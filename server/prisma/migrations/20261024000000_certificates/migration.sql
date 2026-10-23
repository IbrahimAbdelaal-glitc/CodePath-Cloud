-- CreateTable
CREATE TABLE "LessonActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "activeSeconds" INTEGER NOT NULL DEFAULT 0,
    "firstActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roadmapId" TEXT,
    "roadmapTitle" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "accuracy" INTEGER,
    "questionsAnswered" INTEGER NOT NULL,
    "questionsTotal" INTEGER NOT NULL,
    "activeSeconds" INTEGER NOT NULL,
    "timeTrackedSince" TIMESTAMP(3),
    "timeFullyTracked" BOOLEAN NOT NULL,
    "verificationCode" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonActivity_userId_lastHeartbeatAt_idx" ON "LessonActivity"("userId", "lastHeartbeatAt");

-- CreateIndex
CREATE INDEX "LessonActivity_lessonId_idx" ON "LessonActivity"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonActivity_userId_lessonId_key" ON "LessonActivity"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_verificationCode_key" ON "Certificate"("verificationCode");

-- CreateIndex
CREATE INDEX "Certificate_roadmapId_idx" ON "Certificate"("roadmapId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_userId_roadmapId_key" ON "Certificate"("userId", "roadmapId");

-- AddForeignKey
ALTER TABLE "LessonActivity" ADD CONSTRAINT "LessonActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonActivity" ADD CONSTRAINT "LessonActivity_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE SET NULL ON UPDATE CASCADE;

