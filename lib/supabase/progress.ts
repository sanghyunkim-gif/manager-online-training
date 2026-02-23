import { supabase } from './client';

export interface DbUserProgress {
  id: string;
  user_id: string;
  chapter_id: string;
  video_watched: boolean;
  video_watch_time: number;
  questions_assigned: string[] | null;
  questions_answered: number;
  all_correct: boolean;
  chapter_completed: boolean;
  started_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbChapterHistory {
  id: string;
  user_id: string;
  chapter_id: string;
  attempt_number: number;
  start_time: string;
  end_time: string | null;
  video_watch_time: number;
  questions_correct: number | null;
  questions_total: number | null;
  status: 'In Progress' | 'Completed';
  created_at: string;
  updated_at: string;
}

export interface DbQuestionAttempt {
  id: string;
  user_id: string;
  question_id: string;
  chapter_id: string;
  user_answer: '1' | '2' | '3' | '4';
  attempt_number: number;
  time_spent: number | null;
  created_at: string;
}

export async function getUserProgress(
  userId: string,
  chapterId: string
): Promise<DbUserProgress | null> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('chapter_id', chapterId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getAllUserProgress(
  userId: string
): Promise<DbUserProgress[]> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    return [];
  }

  return data;
}

export async function createProgress(
  userId: string,
  chapterId: string,
  questionsAssigned: string[]
): Promise<DbUserProgress> {
  const { data, error } = await supabase
    .from('user_progress')
    .insert({
      user_id: userId,
      chapter_id: chapterId,
      video_watched: false,
      video_watch_time: 0,
      questions_assigned: questionsAssigned,
      questions_answered: 0,
      all_correct: false,
      chapter_completed: false,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error('진행 상황을 생성할 수 없습니다.');
  }

  return data;
}

export async function updateVideoWatchTime(
  progressId: string,
  watchTime: number,
  isWatched: boolean
): Promise<void> {
  const { error } = await supabase
    .from('user_progress')
    .update({
      video_watch_time: watchTime,
      video_watched: isWatched,
    })
    .eq('id', progressId);

  if (error) {
    throw new Error('영상 시청 시간 업데이트에 실패했습니다.');
  }
}

export async function completeChapter(
  progressId: string,
  allCorrect: boolean
): Promise<void> {
  const { error } = await supabase
    .from('user_progress')
    .update({
      all_correct: allCorrect,
      chapter_completed: allCorrect,
    })
    .eq('id', progressId);

  if (error) {
    throw new Error('챕터 완료 처리를 할 수 없습니다.');
  }
}

export async function createChapterHistory(
  userId: string,
  chapterId: string,
  attemptNumber: number
): Promise<DbChapterHistory> {
  const { data, error } = await supabase
    .from('chapter_history')
    .insert({
      user_id: userId,
      chapter_id: chapterId,
      attempt_number: attemptNumber,
      start_time: new Date().toISOString(),
      video_watch_time: 0,
      status: 'In Progress',
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error('챕터 기록을 생성할 수 없습니다.');
  }

  return data;
}

export async function completeChapterHistory(
  historyId: string,
  questionsCorrect: number,
  questionsTotal: number,
  videoWatchTime: number
): Promise<void> {
  const { error } = await supabase
    .from('chapter_history')
    .update({
      end_time: new Date().toISOString(),
      questions_correct: questionsCorrect,
      questions_total: questionsTotal,
      video_watch_time: videoWatchTime,
      status: 'Completed',
    })
    .eq('id', historyId);

  if (error) {
    throw new Error('챕터 기록 완료 처리에 실패했습니다.');
  }
}

export async function createQuestionAttempt(
  userId: string,
  questionId: string,
  chapterId: string,
  userAnswer: '1' | '2' | '3' | '4',
  attemptNumber: number,
  timeSpent?: number
): Promise<void> {
  const { error } = await supabase
    .from('question_attempts')
    .insert({
      user_id: userId,
      question_id: questionId,
      chapter_id: chapterId,
      user_answer: userAnswer,
      attempt_number: attemptNumber,
      time_spent: timeSpent || 0,
    });

  if (error) {
    throw new Error('문제 풀이 기록 생성에 실패했습니다.');
  }
}

export async function getChapterAttemptCount(
  userId: string,
  chapterId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('chapter_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('chapter_id', chapterId);

  if (error) {
    return 0;
  }

  return count || 0;
}
