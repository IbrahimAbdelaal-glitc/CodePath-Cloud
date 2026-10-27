// Content management for instructors and admins.
// ADMIN manages every path. Any INSTRUCTOR can view every path here and add lessons and questions to it;
// editing, reordering and deleting existing content is limited to the paths assigned to them.
import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import { difficulty, httpUrl, idParams, slug, topicTag, uuid } from '../lib/validation.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { config } from '../config.js';
import { youtubeRuntime } from '../lib/youtubeRuntime.js';
import { deleteObject, headObject, presignUpload, storageConfigured, UPLOAD_URL_SECONDS } from '../lib/storage.js';

const router = Router();
router.use(requireAuth, requireRole('INSTRUCTOR', 'ADMIN'));

// ── Path-level permission checks ─────────────────────────────
async function canEdit(user, roadmapId) {
  if (user.role === 'ADMIN') return true;
  const assigned = await prisma.roadmapInstructor.findUnique({
    where: { roadmapId_userId: { roadmapId, userId: user.id } },
  });
  return Boolean(assigned);
}

async function assertCanManage(user, roadmapId) {
  if (!roadmapId) throw notFound();
  if (!(await canEdit(user, roadmapId))) throw forbidden('This path is not assigned to you, so you cannot edit its content');
}

// Viewing and adding lessons/questions: any admin or instructor (the router already requires one of these roles)
function assertCanAddContent(user, roadmapId) {
  if (!roadmapId) throw notFound();
}

async function roadmapOfModule(moduleId) {
  const m = await prisma.module.findUnique({ where: { id: moduleId }, select: { roadmapId: true } });
  if (!m) throw notFound('Module not found');
  return m.roadmapId;
}
async function roadmapOfLesson(lessonId) {
  const l = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { module: { select: { roadmapId: true } } } });
  if (!l) throw notFound('Lesson not found');
  return l.module.roadmapId;
}
async function roadmapOfQuiz(quizId) {
  const q = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { lesson: { select: { module: { select: { roadmapId: true } } } } },
  });
  if (!q) throw notFound('Question not found');
  return q.lesson.module.roadmapId;
}

// ── Schemas ──────────────────────────────────────────────────────────
const text = (min, max, msg) => z.string().trim().min(min, msg).max(max, 'Text is too long');
const optionalText = (max) => z.string().trim().max(max, 'Text is too long').optional().nullable();
const minutes = z.coerce.number().int().min(1, 'Duration must be at least one minute').max(10000).optional().nullable();

const roadmapSchema = z.object({
  title: text(3, 120, 'Path title is too short'),
  slug,
  description: text(10, 4000, 'Description is too short'),
  summary: optionalText(300),
  category: text(2, 80, 'Category is required'),
  difficulty,
  prerequisites: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().optional(),
  order: z.coerce.number().int().min(0).max(1000).optional(),
});

const moduleSchema = z.object({
  title: text(2, 120, 'Module title is too short'),
  description: optionalText(2000),
  difficulty,
  estimatedMinutes: minutes,
  prerequisiteIds: z.array(uuid).max(20).optional(),
});

const resourceSchema = z.object({
  title: text(2, 200, 'Resource title is required'),
  url: httpUrl,
  type: z.enum(['ARTICLE', 'VIDEO', 'DOCUMENTATION'], { error: 'Invalid resource type' }),
});

const seconds = z.coerce.number().int().min(0, 'Times cannot be negative').max(100000).optional().nullable();
// YouTube video ids are 11 characters; a full watch, share or embed link is also accepted
const youtubeId = z
  .string()
  .trim()
  .transform((v) => v.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/)?.[1] ?? v)
  .pipe(z.string().regex(/^[\w-]{11}$/, 'Enter a YouTube link or an 11-character video id'));

const lessonFields = z.object({
    title: text(2, 160, 'Lesson title is too short'),
    summary: optionalText(500),
    content: text(10, 60000, 'Lesson content is too short'),
    keyTakeaways: z.array(z.string().trim().min(1).max(300)).max(15).default([]),
    difficulty,
    estimatedMinutes: minutes,
    resources: z.array(resourceSchema).max(20).optional(),
    // Linking a YouTube video. Uploaded files are attached through the upload endpoints instead.
    youtubeId: youtubeId.optional().nullable().or(z.literal('').transform(() => null)),
    videoStart: seconds,
    videoEnd: seconds,
    videoDurationSeconds: seconds,
    videoCredit: optionalText(300),
    videoSourceUrl: httpUrl.optional().nullable().or(z.literal('').transform(() => null)),
});
const clipOrder = [
  (d) => d.videoStart == null || d.videoEnd == null || d.videoEnd > d.videoStart,
  { message: 'The end time must be after the start time', path: ['videoEnd'] },
];
const lessonSchema = lessonFields.refine(...clipOrder);
const lessonPatchSchema = lessonFields.partial().refine(...clipOrder);

