
-- Fix for posts table missing challenge_id column
ALTER TABLE posts ADD COLUMN IF NOT EXISTS challenge_id uuid REFERENCES challenges(id);
