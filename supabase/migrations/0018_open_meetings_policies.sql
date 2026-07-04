-- =============================================
-- 0018: Mở quyền truy cập Meeting cho tất cả người dùng đã đăng nhập
-- Tương tự migration 0010 đã làm với tasks
-- =============================================

-- meetings table: mở quyền SELECT, INSERT, UPDATE, DELETE cho tất cả authenticated users
DROP POLICY IF EXISTS "workspace_members_meetings_select" ON meetings;
CREATE POLICY "Anyone can view meetings" ON meetings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "workspace_members_meetings_insert" ON meetings;
CREATE POLICY "Anyone can create meetings" ON meetings
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "workspace_members_meetings_update" ON meetings;
CREATE POLICY "Anyone can update meetings" ON meetings
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "workspace_members_meetings_delete" ON meetings;
CREATE POLICY "Anyone can delete meetings" ON meetings
  FOR DELETE TO authenticated USING (true);

-- meeting_participants table
DROP POLICY IF EXISTS "meeting_participants_select" ON meeting_participants;
CREATE POLICY "Anyone can view meeting participants" ON meeting_participants
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "meeting_participants_insert" ON meeting_participants;
CREATE POLICY "Anyone can insert meeting participants" ON meeting_participants
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "meeting_participants_update" ON meeting_participants;
CREATE POLICY "Anyone can update meeting participants" ON meeting_participants
  FOR UPDATE TO authenticated USING (true);

-- meeting_notes table
DROP POLICY IF EXISTS "meeting_notes_select" ON meeting_notes;
CREATE POLICY "Anyone can view meeting notes" ON meeting_notes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "meeting_notes_insert" ON meeting_notes;
CREATE POLICY "Anyone can insert meeting notes" ON meeting_notes
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "meeting_notes_update" ON meeting_notes;
CREATE POLICY "Anyone can update meeting notes" ON meeting_notes
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "meeting_notes_delete" ON meeting_notes;
CREATE POLICY "Anyone can delete meeting notes" ON meeting_notes
  FOR DELETE TO authenticated USING (true);

-- meeting_action_items table
DROP POLICY IF EXISTS "meeting_action_items_select" ON meeting_action_items;
CREATE POLICY "Anyone can view meeting action items" ON meeting_action_items
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "meeting_action_items_insert" ON meeting_action_items;
CREATE POLICY "Anyone can insert meeting action items" ON meeting_action_items
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "meeting_action_items_update" ON meeting_action_items;
CREATE POLICY "Anyone can update meeting action items" ON meeting_action_items
  FOR UPDATE TO authenticated USING (true);
