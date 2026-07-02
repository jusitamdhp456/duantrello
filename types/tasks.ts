export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'revision' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  assignee_name: string | null;
  deadline: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}
