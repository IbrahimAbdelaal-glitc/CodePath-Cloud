import './lib/env.js';
import { config } from './config.js';
import { createApp } from './app.js';
import { prisma } from './lib/prisma.js';
import { syncCatalog } from './services/courseCatalog.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`CodePath Cloud API listening on port ${config.port}`);
  // Create or update the built-in courses in the background; the API serves requests meanwhile
  if (config.autoSeedCourses) {
    syncCatalog().catch((err) => console.error('[catalog] Course sync failed:', err.message));
  }
});

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
