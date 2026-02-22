-- View: completed mentoring hours per mentee
CREATE VIEW public.completed_hours AS
SELECT
  b.mentee_id,
  COALESCE(SUM(s.duration_min), 0) / 60.0 AS completed_hours
FROM public.bookings b
JOIN public.sessions s ON s.id = b.session_id
WHERE b.status = 'accepted'
  AND s.end_time < now()
GROUP BY b.mentee_id;
