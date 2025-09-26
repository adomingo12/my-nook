-- Fix permissions for GitHub Pages deployment
-- Run this in your Supabase SQL editor

-- 1. Enable Row Level Security on the reading_nook table
ALTER TABLE reading_nook ENABLE ROW LEVEL SECURITY;

-- 2. Create a policy that allows all operations for anonymous users
-- Note: This is permissive for a personal app. Adjust as needed for security.
CREATE POLICY "Allow all operations for anon users" ON reading_nook
    FOR ALL 
    TO anon 
    USING (true) 
    WITH CHECK (true);

-- 3. Grant necessary permissions to the anon role
GRANT ALL ON reading_nook TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- 4. If you have any sequences (for auto-incrementing IDs), grant usage
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 5. Check current policies (for verification)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'reading_nook';

-- 6. Check table permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'reading_nook';
