-- Bookings table: mentee signs up for a session
CREATE TABLE public.bookings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  mentee_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  note        text,
  mentor_note text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(session_id, mentee_id)
);

CREATE INDEX idx_bookings_session ON public.bookings(session_id);
CREATE INDEX idx_bookings_mentee  ON public.bookings(mentee_id);
CREATE INDEX idx_bookings_status  ON public.bookings(status);
