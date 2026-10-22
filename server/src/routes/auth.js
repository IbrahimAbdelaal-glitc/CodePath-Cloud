import { Router } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { config } from '../config.js';
import { HttpError, badRequest, conflict, unauthorized } from '../lib/errors.js';
import { publicUserSelect, requireAuth, signToken } from '../middleware/auth.js';
import { sendMail } from '../lib/mailer.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) =>
    next(new HttpError(429, 'Too many attempts, please wait a moment and try again', { code: 'RATE_LIMITED' })),
});

const email = z.string().trim().toLowerCase().pipe(z.email('Invalid email address')).pipe(z.string().max(160));
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), 'Password must contain letters and numbers');
const name = z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name is too long');

// No "role" field here: every new account is a STUDENT and extra fields are ignored
const registerSchema = z.object({ name, email, password });
const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password').max(128) });

router.post('/register', authLimiter, async (req, res) => {
  const data = registerSchema.parse(req.body);
  const exists = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (exists) throw conflict('An account with this email already exists');

  const passwordHash = await bcrypt.hash(data.password, config.bcryptRounds);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash, role: 'STUDENT' },
    select: publicUserSelect,
  });
  res.status(201).json({ token: signToken(user), user });
});

router.post('/login', authLimiter, async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  // Same message in both cases so we do not reveal whether the account exists
  const ok = user && (await bcrypt.compare(data.password, user.passwordHash));
  if (!ok) throw unauthorized('Incorrect email or password');

  const { passwordHash: _omit, ...rest } = user;
  const publicUser = Object.fromEntries(Object.keys(publicUserSelect).map((k) => [k, rest[k]]));
  res.json({ token: signToken(user), user: publicUser });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

const profileSchema = z
  .object({
    name: name.optional(),
    currentPassword: z.string().max(128).optional(),
    newPassword: password.optional(),
  })
  .refine((d) => !d.newPassword || d.currentPassword, {
    message: 'Enter your current password to change it',
    path: ['currentPassword'],
  });

router.patch('/me', requireAuth, async (req, res) => {
  const data = profileSchema.parse(req.body);
  const update = {};
  if (data.name) update.name = data.name;
  if (data.newPassword) {
    const current = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!(await bcrypt.compare(data.currentPassword, current.passwordHash))) {
      throw badRequest('Current password is incorrect');
    }
    update.passwordHash = await bcrypt.hash(data.newPassword, config.bcryptRounds);
    // Changing the password signs out every other session
    update.tokenVersion = { increment: 1 };
  }
  if (!Object.keys(update).length) throw badRequest('There are no changes to save');
  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: update,
    select: { ...publicUserSelect, tokenVersion: true },
  });
  const { tokenVersion: _version, ...user } = updated;
  // A fresh token keeps the current session signed in after a password change
  res.json({ user, ...(data.newPassword && { token: signToken(updated) }) });
});

// ── Password reset ───────────────────────────────────────────────────
const RESET_REQUESTS_PER_HOUR = 3;
const RESET_SENT_MESSAGE =
  'If an account exists for that email, we have sent a link to reset the password. Check your inbox and spam folder.';

const resetRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) =>
    next(new HttpError(429, 'Too many reset requests. Please wait 15 minutes and try again.', { code: 'RATE_LIMITED' })),
});
const resetAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) =>
    next(new HttpError(429, 'Too many attempts, please wait a moment and try again', { code: 'RATE_LIMITED' })),
});

const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const resetToken = z.string().trim().min(20, 'This reset link is invalid').max(200, 'This reset link is invalid');
const invalidLink = () =>
  new HttpError(400, 'This reset link is invalid or has expired. Please request a new one.', {
    code: 'RESET_TOKEN_INVALID',
  });

async function findUsableToken(token) {
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt <= new Date()) return null;
  return record;
}

const escapeHtml = (v) =>
  String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function resetEmail(name, link) {
  const minutes = config.resetTokenMinutes;
  const text = [
    `Hi ${name},`,
    '',
    'We received a request to reset your CodePath Cloud password.',
    `Open this link to choose a new password. It expires in ${minutes} minutes and works once:`,
    link,
    '',
    'If you did not request this, you can ignore this email. Your password will not change.',
  ].join('\n');
  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;color:#12201b">
  <h2 style="color:#0b5d4b">Reset your password</h2>
  <p>Hi ${escapeHtml(name)},</p>
  <p>We received a request to reset your CodePath Cloud password. This link expires in ${minutes} minutes and can be used once.</p>
  <p><a href="${escapeHtml(link)}" style="display:inline-block;background:#0b5d4b;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Choose a new password</a></p>
  <p style="color:#5f6b66;font-size:13px">If the button doesn't work, copy this address into your browser:<br>${escapeHtml(link)}</p>
  <p style="color:#5f6b66;font-size:13px">If you did not request this, ignore this email. Your password will not change.</p>
</div>`;
  return { text, html };
}

// Always answers with the same message so the endpoint cannot reveal which emails are registered
router.post('/forgot-password', resetRequestLimiter, async (req, res) => {
  const { email: address } = z.object({ email }).parse(req.body);
  const user = await prisma.user.findUnique({
    where: { email: address },
    select: { id: true, name: true, email: true },
  });

  if (user) {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await prisma.passwordResetToken.count({ where: { userId: user.id, createdAt: { gte: since } } });
    if (recent < RESET_REQUESTS_PER_HOUR) {
      const token = randomBytes(32).toString('base64url');
      await prisma.$transaction([
        // Older links stop working once a new one is issued
        prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
        prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: hashToken(token),
            expiresAt: new Date(Date.now() + config.resetTokenMinutes * 60 * 1000),
          },
        }),
      ]);
      // The token travels in the URL fragment, which browsers never send to servers or in Referer headers
      const link = `${config.appUrl}/reset-password#token=${token}`;
      const { text, html } = resetEmail(user.name, link);
      // Not awaited, so the response time does not reveal whether the account exists
      sendMail({ to: user.email, subject: 'Reset your CodePath Cloud password', text, html }).catch((err) =>
        console.error('Password reset email failed:', err.message),
      );
    }
  }
  res.json({ message: RESET_SENT_MESSAGE });
});

router.post('/reset-password/verify', resetAttemptLimiter, async (req, res) => {
  const { token } = z.object({ token: resetToken }).parse(req.body);
  const record = await findUsableToken(token);
  if (!record) throw invalidLink();
  res.json({ valid: true, expiresAt: record.expiresAt });
});

const resetSchema = z
  .object({ token: resetToken, password, confirmPassword: z.string().max(128) })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

router.post('/reset-password', resetAttemptLimiter, async (req, res) => {
  const data = resetSchema.parse(req.body);
  const record = await findUsableToken(data.token);
  if (!record) throw invalidLink();
  const passwordHash = await bcrypt.hash(data.password, config.bcryptRounds);

  await prisma.$transaction(async (tx) => {
    // Claim the token atomically so two simultaneous requests cannot both use it
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) throw invalidLink();
    // Bumping tokenVersion signs the user out on every device
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash, tokenVersion: { increment: 1 } } });
    await tx.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  });

  res.json({ message: 'Your password has been reset. You can now sign in with your new password.' });
});

export default router;
