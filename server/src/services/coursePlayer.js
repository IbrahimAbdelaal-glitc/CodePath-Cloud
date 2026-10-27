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

// The three durations a lesson's video has, kept apart everywhere they are shown:
//   seconds         what the lesson plays (the clip, or the whole video)
//   runtimeSeconds  the full video's runtime: verified from the video page for YouTube, read from the file for
//                   uploads; null when it could not be verified (shown as "runtime unavailable", never estimated)
//   isClip          the lesson plays only part of the video
// A lesson's estimatedMinutes is the time to complete it, which is a separate number.
export function videoTimes(lesson) {
  if (!lesson.videoProvider) return null;
  const isClip = lesson.videoProvider === 'YOUTUBE' && lesson.videoStart != null && lesson.videoEnd != null;
  return { seconds: videoDuration(lesson), runtimeSeconds: lesson.videoDurationSeconds || null, isClip };
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
// and every in-video checkpoint question has been answered. When the course sets checkpointPassPercent,
// the student's latest answers must also score at least that much (wrong answers can be retried).
export async function completionStatus(userId, lessonId) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      videoProvider: true,
      videoStart: true,
      videoEnd: true,
      videoDurationSeconds: true,
      module: { select: { roadmap: { select: { id: true, isSequential: true, checkpointPassPercent: true } } } },
      quizzes: { where: { placement: 'CHECKPOINT' }, select: { id: true } },
      videoProgress: { where: { userId } },
    },
  });
  if (!lesson) throw notFound('Lesson not found');
  const duration = videoDuration(lesson);
  const progress = lesson.videoProgress[0] || null;
  const checkpointIds = lesson.quizzes.map((q) => q.id);
  // Latest answer to each question
  const answered = checkpointIds.length
    ? await prisma.quizAttempt.findMany({
        where: { userId, quizId: { in: checkpointIds } },
        orderBy: { createdAt: 'desc' },
        distinct: ['quizId'],
        select: { quizId: true, isCorrect: true },
      })
    : [];
  const correctIds = answered.filter((a) => a.isCorrect).map((a) => a.quizId);
  const checkpointPercent = checkpointIds.length ? Math.round((correctIds.length / checkpointIds.length) * 100) : 100;
  const passMark = lesson.module.roadmap.checkpointPassPercent;
  const enforced = lesson.module.roadmap.isSequential;
  const videoComplete = !hasVideo(lesson) || Boolean(progress?.completedAt);
  const blockers = [];
  if (enforced && !videoComplete) {
    blockers.push(`Watch at least ${Math.round(WATCH_COMPLETE_RATIO * 100)}% of the video (${watchedPercent(progress, duration)}% so far)`);
  }
  if (enforced && answered.length < checkpointIds.length) {
    blockers.push(`Answer the in-video questions (${answered.length} of ${checkpointIds.length} answered)`);
  } else if (enforced && passMark != null && checkpointPercent < passMark) {
    blockers.push(`Score at least ${passMark}% on this video's questions (${checkpointPercent}% now). Rewatch the section and try again`);
  }
  return {
    roadmapId: lesson.module.roadmap.id,
    enforced,
    videoPercent: watchedPercent(progress, duration),
    videoComplete,
    checkpointsTotal: checkpointIds.length,
    checkpointsAnswered: answered.length,
    checkpointsCorrect: correctIds.length,
    checkpointPercent,
    checkpointPassPercent: passMark ?? null,
    correctQuizIds: correctIds,
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
      allowTestOut: true,
      linkedRoadmapIds: true,
      roadmapId: true,
      roadmap: { select: { slug: true, title: true, isPublished: true } },
      lessons: { select: { id: true } },
      _count: { select: { blockQuestions: true } },
    },
  });
  if (!mod || (!mod.roadmap.isPublished && user.role === 'STUDENT')) throw notFound('Module not found');
  return mod;
}

// Progress through the whole courses a module links to (a roadmap stage that reuses existing courses).
// A course counts as complete with the same rule as its certificate: every lesson done and every block quiz passed.
export async function linkedCourseStatus(userId, roadmapIds) {
  if (!roadmapIds?.length) return [];
  const roadmaps = await prisma.roadmap.findMany({
    where: { id: { in: roadmapIds } },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      isPublished: true,
      modules: { select: { id: true, _count: { select: { blockQuestions: true } }, lessons: { select: { id: true } } } },
    },
  });
  const lessonIds = roadmaps.flatMap((r) => r.modules.flatMap((m) => m.lessons.map((l) => l.id)));
  const quizModuleIds = roadmaps.flatMap((r) => r.modules.filter((m) => m._count.blockQuestions > 0).map((m) => m.id));
  const [done, passed] = userId
    ? await Promise.all([
        prisma.userProgress.findMany({ where: { userId, isCompleted: true, lessonId: { in: lessonIds } }, select: { lessonId: true } }),
        prisma.blockQuizAttempt.findMany({
          where: { userId, passed: true, moduleId: { in: quizModuleIds } },
          distinct: ['moduleId'],
          select: { moduleId: true },
        }),
      ])
    : [[], []];
  const doneSet = new Set(done.map((d) => d.lessonId));
  const passedSet = new Set(passed.map((p) => p.moduleId));
  const byId = new Map(roadmaps.map((r) => [r.id, r]));
  // Keep the order the module lists them in
  return roadmapIds.filter((id) => byId.has(id)).map((id) => {
    const r = byId.get(id);
    const lessons = r.modules.flatMap((m) => m.lessons);
    const quizzes = r.modules.filter((m) => m._count.blockQuestions > 0);
    const steps = lessons.length + quizzes.length;
    const completedSteps = lessons.filter((l) => doneSet.has(l.id)).length + quizzes.filter((m) => passedSet.has(m.id)).length;
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      summary: r.summary,
      isPublished: r.isPublished,
      completedSteps,
      steps,
      percent: steps ? Math.round((completedSteps / steps) * 100) : 0,
      completed: steps > 0 && completedSteps === steps,
    };
  });
}

