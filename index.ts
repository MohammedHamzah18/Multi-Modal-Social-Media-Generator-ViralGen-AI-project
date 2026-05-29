export type UserRole = "admin" | "analyst" | "viewer";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string | null;
}

export type CallStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "completed"
  | "failed";

export interface Call {
  id: number;
  title: string;
  filename: string;
  file_format: string;
  file_size_bytes: number;
  duration_seconds: number | null;
  status: CallStatus;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface Transcript {
  id: number;
  full_text: string;
  redacted_text: string | null;
  segments: TranscriptSegment[];
  redacted_segments: TranscriptSegment[] | null;
  speakers: string[];
}

export interface Summary {
  id: number;
  executive_summary: string;
  key_points: string[];
}

export interface ActionItem {
  id: number;
  call_id: number;
  title: string;
  description: string | null;
  assignee: string | null;
  priority: "low" | "medium" | "high";
  is_completed: boolean;
  created_at: string;
}

export interface Sentiment {
  overall_label: string;
  overall_score: number;
  timeline: { start: number; end: number; label: string; score: number }[];
}

export interface CallDetail extends Call {
  transcript: Transcript | null;
  summary: Summary | null;
  action_items: ActionItem[];
  sentiment: Sentiment | null;
}

export interface DashboardStats {
  total_calls: number;
  average_duration_seconds: number;
  average_sentiment_score: number;
  total_action_items: number;
  completed_action_items: number;
  calls_by_status: Record<string, number>;
  sentiment_distribution: Record<string, number>;
  recent_calls: Call[];
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SearchResult {
  call_id: number;
  call_title: string;
  snippet: string;
  created_at: string;
}
