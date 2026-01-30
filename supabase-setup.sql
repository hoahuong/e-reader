-- Supabase Database Setup Script
-- Chạy script này trong Supabase SQL Editor để tạo table metadata

-- Tạo table để lưu metadata
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index để query nhanh hơn
CREATE INDEX IF NOT EXISTS idx_metadata_key ON metadata(key);

-- Enable Row Level Security (RLS) - Cho phép public read/write
ALTER TABLE metadata ENABLE ROW LEVEL SECURITY;

-- Xóa policy cũ nếu có (để tránh conflict)
DROP POLICY IF EXISTS "Allow public read/write" ON metadata;

-- Tạo policy để cho phép public read/write
CREATE POLICY "Allow public read/write" ON metadata
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify table đã được tạo
SELECT * FROM metadata LIMIT 1;
