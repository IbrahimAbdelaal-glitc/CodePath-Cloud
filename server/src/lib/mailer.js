// Outgoing email. Uses SMTP when SMTP_HOST is set.
// In development without SMTP, messages are written to server/.dev-mail/ instead of being sent,
// so the reset flow can be tested without exposing tokens in API responses or logs.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { config } from '../config.js';

const devMailDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.dev-mail');

let transporter = null;
if (config.mail.smtpHost) {
  transporter = nodemailer.createTransport({
    host: config.mail.smtpHost,
    port: config.mail.smtpPort,
    secure: config.mail.smtpSecure,
    auth: config.mail.smtpUser ? { user: config.mail.smtpUser, pass: config.mail.smtpPass } : undefined,
  });
}

export const mailMode = transporter ? 'smtp' : config.isProduction ? 'disabled' : 'dev-outbox';

export async function sendMail({ to, subject, text, html }) {
  if (transporter) {
    await transporter.sendMail({ from: config.mail.from, to, subject, text, html });
    return;
  }
  if (config.isProduction) {
    throw new Error('Email is not configured: set SMTP_HOST and related variables');
  }
  await mkdir(devMailDir, { recursive: true });
  const file = path.join(devMailDir, `${new Date().toISOString().replace(/[:.]/g, '-')}.html`);
  const body = `<!-- To: ${to} | Subject: ${subject} -->\n${html}`;
  await writeFile(file, body, 'utf8');
  // Only the file location is logged, never the link or token
  console.log(`[dev-mail] Email to ${to} saved to ${path.relative(process.cwd(), file)}`);
}
