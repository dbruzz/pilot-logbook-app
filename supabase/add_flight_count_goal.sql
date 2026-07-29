-- ================================================================
-- Add Flight Count goal support to the goals table
-- Run this in the Supabase SQL Editor.
-- ================================================================

ALTER TABLE goals
    ADD COLUMN IF NOT EXISTS target_flight_count INTEGER DEFAULT NULL;

-- ================================================================
-- END OF MIGRATION
-- ================================================================
