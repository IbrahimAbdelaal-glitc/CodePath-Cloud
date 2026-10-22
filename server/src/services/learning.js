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

export async function evaluateTopic(userId, topicTag, { wasIncorrect = false } = {}) {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId, quiz: { topicTag } },
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
    where: { quizzes: { some: { topicTag: { in: tags } } }, module: { roadmap: { isPublished: true } } },
    select: {
      id: true,
      title: true,
      estimatedMinutes: true,
      quizzes: { select: { topicTag: true } },
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
// A module is locked if (a) any lesson in its prerequisite modules is incomplete, or
// (b) the student has a "needs review" topic from those prerequisite modules.
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
              lessons: { select: { id: true, quizzes: { select: { topicTag: true } } } },
            },
          },
        },
      },
    },
  });

  const prereqLessonIds = modules.flatMap((m) =>
    m.prerequisites.flatMap((p) => p.prerequisite.lessons.map((l) => l.id)),
  );

  const [completed, weaknesses] = userId
    ? await Promise.all([
        prisma.userProgress.findMany({
          where: { userId, isCompleted: true, lessonId: { in: prereqLessonIds } },
          select: { lessonId: true },
        }),
        prisma.userWeakness.findMany({
          where: { userId, needsReview: true },
          include: { topic: true },
        }),
      ])
    : [[], []];

  const completedSet = new Set(completed.map((p) => p.lessonId));
  const weakByTag = new Map(weaknesses.map((w) => [w.topicTag, w]));

  const neededTags = new Set();
  const draft = modules.map((m) => {
    const incompleteModules = [];
    const reviewTags = new Set();
    for (const { prerequisite: p } of m.prerequisites) {
      const total = p.lessons.length;
      const done = p.lessons.filter((l) => completedSet.has(l.id)).length;
      if (done < total) incompleteModules.push({ id: p.id, title: p.title, completed: done, total });
      for (const l of p.lessons) {
        for (const q of l.quizzes) if (weakByTag.has(q.topicTag)) reviewTags.add(q.topicTag);
      }
    }
    reviewTags.forEach((t) => neededTags.add(t));
    return { m, incompleteModules, reviewTags: [...reviewTags] };
  });

  const lessonsByTag = await lessonsForTopics([...neededTags]);

  for (const { m, incompleteModules, reviewTags } of draft) {
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
      ...reviewTopics.map(
        (t) => `"${t.name}" needs review: your accuracy is ${t.accuracy}%, below 70%. ${t.message}`,
      ),
    ];
    result.set(m.id, {
      locked: Boolean(userId) && reasons.length > 0,
      hasPrerequisites: m.prerequisites.length > 0,
      prerequisites: m.prerequisites.map((p) => ({ id: p.prerequisite.id, title: p.prerequisite.title })),
      incompleteModules,
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
    select: { id: true, moduleId: true, module: { select: { roadmap: { select: { slug: true } } } } },
  });
  if (!lesson) throw notFound('Lesson not found');

  const access = (await computeModuleAccess(user.id, [lesson.moduleId])).get(lesson.moduleId);
  if (user.role === 'STUDENT' && access.locked) {
    throw forbidden('This module is locked. Complete its requirements to unlock it.', {
      code: 'MODULE_LOCKED',
      details: { ...access, roadmapSlug: lesson.module.roadmap.slug },
    });
  }
  return { lesson, access };
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

export function checkAnswer(quiz, rawAnswer) {
  const options = quizOptions(quiz);
  const accepted = [quiz.correctAnswer, ...(quiz.acceptedAnswers || [])];

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
  };
}
