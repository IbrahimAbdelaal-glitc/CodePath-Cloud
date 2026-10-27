// CodePath Cloud mail relay: a Google Apps Script web app that sends password-reset emails with MailApp
// from the Google account that deploys it. The API (server/src/lib/mailer.js) calls it over HTTPS.
//
// Security
// - Every request is signed with HMAC-SHA256 using SHARED_SECRET (a Script Property, never in this file).
// - The signed payload carries a timestamp (accepted for 5 minutes) and a random nonce (accepted once),
//   so a captured request cannot be replayed.
// - The script builds the email itself from a fixed template. Callers send only the recipient, the student's
//   name and the reset link, and the link must start with APP_URL + "/reset-password#token=". Even with the
//   secret, nobody can use this endpoint to send arbitrary content from the account.
// - Nothing from the request is logged; error answers are short codes that never echo the request.
//
// Script Properties (Project Settings > Script Properties):
//   SHARED_SECRET  the same value as MAIL_APPS_SCRIPT_SECRET on the API (at least 32 characters)
//   APP_URL        the web app address, e.g. https://code-path-cloud.vercel.app (no trailing slash)

var MAX_SKEW_MS = 5 * 60 * 1000;
var NONCE_TTL_SECONDS = 15 * 60;
var MAX_PAYLOAD_CHARS = 4000;

function doPost(e) {
  var result;
  try {
    result = handle_(e);
  } catch (err) {
    result = { ok: false, error: 'bad-request' };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'method' })).setMimeType(ContentService.MimeType.JSON);
}

function handle_(e) {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('SHARED_SECRET');
  var appUrl = (props.getProperty('APP_URL') || '').replace(/\/+$/, '');
  if (!secret || secret.length < 32 || !/^https?:\/\/[^\s/]+$/.test(appUrl)) return { ok: false, error: 'not-configured' };

  var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  if (typeof body.payload !== 'string' || typeof body.sig !== 'string' || body.payload.length > MAX_PAYLOAD_CHARS) {
    return { ok: false, error: 'bad-request' };
  }
  if (!safeEqual_(hmacHex_(body.payload, secret), body.sig)) return { ok: false, error: 'unauthorized' };

  var msg = JSON.parse(body.payload);
  if (msg.v !== 1 || typeof msg.ts !== 'number' || Math.abs(Date.now() - msg.ts) > MAX_SKEW_MS) return { ok: false, error: 'expired' };
  if (typeof msg.nonce !== 'string' || !/^[a-f0-9]{32}$/.test(msg.nonce)) return { ok: false, error: 'bad-request' };

  var email = buildEmail_(msg, appUrl);
  if (!email) return { ok: false, error: 'bad-request' };

  // Check-and-set of the nonce under a lock so two copies of one request cannot both pass
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var cache = CacheService.getScriptCache();
    if (cache.get('nonce:' + msg.nonce)) return { ok: false, error: 'replayed' };
    cache.put('nonce:' + msg.nonce, '1', NONCE_TTL_SECONDS);
  } finally {
    lock.releaseLock();
  }

  if (MailApp.getRemainingDailyQuota() < 1) return { ok: false, error: 'quota' };
  MailApp.sendEmail({ to: msg.to, subject: email.subject, body: email.text, htmlBody: email.html, name: 'CodePath Cloud' });
  return { ok: true };
}

// The only two emails this relay can send
function buildEmail_(msg, appUrl) {
  if (typeof msg.to !== 'string' || msg.to.length > 254 || !/^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/.test(msg.to)) return null;

  if (msg.kind === 'test') {
    return {
      subject: 'CodePath Cloud test email',
      text: 'This is a test email from CodePath Cloud. Email delivery is working.',
      html: '<p>This is a test email from <strong>CodePath Cloud</strong>. Email delivery is working.</p>',
    };
  }

  if (msg.kind !== 'password-reset') return null;
  var prefix = appUrl + '/reset-password#token=';
  if (typeof msg.link !== 'string' || msg.link.indexOf(prefix) !== 0) return null;
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(msg.link.slice(prefix.length))) return null;
  var minutes = msg.minutes;
  if (typeof minutes !== 'number' || minutes % 1 !== 0 || minutes < 1 || minutes > 1440) return null;
  var name = typeof msg.name === 'string' && msg.name.trim() ? msg.name.trim().slice(0, 100) : 'there';

  var text = [
    'Hi ' + name + ',',
    '',
    'We received a request to reset your CodePath Cloud password.',
    'Open this link to choose a new password. It expires in ' + minutes + ' minutes and works once:',
    msg.link,
    '',
    'If you did not request this, you can ignore this email. Your password will not change.',
  ].join('\n');
  var link = escapeHtml_(msg.link);
  var html =
    '<div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;color:#12201b">' +
    '<h2 style="color:#0b5d4b">Reset your password</h2>' +
    '<p>Hi ' + escapeHtml_(name) + ',</p>' +
    '<p>We received a request to reset your CodePath Cloud password. This link expires in ' + minutes + ' minutes and can be used once.</p>' +
    '<p><a href="' + link + '" style="display:inline-block;background:#0b5d4b;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Choose a new password</a></p>' +
    '<p style="color:#5f6b66;font-size:13px">If the button doesn\'t work, copy this address into your browser:<br>' + link + '</p>' +
    '<p style="color:#5f6b66;font-size:13px">If you did not request this, ignore this email. Your password will not change.</p>' +
    '</div>';
  return { subject: 'Reset your CodePath Cloud password', text: text, html: html };
}

function hmacHex_(value, secret) {
  var bytes = Utilities.computeHmacSha256Signature(value, secret, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

// Compares every character so the time taken does not reveal how much of a signature matched
function safeEqual_(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function escapeHtml_(v) {
  return String(v).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
