/**
 * Comment type definitions for transaction comments
 */

export interface Comment {
  id: number;
  content: string;
  is_internal: boolean;
  user: {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  user_name: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface CommentInput {
  content: string;
  is_internal?: boolean;
}