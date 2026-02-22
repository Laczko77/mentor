-- ──────────────────────────────────────────────
-- Session notes: mentor writes per-mentee notes
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS session_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    mentee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(session_id, mentee_id)
);

CREATE INDEX idx_session_notes_session ON session_notes(session_id);
CREATE INDEX idx_session_notes_mentee ON session_notes(mentee_id);

-- RLS
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

-- Mentors can do everything with session notes
CREATE POLICY "Mentors manage session notes"
    ON session_notes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'mentor'
        )
    );

-- Mentees can read notes about themselves
CREATE POLICY "Mentees read own notes"
    ON session_notes FOR SELECT
    USING (auth.uid() = mentee_id);
