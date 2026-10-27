import './lib/env.js';
import { config } from './config.js';
import { createApp } from './app.js';
import { prisma } from './lib/prisma.js';
import { mailDiagnostics } from './lib/mailer.js';
import { applyPendingCatalogRelease } from './services/courseCatalog.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`CodePath Cloud API listening on port ${config.port}`);
  const mail = mailDiagnostics();
  console.log(mail.summary);
  for (const problem of mail.problems) console.warn(`[mail] WARNING: ${problem}`);
  // Applies the catalog release this code ships, once (see CATALOG_RELEASE in src/catalog/index.js).
  // Later start-ups only read the release record; nothing else about the catalog runs at start-up.
  if (config.applyCatalogRelease) {
    applyPendingCatalogRelease().catch((err) => console.error('[catalog] Release failed:', err.message));
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
