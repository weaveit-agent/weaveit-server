-- Safe migration: add `trial_expires_at` timestamptz column to `users` if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name = 'trial_expires_at'
  ) THEN
    ALTER TABLE users ADD COLUMN trial_expires_at timestamptz;
  END IF;
END$$;

-- Create an index to efficiently find expired trials (no-op if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_users_trial_expires_at'
  ) THEN
    CREATE INDEX idx_users_trial_expires_at ON users (trial_expires_at);
  END IF;
END$$;
