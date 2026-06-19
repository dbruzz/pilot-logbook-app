-- ================================================================
-- FLIGHT JOURNAL — Complete SQL Migration
-- Copy-paste this entire script into the Supabase SQL Editor.
-- ================================================================


-- ----------------------------------------------------------------
-- 1. TABLES
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS journal_entries (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     UUID   NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title       TEXT   NOT NULL,
    content     TEXT   NOT NULL,
    entry_date  DATE   NOT NULL,
    entry_type  TEXT   NOT NULL CHECK (entry_type IN ('note', 'experience', 'achievement')),
    -- Optional FK associations (for future Calendar/Timeline use)
    flight_log_id BIGINT REFERENCES flight_logs(id)    ON DELETE SET NULL,
    goal_id       BIGINT REFERENCES goals(id)           ON DELETE SET NULL,
    aircraft_id   BIGINT REFERENCES user_aircrafts(id)  ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entry_images (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    journal_entry_id  BIGINT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    storage_path      TEXT   NOT NULL,   -- path inside the 'journal-images' bucket
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ----------------------------------------------------------------
-- 2. INDEXES
-- ----------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id
    ON journal_entries(user_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_entry_date
    ON journal_entries(entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_journal_entry_images_entry_id
    ON journal_entry_images(journal_entry_id);


-- ----------------------------------------------------------------
-- 3. AUTO-UPDATE updated_at TRIGGER
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger first to make this script idempotent
DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;

CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ----------------------------------------------------------------
-- 4. ROW LEVEL SECURITY — journal_entries
-- ----------------------------------------------------------------

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY "Users can view their own journal entries"
    ON journal_entries FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- INSERT
CREATE POLICY "Users can create their own journal entries"
    ON journal_entries FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- UPDATE
CREATE POLICY "Users can update their own journal entries"
    ON journal_entries FOR UPDATE
    TO authenticated
    USING  (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- DELETE
CREATE POLICY "Users can delete their own journal entries"
    ON journal_entries FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());


-- ----------------------------------------------------------------
-- 5. ROW LEVEL SECURITY — journal_entry_images
-- ----------------------------------------------------------------

ALTER TABLE journal_entry_images ENABLE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY "Users can view images for their own journal entries"
    ON journal_entry_images FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM journal_entries je
            WHERE je.id = journal_entry_id
              AND je.user_id = auth.uid()
        )
    );

-- INSERT
CREATE POLICY "Users can create image records for their own journal entries"
    ON journal_entry_images FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM journal_entries je
            WHERE je.id = journal_entry_id
              AND je.user_id = auth.uid()
        )
    );

-- UPDATE
CREATE POLICY "Users can update image records for their own journal entries"
    ON journal_entry_images FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM journal_entries je
            WHERE je.id = journal_entry_id
              AND je.user_id = auth.uid()
        )
    );

-- DELETE
CREATE POLICY "Users can delete image records for their own journal entries"
    ON journal_entry_images FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM journal_entries je
            WHERE je.id = journal_entry_id
              AND je.user_id = auth.uid()
        )
    );


-- ----------------------------------------------------------------
-- 6. STORAGE BUCKET
-- ----------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'journal-images',
    'journal-images',
    false,          -- PRIVATE: signed URLs required to read
    5242880,        -- 5 MB per file
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------------
-- 7. STORAGE RLS POLICIES
-- Path structure enforced: {user_id}/{entry_id}/{filename}
-- (storage.foldername(name))[1] extracts the first path segment = user_id
-- ----------------------------------------------------------------

-- SELECT: users can only read their own images
CREATE POLICY "Users can view their own journal images"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'journal-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- INSERT: users can only upload to their own folder
CREATE POLICY "Users can upload their own journal images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'journal-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- UPDATE: users can only update their own images
CREATE POLICY "Users can update their own journal images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'journal-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- DELETE: users can only delete their own images
CREATE POLICY "Users can delete their own journal images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'journal-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );


-- ================================================================
-- END OF MIGRATION
-- ================================================================
