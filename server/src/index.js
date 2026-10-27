import './lib/env.js';
import { config } from './config.js';
import { createApp } from './app.js';
import { prisma } from './lib/prisma.js';
import { mailDiagnostics } from './lib/mailer.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`CodePath Cloud API listening on port ${config.port}`);
  const mail = mailDiagnostics();
  console.log(mail.summary);
  for (const problem of mail.problems) console.warn(`[mail] WARNING: ${problem}`);
  // The built-in courses are not synced here; run `npm run catalog:sync` on purpose after a catalog change
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
