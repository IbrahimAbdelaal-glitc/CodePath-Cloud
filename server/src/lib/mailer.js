// Outgoing email. Transports, in order of preference:
//   1. Resend HTTPS API (RESEND_API_KEY)
//   2. Brevo HTTPS API (BREVO_API_KEY)
//   3. SMTP (SMTP_HOST). Note: Render's free web services block outbound SMTP ports 25/465/587,
//      so on that plan use one of the HTTPS APIs above.
// In development without any of these, messages are written to server/.dev-mail/ instead of being sent,
// so the reset flow can be tested without exposing tokens in API responses or logs.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { config } from '../config.js';

const devMailDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.dev-mail');
const { mail } = config;

let transporter = null;
if (!mail.resendApiKey && !mail.brevoApiKey && mail.smtpHost) {
  transporter = nodemailer.createTransport({
    host: mail.smtpHost,
    port: mail.smtpPort,
    secure: mail.smtpSecure,
    auth: mail.smtpUser ? { user: mail.smtpUser, pass: mail.smtpPass } : undefined,
  });
}

export const mailMode = mail.resendApiKey
  ? 'resend'
  : mail.brevoApiKey
    ? 'brevo'
    : transporter
      ? 'smtp'
      : config.isProduction
        ? 'disabled'
        : 'dev-outbox';

// Startup check of the password-reset email setup. Returns lines safe to log: no keys, tokens or addresses
// beyond the sender's domain.
export function mailDiagnostics() {
  const sender = parseAddress(mail.from).email;
  const senderDomain = sender.split('@')[1] || '(none)';
  const problems = [];
  if (mailMode === 'disabled') {
    problems.push('No email provider is configured: set RESEND_API_KEY or BREVO_API_KEY (Render free plans block SMTP)');
  }
  if (config.isProduction && (senderDomain === 'localhost' || senderDomain === '(none)')) {
    problems.push('MAIL_FROM is not set to a sender verified with the email provider');
  }
  if (config.isProduction && !config.appUrl.startsWith('https://')) {
    problems.push(`Reset links would point to ${config.appUrl}: set APP_URL to the deployed web app`);
  }
  return {
    summary: `[mail] mode=${mailMode} sender-domain=${senderDomain} reset-links=${config.appUrl}/reset-password`,
    problems,
  };
}

// "CodePath Cloud <no-reply@example.com>" → { name, email }
export function parseAddress(value) {
  const m = String(value).match(/^\s*(?:"?([^"<]*?)"?\s*)?<([^>]+)>\s*$/);
  return m ? { name: m[1]?.trim() || undefined, email: m[2].trim() } : { email: String(value).trim() };
}

async function postJson(url, headers, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    // Provider error bodies describe configuration problems (unverified sender, bad key); they never contain the message
    const detail = (await res.text().catch(() => '')).slice(0, 300);
    throw new Error(`Email provider responded ${res.status}: ${detail}`);
  }
  return res.json().catch(() => ({}));
}

export async function sendMail({ to, subject, text, html }) {
  if (mail.resendApiKey) {
    await postJson('https://api.resend.com/emails', { Authorization: `Bearer ${mail.resendApiKey}` }, {
      from: mail.from,
      to: [to],
      subject,
      text,
      html,
    });
    return;
  }
  if (mail.brevoApiKey) {
    const sender = parseAddress(mail.from);
    await postJson('https://api.brevo.com/v3/smtp/email', { 'api-key': mail.brevoApiKey }, {
      sender,
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    });
    return;
  }
  if (transporter) {
    await transporter.sendMail({ from: mail.from, to, subject, text, html });
    return;
  }
  if (config.isProduction) {
    throw new Error('Email is not configured: set RESEND_API_KEY or BREVO_API_KEY (or SMTP_HOST on a plan that allows SMTP)');
  }
  await mkdir(devMailDir, { recursive: true });
  const file = path.join(devMailDir, `${new Date().toISOString().replace(/[:.]/g, '-')}.html`);
  const body = `<!-- To: ${to} | Subject: ${subject} -->\n${html}`;
  await writeFile(file, body, 'utf8');
  // Only the file location is logged, never the link or token
  console.log(`[dev-mail] Email to ${to} saved to ${path.relative(process.cwd(), file)}`);
}