const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// A YouTube id in the body switches the lesson to YouTube; an empty one removes a YouTube video.
// The video's runtime is never taken from the form: the server reads it from the video's page when the video is
// added or changed (null, shown as "runtime unavailable", when it cannot be verified), and a clip may not end after it.
// Uploaded files get their runtime from the file itself in the upload flow.
async function videoFields(data, existing = null) {
  const { videoDurationSeconds: _ignored, ...rest } = data;
  let out = rest;
  let runtime = existing?.videoDurationSeconds ?? null;
  if ('youtubeId' in rest) {
    const { youtubeId: id, ...others } = rest;
    if (!id) {
      out = { ...others, youtubeId: null, ...(existing?.videoProvider === 'YOUTUBE' ? { videoDurationSeconds: null } : {}) };
      runtime = null;
    } else {
      out = { ...others, youtubeId: id, videoProvider: 'YOUTUBE' };
      if (id !== existing?.youtubeId || existing?.videoProvider !== 'YOUTUBE' || runtime == null) {
        runtime = (await youtubeRuntime(id)).seconds;
        out.videoDurationSeconds = runtime;
      }
    }
  }
  const end = 'videoEnd' in out ? out.videoEnd : existing?.videoEnd;
  const provider = out.videoProvider ?? existing?.videoProvider;
  if (provider === 'YOUTUBE' && runtime != null && end != null && end > runtime + 1) {
    throw badRequest(`The clip ends at ${clock(end)}, but the video is only ${clock(runtime)} long`, { field: 'videoEnd' });
  }
  return out;
}

const quizSchema = z
  .object({
    question: text(5, 1000, 'Question text is too short'),
    questionType: z.enum(['MULTIPLE_CHOICE', 'CODE_OUTPUT', 'FILL_IN_THE_BLANK', 'TRUE_FALSE', 'MULTI_SELECT'], {
      error: 'Invalid question type',
    }),
    placement: z.enum(['LESSON', 'CHECKPOINT'], { error: 'Invalid question placement' }).default('LESSON'),
    triggerSeconds: seconds,
    needsReview: z.boolean().optional(),
    codeSnippet: optionalText(5000),
    options: z.array(z.string().trim().min(1, 'Options cannot be empty').max(300)).max(8).optional().default([]),
    correctAnswer: text(1, 1000, 'The correct answer is required'),
    acceptedAnswers: z.array(z.string().trim().min(1).max(1000)).max(10).optional().default([]),
    explanation: text(5, 3000, 'An explanation is required so students understand the answer'),
    topicTag,
    topicName: z.string().trim().min(2).max(80).optional(),
    points: z.coerce.number().int().min(1, 'Points must be between 1 and 100').max(100, 'Points must be between 1 and 100').default(10),
    // Position among the lesson's questions; new questions go last when omitted
    order: z.coerce.number().int().min(1, 'Position must be 1 or more').max(1000, 'Position is too large').optional(),
  })
  .superRefine((q, ctx) => {
    const choice = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'MULTI_SELECT'].includes(q.questionType);
    if (choice && q.options.length < 2) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'This question needs at least two options' });
    }
    if (q.questionType === 'TRUE_FALSE' && (q.options.length !== 2 || !q.options.includes('True') || !q.options.includes('False'))) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'A true/false question has exactly the options True and False' });
    }
    if (q.questionType === 'MULTI_SELECT') {
      let picked = null;
      try {
        picked = JSON.parse(q.correctAnswer);
      } catch {
        /* reported below */
      }
      if (!Array.isArray(picked) || !picked.length || picked.some((p) => !q.options.includes(p))) {
        ctx.addIssue({ code: 'custom', path: ['correctAnswer'], message: 'Select at least one correct option' });
      }
    } else if (q.options.length && !q.options.includes(q.correctAnswer)) {
      ctx.addIssue({ code: 'custom', path: ['correctAnswer'], message: 'The correct answer must match one of the options' });
    }
    if (new Set(q.options).size !== q.options.length) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'Options must not repeat' });
    }
    if (q.placement === 'CHECKPOINT' && q.triggerSeconds == null) {
      ctx.addIssue({ code: 'custom', path: ['triggerSeconds'], message: 'Choose when the question appears in the video' });
    }
    if (!choice && !q.codeSnippet) {
      ctx.addIssue({ code: 'custom', path: ['codeSnippet'], message: 'This question type needs a code snippet' });
    }
    if (q.questionType === 'FILL_IN_THE_BLANK' && q.codeSnippet && !q.codeSnippet.includes('___')) {
      ctx.addIssue({ code: 'custom', path: ['codeSnippet'], message: 'Put ___ where the missing part of the code goes' });
    }
  });

