-- Sessions table: mentoring appointments
CREATE TABLE public.sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         text NOT NULL,
  type          text NOT NULL CHECK (type IN ('individual', 'group')),
  start_time    timestamptz NOT NULL,
  end_time      timestamptz NOT NULL,
  duration_min  int GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time))::int / 60
  ) STORED,
  max_slots     int DEFAULT 1,
  location_note text,
  status        text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  created_at    timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX idx_sessions_mentor ON public.sessions(mentor_id);
CREATE INDEX idx_sessions_status ON public.sessions(status);
CREATE INDEX idx_sessions_start  ON public.sessions(start_time);
