// Built-in course catalog (src/catalog). Each course has a key and a version. When an operator runs the sync (CLI or admin System page; never on start-up), a course that is missing
// is created, and a course whose stored catalogVersion is lower than the code's version is updated in place:
// items are matched by catalogKey, so student progress on unchanged lessons is kept. Content that instructors add
// themselves (no catalogKey) is never touched. Uploaded videos and instructor review decisions are preserved.
// Catalog courses use an 80% pass mark for in-video questions and block quizzes unless a course says otherwise.
import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import courses from '../catalog/index.js';

const CHOICE_TYPES = new Set(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'MULTI_SELECT']);

// Normalizes a question from the catalog format and checks it is answerable
function questionData(q, where) {
  const type = q.type || (q.options ? 'MULTIPLE_CHOICE' : 'FILL_IN_THE_BLANK');
  const options = type === 'TRUE_FALSE' ? ['True', 'False'] : q.options || null;
  const answer = type === 'MULTI_SELECT' ? JSON.stringify([...q.answer].sort()) : String(q.answer);
  if (CHOICE_TYPES.has(type)) {
    const picks = type === 'MULTI_SELECT' ? q.answer : [answer];
    if (!options || picks.some((p) => !options.includes(p))) throw new Error(`${where}: answer is not one of the options`);
    if (new Set(options).size !== options.length) throw new Error(`${where}: repeated options`);
  } else if (!answer.trim()) {
    throw new Error(`${where}: missing answer`);
  }
  if (!q.explanation) throw new Error(`${where}: missing explanation`);
  return {
    question: q.q,
    questionType: type,
    codeSnippet: q.code ?? null,
    options: options ?? undefined,
    correctAnswer: answer,
    acceptedAnswers: q.accepted ?? [],
    explanation: q.explanation,
    sourceNote: q.source ?? null,
  };
}

// Moves items out of the way of the unique (parent, order) constraint before renumbering
async function parkOrders(model, where) {
  const items = await prisma[model].findMany({ where, select: { id: true }, orderBy: { order: 'asc' } });
  for (const [i, item] of items.entries()) {
    await prisma[model].update({ where: { id: item.id }, data: { order: -100000 - i } });
  }
}

async function syncLesson(moduleId, order, l, courseKey) {
  const key = `${courseKey}:${l.key}`;
  const existing = await prisma.lesson.findUnique({ where: { catalogKey: key } });
  const v = l.video;
  const video =
    existing?.videoProvider === 'UPLOAD'
      ? {}
      : v
        ? {
            videoProvider: 'YOUTUBE',
            youtubeId: v.youtubeId,
            videoStart: v.start ?? null,
            videoEnd: v.end ?? null,
            videoDurationSeconds: v.duration ?? null,
          }
        : {};
  const data = {
    moduleId,
    order,
    title: l.title,
    summary: l.summary ?? null,
    content: l.content,
    keyTakeaways: l.takeaways ?? [],
    difficulty: l.difficulty ?? 'BEGINNER',
    estimatedMinutes: l.minutes ?? (v ? Math.max(1, Math.round(((v.end ?? v.duration) - (v.start ?? 0)) / 60)) : null),
    videoCredit: v?.credit ?? null,
    videoSourceUrl: v?.sourceUrl ?? null,
    ...video,
  };
  const lesson = existing
    ? await prisma.lesson.update({ where: { id: existing.id }, data })
    : await prisma.lesson.create({ data: { ...data, catalogKey: key } });

  const keep = [];
  for (const [i, c] of (l.checkpoints || []).entries()) {
    const ckey = `${key}:${c.key ?? `c${i + 1}`}`;
    keep.push(ckey);
    const q = questionData(c, ckey);
    const fields = { ...q, lessonId: lesson.id, placement: 'CHECKPOINT', triggerSeconds: c.at, topicTag: c.topic, order: i + 1, points: 5 };
    const found = await prisma.quiz.findUnique({ where: { catalogKey: ckey }, select: { id: true } });
    if (found) await prisma.quiz.update({ where: { id: found.id }, data: fields });
    else await prisma.quiz.create({ data: { ...fields, catalogKey: ckey, needsReview: Boolean(c.review) } });
  }
  await prisma.quiz.deleteMany({ where: { lessonId: lesson.id, catalogKey: { startsWith: `${key}:`, notIn: keep } } });
  return lesson;
}

