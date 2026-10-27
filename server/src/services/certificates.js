// Certificates: issued once, when a student first completes every lesson in a published path.
// Every value is calculated from recorded data and frozen at issue time.
import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

const roadmapSelect = {
  id: true,
  title: true,
  modules: {
    select: {
      id: true,
      _count: { select: { blockQuestions: true } },
      lessons: { select: { id: true, quizzes: { select: { id: true } } } },
    },
  },
};

async function createCertificate(userId, roadmap, lessons, progressByLesson) {
  const lessonIds = lessons.map((l) => l.id);
  const quizIds = lessons.flatMap((l) => l.quizzes.map((q) => q.id));

  // Completion date: when the last lesson of the path was marked complete
  const completions = lessonIds.map((id) => {
    const p = progressByLesson.get(id);
    return (p.completedAt || p.updatedAt).getTime();
  });
  const completedAt = new Date(Math.max(...completions));

  const [attempts, activity] = await Promise.all([
    // Only answers given up to the completion date count
    prisma.quizAttempt.findMany({
      where: { userId, quizId: { in: quizIds }, createdAt: { lte: completedAt } },
      orderBy: { createdAt: 'desc' },
      select: { quizId: true, isCorrect: true, createdAt: true },
    }),
    prisma.lessonActivity.findMany({
      where: { userId, lessonId: { in: lessonIds } },
      select: { activeSeconds: true, firstActiveAt: true },
    }),
  ]);

  // Accuracy: latest answer to each answered question, the same rule as topic mastery
  const latestByQuiz = new Map();
  for (const a of attempts) if (!latestByQuiz.has(a.quizId)) latestByQuiz.set(a.quizId, a.isCorrect);
  const answered = latestByQuiz.size;
  const correct = [...latestByQuiz.values()].filter(Boolean).length;

  // Active time: only activity that started before the path was completed counts
  const counted = activity.filter((a) => a.firstActiveAt <= completedAt);
  const activeSeconds = counted.reduce((s, a) => s + a.activeSeconds, 0);
  const trackedSince = counted.length ? new Date(Math.min(...counted.map((a) => a.firstActiveAt.getTime()))) : null;
  // Fully tracked only when no recorded attempt or completion in the path happened before tracking began
  const firstRecorded = Math.min(...completions, ...attempts.map((a) => a.createdAt.getTime()));
  const timeFullyTracked = Boolean(trackedSince) && trackedSince.getTime() <= firstRecorded;

  try {
    return await prisma.certificate.create({
      data: {
        userId,
        roadmapId: roadmap.id,
        roadmapTitle: roadmap.title,
        completedAt,
        accuracy: answered ? Math.round((correct / answered) * 100) : null,
        questionsAnswered: answered,
        questionsTotal: quizIds.length,
        activeSeconds,
        timeTrackedSince: trackedSince,
        timeFullyTracked,
      },
      select: { id: true, roadmapId: true },
    });
  } catch (err) {
    // Issued concurrently by another request
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return null;
    throw err;
  }
}

// Issues certificates for every completed path that does not have one yet (optionally limited to some paths).
// Same completion rule as path progress: every lesson in the path is marked complete,
// and every module that has a block quiz has a passed attempt.
// Only students earn certificates; instructors and admins bypass module locks.
export async function issueCertificates(user, roadmapIds) {
  if (user.role !== 'STUDENT') return [];

  const roadmaps = await prisma.roadmap.findMany({
    where: {
      isPublished: true,
      ...(roadmapIds && { id: { in: roadmapIds } }),
      certificates: { none: { userId: user.id } },
    },
    select: roadmapSelect,
  });
  if (!roadmaps.length) return [];

  const lessonIds = roadmaps.flatMap((r) => r.modules.flatMap((m) => m.lessons.map((l) => l.id)));
  const progress = await prisma.userProgress.findMany({
    where: { userId: user.id, isCompleted: true, lessonId: { in: lessonIds } },
    select: { lessonId: true, completedAt: true, updatedAt: true },
  });
  const progressByLesson = new Map(progress.map((p) => [p.lessonId, p]));
  const quizModuleIds = roadmaps.flatMap((r) => r.modules.filter((m) => m._count.blockQuestions > 0).map((m) => m.id));
  const passed = quizModuleIds.length
    ? await prisma.blockQuizAttempt.findMany({
        where: { userId: user.id, passed: true, moduleId: { in: quizModuleIds } },
        distinct: ['moduleId'],
        select: { moduleId: true },
      })
    : [];
  const passedSet = new Set(passed.map((a) => a.moduleId));

  const issued = [];
  for (const r of roadmaps) {
    const lessons = r.modules.flatMap((m) => m.lessons);
    if (!lessons.length || !lessons.every((l) => progressByLesson.has(l.id))) continue;
    if (r.modules.some((m) => m._count.blockQuestions > 0 && !passedSet.has(m.id))) continue;
    const certificate = await createCertificate(user.id, r, lessons, progressByLesson);
    if (certificate) issued.push(certificate);
  }
  return issued;
}

// 128 random bits: public links cannot be guessed or enumerated
export function newVerificationCode() {
  return randomBytes(16).toString('base64url');
}

// Facts printed on the certificate; the name always comes from the student's current account profile
function certificateFacts(c, studentName) {
  return {
    studentName,
    roadmapTitle: c.roadmapTitle,
    completedAt: c.completedAt,
    issuedAt: c.issuedAt,
    accuracy: c.accuracy,
    questionsAnswered: c.questionsAnswered,
    questionsTotal: c.questionsTotal,
    activeMinutes: Math.floor(c.activeSeconds / 60),
    timeRecorded: Boolean(c.timeTrackedSince),
    timeTrackedSince: c.timeTrackedSince,
    timeFullyTracked: c.timeFullyTracked,
  };
}

// For the owner only
export function publicCertificate(c, user) {
  return {
    id: c.id,
    ...certificateFacts(c, user.name),
    roadmapSlug: c.roadmap?.slug || null,
    verificationCode: c.verificationCode,
  };
}

// For the public verification page: certificate facts only, no account details or internal IDs
export function verifiedCertificate(c) {
  return { ...certificateFacts(c, c.user.name), verificationCode: c.verificationCode };
}
