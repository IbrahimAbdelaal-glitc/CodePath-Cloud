// Create an admin account, or promote an existing account to admin.
// Usage:
//   ADMIN_EMAIL=... ADMIN_NAME=... ADMIN_PASSWORD=... npm run create-admin
//   or: npm run create-admin -- --email you@example.com --name "Your Name" --password "..."
import '../src/lib/env.js';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const email = (arg('email') || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const name = (arg('name') || process.env.ADMIN_NAME || 'Platform Admin').trim();
const password = arg('password') || process.env.ADMIN_PASSWORD || '';

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('✗ Provide a valid email via --email or ADMIN_EMAIL');
  process.exit(1);
}
if (password.length < 10 || !/\d/.test(password) || !/[A-Za-z]/.test(password)) {
  console.error('✗ The admin password must be at least 10 characters with letters and numbers');
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 12);
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name, passwordHash, role: 'ADMIN' },
    update: { role: 'ADMIN', passwordHash },
  });
  console.log(`✓ Admin account ready: ${user.email}`);
} finally {
  await prisma.$disconnect();
}
