-- CreateEnum
CREATE TYPE "QuizPlacement" AS ENUM ('LESSON', 'CHECKPOINT');

-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('YOUTUBE', 'UPLOAD');

-- CreateEnum
CREATE TYPE "VideoAssetStatus" AS ENUM ('PENDING', 'READY', 'FAILED', 'REPLACED');

-- CreateEnum
CREATE TYPE "ReadingKind" AS ENUM ('PAPER', 'REPORT', 'STANDARD', 'ARTICLE', 'BOOK', 'DOCUMENTATION');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "QuestionType" ADD VALUE 'TRUE_FALSE';
ALTER TYPE "QuestionType" ADD VALUE 'MULTI_SELECT';

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "catalogKey" TEXT,
ADD COLUMN     "videoAssetId" TEXT,
ADD COLUMN     "videoCredit" TEXT,
ADD COLUMN     "videoDurationSeconds" INTEGER,
ADD COLUMN     "videoEnd" INTEGER,
ADD COLUMN     "videoProvider" "VideoProvider",
ADD COLUMN     "videoSourceUrl" TEXT,
ADD COLUMN     "videoStart" INTEGER,
ADD COLUMN     "youtubeId" TEXT;

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "catalogKey" TEXT,
ADD COLUMN     "quizPassPercent" INTEGER NOT NULL DEFAULT 70,
ADD COLUMN     "quizQuestionCount" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "catalogKey" TEXT,
ADD COLUMN     "needsReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "placement" "QuizPlacement" NOT NULL DEFAULT 'LESSON',
ADD COLUMN     "sourceNote" TEXT,
ADD COLUMN     "triggerSeconds" INTEGER;

-- AlterTable
ALTER TABLE "Roadmap" ADD COLUMN     "catalogKey" TEXT,
ADD COLUMN     "catalogVersion" INTEGER,
ADD COLUMN     "isSequential" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "learningOutcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sources" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "ModuleReading" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT,
    "publisher" TEXT,
    "year" INTEGER,
    "url" TEXT NOT NULL,
    "kind" "ReadingKind" NOT NULL DEFAULT 'ARTICLE',
    "note" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "catalogKey" TEXT,

    CONSTRAINT "ModuleReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockQuestion" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "codeSnippet" TEXT,
    "options" JSONB,
    "correctAnswer" TEXT NOT NULL,
    "acceptedAnswers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "explanation" TEXT NOT NULL,
    "topicTag" TEXT,
    "lessonTitle" TEXT,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "sourceNote" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "catalogKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockQuizAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "questionIds" TEXT[],
    "answers" JSONB,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "percent" INTEGER NOT NULL DEFAULT 0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "BlockQuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoAsset" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "durationSeconds" INTEGER,
    "status" "VideoAssetStatus" NOT NULL DEFAULT 'PENDING',
    "lessonId" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "VideoAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonVideoProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "positionSeconds" INTEGER NOT NULL DEFAULT 0,
    "watchedSegments" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "completedAt" TIMESTAMP(3),
    "lastReportAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonVideoProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModuleReading_catalogKey_key" ON "ModuleReading"("catalogKey");

-- CreateIndex
CREATE INDEX "ModuleReading_moduleId_idx" ON "ModuleReading"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockQuestion_catalogKey_key" ON "BlockQuestion"("catalogKey");

-- CreateIndex
CREATE INDEX "BlockQuestion_moduleId_idx" ON "BlockQuestion"("moduleId");

-- CreateIndex
CREATE INDEX "BlockQuizAttempt_userId_moduleId_startedAt_idx" ON "BlockQuizAttempt"("userId", "moduleId", "startedAt");

-- CreateIndex
CREATE INDEX "BlockQuizAttempt_moduleId_idx" ON "BlockQuizAttempt"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoAsset_storageKey_key" ON "VideoAsset"("storageKey");

-- CreateIndex
CREATE INDEX "VideoAsset_lessonId_idx" ON "VideoAsset"("lessonId");

-- CreateIndex
CREATE INDEX "VideoAsset_uploadedById_idx" ON "VideoAsset"("uploadedById");

-- CreateIndex
CREATE INDEX "LessonVideoProgress_lessonId_idx" ON "LessonVideoProgress"("lessonId");

-- CreateIndex
CREATE INDEX "LessonVideoProgress_userId_updatedAt_idx" ON "LessonVideoProgress"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LessonVideoProgress_userId_lessonId_key" ON "LessonVideoProgress"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_videoAssetId_key" ON "Lesson"("videoAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_catalogKey_key" ON "Lesson"("catalogKey");

-- CreateIndex
CREATE UNIQUE INDEX "Module_catalogKey_key" ON "Module"("catalogKey");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_catalogKey_key" ON "Quiz"("catalogKey");

-- CreateIndex
CREATE UNIQUE INDEX "Roadmap_catalogKey_key" ON "Roadmap"("catalogKey");

-- AddForeignKey
ALTER TABLE "ModuleReading" ADD CONSTRAINT "ModuleReading_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockQuestion" ADD CONSTRAINT "BlockQuestion_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockQuizAttempt" ADD CONSTRAINT "BlockQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockQuizAttempt" ADD CONSTRAINT "BlockQuizAttempt_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_videoAssetId_fkey" FOREIGN KEY ("videoAssetId") REFERENCES "VideoAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoAsset" ADD CONSTRAINT "VideoAsset_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoAsset" ADD CONSTRAINT "VideoAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonVideoProgress" ADD CONSTRAINT "LessonVideoProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonVideoProgress" ADD CONSTRAINT "LessonVideoProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

