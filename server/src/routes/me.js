// Personal student data: dashboard, bookmarks and topics to review.
// Every query here is scoped to the current user.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { topicTag as topicTagSchema } from '../lib/validation.js';
import { requireAuth } from '../middleware/auth.js';
import {
  computeModuleAccess,
  lessonsForTopics,
  markTopicReviewed,
  topicStatus,
  topicStatusMessage,
  WEAKNESS_THRESHOLD,
} from '../services/learning.js';

const router = Router();
router.use(requireAuth);

const DAY = 24 * 60 * 60 * 1000;

function dayKey(date, tzOffsetMinutes) {
  return new Date(date.getTime() - tzOffsetMinutes * 60 * 1000).toISOString().slice(0, 10);
}

function computeStreak(dates, tzOffset) {
  const days = new Set(dates.map((d) => dayKey(d, tzOffset)));
  const now = new Date();
  const today = dayKey(now, tzOffset);
  const yesterday = dayKey(new Date(now.getTime() - DAY), tzOffset);

  let current = 0;
  let cursor = days.has(today) ? now : days.has(yesterday) ? new Date(now.getTime() - DAY) : null;
  while (cursor && days.has(dayKey(cursor, tzOffset))) {
    current += 1;
    cursor = new Date(cursor.getTime() - DAY);
  }

  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const d of sorted) {
    run = prev && new Date(d) - new Date(prev) === DAY ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  const counts = new Map();
  for (const d of dates) {
    const k = dayKey(d, tzOffset);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const k = dayKey(new Date(now.getTime() - (13 - i) * DAY), tzOffset);
    return { date: k, count: counts.get(k) || 0 };
  });

  return { current, longest, activeToday: days.has(today), last14 };
}

async function weakTopicsFor(userId) {
  const weaknesses = await prisma.userWeakness.findMany({
    where: { userId, needsReview: true },
    include: { topic: true },
    orderBy: { accuracy: 'asc' },
  });
  const lessonsByTag = await lessonsForTopics(weaknesses.map((w) => w.topicTag));
  return weaknesses.map((w) => {
    const status = topicStatus(w);
    return {
      tag: w.topicTag,
      name: w.topic.name,
      accuracy: Math.round(w.accuracy * 100),
      questionsConsidered: w.attemptsConsidered,
      failureCount: w.failureCount,
      detectedAt: w.detectedAt,
      reviewCompleted: Boolean(w.reviewCompletedAt),
      status,
      message: topicStatusMessage[status],
      lessons: lessonsByTag.get(w.topicTag) || [],
    };
  });
}

const dashboardQuery = z.object({
  tz: z.coerce.number().int().min(-840).max(840).optional().default(0),
});

