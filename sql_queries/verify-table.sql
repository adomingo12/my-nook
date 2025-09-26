-- Verify the reading_nook table exists and has the correct structure
-- Run this in your Supabase SQL editor

-- 1. Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'reading_nook'
) as table_exists;

-- 2. Show table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'reading_nook'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables
WHERE tablename = 'reading_nook';

-- 4. Show current policies
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'reading_nook';

-- 5. Check permissions for anon role
SELECT grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'reading_nook'
AND grantee = 'anon';

-- 6. If table doesn't exist, create it with proper structure
CREATE TABLE IF NOT EXISTS reading_nook (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'TBR',
    format TEXT[] NOT NULL DEFAULT ARRAY['Physical'],
    user_rating INTEGER DEFAULT 0,
    page_count INTEGER DEFAULT 0,
    date_published DATE,
    publisher TEXT,
    isbn TEXT,
    cover_url TEXT,
    synopsis TEXT,
    date_added DATE DEFAULT CURRENT_DATE,
    date_started DATE,
    date_finished DATE,
    current_page INTEGER DEFAULT 0,
    series BOOLEAN DEFAULT FALSE,
    series_name TEXT,
    series_number REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
