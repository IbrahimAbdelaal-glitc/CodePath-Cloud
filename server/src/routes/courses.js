// Course player: the outline with each lesson's state, resume point, readings and block quizzes.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import { idParams, uuid } from '../lib/validation.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { computeModuleAccess, roadmapVisibilityWhere } from '../services/learning.js';
import { issueCertificates } from '../services/certificates.js';
import {
  blockQuizOverview,
  reviewBlockQuiz,
  startBlockQuiz,
  submitBlockQuiz,
  videoDuration,
  watchedPercent,
} from '../services/coursePlayer.js';

const router = Router();

// Lesson states: LOCKED, AVAILABLE, IN_PROGRESS, COMPLETED. Quiz states: LOCKED, AVAILABLE, FAILED, PASSED.
router.get('/:slug/outline', optionalAuth, async (req, res) => {
  const slug = z.string().max(80).parse(req.params.slug);
  const roadmap = await prisma.roadmap.findFirst({
    where: { slug, ...roadmapVisibilityWhere(req.user) },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              summary: true,
              order: true,
              estimatedMinutes: true,
              videoProvider: true,
              videoStart: true,
              videoEnd: true,
              videoDurationSeconds: true,
              _count: { select: { quizzes: { where: { placement: 'CHECKPOINT' } } } },
            },
          },
          readings: { orderBy: { order: 'asc' } },
          _count: { select: { blockQuestions: true } },
        },
      },
    },
  });
  if (!roadmap) throw notFound('Course not found');

  const user = req.user;
  const isStudent = user?.role === 'STUDENT';
  const lessonIds = roadmap.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const moduleIds = roadmap.modules.map((m) => m.id);
  const [access, done, watches, attempts] = await Promise.all([
    computeModuleAccess(user?.id, moduleIds),
    user
      ? prisma.userProgress.findMany({ where: { userId: user.id, isCompleted: true, lessonId: { in: lessonIds } } })
      : [],
    user ? prisma.lessonVideoProgress.findMany({ where: { userId: user.id, lessonId: { in: lessonIds } } }) : [],
    user
      ? prisma.blockQuizAttempt.findMany({
          where: { userId: user.id, moduleId: { in: moduleIds }, submittedAt: { not: null } },
          orderBy: { submittedAt: 'desc' },
        })
      : [],
  ]);
  const doneSet = new Set(done.map((d) => d.lessonId));
  const watchBy = new Map(watches.map((w) => [w.lessonId, w]));

  let resume = null;
  let nextStep = null;
  const modules = roadmap.modules.map((m) => {
    const a = access.get(m.id);
    const moduleLocked = !user || (isStudent && a.locked);
    let previousDone = true;
    const lessons = m.lessons.map((l) => {
      const completed = doneSet.has(l.id);
      const watch = watchBy.get(l.id);
      const sequentialLock = roadmap.isSequential && isStudent && !previousDone;
      const state = completed
        ? 'COMPLETED'
        : moduleLocked || sequentialLock
          ? 'LOCKED'
          : watch
            ? 'IN_PROGRESS'
            : 'AVAILABLE';
      previousDone = completed;
      const duration = videoDuration(l);
      return {
        id: l.id,
        title: l.title,
        summary: l.summary,
        estimatedMinutes: l.estimatedMinutes,
        hasVideo: Boolean(l.videoProvider),
        durationSeconds: duration,
        checkpoints: l._count.quizzes,
        watchedPercent: watchedPercent(watch, duration),
        lastWatchedAt: watch?.updatedAt || null,
        state,
      };
    });

    const moduleAttempts = attempts.filter((t) => t.moduleId === m.id);
    const allLessonsDone = lessons.every((l) => l.state === 'COMPLETED');
    let quiz = null;
    if (m._count.blockQuestions > 0) {
      const passed = moduleAttempts.some((t) => t.passed);
      const best = moduleAttempts.reduce((b, t) => Math.max(b, t.percent), -1);
      quiz = {
        bankSize: m._count.blockQuestions,
        questionCount: Math.min(m.quizQuestionCount, m._count.blockQuestions),
        passPercent: m.quizPassPercent,
        attempts: moduleAttempts.length,
        bestPercent: best >= 0 ? best : null,
        lastPercent: moduleAttempts[0]?.percent ?? null,
        state: passed
          ? 'PASSED'
          : moduleLocked || (isStudent && !allLessonsDone)
            ? 'LOCKED'
            : moduleAttempts.length
              ? 'FAILED'
              : 'AVAILABLE',
      };
    }

    // Next step: the first unfinished lesson, otherwise the module's quiz if it is not passed yet
    if (!nextStep && user) {
      const lesson = lessons.find((l) => l.state === 'AVAILABLE' || l.state === 'IN_PROGRESS');
      if (lesson) nextStep = { type: 'LESSON', lessonId: lesson.id, title: lesson.title, moduleTitle: m.title };
      else if (quiz && (quiz.state === 'AVAILABLE' || quiz.state === 'FAILED')) {
        nextStep = { type: 'QUIZ', moduleId: m.id, title: `${m.title}: block quiz`, moduleTitle: m.title, retake: quiz.state === 'FAILED' };
      }
    }
    for (const l of lessons) {
      if (l.lastWatchedAt && l.state !== 'LOCKED' && (!resume || l.lastWatchedAt > resume.at)) {
        resume = { lessonId: l.id, title: l.title, at: l.lastWatchedAt, completed: l.state === 'COMPLETED' };
      }
    }

    return {
      id: m.id,
      title: m.title,
      description: m.description,
      order: m.order,
      difficulty: m.difficulty,
      locked: moduleLocked,
      reasons: user ? a.reasons : [],
      progress: { completed: lessons.filter((l) => l.state === 'COMPLETED').length, total: lessons.length },
      lessons,
      quiz,
      readings: m.readings.map(({ id, title, authors, publisher, year, url, kind, note }) => ({
        id,
        title,
        authors,
        publisher,
        year,
        url,
        kind,
        note,
      })),
    };
  });

  const totalLessons = lessonIds.length;
  const completedLessons = doneSet.size;
  const quizModules = modules.filter((m) => m.quiz);
  const quizzesPassed = quizModules.filter((m) => m.quiz.state === 'PASSED').length;
  const steps = totalLessons + quizModules.length;
  let certificateId = null;
  if (isStudent && steps && completedLessons + quizzesPassed === steps) {
    await issueCertificates(user, [roadmap.id]);
    const cert = await prisma.certificate.findUnique({
      where: { userId_roadmapId: { userId: user.id, roadmapId: roadmap.id } },
      select: { id: true },
    });
    certificateId = cert?.id || null;
  }

  res.json({
    course: {
      id: roadmap.id,
      title: roadmap.title,
      slug: roadmap.slug,
      summary: roadmap.summary,
      description: roadmap.description,
      difficulty: roadmap.difficulty,
      prerequisites: roadmap.prerequisites,
      learningOutcomes: roadmap.learningOutcomes,
      sources: Array.isArray(roadmap.sources) ? roadmap.sources : [],
      isSequential: roadmap.isSequential,
      progress: user
        ? {
            lessonsCompleted: completedLessons,
            lessonsTotal: totalLessons,
            quizzesPassed,
            quizzesTotal: quizModules.length,
            percent: steps ? Math.round(((completedLessons + quizzesPassed) / steps) * 100) : 0,
          }
        : null,
      resume,
      nextStep,
      certificateId,
      modules,
    },
  });
});

