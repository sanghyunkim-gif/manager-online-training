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

// ============================================================
// 어드민 전용 함수 (이하 모든 함수는 서버의 admin API에서만 호출)
// ============================================================

// 어드민용 문제 생성/수정 입력 타입
export type QuestionCreateInput = Omit<
  DbQuestion,
  'id' | 'total_attempts' | 'correct_count' | 'incorrect_count' | 'created_at' | 'updated_at'
>;
export type QuestionUpdateInput = Partial<QuestionCreateInput>;

/**
 * 특정 챕터의 모든 문제 조회 (어드민용 — Active+Inactive 모두 포함).
 * 학습자용 getQuestionsByChapter는 Active만 반환하므로 별도 함수로 분리.
 */
export async function getQuestionsByChapterAdmin(
  chapterId: string
): Promise<DbQuestion[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error('챕터 문제를 불러올 수 없습니다.');
  }

  return data;
}

/** 전 챕터 문제 전부 조회 (어드민용 — status 무관). */
export async function getAllQuestionsAdmin(): Promise<DbQuestion[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error('문제 목록을 불러올 수 없습니다.');
  }

  return data;
}

/** 새 문제를 생성한다. 통계 컬럼(total_attempts 등)은 DB default(0)에 맡긴다. */
export async function createQuestion(
  input: QuestionCreateInput
): Promise<DbQuestion> {
  const { data, error } = await supabase
    .from('questions')
    .insert(input)
    .select()
    .single();

  if (error) {
    throw new Error('문제를 생성할 수 없습니다.');
  }

  return data;
}

/** 문제를 수정한다. */
export async function updateQuestion(
  id: string,
  updates: QuestionUpdateInput
): Promise<DbQuestion> {
  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error('문제를 수정할 수 없습니다.');
  }

  return data;
}

/**
 * 문제를 비활성화한다 (soft delete).
 * 학습자 노출에서 제외되지만 DB에는 남아있어 기록 보존이 가능하다.
 */
export async function softDeleteQuestion(id: string): Promise<DbQuestion> {
  const { data, error } = await supabase
    .from('questions')
    .update({ status: 'Inactive' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error('문제를 비활성화할 수 없습니다.');
  }

  return data;
}

/**
 * 문제를 완전히 삭제한다 (hard delete).
 * question_attempts가 CASCADE로 설정되어 있어 시도 기록도 함께 삭제됨.
 * 복구 불가 — 호출 전 UI에서 경고 필수.
 */
export async function hardDeleteQuestion(id: string): Promise<boolean> {
  const { error } = await supabase.from('questions').delete().eq('id', id);

  if (error) {
    return false;
  }

  return true;
}

/**
 * 챕터별 Active 문제 수를 집계해 반환한다.
 * N+1 방지: 단일 쿼리로 전체 조회 후 JS reduce로 집계.
 */
export async function countActiveQuestionsByChapter(): Promise<
  Record<string, number>
> {
  const { data, error } = await supabase
    .from('questions')
    .select('chapter_id')
    .eq('status', 'Active');

  if (error) {
    throw new Error('문제 수를 집계할 수 없습니다.');
  }

  return data.reduce<Record<string, number>>((acc, row) => {
    const key = row.chapter_id as string;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