// ── Helpers ─────────────────────────────────────────────────────
async function assertNoCycle(roadmapId, moduleId, prerequisiteIds) {
  if (prerequisiteIds.includes(moduleId)) throw badRequest('A module cannot be its own prerequisite');
  const modules = await prisma.module.findMany({
    where: { roadmapId },
    select: { id: true, prerequisites: { select: { prerequisiteId: true } } },
  });
  const ids = new Set(modules.map((m) => m.id));
  if (prerequisiteIds.some((id) => !ids.has(id))) {
    throw badRequest('Prerequisites must be modules from the same path');
  }
  const graph = new Map(modules.map((m) => [m.id, m.prerequisites.map((p) => p.prerequisiteId)]));
  graph.set(moduleId, prerequisiteIds);
  const visiting = new Set();
  const done = new Set();
  const visit = (id) => {
    if (done.has(id)) return false;
    if (visiting.has(id)) return true;
    visiting.add(id);
    const cyclic = (graph.get(id) || []).some(visit);
    visiting.delete(id);
    done.add(id);
    return cyclic;
  };
  if (visit(moduleId)) throw badRequest('These prerequisites create a cycle between modules');
}

async function ensureTopic(tag, name) {
  const existing = await prisma.topic.findUnique({ where: { tag } });
  if (existing) return existing;
  if (!name) throw badRequest('This is a new topic; enter a name for it', { details: [{ field: 'topicName', message: 'Required' }] });
  return prisma.topic.create({ data: { tag, name } });
}

// Swap an item's order with its neighbour (respects the unique order constraint)
async function swapOrder(model, scopeField, item, direction) {
  const neighbor = await prisma[model].findFirst({
    where: {
      [scopeField]: item[scopeField],
      order: direction === 'up' ? { lt: item.order } : { gt: item.order },
    },
    orderBy: { order: direction === 'up' ? 'desc' : 'asc' },
  });
  if (!neighbor) return false;
  await prisma.$transaction([
    prisma[model].update({ where: { id: item.id }, data: { order: -1 - item.order } }),
    prisma[model].update({ where: { id: neighbor.id }, data: { order: item.order } }),
    prisma[model].update({ where: { id: item.id }, data: { order: neighbor.order } }),
  ]);
  return true;
}
const moveSchema = z.object({ direction: z.enum(['up', 'down'], { error: 'Invalid direction' }) });