// Other catalog courses referenced by key, resolved to the stored roadmaps (they are synced earlier in the list)
async function catalogRoadmaps(keys) {
  if (!keys?.length) return [];
  const found = await prisma.roadmap.findMany({ where: { catalogKey: { in: keys } }, select: { id: true, slug: true, title: true, catalogKey: true } });
  const byKey = new Map(found.map((r) => [r.catalogKey, r]));
  const missing = keys.filter((k) => !byKey.has(k));
  if (missing.length) throw new Error(`Catalog course(s) not found: ${missing.join(', ')}. List them before the course that links them.`);
  return keys.map((k) => byKey.get(k));
}

async function syncModule(roadmapId, order, m, courseKey) {
  const key = `${courseKey}:${m.key}`;
  const existing = await prisma.module.findUnique({ where: { catalogKey: key } });
  const linked = await catalogRoadmaps(m.linkedCourses);
  const specialties = [];
  for (const sp of m.specialties || []) {
    const courses = await catalogRoadmaps(sp.courses);
    specialties.push({
      key: sp.key,
      title: sp.title,
      summary: sp.summary,
      roles: sp.roles ?? [],
      courses: courses.map(({ slug, title }) => ({ slug, title })),
      resources: sp.resources ?? [],
    });
  }
  const data = {
    roadmapId,
    order,
    title: m.title,
    description: m.description ?? null,
    difficulty: m.difficulty ?? 'BEGINNER',
    quizQuestionCount: m.quizCount ?? 10,
    quizPassPercent: m.passPercent ?? 80,
    allowTestOut: Boolean(m.allowTestOut),
    linkedRoadmapIds: linked.map((r) => r.id),
    learningOutcomes: m.outcomes ?? [],
    prerequisiteNotes: m.prerequisites ?? [],
    timeEstimate: m.time ?? null,
    practice: m.practice ?? null,
    nextSteps: m.nextSteps ?? null,
    specialties,
  };
  const mod = existing
    ? await prisma.module.update({ where: { id: existing.id }, data })
    : await prisma.module.create({ data: { ...data, catalogKey: key } });

  // Lessons: catalog lessons first in catalog order, then any lessons instructors added
  await parkOrders('lesson', { moduleId: mod.id });
  const lessonKeys = [];
  let minutes = 0;
  for (const [i, l] of m.lessons.entries()) {
    const lesson = await syncLesson(mod.id, i + 1, l, courseKey);
    lessonKeys.push(lesson.catalogKey);
    minutes += lesson.estimatedMinutes || 0;
  }
  await prisma.lesson.deleteMany({ where: { moduleId: mod.id, catalogKey: { startsWith: `${courseKey}:`, notIn: lessonKeys } } });
  const extra = await prisma.lesson.findMany({ where: { moduleId: mod.id, order: { lt: 0 } }, orderBy: { order: 'desc' } });
  for (const [i, l] of extra.entries()) await prisma.lesson.update({ where: { id: l.id }, data: { order: m.lessons.length + i + 1 } });
  await prisma.module.update({ where: { id: mod.id }, data: { estimatedMinutes: minutes || null } });

  const bankKeys = [];
  for (const [i, q] of (m.bank || []).entries()) {
    const qkey = `${key}:${q.key ?? `q${i + 1}`}`;
    bankKeys.push(qkey);
    const fields = { ...questionData(q, qkey), moduleId: mod.id, topicTag: q.topic ?? null, lessonTitle: q.lesson ?? null, order: i + 1 };
    const found = await prisma.blockQuestion.findUnique({ where: { catalogKey: qkey }, select: { id: true } });
    if (found) await prisma.blockQuestion.update({ where: { id: found.id }, data: fields });
    else await prisma.blockQuestion.create({ data: { ...fields, catalogKey: qkey, needsReview: Boolean(q.review) } });
  }
  await prisma.blockQuestion.deleteMany({ where: { moduleId: mod.id, catalogKey: { startsWith: `${key}:`, notIn: bankKeys } } });

  const readingKeys = [];
  for (const [i, r] of (m.readings || []).entries()) {
    const rkey = `${key}:${r.key ?? `r${i + 1}`}`;
    readingKeys.push(rkey);
    const fields = {
      moduleId: mod.id,
      title: r.title,
      authors: r.authors ?? null,
      publisher: r.publisher ?? null,
      year: r.year ?? null,
      url: r.url,
      kind: r.kind ?? 'ARTICLE',
      note: r.note ?? null,
      access: r.access ?? null,
      order: i + 1,
    };
    await prisma.moduleReading.upsert({ where: { catalogKey: rkey }, create: { ...fields, catalogKey: rkey }, update: fields });
  }
  await prisma.moduleReading.deleteMany({ where: { moduleId: mod.id, catalogKey: { startsWith: `${key}:`, notIn: readingKeys } } });
  return mod;
}

