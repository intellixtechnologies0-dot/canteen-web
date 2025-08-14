-- Cleanup Database - Remove All Custom Tables and Data
-- Keep only Supabase Auth system intact
-- Run this in your Supabase SQL Editor

-- Drop all custom tables (if they exist)
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS logs CASCADE;

-- Drop any custom functions we created
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop any custom indexes (they will be dropped with tables, but just to be sure)
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_inventory_name;
DROP INDEX IF EXISTS idx_logs_created_at;

-- Remove any custom policies (they will be dropped with tables, but just to be sure)
DROP POLICY IF EXISTS "Allow public read access to orders" ON orders;
DROP POLICY IF EXISTS "Allow public read access to inventory" ON inventory;
DROP POLICY IF EXISTS "Allow public read access to logs" ON logs;
DROP POLICY IF EXISTS "Allow authenticated users to insert orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to update orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to insert inventory" ON inventory;
DROP POLICY IF EXISTS "Allow authenticated users to update inventory" ON inventory;
DROP POLICY IF EXISTS "Allow authenticated users to insert logs" ON logs;

-- Clean up any remaining references
-- This will remove any remaining objects related to our custom tables

-- Verify cleanup - this should show only Supabase system tables
-- You can run this to see what tables remain:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Note: This preserves all Supabase built-in tables like:
-- - auth.users
-- - auth.identities
-- - auth.sessions
-- - auth.refresh_tokens
-- - storage.objects
-- - storage.buckets
-- - etc.

-- Your database is now clean and ready for fresh setup!

