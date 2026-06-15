// 서버 전용 모듈. service_role 클라이언트를 supabase 별칭으로 사용한다.
import { supabaseAdmin as supabase } from './client';

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

// 클라이언트로 전송 가능한 문제 타입 (정답·해설·통계 컬럼 제외)
export type PublicQuestion = Omit<
  DbQuestion,
  | 'correct_answer'
  | 'explanation'
  | 'total_attempts'
  | 'correct_count'
  | 'incorrect_count'
  | 'status'
>;

// DbQuestion 에서 민감 필드를 제거해 클라이언트 안전 객체로 변환한다.
export function toPublicQuestion(question: DbQuestion): PublicQuestion {
  return {
    id: question.id,
    chapter_id: question.chapter_id,
    question_text: question.question_text,
    question_image: question.question_image,
    option_1: question.option_1,
    option_2: question.option_2,
    option_3: question.option_3,
    option_4: question.option_4,
    difficulty: question.difficulty,
    created_at: question.created_at,
    updated_at: question.updated_at,
  };
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