router.get('/dashboard', async (req, res) => {
  const { tz } = dashboardQuery.parse(req.query);
  const userId = req.user.id;

  const [roadmaps, completedProgress, recentAttempts, attemptStats, activityAttempts, allAttempts, weakTopics] =
    await Promise.all([
      prisma.roadmap.findMany({
        where: { isPublished: true },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          isFeatured: true,
          modules: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              lessons: { orderBy: { order: 'asc' }, select: { id: true, title: true, estimatedMinutes: true } },
            },
          },
        },
      }),
      prisma.userProgress.findMany({
        where: { userId, isCompleted: true },
        orderBy: { completedAt: 'desc' },
        select: {
          completedAt: true,
          lesson: {
            select: {
              id: true,
              title: true,
              module: { select: { title: true, roadmap: { select: { title: true, slug: true } } } },
            },
          },
        },
      }),
      prisma.quizAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          isCorrect: true,
          score: true,
          createdAt: true,
          quiz: {
            select: {
              question: true,
              questionType: true,
              points: true,
              topic: { select: { tag: true, name: true } },
              lesson: { select: { id: true, title: true } },
            },
          },
        },
      }),
      prisma.quizAttempt.groupBy({ by: ['isCorrect'], where: { userId }, _count: true, _sum: { score: true } }),
      prisma.quizAttempt.findMany({
        where: { userId, createdAt: { gte: new Date(Date.now() - 400 * DAY) } },
        select: { createdAt: true },
      }),
      prisma.quizAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 1000,
        select: { quizId: true, isCorrect: true, quiz: { select: { topic: { select: { tag: true, name: true } } } } },
      }),
      weakTopicsFor(userId),
    ]);

  const completedSet = new Set(completedProgress.map((p) => p.lesson.id));

  // Progress per path
  const paths = roadmaps.map((r) => {
    const lessons = r.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title })));
    const completed = lessons.filter((l) => completedSet.has(l.id)).length;
    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      difficulty: r.difficulty,
      isFeatured: r.isFeatured,
      lessons,
      completed,
      total: lessons.length,
      percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
    };
  });
  const totalLessons = paths.reduce((s, p) => s + p.total, 0);

  // Recommended next lessons: first incomplete lesson of each path the student has started
  const startedPaths = paths.filter((p) => p.completed > 0);
  const candidates = (startedPaths.length ? startedPaths : paths.filter((p) => p.isFeatured).slice(0, 2))
    .map((p) => ({ path: p, lesson: p.lessons.find((l) => !completedSet.has(l.id)) }))
    .filter((c) => c.lesson);
  const access = await computeModuleAccess(userId, [...new Set(candidates.map((c) => c.lesson.moduleId))]);
  const nextLessons = candidates.map(({ path, lesson }) => {
    const a = access.get(lesson.moduleId);
    return {
      id: lesson.id,
      title: lesson.title,
      moduleTitle: lesson.moduleTitle,
      estimatedMinutes: lesson.estimatedMinutes,
      roadmapTitle: path.title,
      roadmapSlug: path.slug,
      locked: a.locked,
      reasons: a.reasons,
    };
  });

  // Accuracy per topic: latest answer per question
  const latestByQuiz = new Map();
  for (const a of allAttempts) if (!latestByQuiz.has(a.quizId)) latestByQuiz.set(a.quizId, a);
  const topicAgg = new Map();
  for (const a of latestByQuiz.values()) {
    const t = a.quiz.topic;
    const agg = topicAgg.get(t.tag) || { tag: t.tag, name: t.name, correct: 0, total: 0 };
    agg.total += 1;
    if (a.isCorrect) agg.correct += 1;
    topicAgg.set(t.tag, agg);
  }
  const topicMastery = [...topicAgg.values()]
    .map((t) => ({ ...t, accuracy: Math.round((t.correct / t.total) * 100) }))
    .sort((a, b) => a.accuracy - b.accuracy);

  const correctRow = attemptStats.find((g) => g.isCorrect);
  const wrongRow = attemptStats.find((g) => !g.isCorrect);
  const totalAttempts = (correctRow?._count || 0) + (wrongRow?._count || 0);

  const streak = computeStreak(
    [
      ...activityAttempts.map((a) => a.createdAt),
      ...completedProgress.filter((p) => p.completedAt).map((p) => p.completedAt),
    ],
    tz,
  );

  res.json({
    dashboard: {
      user: { name: req.user.name, role: req.user.role },
      overall: {
        completed: completedSet.size,
        total: totalLessons,
        percent: totalLessons ? Math.round((completedSet.size / totalLessons) * 100) : 0,
      },
      paths: paths.map(({ lessons, ...p }) => p),
      completedLessons: completedProgress.slice(0, 6).map((p) => ({
        id: p.lesson.id,
        title: p.lesson.title,
        moduleTitle: p.lesson.module.title,
        roadmapTitle: p.lesson.module.roadmap.title,
        completedAt: p.completedAt,
      })),
      nextLessons,
      quizStats: {
        totalAttempts,
        correct: correctRow?._count || 0,
        accuracy: totalAttempts ? Math.round(((correctRow?._count || 0) / totalAttempts) * 100) : null,
        totalScore: correctRow?._sum.score || 0,
      },
      recentAttempts: recentAttempts.map((a) => ({
        id: a.id,
        isCorrect: a.isCorrect,
        score: a.score,
        maxScore: a.quiz.points,
        createdAt: a.createdAt,
        question: a.quiz.question,
        questionType: a.quiz.questionType,
        topic: a.quiz.topic,
        lesson: a.quiz.lesson,
      })),
      streak,
      weakTopics,
      topicMastery,
      threshold: Math.round(WEAKNESS_THRESHOLD * 100),
    },
  });
});

router.get('/bookmarks', async (req, res) => {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      lesson: {
        select: {
          id: true,
          title: true,
          summary: true,
          estimatedMinutes: true,
          difficulty: true,
          module: { select: { title: true, roadmap: { select: { title: true, slug: true } } } },
          progress: { where: { userId: req.user.id }, select: { isCompleted: true } },
        },
      },
    },
  });
  res.json({
    bookmarks: bookmarks.map(({ createdAt, lesson }) => ({
      createdAt,
      id: lesson.id,
      title: lesson.title,
      summary: lesson.summary,
      estimatedMinutes: lesson.estimatedMinutes,
      difficulty: lesson.difficulty,
      moduleTitle: lesson.module.title,
      roadmapTitle: lesson.module.roadmap.title,
      roadmapSlug: lesson.module.roadmap.slug,
      isCompleted: Boolean(lesson.progress[0]?.isCompleted),
    })),
  });
});

router.get('/weaknesses', async (req, res) => {
  res.json({ weakTopics: await weakTopicsFor(req.user.id) });
});

router.post('/weaknesses/:tag/review', async (req, res) => {
  const tag = topicTagSchema.parse(req.params.tag);
  const topic = await markTopicReviewed(req.user.id, tag);
  res.json({ topic });
});

export default router;
