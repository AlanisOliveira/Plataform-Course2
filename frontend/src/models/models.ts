export type Course = {
  id: number;
  fileCover?: string;
  isCoverUrl: number;
  name: string;
  path: string;
  urlCover?: string;
  categories?: string;
  course_type?: string;
  completion_percentage?: number;
  has_progress?: boolean;
  last_watched_at?: string;
};

export type Lesson = {
  id: number;
  module: string;
  progressStatus: string;
  hierarchy_path: string;
  course_title: string;
  isCompleted: number;
  title: string;
  video_url: string;
  time_elapsed?: number;
  duration: string;
  pdf_url: string;
  subtitle_url?: string;
};

export type Module = Record<string, any>;

export type Modules = { [k: string]: Lesson[] };

export type Hierarchy = {
  [key: string]: Hierarchy | Lesson[];
};

export type Book = {
  id: number;
  title: string;
  author?: string;
  file_path: string;
  file_type: string;
  isCoverUrl: number;
  fileCover?: string;
  urlCover?: string;
  categories?: string;
  book_type?: string;
  current_page: number;
  total_pages?: number;
  epub_cfi_position?: string;
  is_read: number;
  last_read_at?: string;
};

export type BookNote = {
  id: number;
  book_id: number;
  page_number?: number;
  cfi_position?: string;
  note_text: string;
  created_at: string;
  updated_at: string;
};

export type BookHighlight = {
  id: number;
  book_id: number;
  page_number?: number;
  cfi_position?: string;
  cfi_range?: string;
  highlighted_text: string;
  color: string;
  created_at: string;
};

export type BookBookmark = {
  id: number;
  book_id: number;
  page_number?: number;
  cfi_position?: string;
  name?: string;
  created_at: string;
};

export type Profile = {
  id: number;
  name: string;
  is_admin: number;
  avatar_color: string;
  created_at?: string;
};
