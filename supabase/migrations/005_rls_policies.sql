-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- =========================================
-- PROFILES policies
-- =========================================
-- Everyone can read basic profile info
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- =========================================
-- SESSIONS policies
-- =========================================
-- Mentor sees all sessions
CREATE POLICY "Mentor sees all sessions"
  ON public.sessions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor')
  );

-- Mentee sees open sessions or sessions they have a booking for
CREATE POLICY "Mentee sees open or booked sessions"
  ON public.sessions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentee')
    AND (
      status = 'open'
      OR id IN (SELECT session_id FROM public.bookings WHERE mentee_id = auth.uid())
    )
  );

-- Only mentor can insert sessions
CREATE POLICY "Mentor can create sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor')
    AND mentor_id = auth.uid()
  );

-- Only mentor can update own sessions
CREATE POLICY "Mentor can update own sessions"
  ON public.sessions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor')
    AND mentor_id = auth.uid()
  );

-- Only mentor can delete own sessions
CREATE POLICY "Mentor can delete own sessions"
  ON public.sessions FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor')
    AND mentor_id = auth.uid()
  );

-- =========================================
-- BOOKINGS policies
-- =========================================
-- Mentor sees all bookings
CREATE POLICY "Mentor sees all bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor')
  );

-- Mentee sees own bookings
CREATE POLICY "Mentee sees own bookings"
  ON public.bookings FOR SELECT
  USING (mentee_id = auth.uid());

-- Mentee can create a booking for themselves
CREATE POLICY "Mentee can book"
  ON public.bookings FOR INSERT
  WITH CHECK (
    mentee_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentee')
  );

-- Mentor can update any booking (accept/reject)
CREATE POLICY "Mentor can update bookings"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor')
  );

-- Mentee can update own pending booking (cancel)
CREATE POLICY "Mentee can cancel own pending booking"
  ON public.bookings FOR UPDATE
  USING (mentee_id = auth.uid() AND status = 'pending');

-- Mentee can delete own pending booking
CREATE POLICY "Mentee can delete own pending booking"
  ON public.bookings FOR DELETE
  USING (mentee_id = auth.uid() AND status = 'pending');
