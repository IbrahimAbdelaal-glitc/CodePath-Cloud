import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import { optionalAuth } from '../middleware/auth.js';
import { computeModuleAccess, roadmapVisibilityWhere } from '../services/learning.js';
import { issueCertificates } from '../services/certificates.js';

const router = Router();

const lessonSummarySelect = {
  id: true,
  title: true,
  summary: true,
  order: true,
  difficulty: true,
  estimatedMinutes: true,
  _count: { select: { quizzes: true } },
};

function sumMinutes(modules) {
  return modules.reduce(
    (total, m) => total + (m.lessons.reduce((s, l) => s + (l.estimatedMinutes || 0), 0) || m.estimatedMinutes || 0),
    0,
  );
}

const listQuery = z.object({
  featured: z.enum(['1', 'true']).optional(),
  q: z.string().trim().max(80).optional(),
});

router.get('/', optionalAuth, async (req, res) => {
  const query = listQuery.parse(req.query);
  const where = {
    ...roadmapVisibilityWhere(req.user),
    ...(query.featured && { isFeatured: true }),
    ...(query.q && {
      OR: [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { category: { contains: query.q, mode: 'insensitive' } },
      ],
    }),
  };

  const roadmaps = await prisma.roadmap.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    include: {
      modules: {
        orderBy: { order: 'asc' },
        select: { id: true, difficulty: true, estimatedMinutes: true, lessons: { select: { id: true, estimatedMinutes: true } } },
      },
    },
  });

  let completedSet = new Set();
  if (req.user) {
    const lessonIds = roadmaps.flatMap((r) => r.modules.flatMap((m) => m.lessons.map((l) => l.id)));
    const done = await prisma.userProgress.findMany({
      where: { userId: req.user.id, isCompleted: true, lessonId: { in: lessonIds } },
      select: { lessonId: true },
    });
    completedSet = new Set(done.map((d) => d.lessonId));
  }

  res.json({
    roadmaps: roadmaps.map((r) => {
      const lessonIds = r.modules.flatMap((m) => m.lessons.map((l) => l.id));
      const completed = lessonIds.filter((id) => completedSet.has(id)).length;
      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        summary: r.summary,
        description: r.description,
        category: r.category,
        difficulty: r.difficulty,
        prerequisites: r.prerequisites,
        isFeatured: r.isFeatured,
        isPublished: r.isPublished,
        isSequential: r.isSequential,
        moduleCount: r.modules.length,
        lessonCount: lessonIds.length,
        estimatedMinutes: sumMinutes(r.modules),
        progress: req.user
          ? { completed, total: lessonIds.length, percent: lessonIds.length ? Math.round((completed / lessonIds.length) * 100) : 0 }
          : null,
      };
    }),
  });
});

router.get('/:slug', optionalAuth, async (req, res) => {
  const slug = z.string().max(80).parse(req.params.slug);
  const roadmap = await prisma.roadmap.findFirst({
    where: { slug, ...roadmapVisibilityWhere(req.user) },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' }, select: lessonSummarySelect } },
      },
      instructors: { select: { user: { select: { id: true, name: true } } } },
    },
  });
  if (!roadmap) throw notFound('Learning path not found');

  const userId = req.user?.id;
  const lessonIds = roadmap.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const [access, progress, bookmarks] = await Promise.all([
    computeModuleAccess(userId, roadmap.modules.map((m) => m.id)),
    userId
      ? prisma.userProgress.findMany({ where: { userId, isCompleted: true, lessonId: { in: lessonIds } }, select: { lessonId: true } })
      : [],
    userId
      ? prisma.bookmark.findMany({ where: { userId, lessonId: { in: lessonIds } }, select: { lessonId: true } })
      : [],
  ]);
  const completedSet = new Set(progress.map((p) => p.lessonId));
  const bookmarkSet = new Set(bookmarks.map((b) => b.lessonId));

  const modules = roadmap.modules.map((m) => {
    const lessons = m.lessons.map(({ _count, ...l }) => ({
      ...l,
      quizCount: _count.quizzes,
      isCompleted: completedSet.has(l.id),
      isBookmarked: bookmarkSet.has(l.id),
    }));
    const completed = lessons.filter((l) => l.isCompleted).length;
    const a = access.get(m.id);
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      order: m.order,
      difficulty: m.difficulty,
      estimatedMinutes: lessons.reduce((s, l) => s + (l.estimatedMinutes || 0), 0) || m.estimatedMinutes,
      lessons,
      progress: { completed, total: lessons.length },
      access: {
        locked: a.locked,
        enforced: req.user?.role === 'STUDENT',
        prerequisites: a.prerequisites,
        incompleteModules: a.incompleteModules,
        reviewTopics: a.reviewTopics,
        reasons: a.reasons,
      },
    };
  });

  const completed = completedSet.size;
  let certificate = null;
  if (userId && lessonIds.length && completed === lessonIds.length) {
    await issueCertificates(req.user, [roadmap.id]);
    certificate = await prisma.certificate.findUnique({
      where: { userId_roadmapId: { userId, roadmapId: roadmap.id } },
      select: { id: true },
    });
  }
  res.json({
    roadmap: {
      id: roadmap.id,
      title: roadmap.title,
      slug: roadmap.slug,
      summary: roadmap.summary,
      description: roadmap.description,
      category: roadmap.category,
      difficulty: roadmap.difficulty,
      prerequisites: roadmap.prerequisites,
      isPublished: roadmap.isPublished,
      isSequential: roadmap.isSequential,
      learningOutcomes: roadmap.learningOutcomes,
      instructors: roadmap.instructors.map((i) => i.user),
      estimatedMinutes: sumMinutes(roadmap.modules),
      lessonCount: lessonIds.length,
      progress: userId
        ? { completed, total: lessonIds.length, percent: lessonIds.length ? Math.round((completed / lessonIds.length) * 100) : 0 }
        : null,
      certificateId: certificate?.id || null,
      modules,
    },
  });
});

export default router;
