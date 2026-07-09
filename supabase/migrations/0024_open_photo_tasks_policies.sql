-- Mở khóa toàn bộ quyền Xem, Thêm, Sửa, Xóa trên bảng photo_tasks cho tất cả người dùng đã đăng nhập (giống như bảng tasks)

DROP POLICY IF EXISTS "Users can view photo_tasks in their workspaces" ON photo_tasks;
CREATE POLICY "Anyone can view photo_tasks" ON photo_tasks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert photo_tasks in their workspaces" ON photo_tasks;
CREATE POLICY "Anyone can insert photo_tasks" ON photo_tasks FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update photo_tasks in their workspaces" ON photo_tasks;
CREATE POLICY "Anyone can update photo_tasks" ON photo_tasks FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can delete photo_tasks in their workspaces" ON photo_tasks;
CREATE POLICY "Anyone can delete photo_tasks" ON photo_tasks FOR DELETE TO authenticated USING (true);
