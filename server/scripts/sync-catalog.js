// Create or update the built-in courses (src/catalog) in the database. The API never does this on its own;
// run it once, on purpose, after deploying a catalog change (admins can also do this from the System page).
// Usage:
//   npm run catalog:sync              shows learner data counts and what would change (no writes)
//   npm run catalog:sync -- --apply   applies the change, then checks that no learner data was lost
// Uses DATABASE_URL from the environment. The connection string is never printed.
import '../src/lib/env.js';
import { prisma } from '../src/lib/prisma.js';
import { applyCatalogSync, catalogPlan, learnerCounts } from '../src/services/courseCatalog.js';

const apply = process.argv.includes('--apply');

async function main() {
  const host = (() => {
    try {
      return new URL(process.env.DATABASE_URL).hostname;
    } catch {
      return '(DATABASE_URL not set)';
    }
  })();
  console.log(`Database host: ${host}`);
  console.log('Learner data:', await learnerCounts());
  const plan = await catalogPlan();
  console.table(plan.steps.map(({ key, slug, stored, code, action }) => ({ key, slug, stored: stored ?? '-', code, action })));
  console.log('Archived paths (not changed by a sync):');
  console.table(plan.archivedPaths);
  if (!apply) {
    console.log(plan.pending ? 'Dry run: nothing written. Add --apply to run it.' : 'Catalog is up to date.');
    return;
  }

  const outcome = await applyCatalogSync();
  if (outcome.status === 'busy') {
    console.error('✗ Another process holds the catalog lock; nothing was changed. Try again in a few minutes.');
    process.exitCode = 1;
    return;
  }
  console.log('Learner data after:', outcome.after);
  if (outcome.lost.length) {
    console.error(`✗ Learner data decreased: ${outcome.lost.join(', ')}`);
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