export async function syncCourse(course) {
  for (const [tag, name] of Object.entries(course.topics || {})) {
    await prisma.topic.upsert({ where: { tag }, create: { tag, name }, update: { name } });
  }
  const existing = await prisma.roadmap.findUnique({ where: { catalogKey: course.key } });
  if (existing && (existing.catalogVersion ?? 0) >= course.version) return { key: course.key, action: 'up-to-date' };

  const r = course.roadmap;
  const data = {
    title: r.title,
    slug: r.slug,
    summary: r.summary,
    description: r.description,
    category: r.category,
    difficulty: r.difficulty,
    prerequisites: r.prerequisites ?? [],
    learningOutcomes: r.learningOutcomes ?? [],
    sources: r.sources ?? [],
    isSequential: true,
    checkpointPassPercent: r.checkpointPassPercent ?? 80,
    order: r.order ?? 0,
  };
  const roadmap = existing
    ? await prisma.roadmap.update({ where: { id: existing.id }, data })
    : await prisma.roadmap.create({ data: { ...data, isFeatured: Boolean(r.isFeatured), isPublished: true, catalogKey: course.key } });

  await parkOrders('module', { roadmapId: roadmap.id });
  const modules = [];
  for (const [i, m] of course.modules.entries()) modules.push(await syncModule(roadmap.id, i + 1, m, course.key));
  await prisma.module.deleteMany({
    where: { roadmapId: roadmap.id, catalogKey: { startsWith: `${course.key}:`, notIn: modules.map((m) => m.catalogKey) } },
  });
  const extra = await prisma.module.findMany({ where: { roadmapId: roadmap.id, order: { lt: 0 } }, orderBy: { order: 'desc' } });
  for (const [i, m] of extra.entries()) await prisma.module.update({ where: { id: m.id }, data: { order: modules.length + i + 1 } });

  // Each catalog module requires the one before it (its lessons and its block quiz)
  await prisma.modulePrerequisite.deleteMany({ where: { moduleId: { in: modules.map((m) => m.id) } } });
  for (let i = 1; i < modules.length; i++) {
    await prisma.modulePrerequisite.create({ data: { moduleId: modules[i].id, prerequisiteId: modules[i - 1].id } });
  }

  await prisma.roadmap.update({ where: { id: roadmap.id }, data: { catalogVersion: course.version } });
  return { key: course.key, action: existing ? 'updated' : 'created' };
}

// The programming paths retired from the student catalog by migration 20261028000000_cyber_roadmap (unpublished, never deleted)
export const ARCHIVED_PATH_SLUGS = ['frontend', 'dotnet-backend', 'python-backend', 'ai-fullstack'];

