// Course player rules: verified video watching, lesson completion requirements and block quizzes.
import { prisma } from '../lib/prisma.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import { checkAnswer, computeModuleAccess, quizOptions } from './learning.js';
import { issueCertificates } from './certificates.js';

// ── Video watching ───────────────────────────────────────────────────
// The player reports the interval it actually played. The video is split into SEGMENT_SECONDS segments and a
// segment counts as watched when the student played at least half of it. Credit per report is limited by the
// wall-clock time since the previous report (allowing up to 2x playback), so skipping ahead earns nothing.
export const SEGMENT_SECONDS = 10;
export const WATCH_COMPLETE_RATIO = 0.9;
const MAX_REPORT_SPAN = 45;
const MAX_PLAYBACK_RATE = 2.1;

export function videoDuration(lesson) {
  if (lesson.videoStart != null && lesson.videoEnd != null && lesson.videoEnd > lesson.videoStart) {
    return lesson.videoEnd - lesson.videoStart;
  }
  return lesson.videoDurationSeconds || null;
}

export const hasVideo = (lesson) => Boolean(lesson.videoProvider) && Boolean(videoDuration(lesson));
const segmentCount = (duration) => Math.max(1, Math.ceil(duration / SEGMENT_SECONDS));

export function watchedPercent(progress, duration) {
  if (!progress || !duration) return 0;
  return Math.min(100, Math.round((progress.watchedSegments.length / segmentCount(duration)) * 100));
}

function creditedSegments(from, to, duration) {
  const segments = [];
  for (let k = Math.floor(from / SEGMENT_SECONDS); k * SEGMENT_SECONDS < to; k++) {
    const start = k * SEGMENT_SECONDS;
    const end = Math.min(start + SEGMENT_SECONDS, duration);
    const overlap = Math.min(to, end) - Math.max(from, start);
    if (overlap >= (end - start) / 2) segments.push(k);
  }
  return segments;
}

