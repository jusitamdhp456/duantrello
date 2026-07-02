-- Thêm các cột còn thiếu vào bảng tasks (Nếu đã có sẽ tự động bỏ qua)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS product_url TEXT,
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending';
