// Outgoing email. Transports, in order of preference:
//   1. Google Apps Script relay (MAIL_APPS_SCRIPT_URL + MAIL_APPS_SCRIPT_SECRET): sends from the Gmail account
//      that deployed server/apps-script/Code.gs. Free and needs no domain; consumer accounts get 100 recipients a day.
//      The relay builds the email from its own template, so callers pass `template` as well as the rendered text.
//   2. Resend HTTPS API (RESEND_API_KEY)
//   3. Brevo HTTPS API (BREVO_API_KEY)
//   4. SMTP (SMTP_HOST). Note: Render's free web services block outbound SMTP ports 25/465/587,
//      so on that plan use one of the HTTPS options above.
// In development without any of these, messages are written to server/.dev-mail/ instead of being sent,
// so the reset flow can be tested without exposing tokens in API responses or logs.
import { createHmac, randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { config } from '../config.js';

const devMailDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.dev-mail');
const { mail } = config;

const useAppsScript = Boolean(mail.appsScriptUrl && mail.appsScriptSecret);
const APPS_SCRIPT_URL = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/;

let transporter = null;
if (!useAppsScript && !mail.resendApiKey && !mail.brevoApiKey && mail.smtpHost) {
  transporter = nodemailer.createTransport({
    host: mail.smtpHost,
    port: mail.smtpPort,
    secure: mail.smtpSecure,
    auth: mail.smtpUser ? { user: mail.smtpUser, pass: mail.smtpPass } : undefined,
  });
}

export const mailMode = useAppsScript
  ? 'apps-script'
  : mail.resendApiKey
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
  const senderDomain = useAppsScript ? '(the Google account that deployed the script)' : sender.split('@')[1] || '(none)';
  const problems = [];
  if (mailMode === 'disabled') {
    problems.push(
      'No email provider is configured: set MAIL_APPS_SCRIPT_URL and MAIL_APPS_SCRIPT_SECRET (see server/apps-script), or RESEND_API_KEY or BREVO_API_KEY (Render free plans block SMTP)',
    );
  }
  if (Boolean(mail.appsScriptUrl) !== Boolean(mail.appsScriptSecret)) {
    problems.push('Set both MAIL_APPS_SCRIPT_URL and MAIL_APPS_SCRIPT_SECRET, or neither');
  }
  if (useAppsScript) {
    if (config.isProduction && !APPS_SCRIPT_URL.test(mail.appsScriptUrl)) {
      problems.push('MAIL_APPS_SCRIPT_URL must be the web app URL https://script.google.com/macros/s/.../exec');
    }
    if (mail.appsScriptSecret.length < 32) problems.push('MAIL_APPS_SCRIPT_SECRET must be at least 32 characters');
    if (mail.resendApiKey || mail.brevoApiKey) problems.push('The Apps Script relay is used; RESEND_API_KEY and BREVO_API_KEY are ignored');
  } else if (config.isProduction && (senderDomain === 'localhost' || senderDomain === '(none)')) {
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

// Error codes the relay answers with; they never echo the request
const APPS_SCRIPT_ERRORS = {
  'not-configured': 'the script is missing its SHARED_SECRET or APP_URL Script Property',
  unauthorized: 'the signature was rejected: MAIL_APPS_SCRIPT_SECRET does not match SHARED_SECRET',
  expired: 'the request timestamp was rejected (clock skew over 5 minutes)',
  replayed: 'the request was already used',
  'bad-request': 'the message was rejected (check APP_URL matches the Script Property)',
  quota: "the Google account's daily email quota is used up",
  method: 'the request did not reach doPost',
};

// Signs { v, ts, nonce, to, ...template } with HMAC-SHA256. Apps Script always answers 200 after redirecting to
// script.googleusercontent.com (fetch follows it), so success is read from the JSON body, not the status.
async function sendViaAppsScript(to, template) {
  if (!template) throw new Error('This email has no template for the Apps Script relay');
  const payload = JSON.stringify({ v: 1, ts: Date.now(), nonce: randomBytes(16).toString('hex'), to, ...template });
  const sig = createHmac('sha256', mail.appsScriptSecret).update(payload).digest('hex');
  const res = await fetch(mail.appsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload, sig }),
    redirect: 'follow',
    // Apps Script can take several seconds to start
    signal: AbortSignal.timeout(30000),
  });
  const result = await res.json().catch(() => null);
  if (!result) {
    throw new Error(`Apps Script relay answered ${res.status} without JSON: deploy it as a web app that runs as you, with access "Anyone"`);
  }
  if (!result.ok) throw new Error(`Apps Script relay refused: ${APPS_SCRIPT_ERRORS[result.error] || 'unknown error'}`);
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

// `template` describes the message for the Apps Script relay, which renders it itself:
// { kind: 'password-reset', name, link, minutes } or { kind: 'test' }
export async function sendMail({ to, subject, text, html, template }) {
  if (useAppsScript) {
    await sendViaAppsScript(to, template);
    return;
  }
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
    throw new Error('Email is not configured: set MAIL_APPS_SCRIPT_URL and MAIL_APPS_SCRIPT_SECRET, or RESEND_API_KEY or BREVO_API_KEY');
  }
  await mkdir(devMailDir, { recursive: true });
  const file = path.join(devMailDir, `${new Date().toISOString().replace(/[:.]/g, '-')}.html`);
  const body = `<!-- To: ${to} | Subject: ${subject} -->\n${html}`;
  await writeFile(file, body, 'utf8');
  // Only the file location is logged, never the link or token
  console.log(`[dev-mail] Email to ${to} saved to ${path.relative(process.cwd(), file)}`);
}
