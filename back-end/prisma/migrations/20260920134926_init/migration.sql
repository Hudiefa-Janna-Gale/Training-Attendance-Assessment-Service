-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'excused');

-- CreateEnum
CREATE TYPE "AssessmentResult" AS ENUM ('PASS', 'FAIL');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('FINAL', 'QUIZ');

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "session_id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "facilitator_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "time_slot" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL,
    "session_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'absent',
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" UUID NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "type" "AssessmentType" NOT NULL DEFAULT 'FINAL',
    "total_marks" INTEGER NOT NULL DEFAULT 100,
    "pass_mark" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scores" (
    "id" UUID NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "result" "AssessmentResult" NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_id_key" ON "sessions"("session_id");

-- CreateIndex
CREATE INDEX "sessions_workshop_id_idx" ON "sessions"("workshop_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_workshop_id_day_time_slot_key" ON "sessions"("workshop_id", "day", "time_slot");

-- CreateIndex
CREATE INDEX "attendance_records_participant_id_idx" ON "attendance_records"("participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_session_id_participant_id_key" ON "attendance_records"("session_id", "participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessments_assessment_id_key" ON "assessments"("assessment_id");

-- CreateIndex
CREATE INDEX "assessments_workshop_id_idx" ON "assessments"("workshop_id");

-- CreateIndex
CREATE INDEX "scores_participant_id_idx" ON "scores"("participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "scores_assessment_id_participant_id_key" ON "scores"("assessment_id", "participant_id");

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("session_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("assessment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-written additions (Prisma's schema language cannot express these).
-- ---------------------------------------------------------------------------

-- Domain guards: a workshop runs 3 days; marks are sane; a FINAL is on day 3.
ALTER TABLE "sessions"
    ADD CONSTRAINT "sessions_day_range_chk" CHECK ("day" BETWEEN 1 AND 3);

ALTER TABLE "assessments"
    ADD CONSTRAINT "assessments_day_range_chk" CHECK ("day" BETWEEN 1 AND 3),
    ADD CONSTRAINT "assessments_marks_chk" CHECK ("total_marks" > 0 AND "pass_mark" BETWEEN 0 AND "total_marks"),
    ADD CONSTRAINT "assessments_final_on_day3_chk" CHECK ("type" <> 'FINAL' OR "day" = 3);

ALTER TABLE "scores"
    ADD CONSTRAINT "scores_score_nonneg_chk" CHECK ("score" >= 0);

-- "Each workshop has exactly one final assessment": at most one FINAL per workshop.
CREATE UNIQUE INDEX "assessments_one_final_per_workshop_key"
    ON "assessments"("workshop_id") WHERE "type" = 'FINAL';

-- Race-free generators for human-readable ids (SES-001, ASS-001) when the client
-- does not supply one.
CREATE SEQUENCE "session_id_seq" START 1;
CREATE SEQUENCE "assessment_id_seq" START 1;
