import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class HttpError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (msg, opts) => new HttpError(400, msg, { code: 'BAD_REQUEST', ...opts });
export const unauthorized = (msg = 'Please sign in to continue') =>
  new HttpError(401, msg, { code: 'UNAUTHORIZED' });
export const forbidden = (msg = 'You do not have permission to perform this action', opts) =>
  new HttpError(403, msg, { code: 'FORBIDDEN', ...opts });
export const notFound = (msg = 'The requested item was not found') =>
  new HttpError(404, msg, { code: 'NOT_FOUND' });
export const conflict = (msg) => new HttpError(409, msg, { code: 'CONFLICT' });

function send(req, res, status, error) {
  res.status(status).json({ error });
}

export function notFoundHandler(req, res) {
  send(req, res, 404, { code: 'NOT_FOUND', message: 'The requested route was not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return send(req, res, 400, {
      code: 'VALIDATION_ERROR',
      message: details[0]?.message || 'The submitted data is invalid',
      details,
    });
  }

  if (err instanceof HttpError) {
    return send(req, res, err.status, { code: err.code, message: err.message, details: err.details });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return send(req, res, 409, { code: 'CONFLICT', message: 'This value is already in use' });
    }
    if (err.code === 'P2025') {
      return send(req, res, 404, { code: 'NOT_FOUND', message: 'The requested item was not found' });
    }
    if (err.code === 'P2003') {
      return send(req, res, 409, { code: 'CONFLICT', message: 'This action cannot be completed because other data depends on this item' });
    }
  }

  if (err?.type === 'entity.parse.failed') {
    return send(req, res, 400, { code: 'BAD_JSON', message: 'Invalid JSON body' });
  }
  if (err?.type === 'entity.too.large') {
    return send(req, res, 413, { code: 'TOO_LARGE', message: 'The request body is too large' });
  }

  console.error(err);
  send(req, res, 500, { code: 'INTERNAL', message: 'An unexpected server error occurred, please try again later' });
}
