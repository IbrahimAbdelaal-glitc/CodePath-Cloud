-- Records which named catalog releases have been applied, so each one runs exactly once (additive)
CREATE TABLE "CatalogRelease" (
    "id" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" JSONB NOT NULL,

    CONSTRAINT "CatalogRelease_pkey" PRIMARY KEY ("id")
);