// ── Paths ─────────────────────────────────────────────────────────
router.get('/roadmaps', async (req, res) => {
  const roadmaps = await prisma.roadmap.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    include: {
      _count: { select: { modules: true } },
      modules: { orderBy: { order: 'asc' }, select: { id: true, title: true, _count: { select: { lessons: true } } } },
      instructors: { select: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  res.json({
    roadmaps: roadmaps.map(({ modules, _count, instructors, ...r }) => ({
      ...r,
      moduleCount: _count.modules,
      lessonCount: modules.reduce((s, m) => s + m._count.lessons, 0),
      // For choosing where a new lesson goes
      modules: modules.map(({ id, title }) => ({ id, title })),
      instructors: instructors.map((i) => i.user),
      canEdit: req.user.role === 'ADMIN' || instructors.some((i) => i.user.id === req.user.id),
    })),
  });
});

router.post('/roadmaps', async (req, res) => {
  const data = roadmapSchema.parse(req.body);
  if (req.user.role !== 'ADMIN') delete data.isFeatured;
  const roadmap = await prisma.roadmap.create({
    data: {
      ...data,
      createdById: req.user.id,
      // An instructor who creates a path is assigned to it automatically
      ...(req.user.role === 'INSTRUCTOR' && { instructors: { create: { userId: req.user.id } } }),
    },
  });
  res.status(201).json({ roadmap });
});

router.get('/roadmaps/:id', async (req, res) => {
  const { id } = idParams.parse(req.params);
  assertCanAddContent(req.user, id);
  const roadmap = await prisma.roadmap.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          prerequisites: { select: { prerequisiteId: true } },
          _count: { select: { blockQuestions: true } },
          lessons: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              order: true,
              difficulty: true,
              estimatedMinutes: true,
              videoProvider: true,
              _count: { select: { quizzes: true } },
            },
          },
        },
      },
      instructors: { select: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!roadmap) throw notFound('Learning path not found');
  res.json({
    roadmap: {
      ...roadmap,
      canEdit: await canEdit(req.user, id),
      instructors: roadmap.instructors.map((i) => i.user),
      modules: roadmap.modules.map(({ _count, ...m }) => ({
        ...m,
        blockQuestionCount: _count.blockQuestions,
        prerequisiteIds: m.prerequisites.map((p) => p.prerequisiteId),
        prerequisites: undefined,
        lessons: m.lessons.map(({ _count, ...l }) => ({ ...l, quizCount: _count.quizzes })),
      })),
    },
  });
});

router.patch('/roadmaps/:id', async (req, res) => {
  const { id } = idParams.parse(req.params);
  await assertCanManage(req.user, id);
  const data = roadmapSchema.partial().parse(req.body);
  if (req.user.role !== 'ADMIN') delete data.isFeatured;
  const roadmap = await prisma.roadmap.update({ where: { id }, data });
  res.json({ roadmap });
});

router.delete('/roadmaps/:id', requireRole('ADMIN'), async (req, res) => {
  const { id } = idParams.parse(req.params);
  await prisma.roadmap.delete({ where: { id } });
  res.status(204).end();
});

// ── Modules ──────────────────────────────────────────────────────────
router.post('/roadmaps/:id/modules', async (req, res) => {
  const { id: roadmapId } = idParams.parse(req.params);
  await assertCanManage(req.user, roadmapId);
  const { prerequisiteIds = [], ...data } = moduleSchema.parse(req.body);

  // Nothing depends on a new module yet, so we only check the prerequisites belong to this path
  if (prerequisiteIds.length) await assertNoCycle(roadmapId, '__new__', prerequisiteIds);

  const last = await prisma.module.findFirst({ where: { roadmapId }, orderBy: { order: 'desc' } });
  const created = await prisma.module.create({
    data: {
      ...data,
      roadmapId,
      order: (last?.order ?? 0) + 1,
      prerequisites: { create: prerequisiteIds.map((prerequisiteId) => ({ prerequisiteId })) },
    },
  });
  res.status(201).json({ module: created });
});

router.patch('/modules/:id', async (req, res) => {
  const { id } = idParams.parse(req.params);
  const roadmapId = await roadmapOfModule(id);
  await assertCanManage(req.user, roadmapId);
  const { prerequisiteIds, ...data } = moduleSchema.partial().parse(req.body);

  if (prerequisiteIds) await assertNoCycle(roadmapId, id, prerequisiteIds);
  const updated = await prisma.$transaction(async (tx) => {
    if (prerequisiteIds) {
      await tx.modulePrerequisite.deleteMany({ where: { moduleId: id } });
      await tx.modulePrerequisite.createMany({
        data: prerequisiteIds.map((prerequisiteId) => ({ moduleId: id, prerequisiteId })),
      });
    }
    return tx.module.update({ where: { id }, data });
  });
  res.json({ module: updated });
});

router.post('/modules/:id/move', async (req, res) => {
  const { id } = idParams.parse(req.params);
  const { direction } = moveSchema.parse(req.body);
  const item = await prisma.module.findUnique({ where: { id } });
  if (!item) throw notFound('Module not found');
  await assertCanManage(req.user, item.roadmapId);
  res.json({ moved: await swapOrder('module', 'roadmapId', item, direction) });
});

router.delete('/modules/:id', async (req, res) => {
  const { id } = idParams.parse(req.params);
  await assertCanManage(req.user, await roadmapOfModule(id));
  await prisma.module.delete({ where: { id } });
  res.status(204).end();
});

