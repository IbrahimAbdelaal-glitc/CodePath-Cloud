// Create or update the built-in courses (src/catalog) in the database. The API never does this on its own;
// run it once, on purpose, after deploying a catalog change.
// Usage:
//   npm run catalog:sync              shows learner data counts and what would change (no writes)
//   npm run catalog:sync -- --apply   applies the change, then checks that no learner data was lost
// Uses DATABASE_URL from the environment. The connection string is never printed.
import '../src/lib/env.js';
import { prisma } from '../src/lib/prisma.js';
import { syncCatalog } from '../src/services/courseCatalog.js';
import courses from '../src/catalog/index.js';

const apply = process.argv.includes('--apply');

// Rows that belong to learners; a catalog sync must never reduce any of these
async function learnerCounts() {
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

async function plan() {
  const stored = await prisma.roadmap.findMany({
    where: { catalogKey: { in: courses.map((c) => c.key) } },
    select: { catalogKey: true, catalogVersion: true, slug: true, isPublished: true },
  });
  const byKey = new Map(stored.map((r) => [r.catalogKey, r]));
  return courses.map((c) => {
    const r = byKey.get(c.key);
    const action = !r ? 'create' : (r.catalogVersion ?? 0) >= c.version ? 'up-to-date' : 'update';
    return { key: c.key, slug: c.roadmap.slug, stored: r ? `v${r.catalogVersion ?? 0}` : '-', code: `v${c.version}`, action };
  });
}

async function main() {
  const host = (() => {
    try {
      return new URL(process.env.DATABASE_URL).hostname;
    } catch {
      return '(DATABASE_URL not set)';
    }
  })();
  console.log(`Database host: ${host}`);
  const before = await learnerCounts();
  console.log('Learner data:', before);
  const steps = await plan();
  console.table(steps);
  if (!apply) {
    console.log(steps.some((s) => s.action !== 'up-to-date') ? 'Dry run: nothing written. Add --apply to run it.' : 'Catalog is up to date.');
    return;
  }

  const results = await syncCatalog();
  if (!results.length) {
    console.error('✗ Another process holds the catalog lock; nothing was changed. Try again in a few minutes.');
    process.exitCode = 1;
    return;
  }
  const after = await learnerCounts();
  console.log('Learner data after:', after);
  const lost = Object.keys(before).filter((k) => after[k] < before[k]);
  if (lost.length) {
    console.error(`✗ Learner data decreased: ${lost.join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log('✓ Catalog synced; no learner data was removed.');
  }
}

main()
  .catch((err) => {
    console.error('✗ Catalog sync failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
