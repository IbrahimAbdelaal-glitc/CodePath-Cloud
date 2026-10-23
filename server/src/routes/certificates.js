// Public certificate verification. Works only for certificates whose owner turned on public verification.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import { verifiedCertificate } from '../services/certificates.js';

const router = Router();

const codeSchema = z.string().regex(/^[A-Za-z0-9_-]{22}$/, 'Invalid verification code');

router.get('/verify/:code', async (req, res) => {
  const parsed = codeSchema.safeParse(req.params.code);
  if (!parsed.success) throw notFound('Certificate not found or not shared');
  const certificate = await prisma.certificate.findUnique({
    where: { verificationCode: parsed.data },
    include: { user: { select: { name: true } } },
  });
  if (!certificate) throw notFound('Certificate not found or not shared');
  res.json({ certificate: verifiedCertificate(certificate) });
});

export default router;
