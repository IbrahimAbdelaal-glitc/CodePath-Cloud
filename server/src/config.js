// Server configuration read from environment variables. No secrets live in code.

const isProduction = process.env.NODE_ENV === 'production';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required. See .env.example`);
  }
  return value;
}

const jwtSecret = required('JWT_SECRET');
if (isProduction && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}

required('DATABASE_URL');

// Comma-separated list of allowed origins: https://app.vercel.app,http://localhost:5173
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

// Public URL of the web app, used to build links in emails (password reset). In production without APP_URL, the first
// https origin in CORS_ORIGIN (the deployed web app) is used, so reset links never point at localhost.
const appUrl = (
  process.env.APP_URL ||
  (isProduction && corsOrigins.find((o) => o.startsWith('https://'))) ||
  'http://localhost:5173'
).replace(/\/$/, '');

export const config = {
  isProduction,
  port: Number(process.env.PORT) || 4000,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins,
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
  appUrl,
  resetTokenMinutes: Number(process.env.RESET_TOKEN_MINUTES) || 30,
  // Apply the code's named catalog release once at start-up (src/catalog/index.js). "false" leaves it to an admin.
  applyCatalogRelease: process.env.CATALOG_AUTO_RELEASE !== 'false',
  mail: {
    // Google Apps Script relay (server/apps-script): sends from a Gmail account over HTTPS, no domain needed
    appsScriptUrl: process.env.MAIL_APPS_SCRIPT_URL || '',
    appsScriptSecret: process.env.MAIL_APPS_SCRIPT_SECRET || '',
    // HTTPS email APIs. Preferred on hosts that block outbound SMTP ports (Render's free plan does).
    resendApiKey: process.env.RESEND_API_KEY || '',
    brevoApiKey: process.env.BREVO_API_KEY || '',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: Number(process.env.SMTP_PORT) || 587,
    // true for port 465 (implicit TLS); false uses STARTTLS on 587
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'CodePath Cloud <no-reply@localhost>',
  },
  // S3-compatible object storage for uploaded lesson videos (Neon Object Storage, Cloudflare R2, AWS S3...).
  // Neon writes its credentials as AWS_*; the STORAGE_* names take precedence when both are set.
  storage: {
    endpoint: process.env.STORAGE_ENDPOINT || process.env.AWS_ENDPOINT_URL_S3 || '',
    region: process.env.STORAGE_REGION || process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
    bucket: process.env.STORAGE_BUCKET || 'lesson-videos',
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE !== 'false',
    maxVideoMb: Number(process.env.VIDEO_MAX_MB) || 1024,
  },
};
