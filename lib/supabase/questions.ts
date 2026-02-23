import { supabase } from './client';

export interface DbQuestion {
  id: string;
  chapter_id: string;
  question_text: string;
  question_image: string | null;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  correct_answer: '1' | '2' | '3' | '4';
  explanation: string | null;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  total_attempts: number;
  correct_count: number;
  incorrect_count: number;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export async function getQuestionsByChapter(
  chapterId: string
): Promise<DbQuestion[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('chapter_id', chapterId)
    .eq('status', 'Active');

  if (error) {
    throw new Error('문제를 불러올 수 없습니다.');
  }

  return data;
}

export async function getRandomQuestions(
  chapterId: string,
  count: number
): Promise<DbQuestion[]> {
  const allQuestions = await getQuestionsByChapter(chapterId);

  // Fisher-Yates shuffle
  const shuffled = [...allQuestions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export async function getQuestionById(
  questionId: string
): Promise<DbQuestion | null> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', questionId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getQuestionsByIds(
  questionIds: string[]
): Promise<Record<string, DbQuestion>> {
  const result: Record<string, DbQuestion> = {};
  if (!questionIds.length) {
    return result;
  }

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .in('id', questionIds);

  if (error || !data) {
    return result;
  }

  for (const question of data) {
    result[question.id] = question;
  }

  return result;
}

export async function updateQuestionStats(
  questionId: string,
  isCorrect: boolean,
  cachedQuestion?: DbQuestion | null
): Promise<void> {
  const question = cachedQuestion || (await getQuestionById(questionId));
  if (!question) return;

  const totalAttempts = question.total_attempts + 1;
  const correctCount = isCorrect
    ? question.correct_count + 1
    : question.correct_count;
  const incorrectCount = !isCorrect
    ? question.incorrect_count + 1
    : question.incorrect_count;

  const { error } = await supabase
    .from('questions')
    .update({
      total_attempts: totalAttempts,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
    })
    .eq('id', questionId);

  if (error) {
    throw new Error('문제 통계 업데이트에 실패했습니다.');
  }
}

export async function getAllQuestionsStats(): Promise<DbQuestion[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('status', 'Active')
    .order('total_attempts', { ascending: false });

  if (error) {
    throw new Error('문제 통계를 불러올 수 없습니다.');
  }

  return data;
}
