// Supabase DB 타입 re-export
export type { DbChapter } from '@/lib/supabase/chapters';
export type { DbUser } from '@/lib/supabase/users';
export type {
  DbUserProgress,
  DbChapterHistory,
  DbQuestionAttempt,
} from '@/lib/supabase/progress';
export type { DbQuestion, PublicQuestion } from '@/lib/supabase/questions';
export type {
  ChapterStats,
  QuestionStats,
  DropoffAnalysis,
  RegionStats,
} from '@/lib/supabase/stats';

// API 응답 타입
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  allCompleted?: boolean;
  completedChapters?: number;
  totalChapters?: number;
}

// 세션 타입
export interface Session {
  userId: string;
  userName: string;
  userPhone: string;
  sessionToken: string;
}

// 챕터 진행 상태 타입
export interface ChapterProgressState {
  chapterId: string;
  chapterName: string;
  order: number;
  videoWatched: boolean;
  videoWatchPercentage: number;
  questionsCompleted: boolean;
  allCorrect: boolean;
  completed: boolean;
}
