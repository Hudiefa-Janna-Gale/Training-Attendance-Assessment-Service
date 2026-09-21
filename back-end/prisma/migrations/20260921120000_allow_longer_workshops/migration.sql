-- A workshop usually runs 3 days, but longer ones exist: a session or an assessment can be on any
-- day from 1 to 30 (MAX_DAY in src/common/workshop-days.ts). Only the upper bound of the two day
-- guards changes, so every existing row stays valid. A FINAL assessment is still on day 3
-- ("assessments_final_on_day3_chk"), and a participant still needs 2 attended days to pass.

ALTER TABLE "sessions"
    DROP CONSTRAINT "sessions_day_range_chk",
    ADD CONSTRAINT "sessions_day_range_chk" CHECK ("day" BETWEEN 1 AND 30);

ALTER TABLE "assessments"
    DROP CONSTRAINT "assessments_day_range_chk",
    ADD CONSTRAINT "assessments_day_range_chk" CHECK ("day" BETWEEN 1 AND 30);
