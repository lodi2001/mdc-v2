/**
 * History and activity type definitions for transaction history
 */

export interface ActivityItem {
  type: 'status_change' | 'comment' | 'attachment';
  icon: string;
  color: string;
  title: string;
  description: string;
  user: string;
  created_at: string;
}

export interface StatusHistory {
  id: number;
  previous_status: string;
  new_status: string;
  previous_status_display: string;
  new_status_display: string;
  changed_by: {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  change_reason: string | null;
  created_at: string;
}