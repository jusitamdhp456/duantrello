export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'revision' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  assignee_name?: string | null;
  assignee_id?: string | null;
  deadline?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  video_url?: string | null;
  product_url?: string | null;
  review_status?: 'pending' | 'approved' | 'rejected' | null;
  created_at: string;
  updated_at: string;
}
