import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';
import { forbidden, unauthorized } from '../lib/errors.js';

export const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  role: true,
  createdAt: true,
};

// "ver" is the user's tokenVersion; bumping it in the database revokes every older token
export function signToken(user) {
  return jwt.sign({ sub: user.id, ver: user.tokenVersion ?? 0 }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function readToken(req) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

// The user is loaded on every request, so role changes and deletions take effect immediately
async function loadUser(token) {
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw unauthorized('Your session has expired or is invalid, please sign in again');
  }
  const found = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { ...publicUserSelect, tokenVersion: true },
  });
  if (!found) throw unauthorized('Account not found, please sign in again');
  const { tokenVersion, ...user } = found;
  if ((payload.ver ?? 0) !== tokenVersion) {
    throw unauthorized('Your session has expired or is invalid, please sign in again');
  }
  return user;
}

export async function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) throw unauthorized();
  req.user = await loadUser(token);
  next();
}

// Identifies the user when a valid token is present; otherwise continues as a guest
export async function optionalAuth(req, res, next) {
  const token = readToken(req);
  req.user = null;
  if (token) {
    try {
      req.user = await loadUser(token);
    } catch {
      req.user = null;
    }
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) throw unauthorized();
    if (!roles.includes(req.user.role)) throw forbidden();
    next();
  };
}

export const isStaff = (user) => user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR';
