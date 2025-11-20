-- Bank It Game Database Schema
-- Run this in your Supabase SQL Editor

-- Rooms table stores all game rooms
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  host_player_id TEXT NOT NULL,
  total_rounds INTEGER NOT NULL DEFAULT 5,
  started BOOLEAN NOT NULL DEFAULT false,
  game_state JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON rooms(created_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on every update
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: Clean up old rooms (older than 24 hours)
-- You can run this periodically or set up a cron job
CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS void AS $$
BEGIN
    DELETE FROM rooms
    WHERE created_at < (now() - interval '24 hours');
END;
$$ language 'plpgsql';

-- Enable Row Level Security (optional, for future multi-tenancy)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on rooms" ON rooms
    FOR ALL USING (true);
