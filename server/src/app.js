import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { prisma } from './lib/prisma.js';
import { errorHandler, notFoundHandler } from './lib/errors.js';
import authRoutes from './routes/auth.js';
import roadmapRoutes from './routes/roadmaps.js';
import lessonRoutes from './routes/lessons.js';
import quizRoutes from './routes/quizzes.js';
import meRoutes from './routes/me.js';
import manageRoutes from './routes/manage.js';
import adminRoutes from './routes/admin.js';

export function createApp() {
  const app = express();

  // Behind a load balancer (Render/Railway): use the real client IP for rate limiting
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Requests without an Origin (health checks, curl) are allowed
        if (!origin || config.corsOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
        return callback(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    }),
  );
  app.use(express.json({ limit: '200kb' }));

  app.get('/health', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', database: 'ok', time: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: 'degraded', database: 'unreachable', time: new Date().toISOString() });
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/roadmaps', roadmapRoutes);
  app.use('/api/lessons', lessonRoutes);
  app.use('/api/quizzes', quizRoutes);
  app.use('/api/me', meRoutes);
  app.use('/api/manage', manageRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
