// Content management for instructors and admins.
// ADMIN manages every path; INSTRUCTOR manages only the paths assigned to them.
import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import { difficulty, httpUrl, idParams, slug, topicTag, uuid } from '../lib/validation.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('INSTRUCTOR', 'ADMIN'));

// ── Path-level permission checks ─────────────────────────────
async function assertCanManage(user, roadmapId) {
  if (!roadmapId) throw notFound();
  if (user.role === 'ADMIN') return;
  const assigned = await prisma.roadmapInstructor.findUnique({
    where: { roadmapId_userId: { roadmapId, userId: user.id } },
  });
  if (!assigned) throw forbidden('This path is not assigned to you, so you cannot edit its content');
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

const lessonSchema = z.object({
  title: text(2, 160, 'Lesson title is too short'),
  summary: optionalText(500),
  content: text(10, 60000, 'Lesson content is too short'),
  keyTakeaways: z.array(z.string().trim().min(1).max(300)).max(15).default([]),
  difficulty,
  estimatedMinutes: minutes,
  resources: z.array(resourceSchema).max(20).optional(),
});

const quizSchema = z
  .object({
    question: text(5, 1000, 'Question text is too short'),
    questionType: z.enum(['MULTIPLE_CHOICE', 'CODE_OUTPUT', 'FILL_IN_THE_BLANK'], { error: 'Invalid question type' }),
    codeSnippet: optionalText(5000),
    options: z.array(z.string().trim().min(1, 'Options cannot be empty').max(300)).max(8).optional().default([]),
    correctAnswer: text(1, 1000, 'The correct answer is required'),
    acceptedAnswers: z.array(z.string().trim().min(1).max(1000)).max(10).optional().default([]),
    explanation: text(5, 3000, 'An explanation is required so students understand the answer'),
    topicTag,
    topicName: z.string().trim().min(2).max(80).optional(),
    points: z.coerce.number().int().min(1).max(100).default(10),
  })
  .superRefine((q, ctx) => {
    if (q.questionType === 'MULTIPLE_CHOICE' && q.options.length < 2) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'A multiple-choice question needs at least two options' });
    }
    if (q.options.length && !q.options.includes(q.correctAnswer)) {
      ctx.addIssue({ code: 'custom', path: ['correctAnswer'], message: 'The correct answer must match one of the options' });
    }
    if (new Set(q.options).size !== q.options.length) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'Options must not repeat' });
    }
    if (q.questionType !== 'MULTIPLE_CHOICE' && !q.codeSnippet) {
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
  const where = req.user.role === 'ADMIN' ? {} : { instructors: { some: { userId: req.user.id } } };
  const roadmaps = await prisma.roadmap.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    include: {
      _count: { select: { modules: true } },
      modules: { select: { _count: { select: { lessons: true } } } },
      instructors: { select: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  res.json({
    roadmaps: roadmaps.map(({ modules, _count, instructors, ...r }) => ({
      ...r,
      moduleCount: _count.modules,
      lessonCount: modules.reduce((s, m) => s + m._count.lessons, 0),
      instructors: instructors.map((i) => i.user),
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
  await assertCanManage(req.user, id);
  const roadmap = await prisma.roadmap.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          prerequisites: { select: { prerequisiteId: true } },
          lessons: {
            orderBy: { order: 'asc' },
            select: { id: true, title: true, order: true, difficulty: true, estimatedMinutes: true, _count: { select: { quizzes: true } } },
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
      instructors: roadmap.instructors.map((i) => i.user),
      modules: roadmap.modules.map((m) => ({
        ...m,
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
  await assertCanManage(req.user, await roadmapOfModule(moduleId));
  const { resources = [], ...data } = lessonSchema.parse(req.body);
  const last = await prisma.lesson.findFirst({ where: { moduleId }, orderBy: { order: 'desc' } });
  const lesson = await prisma.lesson.create({
    data: {
      ...data,
      moduleId,
      order: (last?.order ?? 0) + 1,
      resources: { create: resources.map((r, i) => ({ ...r, order: i })) },
    },
  });
  res.status(201).json({ lesson });
});

router.get('/lessons/:id', async (req, res) => {
  const { id } = idParams.parse(req.params);
  await assertCanManage(req.user, await roadmapOfLesson(id));
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      resources: { orderBy: { order: 'asc' } },
      quizzes: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }], include: { topic: true } },
      module: { select: { id: true, title: true, roadmap: { select: { id: true, title: true, slug: true } } } },
    },
  });
  res.json({ lesson });
});

router.patch('/lessons/:id', async (req, res) => {
  const { id } = idParams.parse(req.params);
  await assertCanManage(req.user, await roadmapOfLesson(id));
  const { resources, ...data } = lessonSchema.partial().parse(req.body);
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
  await assertCanManage(req.user, await roadmapOfLesson(lessonId));
  const data = quizSchema.parse(req.body);
  await ensureTopic(data.topicTag, data.topicName);
  const count = await prisma.quiz.count({ where: { lessonId } });
  const quiz = await prisma.quiz.create({ data: { ...quizData(data), lessonId, order: count + 1 }, include: { topic: true } });
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

export default router;