// from/to/position are seconds from the start of the lesson clip
export async function recordVideoProgress(userId, lesson, { from, to, position }) {
  const duration = videoDuration(lesson);
  if (!duration) throw badRequest('This lesson has no video');

  return prisma.$transaction(async (tx) => {
    // Serializes reports per user and lesson so two tabs cannot double-count the same wall-clock time
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`${userId}:${lesson.id}`}))`;
    const now = new Date();
    const existing = await tx.lessonVideoProgress.findUnique({ where: { userId_lessonId: { userId, lessonId: lesson.id } } });

    let added = [];
    if (from != null && to != null && to > from) {
      const end = Math.min(to, duration);
      const elapsed = existing ? (now - existing.lastReportAt) / 1000 : SEGMENT_SECONDS * 1.5;
      const allowed = Math.min(MAX_REPORT_SPAN, elapsed * MAX_PLAYBACK_RATE + 3);
      const start = Math.max(from, end - allowed, 0);
      if (end > start) added = creditedSegments(start, end, duration);
    }

    const watched = [...new Set([...(existing?.watchedSegments || []), ...added])].sort((a, b) => a - b);
    const pos = Math.max(0, Math.min(Math.round(position ?? to ?? 0), duration));
    const complete = watched.length / segmentCount(duration) >= WATCH_COMPLETE_RATIO;
    const data = {
      watchedSegments: watched,
      positionSeconds: pos,
      lastReportAt: now,
      ...(complete && !existing?.completedAt && { completedAt: now }),
    };
    return tx.lessonVideoProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
      create: { userId, lessonId: lesson.id, ...data },
      update: data,
    });
  });
}

// ── Lesson completion ────────────────────────────────────────────────
// In a sequential course a lesson can be marked complete only after its video is watched
// and every in-video checkpoint question has been answered (right or wrong).
export async function completionStatus(userId, lessonId) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      videoProvider: true,
      videoStart: true,
      videoEnd: true,
      videoDurationSeconds: true,
      module: { select: { roadmap: { select: { id: true, isSequential: true } } } },
      quizzes: { where: { placement: 'CHECKPOINT' }, select: { id: true } },
      videoProgress: { where: { userId } },
    },
  });
  if (!lesson) throw notFound('Lesson not found');
  const duration = videoDuration(lesson);
  const progress = lesson.videoProgress[0] || null;
  const checkpointIds = lesson.quizzes.map((q) => q.id);
  const answered = checkpointIds.length
    ? await prisma.quizAttempt.findMany({
        where: { userId, quizId: { in: checkpointIds } },
        distinct: ['quizId'],
        select: { quizId: true },
      })
    : [];
  const enforced = lesson.module.roadmap.isSequential;
  const videoComplete = !hasVideo(lesson) || Boolean(progress?.completedAt);
  const blockers = [];
  if (enforced && !videoComplete) {
    blockers.push(`Watch at least ${Math.round(WATCH_COMPLETE_RATIO * 100)}% of the video (${watchedPercent(progress, duration)}% so far)`);
  }
  if (enforced && answered.length < checkpointIds.length) {
    blockers.push(`Answer the in-video questions (${answered.length} of ${checkpointIds.length} answered)`);
  }
  return {
    roadmapId: lesson.module.roadmap.id,
    enforced,
    videoPercent: watchedPercent(progress, duration),
    videoComplete,
    checkpointsTotal: checkpointIds.length,
    checkpointsAnswered: answered.length,
    canComplete: blockers.length === 0,
    blockers,
  };
}

// Marks the lesson complete when its requirements are met. Returns { completed, certificateId, status }.
export async function tryCompleteLesson(user, lessonId) {
  const status = await completionStatus(user.id, lessonId);
  if (!status.canComplete) return { completed: false, certificateId: null, status };
  const existing = await prisma.userProgress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId } } });
  if (!existing?.isCompleted) {
    await prisma.userProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      create: { userId: user.id, lessonId, isCompleted: true, completedAt: new Date() },
      update: { isCompleted: true, completedAt: new Date() },
    });
  }
  const [certificate] = await issueCertificates(user, [status.roadmapId]);
  return { completed: true, certificateId: certificate?.id || null, status };
}

// ── Block quizzes ────────────────────────────────────────────────────
function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Browser-safe block question: no answer, explanation or review metadata
export function publicBlockQuestion(q) {
  return {
    id: q.id,
    question: q.question,
    questionType: q.questionType,
    codeSnippet: q.codeSnippet,
    options: quizOptions(q),
    lessonTitle: q.lessonTitle,
  };
}

async function loadModuleForQuiz(user, moduleId) {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: {
      id: true,
      title: true,
      order: true,
      quizQuestionCount: true,
      quizPassPercent: true,
      roadmapId: true,
      roadmap: { select: { slug: true, title: true, isPublished: true } },
      lessons: { select: { id: true } },
      _count: { select: { blockQuestions: true } },
    },
  });
  if (!mod || (!mod.roadmap.isPublished && user.role === 'STUDENT')) throw notFound('Module not found');
  return mod;
}

// Students must have unlocked the module and completed all its lessons before taking its quiz
export async function blockQuizAccess(user, mod) {
  const access = (await computeModuleAccess(user.id, [mod.id])).get(mod.id);
  const done = await prisma.userProgress.count({
    where: { userId: user.id, isCompleted: true, lessonId: { in: mod.lessons.map((l) => l.id) } },
  });
  const reasons = [...access.reasons];
  if (done < mod.lessons.length) reasons.push(`Complete every lesson in this module first (${done} of ${mod.lessons.length} done)`);
  const locked = user.role === 'STUDENT' && reasons.length > 0;
  return { locked, reasons, lessonsDone: done, lessonsTotal: mod.lessons.length };
}

const attemptSummary = (a) => ({
  id: a.id,
  correct: a.correct,
  total: a.total,
  percent: a.percent,
  passed: a.passed,
  startedAt: a.startedAt,
  submittedAt: a.submittedAt,
});

export async function blockQuizOverview(user, moduleId) {
  const mod = await loadModuleForQuiz(user, moduleId);
  if (!mod._count.blockQuestions) throw notFound('This module has no block quiz');
  const [gate, attempts] = await Promise.all([
    blockQuizAccess(user, mod),
    prisma.blockQuizAttempt.findMany({
      where: { userId: user.id, moduleId, submittedAt: { not: null } },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    }),
  ]);
  const best = attempts.reduce((b, a) => (!b || a.percent > b.percent ? a : b), null);
  return {
    module: {
      id: mod.id,
      title: mod.title,
      order: mod.order,
      roadmapSlug: mod.roadmap.slug,
      roadmapTitle: mod.roadmap.title,
      questionCount: Math.min(mod.quizQuestionCount, mod._count.blockQuestions),
      bankSize: mod._count.blockQuestions,
      passPercent: mod.quizPassPercent,
    },
    locked: gate.locked,
    reasons: gate.reasons,
    passed: attempts.some((a) => a.passed),
    bestPercent: best?.percent ?? null,
    attempts: attempts.map(attemptSummary),
  };
}

export async function startBlockQuiz(user, moduleId) {
  const mod = await loadModuleForQuiz(user, moduleId);
  const gate = await blockQuizAccess(user, mod);
  if (gate.locked) {
    throw forbidden('This quiz is locked. Finish the module first.', { code: 'QUIZ_LOCKED', details: { reasons: gate.reasons } });
  }
  const bank = await prisma.blockQuestion.findMany({ where: { moduleId } });
  if (!bank.length) throw notFound('This module has no block quiz');
  const picked = shuffle(bank).slice(0, Math.min(mod.quizQuestionCount, bank.length));
  // An unfinished earlier sitting is discarded so only one attempt is open at a time
  await prisma.blockQuizAttempt.deleteMany({ where: { userId: user.id, moduleId, submittedAt: null } });
  const attempt = await prisma.blockQuizAttempt.create({
    data: { userId: user.id, moduleId, questionIds: picked.map((q) => q.id), total: picked.length },
  });
  return {
    attempt: attemptSummary(attempt),
    passPercent: mod.quizPassPercent,
    questions: picked.map(publicBlockQuestion),
  };
}

export async function submitBlockQuiz(user, attemptId, answers) {
  const attempt = await prisma.blockQuizAttempt.findUnique({
    where: { id: attemptId },
    include: { module: { select: { quizPassPercent: true, title: true } } },
  });
  if (!attempt || attempt.userId !== user.id) throw notFound('Quiz attempt not found');
  if (attempt.submittedAt) throw badRequest('This attempt has already been submitted');

  const questions = await prisma.blockQuestion.findMany({ where: { id: { in: attempt.questionIds } } });
  const byId = new Map(questions.map((q) => [q.id, q]));
  const saved = {};
  const results = [];
  let correct = 0;
  for (const id of attempt.questionIds) {
    const q = byId.get(id);
    if (!q) continue; // removed from the bank after the attempt started
    const raw = answers[id];
    let isCorrect = false;
    if (raw != null && raw !== '' && !(Array.isArray(raw) && !raw.length)) {
      try {
        isCorrect = checkAnswer(q, raw);
      } catch {
        isCorrect = false;
      }
    }
    if (isCorrect) correct += 1;
    saved[id] = raw ?? null;
    results.push({
      ...publicBlockQuestion(q),
      yourAnswer: raw ?? null,
      isCorrect,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    });
  }
  const total = results.length || 1;
  const percent = Math.round((correct / total) * 100);
  const passed = percent >= attempt.module.quizPassPercent;
  // Conditional update so a double submit cannot grade the same attempt twice
  const claimed = await prisma.blockQuizAttempt.updateMany({
    where: { id: attemptId, submittedAt: null },
    data: { answers: saved, correct, total: results.length, percent, passed, submittedAt: new Date() },
  });
  if (claimed.count !== 1) throw badRequest('This attempt has already been submitted');
  return {
    attempt: { ...attemptSummary(attempt), correct, total: results.length, percent, passed, submittedAt: new Date() },
    passPercent: attempt.module.quizPassPercent,
    results,
  };
}

// Review of a submitted attempt (answers and explanations are shown only after submission)
export async function reviewBlockQuiz(user, attemptId) {
  const attempt = await prisma.blockQuizAttempt.findUnique({
    where: { id: attemptId },
    include: { module: { select: { quizPassPercent: true } } },
  });
  if (!attempt || attempt.userId !== user.id) throw notFound('Quiz attempt not found');
  if (!attempt.submittedAt) throw badRequest('Submit the attempt to see the answers');
  const questions = await prisma.blockQuestion.findMany({ where: { id: { in: attempt.questionIds } } });
  const byId = new Map(questions.map((q) => [q.id, q]));
  const answers = attempt.answers || {};
  const results = attempt.questionIds.filter((id) => byId.has(id)).map((id) => {
    const q = byId.get(id);
    let isCorrect = false;
    try {
      isCorrect = answers[id] != null && checkAnswer(q, answers[id]);
    } catch {
      isCorrect = false;
    }
    return { ...publicBlockQuestion(q), yourAnswer: answers[id] ?? null, isCorrect, correctAnswer: q.correctAnswer, explanation: q.explanation };
  });
  return { attempt: attemptSummary(attempt), passPercent: attempt.module.quizPassPercent, results };
}