// ── Lessons ───────────────────────────────────────────────────────────
router.post('/modules/:id/lessons', async (req, res) => {
  const { id: moduleId } = idParams.parse(req.params);
  assertCanAddContent(req.user, await roadmapOfModule(moduleId));
  const { resources = [], ...data } = lessonSchema.parse(req.body);
  const last = await prisma.lesson.findFirst({ where: { moduleId }, orderBy: { order: 'desc' } });
  const video = await videoFields(data);
  const lesson = await prisma.lesson.create({
    data: {
      ...video,
      moduleId,
      order: (last?.order ?? 0) + 1,
      resources: { create: resources.map((r, i) => ({ ...r, order: i })) },
    },
  });
  res.status(201).json({ lesson });
});

router.get('/lessons/:id', async (req, res) => {
  const { id } = idParams.parse(req.params);
  const roadmapId = await roadmapOfLesson(id);
  assertCanAddContent(req.user, roadmapId);
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      resources: { orderBy: { order: 'asc' } },
      quizzes: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }], include: { topic: true } },
      module: { select: { id: true, title: true, roadmap: { select: { id: true, title: true, slug: true } } } },
      videoAsset: { select: { id: true, originalName: true, sizeBytes: true, contentType: true, durationSeconds: true, completedAt: true } },
    },
  });
  res.json({ lesson: { ...lesson, canEdit: await canEdit(req.user, roadmapId) } });
});

router.patch('/lessons/:id', async (req, res) => {
  const { id } = idParams.parse(req.params);
  await assertCanManage(req.user, await roadmapOfLesson(id));
  const existing = await prisma.lesson.findUnique({
    where: { id },
    select: { youtubeId: true, videoProvider: true, videoEnd: true, videoDurationSeconds: true },
  });
  const { resources, ...data } = await videoFields(lessonPatchSchema.parse(req.body), existing);
  const lesson = await prisma.$transaction(async (tx) => {
    if (resources) {
      await tx.lessonResource.deleteMany({ where: { lessonId: id } });
      await tx.lessonResource.createMany({ data: resources.map((r, i) => ({ ...r, lessonId: id, order: i })) });
    }
    return tx.lesson.update({ where: { id }, data, include: { resources: { orderBy: { order: 'asc' } } } });
  });
  res.json({ lesson });
});

router.post('/lessons/:id/move', async (req, res) => {
  const { id } = idParams.parse(req.params);
  const { direction } = moveSchema.parse(req.body);
  const item = await prisma.lesson.findUnique({ where: { id } });
  if (!item) throw notFound('Lesson not found');
  await assertCanManage(req.user, await roadmapOfModule(item.moduleId));
  res.json({ moved: await swapOrder('lesson', 'moduleId', item, direction) });
});

router.delete('/lessons/:id', async (req, res) => {
  const { id } = idParams.parse(req.params);
  await assertCanManage(req.user, await roadmapOfLesson(id));
  await prisma.lesson.delete({ where: { id } });
  res.status(204).end();
});

// ── Questions ──────────────────────────────────────────────────────────
function quizData(q) {
  const { topicName: _ignored, options, ...rest } = q;
  return { ...rest, options: options?.length ? options : undefined, codeSnippet: rest.codeSnippet || null };
}

router.post('/lessons/:id/quizzes', async (req, res) => {
  const { id: lessonId } = idParams.parse(req.params);
  assertCanAddContent(req.user, await roadmapOfLesson(lessonId));
  const data = quizSchema.parse(req.body);
  await ensureTopic(data.topicTag, data.topicName);
  const count = await prisma.quiz.count({ where: { lessonId } });
  const quiz = await prisma.quiz.create({
    data: { ...quizData(data), lessonId, order: data.order ?? count + 1 },
    include: { topic: true },
  });
  res.status(201).json({ quiz });
});

router.patch('/quizzes/:id', async (req, res) => {
  const { id } = idParams.parse(req.params);
  await assertCanManage(req.user, await roadmapOfQuiz(id));
  // Validate the full question so options and answer stay consistent
  const data = quizSchema.parse(req.body);
  await ensureTopic(data.topicTag, data.topicName);
  const quiz = await prisma.quiz.update({
    where: { id },
    data: { ...quizData(data), options: data.options.length ? data.options : Prisma.DbNull },
    include: { topic: true },
  });
  res.json({ quiz });
});

