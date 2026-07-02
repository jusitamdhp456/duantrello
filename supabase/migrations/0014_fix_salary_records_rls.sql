-- Sửa lại RLS cho bảng salary_records để Admin có quyền thêm/xóa lương cho thành viên khác trong workspace

DROP POLICY IF EXISTS "Users can view their own salary records" ON salary_records;
CREATE POLICY "Workspace members can view salary records"
ON salary_records FOR SELECT
USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can insert their own salary records" ON salary_records;
CREATE POLICY "Workspace members can insert salary records"
ON salary_records FOR INSERT
WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can delete their own salary records" ON salary_records;
CREATE POLICY "Workspace members can delete salary records"
ON salary_records FOR DELETE
USING (is_workspace_member(workspace_id));
