// Core learning logic: grading, weakness detection and module locking.
import { prisma } from '../lib/prisma.js';
import { forbidden, notFound, badRequest } from '../lib/errors.js';

// ── Weakness rule ─────────────────────────────────────────────
// For each topic, take the student's latest answer to each of their RECENT_QUESTIONS most recently answered questions.
// If accuracy is below WEAKNESS_THRESHOLD (70%), the topic is flagged "needs review".
// The flag clears only when (1) the student confirms the review and (2) accuracy is back to 70% or more.
export const WEAKNESS_THRESHOLD = 0.7;
export const RECENT_QUESTIONS = 10;

export function topicStatus(weakness) {
  if (!weakness || !weakness.needsReview) return 'OK';
  if (!weakness.reviewCompletedAt) return 'NEEDS_REVIEW';
  return 'RETEST';
}

export const topicStatusMessage = {
  OK: 'You are doing well on this topic',
  NEEDS_REVIEW: 'Review the suggested lessons, then confirm your review',
  RETEST: "Review done; retake this topic's questions to reach 70% or more",
};

// In-video checkpoint questions are formative (answering them completes a lesson; the block quiz checks mastery),
// so only practice questions placed with the lesson count towards weakness detection.
const COUNTED = { placement: 'LESSON' };

export async function evaluateTopic(userId, topicTag, { wasIncorrect = false } = {}) {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId, quiz: { topicTag, ...COUNTED } },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: { quizId: true, isCorrect: true },
  });

  const latestByQuiz = new Map();
  for (const a of attempts) {
    if (!latestByQuiz.has(a.quizId)) latestByQuiz.set(a.quizId, a.isCorrect);
    if (latestByQuiz.size >= RECENT_QUESTIONS) break;
  }
  const considered = latestByQuiz.size;
  const correct = [...latestByQuiz.values()].filter(Boolean).length;
  const accuracy = considered ? correct / considered : 1;

  const key = { userId_topicTag: { userId, topicTag } };
  const existing = await prisma.userWeakness.findUnique({ where: key });
  let weakness = existing;

  if (considered && accuracy < WEAKNESS_THRESHOLD) {
    const reopen = existing && !existing.needsReview;
    weakness = await prisma.userWeakness.upsert({
      where: key,
      create: { userId, topicTag, accuracy, attemptsConsidered: considered, failureCount: wasIncorrect ? 1 : 0 },
      update: {
        accuracy,
        attemptsConsidered: considered,
        ...(wasIncorrect && { failureCount: { increment: 1 } }),
        ...(reopen && { needsReview: true, reviewCompletedAt: null, detectedAt: new Date(), resolvedAt: null }),
      },
    });
  } else if (existing) {
    const resolve = existing.needsReview && existing.reviewCompletedAt;
    weakness = await prisma.userWeakness.update({
      where: key,
      data: {
        accuracy,
        attemptsConsidered: considered,
        ...(wasIncorrect && { failureCount: { increment: 1 } }),
        ...(resolve && { needsReview: false, resolvedAt: new Date() }),
      },
    });
  }

  const status = topicStatus(weakness);
  return {
    tag: topicTag,
    accuracy: Math.round(accuracy * 100),
    questionsConsidered: considered,
    needsReview: Boolean(weakness?.needsReview),
    reviewCompleted: Boolean(weakness?.reviewCompletedAt),
    status,
    message: topicStatusMessage[status],
  };
}

export async function markTopicReviewed(userId, topicTag) {
  const key = { userId_topicTag: { userId, topicTag } };
  const existing = await prisma.userWeakness.findUnique({ where: key });
  if (!existing || !existing.needsReview) {
    throw badRequest('This topic does not currently need review');
  }
  await prisma.userWeakness.update({ where: key, data: { reviewCompletedAt: new Date() } });
  return evaluateTopic(userId, topicTag);
}

// Lessons covering the given topics (lessons with questions on those topics)
export async function lessonsForTopics(tags) {
  if (!tags.length) return new Map();
  const lessons = await prisma.lesson.findMany({
    where: { quizzes: { some: { topicTag: { in: tags }, ...COUNTED } }, module: { roadmap: { isPublished: true } } },
    select: {
      id: true,
      title: true,
      estimatedMinutes: true,
      quizzes: { where: COUNTED, select: { topicTag: true } },
      module: { select: { title: true, order: true, roadmap: { select: { title: true, slug: true } } } },
      order: true,
    },
    orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
  });
  const byTag = new Map(tags.map((t) => [t, []]));
  for (const l of lessons) {
    const lessonTags = new Set(l.quizzes.map((q) => q.topicTag));
    for (const t of lessonTags) {
      if (byTag.has(t)) {
        byTag.get(t).push({
          id: l.id,
          title: l.title,
          estimatedMinutes: l.estimatedMinutes,
          moduleTitle: l.module.title,
          roadmapTitle: l.module.roadmap.title,
          roadmapSlug: l.module.roadmap.slug,
        });
      }
    }
  }
  return byTag;
}

