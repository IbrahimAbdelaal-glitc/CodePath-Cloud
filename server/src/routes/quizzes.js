import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import { idParams } from '../lib/validation.js';
import { requireAuth } from '../middleware/auth.js';
import { assertLessonAccess, checkAnswer, evaluateTopic, quizOptions } from '../services/learning.js';
import { tryCompleteLesson } from '../services/coursePlayer.js';

const router = Router();
router.use(requireAuth);

const attemptSchema = z.object({
  answer: z.string({ error: 'An answer is required' }).max(2000, 'The answer is too long'),
});

async function findQuiz(id) {
  const quiz = await prisma.quiz.findUnique({ where: { id }, include: { topic: true } });
  if (!quiz) throw notFound('Question not found');
  return quiz;
}

router.post('/:id/attempts', async (req, res) => {
  const { id } = idParams.parse(req.params);
  const { answer } = attemptSchema.parse(req.body);
  const quiz = await findQuiz(id);
  // Same access rules as the lesson: no answering questions in a locked module
  await assertLessonAccess(req.user, quiz.lessonId);

  const isCorrect = checkAnswer(quiz, answer);
  const score = isCorrect ? quiz.points : 0;

  const attempt = await prisma.quizAttempt.create({
    data: { userId: req.user.id, quizId: quiz.id, userAnswer: answer.trim(), isCorrect, score },
    select: { id: true, userAnswer: true, isCorrect: true, score: true, createdAt: true },
  });

  const [topic, totals, completion] = await Promise.all([
    evaluateTopic(req.user.id, quiz.topicTag, { wasIncorrect: !isCorrect }),
    prisma.quizAttempt.aggregate({ where: { userId: req.user.id }, _sum: { score: true }, _count: true }),
    // Answering the last in-video question can finish the lesson when the video is already watched
    quiz.placement === 'CHECKPOINT' && req.user.role === 'STUDENT' ? tryCompleteLesson(req.user, quiz.lessonId) : null,
  ]);

  res.status(201).json({
    result: {
      attempt,
      isCorrect,
      score,
      // The correct answer and explanation are revealed only after an attempt
      correctAnswer: quiz.correctAnswer,
      explanation: quiz.explanation,
      options: quizOptions(quiz),
      topic: { ...topic, name: quiz.topic.name },
      totalScore: totals._sum.score || 0,
      totalAttempts: totals._count,
      lessonCompleted: Boolean(completion?.completed),
      certificate: completion?.certificateId ? { id: completion.certificateId } : null,
      completion: completion?.status ?? null,
    },
  });
});

router.get('/:id/attempts', async (req, res) => {
  const { id } = idParams.parse(req.params);
  const quiz = await findQuiz(id);
  await assertLessonAccess(req.user, quiz.lessonId);
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId: req.user.id, quizId: id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, userAnswer: true, isCorrect: true, score: true, createdAt: true },
  });
  res.json({ attempts });
});

export default router;
