@echo off
echo Setting environment variables on Vercel...

set SUPABASE_URL=https://aagxclbjdfpslykmicwp.supabase.co
set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZ3hjbGJqZGZwc2x5a21pY3dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MjM5OTIsImV4cCI6MjA4NzA5OTk5Mn0.mOtU1SWHRl851n7SsT8vzmUL9vEadBll0sgdi0HPXHQ
set SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZ3hjbGJqZGZwc2x5a21pY3dwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUyMzk5MiwiZXhwIjoyMDg3MDk5OTkyfQ.Ml7MmrDNJdUQ63OwqtBrs9ojp7AVNRESfH-7kuB3nAc

echo Adding NEXT_PUBLIC_SUPABASE_URL...
call npx vercel env add NEXT_PUBLIC_SUPABASE_URL production %SUPABASE_URL% --force
call npx vercel env add NEXT_PUBLIC_SUPABASE_URL preview %SUPABASE_URL% --force
call npx vercel env add NEXT_PUBLIC_SUPABASE_URL development %SUPABASE_URL% --force

echo Adding NEXT_PUBLIC_SUPABASE_ANON_KEY...
call npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production %SUPABASE_ANON_KEY% --force
call npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview %SUPABASE_ANON_KEY% --force
call npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development %SUPABASE_ANON_KEY% --force

echo Adding SUPABASE_SERVICE_ROLE_KEY...
call npx vercel env add SUPABASE_SERVICE_ROLE_KEY production %SUPABASE_SERVICE_ROLE% --force
call npx vercel env add SUPABASE_SERVICE_ROLE_KEY preview %SUPABASE_SERVICE_ROLE% --force
call npx vercel env add SUPABASE_SERVICE_ROLE_KEY development %SUPABASE_SERVICE_ROLE% --force

echo Adding NEXT_PUBLIC_API_URL...
call npx vercel env add NEXT_PUBLIC_API_URL production /api --force
call npx vercel env add NEXT_PUBLIC_API_URL preview /api --force
call npx vercel env add NEXT_PUBLIC_API_URL development /api --force

echo Done!
