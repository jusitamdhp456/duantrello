-- 1. Cho phép tất cả người dùng đã đăng nhập xem tất cả Workspace
DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON workspaces;
CREATE POLICY "Anyone can view workspaces" ON workspaces FOR SELECT TO authenticated USING (true);

-- 2. Cho phép tất cả người dùng xem thành viên
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON workspace_members;
CREATE POLICY "Anyone can view members" ON workspace_members FOR SELECT TO authenticated USING (true);

-- 3. Mở khóa toàn bộ quyền Xem, Thêm, Sửa, Xóa trên bảng Tasks cho tất cả người dùng
DROP POLICY IF EXISTS "Users can view tasks in their workspaces" ON tasks;
CREATE POLICY "Anyone can view tasks" ON tasks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert tasks in their workspaces" ON tasks;
CREATE POLICY "Anyone can insert tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update tasks in their workspaces" ON tasks;
CREATE POLICY "Anyone can update tasks" ON tasks FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can delete tasks in their workspaces" ON tasks;
CREATE POLICY "Anyone can delete tasks" ON tasks FOR DELETE TO authenticated USING (true);
