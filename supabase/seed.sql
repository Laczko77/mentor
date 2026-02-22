-- Seed data for testing locally

-- Insert dummy users into Auth system
-- Their public.profiles will be created automatically via the trigger
INSERT INTO
    auth.users (
        id,
        instance_id,
        role,
        aud,
        authenticated_role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    )
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'authenticated',
        'mentor@mentortrack.test',
        crypt ('password123', gen_salt ('bf')),
        current_timestamp,
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Kovács Péter", "role": "mentor", "joined_at": "2025-01-01"}',
        current_timestamp,
        current_timestamp
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'authenticated',
        'anna@mentortrack.test',
        crypt ('password123', gen_salt ('bf')),
        current_timestamp,
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Nagy Anna", "role": "mentee", "joined_at": "2025-12-01"}',
        current_timestamp,
        current_timestamp
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'authenticated',
        'bela@mentortrack.test',
        crypt ('password123', gen_salt ('bf')),
        current_timestamp,
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Kiss Béla", "role": "mentee", "joined_at": "2025-06-15"}',
        current_timestamp,
        current_timestamp
    );

-- Insert identities (required for auth to work properly)
INSERT INTO
    auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    )
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        '11111111-1111-1111-1111-111111111111',
        '11111111-1111-1111-1111-111111111111',
        format('{"sub":"%s","email":"%s"}', '11111111-1111-1111-1111-111111111111', 'mentor@mentortrack.test')::jsonb,
        'email',
        current_timestamp,
        current_timestamp,
        current_timestamp
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        '22222222-2222-2222-2222-222222222222',
        '22222222-2222-2222-2222-222222222222',
        format('{"sub":"%s","email":"%s"}', '22222222-2222-2222-2222-222222222222', 'anna@mentortrack.test')::jsonb,
        'email',
        current_timestamp,
        current_timestamp,
        current_timestamp
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        '33333333-3333-3333-3333-333333333333',
        '33333333-3333-3333-3333-333333333333',
        format('{"sub":"%s","email":"%s"}', '33333333-3333-3333-3333-333333333333', 'bela@mentortrack.test')::jsonb,
        'email',
        current_timestamp,
        current_timestamp,
        current_timestamp
    );

-- Sample sessions
INSERT INTO public.sessions (id, mentor_id, title, type, start_time, end_time, duration_min, max_slots, location_note, status)
VALUES
  ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', '1:1 Mentoring - Onboarding', 'individual', CURRENT_DATE + interval '1 day' + interval '10 hours', CURRENT_DATE + interval '1 day' + interval '11 hours', 60, 1, 'Teams link', 'open'),
  ('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', 'Group Session - Best Practices', 'group', CURRENT_DATE + interval '2 days' + interval '14 hours', CURRENT_DATE + interval '2 days' + interval '15 hours 30 minutes', 90, 5, 'Iroda 3.em', 'open'),
  ('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', '1:1 Code Review', 'individual', CURRENT_TIMESTAMP - interval '1 day', CURRENT_TIMESTAMP - interval '23 hours', 60, 1, 'Teams link', 'completed');

-- Sample bookings
INSERT INTO public.bookings (session_id, mentee_id, status)
VALUES
  ('44444444-4444-4444-4444-444444444441', '22222222-2222-2222-2222-222222222222', 'accepted'),
  ('44444444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222222', 'pending'),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333333', 'accepted'),
  ('44444444-4444-4444-4444-444444444443', '22222222-2222-2222-2222-222222222222', 'completed');