// A skip test is a block exam taken before the lessons. Each student gets this many tries per module;
// after that they work through the lessons and take the normal exam, which can be retaken without limit.
export const MAX_TEST_OUT_ATTEMPTS = 2;

// EXAM: students must have unlocked the module, completed all its lessons (each lesson already requires the
// video and its questions) and completed any linked courses. TEST_OUT: the module must offer a skip test, be
// unlocked, not be passed yet, and the student must have tries left.
export async function blockQuizAccess(user, mod, mode = 'EXAM') {
  const access = (await computeModuleAccess(user.id, [mod.id])).get(mod.id);
  const reasons = [...access.reasons];
  const [done, testOutsUsed, passedBefore] = await Promise.all([
    prisma.userProgress.count({
      where: { userId: user.id, isCompleted: true, lessonId: { in: mod.lessons.map((l) => l.id) } },
    }),
    prisma.blockQuizAttempt.count({ where: { userId: user.id, moduleId: mod.id, mode: 'TEST_OUT' } }),
    prisma.blockQuizAttempt.count({ where: { userId: user.id, moduleId: mod.id, passed: true } }),
  ]);
  const linkedCourses = await linkedCourseStatus(user.id, mod.linkedRoadmapIds);

  if (mode === 'TEST_OUT') {
    if (!mod.allowTestOut) reasons.push('This block does not offer a skip test');
    else if (passedBefore) reasons.push('You have already passed this block');
    else if (testOutsUsed >= MAX_TEST_OUT_ATTEMPTS) {
      reasons.push(`You have used your ${MAX_TEST_OUT_ATTEMPTS} skip-test attempts. Work through the lessons, then take the block exam`);
    }
  } else {
    if (done < mod.lessons.length) reasons.push(`Complete every lesson in this module first (${done} of ${mod.lessons.length} done)`);
    for (const c of linkedCourses) {
      if (!c.completed) reasons.push(`Complete the course "${c.title}" (${c.completedSteps} of ${c.steps} steps done)`);
    }
  }
  const locked = user.role === 'STUDENT' && reasons.length > 0;
  return {
    locked,
    reasons,
    lessonsDone: done,
    lessonsTotal: mod.lessons.length,
    linkedCourses,
    testOutsUsed,
    testOutsLeft: Math.max(0, MAX_TEST_OUT_ATTEMPTS - testOutsUsed),
  };
}

const attemptSummary = (a) => ({
  id: a.id,
  mode: a.mode,
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
  const [gate, testOutGate, attempts] = await Promise.all([
    blockQuizAccess(user, mod),
    mod.allowTestOut ? blockQuizAccess(user, mod, 'TEST_OUT') : null,
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
    linkedCourses: gate.linkedCourses,
    testOut: testOutGate
      ? {
          locked: testOutGate.locked,
          reasons: testOutGate.reasons,
          attemptsAllowed: MAX_TEST_OUT_ATTEMPTS,
          attemptsUsed: testOutGate.testOutsUsed,
          attemptsLeft: testOutGate.testOutsLeft,
        }
      : null,
    passed: attempts.some((a) => a.passed),
    testedOut: attempts.some((a) => a.passed && a.mode === 'TEST_OUT'),
    bestPercent: best?.percent ?? null,
    attempts: attempts.map(attemptSummary),
  };
}

export async function startBlockQuiz(user, moduleId, mode = 'EXAM') {
  const mod = await loadModuleForQuiz(user, moduleId);
  const gate = await blockQuizAccess(user, mod, mode);
  if (gate.locked) {
    const message = mode === 'TEST_OUT' ? 'The skip test is not available.' : 'This quiz is locked. Finish the module first.';
    throw forbidden(message, { code: 'QUIZ_LOCKED', details: { reasons: gate.reasons } });
  }
  const bank = await prisma.blockQuestion.findMany({ where: { moduleId } });
  if (!bank.length) throw notFound('This module has no block quiz');
  const picked = shuffle(bank).slice(0, Math.min(mod.quizQuestionCount, bank.length));
  // Only one attempt is open at a time. An unfinished exam is discarded; an unfinished skip test is closed as a
  // failed try (score 0), so abandoning a skip test to see new questions still uses up an attempt.
  await prisma.$transaction([
    prisma.blockQuizAttempt.updateMany({
      where: { userId: user.id, moduleId, submittedAt: null, mode: 'TEST_OUT' },
      data: { submittedAt: new Date(), answers: {}, correct: 0, percent: 0, passed: false },
    }),
    prisma.blockQuizAttempt.deleteMany({ where: { userId: user.id, moduleId, submittedAt: null } }),
  ]);
  const attempt = await prisma.blockQuizAttempt.create({
    data: { userId: user.id, moduleId, mode, questionIds: picked.map((q) => q.id), total: picked.length },
  });
  // Two skip tests started at the same moment could both pass the check above; keep only the allowed number
  if (mode === 'TEST_OUT' && user.role === 'STUDENT') {
    const used = await prisma.blockQuizAttempt.count({ where: { userId: user.id, moduleId, mode: 'TEST_OUT' } });
    if (used > MAX_TEST_OUT_ATTEMPTS) {
      await prisma.blockQuizAttempt.delete({ where: { id: attempt.id } });
      throw forbidden('The skip test is not available.', { code: 'QUIZ_LOCKED', details: { reasons: ['No skip-test attempts left'] } });
    }
  }
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