// ── Module locking ───────────────────────────────────────────────────────
// A module is locked if (a) any lesson in its prerequisite modules is incomplete,
// (b) the student has a "needs review" topic from those prerequisite modules, or
// (c) a prerequisite module has a block quiz the student has not passed yet.
export async function computeModuleAccess(userId, moduleIds) {
  const result = new Map();
  if (!moduleIds.length) return result;

  const modules = await prisma.module.findMany({
    where: { id: { in: moduleIds } },
    select: {
      id: true,
      prerequisites: {
        select: {
          prerequisite: {
            select: {
              id: true,
              title: true,
              quizPassPercent: true,
              _count: { select: { blockQuestions: true } },
              lessons: { select: { id: true, quizzes: { where: COUNTED, select: { topicTag: true } } } },
            },
          },
        },
      },
    },
  });

  const prereqLessonIds = modules.flatMap((m) =>
    m.prerequisites.flatMap((p) => p.prerequisite.lessons.map((l) => l.id)),
  );
  const quizModuleIds = modules.flatMap((m) =>
    m.prerequisites.filter((p) => p.prerequisite._count.blockQuestions > 0).map((p) => p.prerequisite.id),
  );

  const [completed, weaknesses, passedQuizzes] = userId
    ? await Promise.all([
        prisma.userProgress.findMany({
          where: { userId, isCompleted: true, lessonId: { in: prereqLessonIds } },
          select: { lessonId: true },
        }),
        prisma.userWeakness.findMany({
          where: { userId, needsReview: true },
          include: { topic: true },
        }),
        quizModuleIds.length
          ? prisma.blockQuizAttempt.findMany({
              where: { userId, passed: true, moduleId: { in: quizModuleIds } },
              distinct: ['moduleId'],
              select: { moduleId: true },
            })
          : [],
      ])
    : [[], [], []];

  const completedSet = new Set(completed.map((p) => p.lessonId));
  const weakByTag = new Map(weaknesses.map((w) => [w.topicTag, w]));
  const passedSet = new Set(passedQuizzes.map((a) => a.moduleId));

  const neededTags = new Set();
  const draft = modules.map((m) => {
    const incompleteModules = [];
    const quizzesToPass = [];
    const reviewTags = new Set();
    for (const { prerequisite: p } of m.prerequisites) {
      const total = p.lessons.length;
      const done = p.lessons.filter((l) => completedSet.has(l.id)).length;
      if (done < total) incompleteModules.push({ id: p.id, title: p.title, completed: done, total });
      if (p._count.blockQuestions > 0 && !passedSet.has(p.id)) {
        quizzesToPass.push({ id: p.id, title: p.title, passPercent: p.quizPassPercent });
      }
      for (const l of p.lessons) {
        for (const q of l.quizzes) if (weakByTag.has(q.topicTag)) reviewTags.add(q.topicTag);
      }
    }
    reviewTags.forEach((t) => neededTags.add(t));
    return { m, incompleteModules, quizzesToPass, reviewTags: [...reviewTags] };
  });

  const lessonsByTag = await lessonsForTopics([...neededTags]);

  for (const { m, incompleteModules, quizzesToPass, reviewTags } of draft) {
    const reviewTopics = reviewTags.map((tag) => {
      const w = weakByTag.get(tag);
      const status = topicStatus(w);
      return {
        tag,
        name: w.topic.name,
        accuracy: Math.round(w.accuracy * 100),
        status,
        message: topicStatusMessage[status],
        lessons: lessonsByTag.get(tag) || [],
      };
    });
    const reasons = [
      ...incompleteModules.map(
        (p) => `Complete every lesson in "${p.title}" (${p.completed} of ${p.total} done)`,
      ),
      ...quizzesToPass.map((q) => `Pass the block quiz for "${q.title}" (${q.passPercent}% or more)`),
      ...reviewTopics.map(
        (t) => `"${t.name}" needs review: your accuracy is ${t.accuracy}%, below 70%. ${t.message}`,
      ),
    ];
    result.set(m.id, {
      locked: Boolean(userId) && reasons.length > 0,
      hasPrerequisites: m.prerequisites.length > 0,
      prerequisites: m.prerequisites.map((p) => ({ id: p.prerequisite.id, title: p.prerequisite.title })),
      incompleteModules,
      quizzesToPass,
      reviewTopics,
      reasons,
    });
  }
  return result;
}

// ── Path visibility ───────────────────────────────────────────────
export function roadmapVisibilityWhere(user) {
  if (user?.role === 'ADMIN') return {};
  if (user?.role === 'INSTRUCTOR') {
    return { OR: [{ isPublished: true }, { instructors: { some: { userId: user.id } } }] };
  }
  return { isPublished: true };
}

