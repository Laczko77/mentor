-- ──────────────────────────────────────────────
-- Add recurrence columns to sessions table
-- ──────────────────────────────────────────────

ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS recurrence_rule TEXT CHECK (recurrence_rule IN ('weekly', 'biweekly')),
    ADD COLUMN IF NOT EXISTS recurrence_group_id UUID;

CREATE INDEX idx_sessions_recurrence_group ON sessions(recurrence_group_id) WHERE recurrence_group_id IS NOT NULL;
