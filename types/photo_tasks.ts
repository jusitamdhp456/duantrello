export type PhotoTaskStatus = 'pending' | 'in_progress' | 'review' | 'revision' | 'completed' | 'cancelled';
export type PhotoTaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface PhotoTask {
  id: string;
  workspace_id: string;
  title: string;
  description?: string | null;
  assignee_name?: string | null;
  assignee_id?: string | null;
  deadline?: string | null;
  priority: PhotoTaskPriority;
  status: PhotoTaskStatus;
  video_url?: string | null;
  video_url_2?: string | null;
  image_urls?: string[] | null;
  product_url?: string | null;
  review_status?: 'pending' | 'approved' | 'rejected' | null;
  created_at: string;
  updated_at: string;
}

export interface PhotoTaskComment {
  id: string;
  task_id: string;
  user_id: string | null;
  user_name: string | null;
  user_avatar?: string | null;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}