// Checks the user can access a lesson and rejects it server-side when its module is locked.
// Instructors and admins can preview without locks.
export async function assertLessonAccess(user, lessonId) {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { roadmap: roadmapVisibilityWhere(user) } },
    select: {
      id: true,
      title: true,
      order: true,
      moduleId: true,
      module: { select: { roadmap: { select: { id: true, slug: true, isSequential: true } } } },
    },
  });
  if (!lesson) throw notFound('Lesson not found');

  const access = (await computeModuleAccess(user.id, [lesson.moduleId])).get(lesson.moduleId);
  if (user.role === 'STUDENT' && access.locked) {
    throw forbidden('This module is locked. Complete its requirements to unlock it.', {
      code: 'MODULE_LOCKED',
      details: { ...access, roadmapSlug: lesson.module.roadmap.slug },
    });
  }

  // Sequential courses: a lesson opens only after the lesson before it in the module is complete
  if (user.role === 'STUDENT' && lesson.module.roadmap.isSequential) {
    const previous = await prisma.lesson.findFirst({
      where: { moduleId: lesson.moduleId, order: { lt: lesson.order } },
      orderBy: { order: 'desc' },
      select: { id: true, title: true, progress: { where: { userId: user.id, isCompleted: true }, select: { id: true } } },
    });
    if (previous && !previous.progress.length) {
      throw forbidden(`Finish "${previous.title}" first. Lessons in this course unlock one at a time.`, {
        code: 'LESSON_LOCKED',
        details: { previousLessonId: previous.id, previousLessonTitle: previous.title, roadmapSlug: lesson.module.roadmap.slug },
      });
    }
  }
  return { lesson, access };
}

// ── Active learning time ─────────────────────────────────────────
// The lesson page sends a heartbeat about every 30 seconds while it is visible and in use.
// Each heartbeat credits the time since the user's previous heartbeat on any lesson, but only when
// that gap is at most MAX_HEARTBEAT_GAP_SECONDS. A longer gap starts a new session and credits nothing,
// so idle time is never counted and parallel tabs cannot count the same minute twice.
export const MAX_HEARTBEAT_GAP_SECONDS = 60;

export async function recordLessonActivity(userId, lessonId) {
  await prisma.$transaction(async (tx) => {
    // Serializes heartbeats per user so two tabs never credit the same gap
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${userId}))`;
    const now = new Date();
    const last = await tx.lessonActivity.findFirst({
      where: { userId },
      orderBy: { lastHeartbeatAt: 'desc' },
      select: { lastHeartbeatAt: true },
    });
    const gap = last ? Math.round((now - last.lastHeartbeatAt) / 1000) : Infinity;
    const credit = gap > 0 && gap <= MAX_HEARTBEAT_GAP_SECONDS ? gap : 0;
    await tx.lessonActivity.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, activeSeconds: credit, firstActiveAt: now, lastHeartbeatAt: now },
      update: { activeSeconds: { increment: credit }, lastHeartbeatAt: now },
    });
  });
}

// ── Server-side grading ─────────────────────────────────────────
const normalizeInline = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const normalizeOutput = (s) =>
  String(s ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/^\n+|\n+$/g, '');

export function quizOptions(quiz) {
  return Array.isArray(quiz.options) ? quiz.options.map(String) : [];
}

// Multi-select answers travel as an array or a JSON array string; order does not matter
export function parseSelection(raw) {
  let value = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      value = null;
    }
  }
  if (!Array.isArray(value)) throw badRequest('Choose at least one option');
  return [...new Set(value.map((v) => String(v).trim()))].sort();
}

export function checkAnswer(quiz, rawAnswer) {
  const options = quizOptions(quiz);
  const accepted = [quiz.correctAnswer, ...(quiz.acceptedAnswers || [])];

  if (quiz.questionType === 'MULTI_SELECT') {
    const picked = parseSelection(rawAnswer);
    if (!picked.length) throw badRequest('Choose at least one option');
    if (picked.some((p) => !options.includes(p))) throw badRequest('Choose from the available options');
    const correct = parseSelection(quiz.correctAnswer);
    return picked.length === correct.length && picked.every((p, i) => p === correct[i]);
  }

  if (quiz.questionType === 'MULTIPLE_CHOICE' || options.length) {
    const answer = String(rawAnswer).trim();
    if (!options.includes(answer)) throw badRequest('Choose one of the available options');
    return accepted.some((a) => a.trim() === answer);
  }

  const normalize = quiz.questionType === 'CODE_OUTPUT' ? normalizeOutput : normalizeInline;
  const answer = normalize(rawAnswer);
  if (!answer) throw badRequest('Write your answer before submitting');
  return accepted.some((a) => normalize(a) === answer);
}

// Browser-safe question: no correct answer and no explanation
export function publicQuiz(quiz) {
  return {
    id: quiz.id,
    question: quiz.question,
    questionType: quiz.questionType,
    codeSnippet: quiz.codeSnippet,
    options: quizOptions(quiz),
    points: quiz.points,
    topic: quiz.topic ? { tag: quiz.topic.tag, name: quiz.topic.name } : { tag: quiz.topicTag },
    placement: quiz.placement ?? 'LESSON',
    triggerSeconds: quiz.triggerSeconds ?? null,
  };
}
