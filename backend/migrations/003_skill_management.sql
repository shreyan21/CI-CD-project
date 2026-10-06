ALTER TABLE skills ADD COLUMN IF NOT EXISTS proficiency SMALLINT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'skills_proficiency_range'
  ) THEN
    ALTER TABLE skills
      ADD CONSTRAINT skills_proficiency_range
      CHECK (proficiency IS NULL OR proficiency BETWEEN 0 AND 100);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS skills_sort_order_idx ON skills(sort_order, id);
CREATE UNIQUE INDEX IF NOT EXISTS certifications_title_unique_idx ON certifications(title);
