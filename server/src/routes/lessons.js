import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { idParams } from '../lib/validation.js';
import { requireAuth } from '../middleware/auth.js';
import {
  assertLessonAccess,
  publicQuiz,
  topicStatus,
  topicStatusMessage,
} from '../services/learning.js';

const router = Router();
router.use(requireAuth);

router.get('/:id', async (req, res) => {
  const { id } = idParams.parse(req.params);
  const userId = req.user.id;
  const { access } = await assertLessonAccess(req.user, id);

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      resources: { orderBy: { order: 'asc' } },
      quizzes: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }], include: { topic: true } },
      module: {
        select: {
          id: true,
          title: true,
          order: true,
          roadmap: { select: { id: true, title: true, slug: true } },
        },
      },
    },
  });

  const quizIds = lesson.quizzes.map((q) => q.id);
  const topicTags = [...new Set(lesson.quizzes.map((q) => q.topicTag))];

  const [siblings, progress, bookmark, attempts, weaknesses] = await Promise.all([
    prisma.lesson.findMany({
      where: { module: { roadmapId: lesson.module.roadmap.id } },
      orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
      select: { id: true, title: true, moduleId: true },
    }),
    prisma.userProgress.findUnique({ where: { userId_lessonId: { userId, lessonId: id } } }),
    prisma.bookmark.findUnique({ where: { userId_lessonId: { userId, lessonId: id } } }),
    prisma.quizAttempt.findMany({
      where: { userId, quizId: { in: quizIds } },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { id: true, quizId: true, userAnswer: true, isCorrect: true, score: true, createdAt: true },
    }),
    prisma.userWeakness.findMany({ where: { userId, topicTag: { in: topicTags } }, include: { topic: true } }),
  ]);

  const index = siblings.findIndex((s) => s.id === id);
  const attemptsByQuiz = new Map(quizIds.map((qid) => [qid, []]));
  for (const a of attempts) {
    const list = attemptsByQuiz.get(a.quizId);
    if (list.length < 10) list.push(a);
  }

  res.json({
    lesson: {
      id: lesson.id,
      title: lesson.title,
      summary: lesson.summary,
      content: lesson.content,
      keyTakeaways: lesson.keyTakeaways,
      difficulty: lesson.difficulty,
      estimatedMinutes: lesson.estimatedMinutes,
      order: lesson.order,
      updatedAt: lesson.updatedAt,
      resources: lesson.resources.map(({ id: rid, title, url, type }) => ({ id: rid, title, url, type })),
      module: { id: lesson.module.id, title: lesson.module.title, order: lesson.module.order },
      roadmap: lesson.module.roadmap,
      isCompleted: Boolean(progress?.isCompleted),
      completedAt: progress?.completedAt || null,
      isBookmarked: Boolean(bookmark),
      preview: req.user.role !== 'STUDENT' && access.locked,
      quizzes: lesson.quizzes.map((q) => ({ ...publicQuiz(q), attempts: attemptsByQuiz.get(q.id) })),
      topics: topicTags.map((tag) => {
        const w = weaknesses.find((x) => x.topicTag === tag);
        const status = topicStatus(w);
        return {
          tag,
          name: lesson.quizzes.find((q) => q.topicTag === tag).topic.name,
          status,
          message: topicStatusMessage[status],
          accuracy: w ? Math.round(w.accuracy * 100) : null,
        };
      }),
      navigation: {
        position: index + 1,
        total: siblings.length,
        previous: index > 0 ? { id: siblings[index - 1].id, title: siblings[index - 1].title } : null,
        next: index < siblings.length - 1 ? { id: siblings[index + 1].id, title: siblings[index + 1].title } : null,
      },
    },
  });
});

const progressSchema = z.object({ isCompleted: z.boolean({ error: 'Completion value must be true or false' }) });

router.put('/:id/progress', async (req, res) => {
  const { id } = idParams.parse(req.params);
  const { isCompleted } = progressSchema.parse(req.body);
  await assertLessonAccess(req.user, id);

  const progress = await prisma.userProgress.upsert({
    where: { userId_lessonId: { userId: req.user.id, lessonId: id } },
    create: { userId: req.user.id, lessonId: id, isCompleted, completedAt: isCompleted ? new Date() : null },
    update: { isCompleted, completedAt: isCompleted ? new Date() : null },
  });
  res.json({ progress: { lessonId: id, isCompleted: progress.isCompleted, completedAt: progress.completedAt } });
});

router.put('/:id/bookmark', async (req, res) => {
  const { id } = idParams.parse(req.params);
  await assertLessonAccess(req.user, id);
  await prisma.bookmark.upsert({
    where: { userId_lessonId: { userId: req.user.id, lessonId: id } },
    create: { userId: req.user.id, lessonId: id },
    update: {},
  });
  res.json({ bookmarked: true });
});

router.delete('/:id/bookmark', async (req, res) => {
  const { id } = idParams.parse(req.params);
  // Scoped to the current user, so nobody can delete another user's bookmark
  await prisma.bookmark.deleteMany({ where: { userId: req.user.id, lessonId: id } });
  res.json({ bookmarked: false });
});

export default router;
