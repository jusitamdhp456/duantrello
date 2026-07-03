-- =============================================
-- 0015: Create Meetings Module Tables
-- =============================================

-- Meeting types enum
CREATE TYPE meeting_type AS ENUM ('standup', 'brainstorm', 'review', 'one_on_one', 'general');
CREATE TYPE meeting_status AS ENUM ('scheduled', 'ongoing', 'ended', 'cancelled');

-- =============================================
-- meetings table
-- =============================================
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type meeting_type NOT NULL DEFAULT 'general',
  status meeting_status NOT NULL DEFAULT 'scheduled',
  meet_link TEXT, -- Google Meet / Zoom / Daily.co link
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER, -- calculated when ended
  agenda JSONB DEFAULT '[]'::jsonb, -- [{title, duration_minutes}]
  summary TEXT, -- post-meeting summary
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- meeting_participants table
-- =============================================
CREATE TABLE meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- meeting_notes table
-- =============================================
CREATE TABLE meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- meeting_action_items table
-- =============================================
CREATE TABLE meeting_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL, -- linked to tasks table
  title TEXT NOT NULL,
  assignee_name TEXT,
  due_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- updated_at triggers
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER meeting_notes_updated_at
  BEFORE UPDATE ON meeting_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Row Level Security
-- =============================================
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_action_items ENABLE ROW LEVEL SECURITY;

-- meetings: workspace members can read/write
CREATE POLICY "workspace_members_meetings_select" ON meetings
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_members_meetings_insert" ON meetings
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_members_meetings_update" ON meetings
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_members_meetings_delete" ON meetings
  FOR DELETE USING (host_id = auth.uid());

-- meeting_participants: same workspace members
CREATE POLICY "meeting_participants_select" ON meeting_participants
  FOR SELECT USING (
    meeting_id IN (
      SELECT m.id FROM meetings m
      JOIN workspace_members wm ON wm.workspace_id = m.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "meeting_participants_insert" ON meeting_participants
  FOR INSERT WITH CHECK (
    meeting_id IN (
      SELECT m.id FROM meetings m
      JOIN workspace_members wm ON wm.workspace_id = m.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "meeting_participants_update" ON meeting_participants
  FOR UPDATE USING (user_id = auth.uid());

-- meeting_notes: workspace members
CREATE POLICY "meeting_notes_select" ON meeting_notes
  FOR SELECT USING (
    meeting_id IN (
      SELECT m.id FROM meetings m
      JOIN workspace_members wm ON wm.workspace_id = m.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "meeting_notes_insert" ON meeting_notes
  FOR INSERT WITH CHECK (
    meeting_id IN (
      SELECT m.id FROM meetings m
      JOIN workspace_members wm ON wm.workspace_id = m.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "meeting_notes_update" ON meeting_notes
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "meeting_notes_delete" ON meeting_notes
  FOR DELETE USING (author_id = auth.uid());

-- meeting_action_items: workspace members
CREATE POLICY "meeting_action_items_select" ON meeting_action_items
  FOR SELECT USING (
    meeting_id IN (
      SELECT m.id FROM meetings m
      JOIN workspace_members wm ON wm.workspace_id = m.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "meeting_action_items_insert" ON meeting_action_items
  FOR INSERT WITH CHECK (
    meeting_id IN (
      SELECT m.id FROM meetings m
      JOIN workspace_members wm ON wm.workspace_id = m.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "meeting_action_items_update" ON meeting_action_items
  FOR UPDATE USING (
    meeting_id IN (
      SELECT m.id FROM meetings m
      JOIN workspace_members wm ON wm.workspace_id = m.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX idx_meetings_workspace_id ON meetings(workspace_id);
CREATE INDEX idx_meetings_host_id ON meetings(host_id);
CREATE INDEX idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_notes_meeting_id ON meeting_notes(meeting_id);
CREATE INDEX idx_meeting_action_items_meeting_id ON meeting_action_items(meeting_id);
