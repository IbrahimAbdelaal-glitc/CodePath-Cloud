// Course player: the outline with each lesson's state, resume point, readings and block quizzes.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import { idParams, uuid } from '../lib/validation.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { computeModuleAccess, roadmapVisibilityWhere } from '../services/learning.js';
import { issueCertificates } from '../services/certificates.js';
import { renderRoadmapPdf, roadmapHandout } from '../services/roadmapHandout.js';
import {
  MAX_TEST_OUT_ATTEMPTS,
  blockQuizOverview,
  linkedCourseStatus,
  reviewBlockQuiz,
  startBlockQuiz,
  submitBlockQuiz,
  videoDuration,
  watchedPercent,
} from '../services/coursePlayer.js';

const router = Router();

// Downloadable roadmap (public): JSON for the print page, and a PDF built from the same data. The PDF is cached per
// roadmap version (updatedAt), so it is regenerated whenever the roadmap changes.
const pdfCache = new Map();

router.get('/:slug/handout', async (req, res) => {
  const handout = await roadmapHandout(String(req.params.slug));
  if (!handout) throw notFound('Roadmap not found');
  res.json({ handout });
});

router.get('/:slug/roadmap.pdf', async (req, res) => {
  const handout = await roadmapHandout(String(req.params.slug));
  if (!handout) throw notFound('Roadmap not found');
  const stamp = handout.updatedAt.toISOString();
  let cached = pdfCache.get(handout.slug);
  if (!cached || cached.stamp !== stamp) {
    cached = { stamp, pdf: await renderRoadmapPdf(handout) };
    pdfCache.set(handout.slug, cached);
  }
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${handout.slug}-roadmap.pdf"`,
    'Cache-Control': 'public, max-age=300',
  });
  res.send(cached.pdf);
});

// Lesson states: LOCKED, AVAILABLE, IN_PROGRESS, COMPLETED. Quiz states: LOCKED, AVAILABLE, FAILED, PASSED.
// A module the student skipped with a skip test keeps its lessons open for review, and they no longer count as required.
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
  const testedOut = new Set(attempts.filter((t) => t.passed && t.mode === 'TEST_OUT').map((t) => t.moduleId));
  const linkedIds = [...new Set(roadmap.modules.flatMap((m) => m.linkedRoadmapIds))];
  const linkedById = new Map((await linkedCourseStatus(user?.id, linkedIds)).map((c) => [c.id, c]));
  let requiredLessons = 0;
  let requiredDone = 0;

  let resume = null;
  let nextStep = null;
  const modules = roadmap.modules.map((m) => {
    const a = access.get(m.id);
    const moduleLocked = !user || (isStudent && a.locked);
    const skipped = testedOut.has(m.id);
    let previousDone = true;
    const lessons = m.lessons.map((l) => {
      const completed = doneSet.has(l.id);
      const watch = watchBy.get(l.id);
      const sequentialLock = roadmap.isSequential && isStudent && !previousDone && !skipped;
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
    const linkedCourses = m.linkedRoadmapIds.map((id) => linkedById.get(id)).filter(Boolean);
    const linkedDone = linkedCourses.every((c) => c.completed);
    if (!skipped) {
      requiredLessons += lessons.length;
      requiredDone += lessons.filter((l) => l.state === 'COMPLETED').length;
    }
    let quiz = null;
    if (m._count.blockQuestions > 0) {
      const passed = moduleAttempts.some((t) => t.passed);
      const best = moduleAttempts.reduce((b, t) => Math.max(b, t.percent), -1);
      const exams = moduleAttempts.filter((t) => t.mode !== 'TEST_OUT');
      const testOutsUsed = moduleAttempts.length - exams.length;
      quiz = {
        bankSize: m._count.blockQuestions,
        questionCount: Math.min(m.quizQuestionCount, m._count.blockQuestions),
        passPercent: m.quizPassPercent,
        attempts: moduleAttempts.length,
        bestPercent: best >= 0 ? best : null,
        lastPercent: moduleAttempts[0]?.percent ?? null,
        state: passed
          ? 'PASSED'
          : moduleLocked || (isStudent && (!allLessonsDone || !linkedDone))
            ? 'LOCKED'
            : exams.length
              ? 'FAILED'
              : 'AVAILABLE',
        testOut: m.allowTestOut
          ? {
              attemptsAllowed: MAX_TEST_OUT_ATTEMPTS,
              attemptsLeft: Math.max(0, MAX_TEST_OUT_ATTEMPTS - testOutsUsed),
              available: Boolean(user) && !passed && !moduleLocked && testOutsUsed < MAX_TEST_OUT_ATTEMPTS,
            }
          : null,
      };
    }

    // Next step: the first unfinished lesson, then any linked course, then the module's quiz if it is not passed yet
    if (!nextStep && user && !skipped) {
      const lesson = lessons.find((l) => l.state === 'AVAILABLE' || l.state === 'IN_PROGRESS');
      const course = !moduleLocked && linkedCourses.find((c) => !c.completed);
      if (lesson) nextStep = { type: 'LESSON', lessonId: lesson.id, title: lesson.title, moduleTitle: m.title };
      else if (course && allLessonsDone) nextStep = { type: 'COURSE', slug: course.slug, title: course.title, moduleTitle: m.title };
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
      skipped,
      progress: { completed: lessons.filter((l) => l.state === 'COMPLETED').length, total: lessons.length },
      lessons,
      quiz,
      linkedCourses,
      // Stage details
      learningOutcomes: m.learningOutcomes,
      prerequisiteNotes: m.prerequisiteNotes,
      timeEstimate: m.timeEstimate,
      estimatedMinutes: m.estimatedMinutes,
      practice: m.practice,
      nextSteps: m.nextSteps,
      specialties: Array.isArray(m.specialties) ? m.specialties : [],
      readings: m.readings.map(({ id, title, authors, publisher, year, url, kind, note, access }) => ({
        id,
        title,
        authors,
        publisher,
        year,
        url,
        kind,
        note,
        access,
      })),
    };
  });

  // Progress counts required lessons only (lessons in skipped modules are optional review)
  const totalLessons = requiredLessons;
  const completedLessons = requiredDone;
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
      checkpointPassPercent: roadmap.checkpointPassPercent,
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

const startSchema = z.object({ mode: z.enum(['EXAM', 'TEST_OUT']).default('EXAM') });

router.post('/modules/:id/quiz/attempts', requireAuth, async (req, res) => {
  const { id } = idParams.parse(req.params);
  const { mode } = startSchema.parse(req.body ?? {});
  res.status(201).json(await startBlockQuiz(req.user, id, mode));
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
