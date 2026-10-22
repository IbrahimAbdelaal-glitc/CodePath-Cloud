// Sample data: paths, modules, lessons and questions of all three types.
// Usage: npm run db:seed
//   SEED_RESET=true npm run db:seed  → deletes and recreates the sample paths (including student progress in them)
import '../src/lib/env.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import topics from './seed-data/topics.js';
import frontend from './seed-data/frontend.js';
import dotnet from './seed-data/dotnet.js';
import python from './seed-data/python.js';
import ai from './seed-data/ai.js';

const prisma = new PrismaClient();
const here = path.dirname(fileURLToPath(import.meta.url));
const reset = process.env.SEED_RESET === 'true';

const paths = [
  { data: frontend, content: 'frontend.md' },
  { data: dotnet, content: 'dotnet.md' },
  { data: python, content: 'python.md' },
  { data: ai, content: 'ai.md' },
];

function loadLessonContent(file) {
  const raw = readFileSync(path.join(here, 'seed-data', 'content', file), 'utf8').replace(/\r\n/g, '\n');
  const parts = raw.split(/^=== lesson: (\S+) ===$/m);
  const map = new Map();
  for (let i = 1; i < parts.length; i += 2) map.set(parts[i], parts[i + 1].trim());
  return map;
}

async function seedTopics() {
  for (const [tag, name] of Object.entries(topics)) {
    await prisma.topic.upsert({ where: { tag }, create: { tag, name }, update: { name } });
  }
  console.log(`✓ Topics: ${Object.keys(topics).length}`);
}

async function seedRoadmap({ data, content }) {
  const contents = loadLessonContent(content);
  const { roadmap: rm, modules } = data;

  const existing = await prisma.roadmap.findUnique({
    where: { slug: rm.slug },
    include: { _count: { select: { modules: true } } },
  });
  if (existing && existing._count.modules > 0 && !reset) {
    console.log(`• Path "${rm.title}" already exists, skipped (use SEED_RESET=true to recreate)`);
    return;
  }

  const roadmap = await prisma.roadmap.upsert({ where: { slug: rm.slug }, create: rm, update: rm });
  if (existing) await prisma.module.deleteMany({ where: { roadmapId: roadmap.id } });

  const moduleIds = new Map();
  let lessonCount = 0;
  let quizCount = 0;

  for (const [mIndex, m] of modules.entries()) {
    const created = await prisma.module.create({
      data: {
        roadmapId: roadmap.id,
        title: m.title,
        description: m.description,
        difficulty: m.difficulty,
        order: mIndex + 1,
      },
    });
    moduleIds.set(m.key, created.id);

    for (const [lIndex, l] of m.lessons.entries()) {
      const body = contents.get(l.key);
      if (!body) throw new Error(`No content for lesson ${l.key} in ${content}`);
      await prisma.lesson.create({
        data: {
          moduleId: created.id,
          title: l.title,
          summary: l.summary,
          content: body,
          keyTakeaways: l.keyTakeaways,
          difficulty: l.difficulty,
          estimatedMinutes: l.estimatedMinutes,
          order: lIndex + 1,
          resources: { create: l.resources.map((r, i) => ({ ...r, order: i })) },
          quizzes: {
            create: l.quizzes.map((q, i) => {
              if (!topics[q.topic]) throw new Error(`Topic ${q.topic} is not defined in topics.js`);
              if (q.options && !q.options.includes(q.correctAnswer)) {
                throw new Error(`Correct answer is not one of the options: ${q.question}`);
              }
              return {
                question: q.question,
                questionType: q.questionType,
                codeSnippet: q.codeSnippet ?? null,
                options: q.options ?? undefined,
                correctAnswer: q.correctAnswer,
                acceptedAnswers: q.acceptedAnswers ?? [],
                explanation: q.explanation,
                topicTag: q.topic,
                order: i + 1,
              };
            }),
          },
        },
      });
      lessonCount += 1;
      quizCount += l.quizzes.length;
    }

    const moduleMinutes = m.lessons.reduce((s, l) => s + (l.estimatedMinutes || 0), 0);
    await prisma.module.update({ where: { id: created.id }, data: { estimatedMinutes: moduleMinutes } });
  }

  for (const m of modules) {
    for (const key of m.prerequisites || []) {
      if (!moduleIds.has(key)) throw new Error(`Unknown prerequisite ${key} in module ${m.key}`);
      await prisma.modulePrerequisite.create({
        data: { moduleId: moduleIds.get(m.key), prerequisiteId: moduleIds.get(key) },
      });
    }
  }

  console.log(`✓ "${rm.title}": ${modules.length} modules, ${lessonCount} lessons, ${quizCount} questions`);
}

// Demo accounts for local development only, using the password set in DEMO_PASSWORD
async function seedDemoUsers() {
  const password = process.env.DEMO_PASSWORD;
  if (!password) {
    console.log('• DEMO_PASSWORD not set, skipping demo accounts');
    return;
  }
  if (process.env.NODE_ENV === 'production') {
    console.log('• Production environment: demo accounts skipped');
    return;
  }
  if (password.length < 8) throw new Error('DEMO_PASSWORD must be at least 8 characters');

  const passwordHash = await bcrypt.hash(password, 10);
  const users = [
    { email: 'student@demo.local', name: 'Demo Student', role: 'STUDENT' },
    { email: 'instructor@demo.local', name: 'Demo Instructor', role: 'INSTRUCTOR' },
    { email: 'admin@demo.local', name: 'Demo Admin', role: 'ADMIN' },
  ];
  for (const u of users) {
    await prisma.user.upsert({ where: { email: u.email }, create: { ...u, passwordHash }, update: { role: u.role, name: u.name } });
  }

  // Assign the demo instructor to the frontend path
  const instructor = await prisma.user.findUnique({ where: { email: 'instructor@demo.local' } });
  const frontendPath = await prisma.roadmap.findUnique({ where: { slug: 'frontend' } });
  if (instructor && frontendPath) {
    await prisma.roadmapInstructor.upsert({
      where: { roadmapId_userId: { roadmapId: frontendPath.id, userId: instructor.id } },
      create: { roadmapId: frontendPath.id, userId: instructor.id },
      update: {},
    });
  }
  console.log('✓ Demo accounts: student@demo.local, instructor@demo.local, admin@demo.local');
}

try {
  await seedTopics();
  for (const p of paths) await seedRoadmap(p);
  await seedDemoUsers();
  console.log('✓ Seeding complete');
} catch (error) {
  console.error('✗ Seeding failed:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
