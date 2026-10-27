-- Cybersecurity roadmap: stage details, skip tests, video-question pass mark, reading access labels and a catalog sync lease.
-- Additive only: new nullable or defaulted columns and one new table. No existing rows or columns are removed.

-- AlterTable
ALTER TABLE "BlockQuizAttempt" ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'EXAM';

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "allowTestOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "learningOutcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "linkedRoadmapIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "nextSteps" TEXT,
ADD COLUMN     "practice" TEXT,
ADD COLUMN     "prerequisiteNotes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "specialties" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "timeEstimate" TEXT;

-- AlterTable
ALTER TABLE "ModuleReading" ADD COLUMN     "access" TEXT;

-- AlterTable
ALTER TABLE "Roadmap" ADD COLUMN     "checkpointPassPercent" INTEGER;

-- CreateTable
CREATE TABLE "CatalogLock" (
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "lockedUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogLock_pkey" PRIMARY KEY ("name")
);


-- The site now teaches cybersecurity only. Hide (do not delete) the four programming paths from the student catalog.
-- Their lessons, student progress, quiz attempts and certificates stay in the database, and an admin can republish them.
-- Matched by exact slug, and only for paths that did not come from the built-in catalog.
UPDATE "Roadmap"
SET "isPublished" = false, "isFeatured" = false
WHERE "slug" IN ('frontend', 'dotnet-backend', 'python-backend', 'ai-fullstack') AND "catalogKey" IS NULL;
