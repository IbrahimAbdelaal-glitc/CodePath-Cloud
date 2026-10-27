// Admin API: users, roles and instructor assignments. ADMIN only.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { badRequest, notFound } from '../lib/errors.js';
import { idParams, uuid } from '../lib/validation.js';
import { publicUserSelect, requireAuth, requireRole } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { mailMode, parseAddress, sendMail } from '../lib/mailer.js';
import { storageConfigured } from '../lib/storage.js';
import { applyCatalogSync, catalogPlan, learnerCounts } from '../services/courseCatalog.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

const role = z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN'], { error: 'Invalid role' });

const listQuery = z.object({
  q: z.string().trim().max(100).optional(),
  role: role.optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
const PAGE_SIZE = 20;

router.get('/stats', async (req, res) => {
  const [byRole, roadmaps, lessons, quizzes, attempts] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.roadmap.count(),
    prisma.lesson.count(),
    prisma.quiz.count(),
    prisma.quizAttempt.count(),
  ]);
  res.json({
    stats: {
      users: Object.fromEntries(byRole.map((r) => [r.role, r._count])),
      roadmaps,
      lessons,
      quizzes,
      attempts,
    },
  });
});

router.get('/users', async (req, res) => {
  const { q, role: roleFilter, page } = listQuery.parse(req.query);
  const where = {
    ...(roleFilter && { role: roleFilter }),
    ...(q && {
      OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }],
    }),
  };
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        ...publicUserSelect,
        assignedRoadmaps: { select: { roadmap: { select: { id: true, title: true } } } },
        _count: { select: { quizAttempts: true, userProgress: { where: { isCompleted: true } } } },
      },
    }),
  ]);
  res.json({
    users: users.map(({ assignedRoadmaps, _count, ...u }) => ({
      ...u,
      assignedRoadmaps: assignedRoadmaps.map((a) => a.roadmap),
      attempts: _count.quizAttempts,
      completedLessons: _count.userProgress,
    })),
    page,
    pageSize: PAGE_SIZE,
    total,
  });
});

async function assertNotLastAdmin(userId) {
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) throw notFound('User not found');
  if (target.role === 'ADMIN') {
    const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (admins <= 1) throw badRequest('You cannot remove the last administrator');
  }
  return target;
}

router.patch('/users/:id/role', async (req, res) => {
  const { id } = idParams.parse(req.params);
  const data = z.object({ role }).parse(req.body);
  if (id === req.user.id) throw badRequest('You cannot change your own role');
  const target = await assertNotLastAdmin(id);

  const user = await prisma.$transaction(async (tx) => {
    // Removing the instructor role also removes their path assignments
    if (target.role === 'INSTRUCTOR' && data.role !== 'INSTRUCTOR') {
      await tx.roadmapInstructor.deleteMany({ where: { userId: id } });
    }
    return tx.user.update({ where: { id }, data: { role: data.role }, select: publicUserSelect });
  });
  res.json({ user });
});

router.delete('/users/:id', async (req, res) => {
  const { id } = idParams.parse(req.params);
  if (id === req.user.id) throw badRequest('You cannot delete your own account from the admin panel');
  await assertNotLastAdmin(id);
  await prisma.user.delete({ where: { id } });
  res.status(204).end();
});

router.put('/roadmaps/:id/instructors', async (req, res) => {
  const { id } = idParams.parse(req.params);
  const { userIds } = z.object({ userIds: z.array(uuid).max(50) }).parse(req.body);
  const roadmap = await prisma.roadmap.findUnique({ where: { id }, select: { id: true } });
  if (!roadmap) throw notFound('Learning path not found');

  const instructors = await prisma.user.findMany({
    where: { id: { in: userIds }, role: 'INSTRUCTOR' },
    select: { id: true },
  });
  if (instructors.length !== new Set(userIds).size) {
    throw badRequest('Only users with the instructor role can be assigned');
  }
  await prisma.$transaction([
    prisma.roadmapInstructor.deleteMany({ where: { roadmapId: id } }),
    prisma.roadmapInstructor.createMany({ data: instructors.map((u) => ({ roadmapId: id, userId: u.id })) }),
  ]);
  const assigned = await prisma.roadmapInstructor.findMany({
    where: { roadmapId: id },
    select: { user: { select: { id: true, name: true, email: true } } },
  });
  res.json({ instructors: assigned.map((a) => a.user) });
});

// ── System status ───────────────────────────────────────────────
// Which integrations are configured (never their values), so setup can be checked from the browser
router.get('/system', async (req, res) => {
  const [videos, pendingReview] = await Promise.all([
    prisma.videoAsset.count({ where: { status: 'READY' } }),
    prisma.blockQuestion.count({ where: { needsReview: true } }),
  ]);
  res.json({
    // The Apps Script relay sends from the Google account that deployed it; MAIL_FROM is not used
    mail: { mode: mailMode, from: mailMode === 'apps-script' ? null : parseAddress(config.mail.from).email },
    storage: { configured: storageConfigured, bucket: config.storage.bucket, maxVideoMb: config.storage.maxVideoMb },
    appUrl: config.appUrl,
    uploadedVideos: videos,
    questionsAwaitingReview: pendingReview,
  });
});

const testMailLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false });

// Sends a test message to the signed-in admin's own address and reports the provider's answer
router.post('/system/test-email', testMailLimiter, async (req, res) => {
  try {
    await sendMail({
      to: req.user.email,
      subject: 'CodePath Cloud test email',
      text: 'This is a test email from CodePath Cloud. Email delivery is working.',
      html: '<p>This is a test email from <strong>CodePath Cloud</strong>. Email delivery is working.</p>',
      template: { kind: 'test' },
    });
    res.json({ sent: true, to: req.user.email, mode: mailMode });
  } catch (err) {
    console.error('Test email failed:', err.message);
    throw badRequest(`The email could not be sent: ${err.message}`, { code: 'MAIL_FAILED' });
  }
});

// Built-in course catalog. Nothing syncs on its own: an admin previews the change (a dry run that writes nothing),
// then applies it. The sync is idempotent (courses already at the code's version are skipped), takes the catalog
// lease so two runs cannot overlap, and reports learner data counts before and after.
router.get('/catalog', async (req, res) => {
  const [plan, learner] = await Promise.all([catalogPlan(), learnerCounts()]);
  res.json({ ...plan, learner });
});

const catalogSyncLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false });

router.post('/catalog/sync', catalogSyncLimiter, async (req, res) => {
  z.object({ confirm: z.literal(true, { error: 'Confirm the catalog update' }) }).parse(req.body);
  const plan = await catalogPlan();
  if (!plan.pending) return res.json({ status: 'up-to-date', steps: plan.steps });
  console.log(`[catalog] sync started by admin ${req.user.id}`);
  const outcome = await applyCatalogSync();
  if (outcome.status === 'busy') {
    throw badRequest('Another catalog update is running. Try again in a few minutes.', { code: 'CATALOG_BUSY' });
  }
  if (outcome.lost.length) console.error(`[catalog] learner data decreased: ${outcome.lost.join(', ')}`);
  res.json(outcome);
});

export default router;
