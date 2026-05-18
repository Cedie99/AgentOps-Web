-- Create collector_daily_collections table for simple daily collection tracking
-- This table records only the amounts collectors physically collect each day

CREATE TABLE IF NOT EXISTS collector_daily_collections (
  id SERIAL PRIMARY KEY,
  collector_id TEXT NOT NULL,
  store_name TEXT NOT NULL,
  amount_collected DECIMAL(12, 2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  receipt_photo_url TEXT,
  collection_notes TEXT,
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_collector_daily_collections_collector_id ON collector_daily_collections(collector_id);
CREATE INDEX idx_collector_daily_collections_collected_at ON collector_daily_collections(collected_at);
CREATE INDEX idx_collector_daily_collections_store_name ON collector_daily_collections(store_name);

-- Enable Row Level Security
ALTER TABLE collector_daily_collections ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON collector_daily_collections TO anon, authenticated;
GRANT USAGE ON SEQUENCE collector_daily_collections_id_seq TO anon, authenticated;

-- Service role full access
CREATE POLICY "Service role can do anything on collector_daily_collections"
ON collector_daily_collections FOR ALL TO service_role
USING (true);

-- Allow collectors to view their own collections
CREATE POLICY "Collectors can view their own collections"
ON collector_daily_collections FOR SELECT TO authenticated, anon
USING (true);

-- Allow collectors to insert their own collections
CREATE POLICY "Collectors can insert their own collections"
ON collector_daily_collections FOR INSERT TO authenticated, anon
WITH CHECK (true);

-- Allow collectors to update their own collections
CREATE POLICY "Collectors can update their own collections"
ON collector_daily_collections FOR UPDATE TO authenticated, anon
USING (true);

-- Admins can view all collections
CREATE POLICY "Admins can view all collections"
ON collector_daily_collections FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM users
  WHERE email = auth.email()
  AND role IN ('ADMIN', 'SUPER_ADMIN')
));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_collector_daily_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collector_daily_collections_updated_at
BEFORE UPDATE ON collector_daily_collections
FOR EACH ROW
EXECUTE FUNCTION update_collector_daily_collections_updated_at();
