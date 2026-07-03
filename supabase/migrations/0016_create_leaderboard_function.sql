-- =============================================
-- 0016: Create Leaderboard Function
-- =============================================

-- Create a type for the leaderboard response to ensure type safety
CREATE TYPE leaderboard_entry AS (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  completed_tasks BIGINT,
  rank_num BIGINT
);

-- Function to get leaderboard for a workspace
CREATE OR REPLACE FUNCTION get_workspace_leaderboard(p_workspace_id UUID)
RETURNS SETOF leaderboard_entry AS $$
BEGIN
  RETURN QUERY
  WITH task_counts AS (
    SELECT 
      t.assignee_id as uid, 
      COUNT(t.id) as completed_count
    FROM public.tasks t
    WHERE t.workspace_id = p_workspace_id 
      AND t.status = 'completed'
      AND t.assignee_id IS NOT NULL
    GROUP BY t.assignee_id
  )
  SELECT 
    tc.uid as user_id,
    p.full_name,
    p.avatar_url,
    tc.completed_count as completed_tasks,
    RANK() OVER (ORDER BY tc.completed_count DESC) as rank_num
  FROM task_counts tc
  LEFT JOIN public.profiles p ON p.id = tc.uid
  ORDER BY tc.completed_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
