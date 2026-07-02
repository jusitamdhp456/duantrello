-- Thêm cột product_url và review_status vào bảng tasks
alter table tasks 
add column if not exists product_url text,
add column if not exists review_status text default 'pending';

-- Các giá trị review_status dự kiến: 'pending', 'approved', 'rejected'