// Rows that belong to learners; a catalog sync must never reduce any of these
export async function learnerCounts() {
  const [users, progress, quizAttempts, blockAttempts, videoProgress, certificates, bookmarks, activity] = await Promise.all([
    prisma.user.count(),
    prisma.userProgress.count(),
    prisma.quizAttempt.count(),
    prisma.blockQuizAttempt.count(),
    prisma.lessonVideoProgress.count(),
    prisma.certificate.count(),
    prisma.bookmark.count(),
    prisma.lessonActivity.count(),
  ]);
  return { users, progress, quizAttempts, blockAttempts, videoProgress, certificates, bookmarks, activity };
}

// Dry run: what a sync would do to each catalog course, plus the state of the archived paths. Writes nothing.
export async function catalogPlan() {
  const stored = await prisma.roadmap.findMany({
    where: { catalogKey: { in: courses.map((c) => c.key) } },
    select: { catalogKey: true, catalogVersion: true },
  });
  const byKey = new Map(stored.map((r) => [r.catalogKey, r]));
  const steps = courses.map((c) => {
    const r = byKey.get(c.key);
    const action = !r ? 'create' : (r.catalogVersion ?? 0) >= c.version ? 'up-to-date' : 'update';
    return { key: c.key, slug: c.roadmap.slug, title: c.roadmap.title, stored: r ? (r.catalogVersion ?? 0) : null, code: c.version, action };
  });
  const archived = await prisma.roadmap.findMany({
    where: { slug: { in: ARCHIVED_PATH_SLUGS } },
    select: { slug: true, title: true, isPublished: true, catalogKey: true, _count: { select: { certificates: true } } },
    orderBy: { slug: 'asc' },
  });
  return {
    steps,
    pending: steps.some((s) => s.action !== 'up-to-date'),
    archivedPaths: archived.map((r) => ({
      slug: r.slug,
      title: r.title,
      published: r.isPublished,
      // A sync only touches courses with a catalog key; these have none, so it cannot change them
      touchedBySync: r.catalogKey !== null,
      certificates: r._count.certificates,
    })),
  };
}

// Runs the sync and proves no learner rows were lost. Returns { status: 'busy' | 'synced', results, before, after, lost }.
export async function applyCatalogSync({ log = console.log } = {}) {
  const before = await learnerCounts();
  const results = await syncCatalog({ log });
  if (!results.length) return { status: 'busy', before };
  const after = await learnerCounts();
  const lost = Object.keys(before).filter((k) => after[k] < before[k]);
  return { status: 'synced', results, before, after, lost };
}

// Runs only on purpose: from scripts/sync-catalog.js or the admin System page, never on start-up or deploy.
// Two runs could overlap (two operators, or a retry), so the sync takes a lease row first
// (a session advisory lock is not used because pooled connections cannot guarantee lock and unlock share a session).
// The lease expires on its own if a run dies mid-sync. Unique catalog keys still prevent duplicates.
const LEASE_MINUTES = 10;

async function acquireLease(owner) {
  const rows = await prisma.$queryRaw`
    INSERT INTO "CatalogLock" ("name", "owner", "lockedUntil")
    VALUES ('catalog', ${owner}, (now() AT TIME ZONE 'UTC') + make_interval(mins => ${LEASE_MINUTES}::int))
    ON CONFLICT ("name") DO UPDATE SET "owner" = EXCLUDED."owner", "lockedUntil" = EXCLUDED."lockedUntil"
    WHERE "CatalogLock"."lockedUntil" < (now() AT TIME ZONE 'UTC')
    RETURNING "owner"`;
  return rows.length === 1;
}

async function releaseLease(owner) {
  await prisma.$executeRaw`
    UPDATE "CatalogLock" SET "lockedUntil" = (now() AT TIME ZONE 'UTC') WHERE "name" = 'catalog' AND "owner" = ${owner}`;
}

export async function syncCatalog({ log = console.log } = {}) {
  const owner = randomUUID();
  if (!(await acquireLease(owner))) {
    log('[catalog] another instance is syncing the catalog; skipped');
    return [];
  }
  try {
    const results = [];
    for (const course of courses) {
      const result = await syncCourse(course);
      if (result.action !== 'up-to-date') log(`[catalog] ${result.key}: ${result.action}`);
      results.push(result);
    }
    return results;
  } finally {
    await releaseLease(owner);
  }
}
