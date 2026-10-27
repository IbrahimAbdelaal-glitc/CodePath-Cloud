import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { idParams } from '../lib/validation.js';
import { requireAuth } from '../middleware/auth.js';
import {
  assertLessonAccess,
  publicQuiz,
  recordLessonActivity,
  topicStatus,
  topicStatusMessage,
} from '../services/learning.js';
import { issueCertificates } from '../services/certificates.js';
import { completionStatus, recordVideoProgress, tryCompleteLesson, videoDuration, videoTimes, watchedPercent } from '../services/coursePlayer.js';
import { presignPlayback, storageConfigured } from '../lib/storage.js';
import { forbidden } from '../lib/errors.js';

const router = Router();
router.use(requireAuth);

// Video details for the player. Uploaded files get a short-lived signed playback URL.
async function lessonVideo(lesson) {
  if (!lesson.videoProvider) return null;
  const times = videoTimes(lesson);
  const base = {
    provider: lesson.videoProvider,
    duration: times.seconds,
    runtimeSeconds: times.runtimeSeconds,
    isClip: times.isClip,
    credit: lesson.videoCredit,
    sourceUrl: lesson.videoSourceUrl,
  };
  if (lesson.videoProvider === 'YOUTUBE') {
    return { ...base, youtubeId: lesson.youtubeId, start: lesson.videoStart ?? 0, end: lesson.videoEnd ?? null };
  }
  const asset = lesson.videoAsset;
  if (!asset || asset.status !== 'READY' || !storageConfigured) return { ...base, unavailable: true };
  return { ...base, url: await presignPlayback(asset.storageKey), contentType: asset.contentType };
}

router.get('/:id', async (req, res) => {
  const { id } = idParams.parse(req.params);
  const userId = req.user.id;
  const { access } = await assertLessonAccess(req.user, id);

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      resources: { orderBy: { order: 'asc' } },
      quizzes: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }], include: { topic: true } },
      videoAsset: { select: { storageKey: true, contentType: true, status: true } },
      videoProgress: { where: { userId } },
      module: {
        select: {
          id: true,
          title: true,
          order: true,
          roadmap: { select: { id: true, title: true, slug: true, isSequential: true } },
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
  const [video, completion] = await Promise.all([lessonVideo(lesson), completionStatus(userId, id)]);
  const watch = lesson.videoProgress[0];
  const isStaff = req.user.role !== 'STUDENT';

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
      preview: isStaff && access.locked,
      video,
      videoProgress: video
        ? {
            position: watch?.positionSeconds ?? 0,
            percent: watchedPercent(watch, video.duration),
            completed: Boolean(watch?.completedAt),
          }
        : null,
      completion,
      quizzes: lesson.quizzes
        .filter((q) => q.placement !== 'CHECKPOINT')
        .map((q) => ({ ...publicQuiz(q), attempts: attemptsByQuiz.get(q.id) })),
      checkpoints: lesson.quizzes
        .filter((q) => q.placement === 'CHECKPOINT')
        .map((q) => ({
          ...publicQuiz(q),
          answered: attemptsByQuiz.get(q.id).length > 0,
          // Latest answer was right (attempts are newest first)
          correct: Boolean(attemptsByQuiz.get(q.id)[0]?.isCorrect),
          // Review flags are only shown to staff
          ...(isStaff && { needsReview: q.needsReview, sourceNote: q.sourceNote }),
        })),
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
  const { lesson } = await assertLessonAccess(req.user, id);

  // Sequential courses: completion requires the watched video and the in-video questions (at the pass mark, if the
  // course sets one), and cannot be undone
  if (req.user.role === 'STUDENT' && lesson.module.roadmap.isSequential) {
    if (!isCompleted) throw forbidden('Completed lessons in this course stay completed.');
    const result = await tryCompleteLesson(req.user, id);
    if (!result.completed) {
      throw forbidden(result.status.blockers.join('. '), { code: 'LESSON_INCOMPLETE', details: result.status });
    }
    return res.json({
      progress: { lessonId: id, isCompleted: true, completedAt: new Date() },
      certificate: result.certificateId ? { id: result.certificateId } : null,
    });
  }

  const progress = await prisma.userProgress.upsert({
    where: { userId_lessonId: { userId: req.user.id, lessonId: id } },
    create: { userId: req.user.id, lessonId: id, isCompleted, completedAt: isCompleted ? new Date() : null },
    update: { isCompleted, completedAt: isCompleted ? new Date() : null },
  });
  // Completing the last lesson of a path issues its certificate
  const [certificate] = isCompleted ? await issueCertificates(req.user, [lesson.module.roadmap.id]) : [];
  res.json({
    progress: { lessonId: id, isCompleted: progress.isCompleted, completedAt: progress.completedAt },
    certificate: certificate ? { id: certificate.id } : null,
  });
});

// The player reports what it actually played (seconds from the clip start). See recordVideoProgress.
const watchSchema = z
  .object({
    from: z.number().min(0).max(100000).nullable().optional(),
    to: z.number().min(0).max(100000).nullable().optional(),
    position: z.number().min(0).max(100000),
  })
  .refine((d) => d.from == null || d.to == null || d.to >= d.from, { message: 'Invalid watch interval' });

router.post('/:id/video-progress', async (req, res) => {
  const { id } = idParams.parse(req.params);
  const body = watchSchema.parse(req.body);
  await assertLessonAccess(req.user, id);
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: { id: true, videoProvider: true, videoStart: true, videoEnd: true, videoDurationSeconds: true },
  });
  const progress = await recordVideoProgress(req.user.id, lesson, body);
  // Watching the video can finish the lesson when its questions are already answered
  const result = req.user.role === 'STUDENT' && progress.completedAt ? await tryCompleteLesson(req.user, id) : null;
  res.json({
    videoProgress: {
      position: progress.positionSeconds,
      percent: watchedPercent(progress, videoDuration(lesson)),
      completed: Boolean(progress.completedAt),
    },
    lessonCompleted: Boolean(result?.completed),
    certificate: result?.certificateId ? { id: result.certificateId } : null,
    completion: result?.status ?? (await completionStatus(req.user.id, id)),
  });
});

// Heartbeat from the lesson page while it is visible and in use (see recordLessonActivity)
router.post('/:id/activity', async (req, res) => {
  const { id } = idParams.parse(req.params);
  await assertLessonAccess(req.user, id);
  // Only students earn certificates, so only their learning time is recorded
  if (req.user.role === 'STUDENT') await recordLessonActivity(req.user.id, id);
  res.status(204).end();
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
