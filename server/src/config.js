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

export const config = {
  isProduction,
  port: Number(process.env.PORT) || 4000,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Comma-separated list of allowed origins: https://app.vercel.app,http://localhost:5173
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean),
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
  // Public URL of the web app, used to build links in emails (password reset)
  appUrl: (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, ''),
  resetTokenMinutes: Number(process.env.RESET_TOKEN_MINUTES) || 30,
  mail: {
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: Number(process.env.SMTP_PORT) || 587,
    // true for port 465 (implicit TLS); false uses STARTTLS on 587
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'CodePath Cloud <no-reply@localhost>',
  },
};
