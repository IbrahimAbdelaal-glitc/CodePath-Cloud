// Admin API: users, roles and instructor assignments. ADMIN only.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { badRequest, notFound } from '../lib/errors.js';
import { idParams, uuid } from '../lib/validation.js';
import { publicUserSelect, requireAuth, requireRole } from '../middleware/auth.js';

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

export default router;