router.delete('/quizzes/:id', async (req, res) => {
  const { id } = idParams.parse(req.params);
  await assertCanManage(req.user, await roadmapOfQuiz(id));
  await prisma.quiz.delete({ where: { id } });
  res.status(204).end();
});

router.get('/topics', async (req, res) => {
  const topics = await prisma.topic.findMany({ orderBy: { tag: 'asc' } });
  res.json({ topics });
});

// ── Content review ───────────────────────────────────────────────
// Catalog questions are flagged until an instructor confirms they match the linked video
const reviewSchema = z.object({ needsReview: z.boolean({ error: 'needsReview must be true or false' }) });

router.patch('/quizzes/:id/review', async (req, res) => {
  const { id } = idParams.parse(req.params);
  await assertCanManage(req.user, await roadmapOfQuiz(id));
  const { needsReview } = reviewSchema.parse(req.body);
  const quiz = await prisma.quiz.update({ where: { id }, data: { needsReview }, select: { id: true, needsReview: true } });
  res.json({ quiz });
});

router.get('/modules/:id/block-questions', async (req, res) => {
  const { id } = idParams.parse(req.params);
  const roadmapId = await roadmapOfModule(id);
  const [questions, mod] = await Promise.all([
    prisma.blockQuestion.findMany({ where: { moduleId: id }, orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
    prisma.module.findUnique({ where: { id }, select: { id: true, title: true, quizQuestionCount: true, quizPassPercent: true } }),
  ]);
  res.json({ module: mod, questions, canEdit: await canEdit(req.user, roadmapId) });
});

router.patch('/block-questions/:id/review', async (req, res) => {
  const { id } = idParams.parse(req.params);
  const q = await prisma.blockQuestion.findUnique({ where: { id }, select: { module: { select: { roadmapId: true } } } });
  if (!q) throw notFound('Question not found');
  await assertCanManage(req.user, q.module.roadmapId);
  const { needsReview } = reviewSchema.parse(req.body);
  const question = await prisma.blockQuestion.update({ where: { id }, data: { needsReview }, select: { id: true, needsReview: true } });
  res.json({ question });
});

// ── Video uploads ────────────────────────────────────────────────
// 1. POST /lessons/:id/video-uploads → validates the file, records a PENDING asset and returns a presigned PUT URL.
// 2. The browser uploads the file straight to object storage (with progress).
// 3. POST /video-uploads/:id/complete → the server checks the stored object and attaches it to the lesson.
// Only admins and instructors assigned to the course can upload, checked here on the server.
const VIDEO_TYPES = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'video/x-m4v': 'm4v' };
const MB = 1024 * 1024;

router.get('/storage', async (req, res) => {
  res.json({
    configured: storageConfigured,
    maxMb: config.storage.maxVideoMb,
    allowedTypes: Object.keys(VIDEO_TYPES),
  });
});

const uploadSchema = z.object({
  fileName: z.string().trim().min(1, 'The file needs a name').max(200, 'The file name is too long'),
  contentType: z.string().trim().refine((t) => t in VIDEO_TYPES, 'Upload an MP4, WebM or MOV video file'),
  sizeBytes: z.coerce
    .number()
    .int()
    .min(1, 'The file is empty')
    .refine((n) => n <= config.storage.maxVideoMb * MB, `The video is larger than the ${config.storage.maxVideoMb} MB limit`),
  durationSeconds: z.coerce.number().int().min(1).max(100000).optional().nullable(),
});

router.post('/lessons/:id/video-uploads', async (req, res) => {
  const { id: lessonId } = idParams.parse(req.params);
  await assertCanManage(req.user, await roadmapOfLesson(lessonId));
  const data = uploadSchema.parse(req.body);
  if (!storageConfigured) {
    throw badRequest('Video storage is not configured on the server yet. Ask an administrator to add the storage credentials.', {
      code: 'STORAGE_NOT_CONFIGURED',
    });
  }
  const asset = await prisma.videoAsset.create({
    data: {
      storageKey: `pending/${lessonId}/${Date.now()}`,
      originalName: data.fileName,
      contentType: data.contentType,
      sizeBytes: data.sizeBytes,
      durationSeconds: data.durationSeconds ?? null,
      lessonId,
      uploadedById: req.user.id,
    },
  });
  // The object key uses only generated ids, never the user's file name
  const storageKey = `lessons/${lessonId}/${asset.id}.${VIDEO_TYPES[data.contentType]}`;
  await prisma.videoAsset.update({ where: { id: asset.id }, data: { storageKey } });
  const uploadUrl = await presignUpload({ key: storageKey, contentType: data.contentType, sizeBytes: data.sizeBytes });
  res.status(201).json({
    upload: {
      id: asset.id,
      url: uploadUrl,
      method: 'PUT',
      headers: { 'Content-Type': data.contentType },
      expiresInSeconds: UPLOAD_URL_SECONDS,
    },
  });
});

async function findUpload(user, id) {
  const asset = await prisma.videoAsset.findUnique({ where: { id } });
  if (!asset || !asset.lessonId) throw notFound('Upload not found');
  await assertCanManage(user, await roadmapOfLesson(asset.lessonId));
  return asset;
}

const completeSchema = z.object({ durationSeconds: z.coerce.number().int().min(1).max(100000).optional().nullable() });

router.post('/video-uploads/:id/complete', async (req, res) => {
  const { id } = idParams.parse(req.params);
  const { durationSeconds } = completeSchema.parse(req.body ?? {});
  const asset = await findUpload(req.user, id);
  if (asset.status !== 'PENDING') throw badRequest('This upload has already been processed');

  const stored = await headObject(asset.storageKey);
  if (!stored) throw badRequest('The video did not reach storage. Please try the upload again.', { code: 'UPLOAD_MISSING' });
  if (stored.sizeBytes !== asset.sizeBytes) {
    await prisma.videoAsset.update({ where: { id }, data: { status: 'FAILED' } });
    await deleteObject(asset.storageKey).catch(() => {});
    throw badRequest('The uploaded file is incomplete. Please try the upload again.', { code: 'UPLOAD_INCOMPLETE' });
  }

  const duration = durationSeconds ?? asset.durationSeconds;
  const previous = await prisma.lesson.findUnique({ where: { id: asset.lessonId }, select: { videoAsset: true } });
  const lesson = await prisma.$transaction(async (tx) => {
    await tx.videoAsset.update({ where: { id }, data: { status: 'READY', completedAt: new Date(), durationSeconds: duration } });
    if (previous?.videoAsset) await tx.videoAsset.update({ where: { id: previous.videoAsset.id }, data: { status: 'REPLACED' } });
    // An uploaded video replaces the lesson's clip settings, so watch progress restarts against the new file
    await tx.lessonVideoProgress.deleteMany({ where: { lessonId: asset.lessonId, completedAt: null } });
    return tx.lesson.update({
      where: { id: asset.lessonId },
      data: { videoProvider: 'UPLOAD', videoAssetId: id, videoDurationSeconds: duration, videoStart: null, videoEnd: null },
      select: { id: true, title: true, videoProvider: true, videoDurationSeconds: true },
    });
  });
  if (previous?.videoAsset) await deleteObject(previous.videoAsset.storageKey).catch(() => {});
  res.json({ lesson, asset: { id, originalName: asset.originalName, sizeBytes: asset.sizeBytes, durationSeconds: duration } });
});

router.post('/video-uploads/:id/abort', async (req, res) => {
  const { id } = idParams.parse(req.params);
  const asset = await findUpload(req.user, id);
  if (asset.status === 'PENDING') {
    await prisma.videoAsset.update({ where: { id }, data: { status: 'FAILED' } });
    await deleteObject(asset.storageKey).catch(() => {});
  }
  res.status(204).end();
});

// Removes an uploaded video; the lesson falls back to its YouTube video when it has one
router.delete('/lessons/:id/video-upload', async (req, res) => {
  const { id } = idParams.parse(req.params);
  await assertCanManage(req.user, await roadmapOfLesson(id));
  const lesson = await prisma.lesson.findUnique({ where: { id }, include: { videoAsset: true } });
  if (!lesson.videoAsset) throw notFound('This lesson has no uploaded video');
  await prisma.$transaction([
    prisma.videoAsset.update({ where: { id: lesson.videoAsset.id }, data: { status: 'REPLACED' } }),
    prisma.lesson.update({
      where: { id },
      data: { videoAssetId: null, videoProvider: lesson.youtubeId ? 'YOUTUBE' : null },
    }),
  ]);
  await deleteObject(lesson.videoAsset.storageKey).catch(() => {});
  res.status(204).end();
});

export default router;