// ── Block quizzes ─────────────────────────────────────────────────────
router.get('/modules/:id/quiz', requireAuth, async (req, res) => {
  const { id } = idParams.parse(req.params);
  res.json(await blockQuizOverview(req.user, id));
});

router.post('/modules/:id/quiz/attempts', requireAuth, async (req, res) => {
  const { id } = idParams.parse(req.params);
  res.status(201).json(await startBlockQuiz(req.user, id));
});

const answerValue = z.union([z.string().max(2000), z.array(z.string().max(300)).max(10), z.null()]);
const submitSchema = z.object({ answers: z.record(uuid, answerValue) });

router.post('/quiz-attempts/:id/submit', requireAuth, async (req, res) => {
  const { id } = idParams.parse(req.params);
  const { answers } = submitSchema.parse(req.body);
  const result = await submitBlockQuiz(req.user, id, answers);
  // Passing the last block quiz can complete the course
  let certificate = null;
  if (result.attempt.passed) {
    const attempt = await prisma.blockQuizAttempt.findUnique({ where: { id }, select: { module: { select: { roadmapId: true } } } });
    [certificate] = await issueCertificates(req.user, [attempt.module.roadmapId]);
  }
  res.json({ ...result, certificate: certificate ? { id: certificate.id } : null });
});

router.get('/quiz-attempts/:id', requireAuth, async (req, res) => {
  const { id } = idParams.parse(req.params);
  res.json(await reviewBlockQuiz(req.user, id));
});

export default router;
