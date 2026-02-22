-- ──────────────────────────────────────────────
-- Session templates for quick session creation
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS session_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('individual', 'group')),
    duration_min INTEGER NOT NULL DEFAULT 60,
    max_slots INTEGER NOT NULL DEFAULT 1,
    location_note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_templates_mentor ON session_templates(mentor_id);

-- RLS
ALTER TABLE session_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors manage own templates"
    ON session_templates FOR ALL
    USING (
        auth.uid() = mentor_id
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'mentor'
        )
    );
