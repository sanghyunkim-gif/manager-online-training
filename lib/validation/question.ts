/**
 * 문제 입력 서버 검증 헬퍼.
 * zod 미설치 환경이므로 unknown + type guard 패턴으로 수동 구현.
 */

export type ValidationResult = { ok: true } | { ok: false; error: string };

const CORRECT_ANSWER_VALUES = ['1', '2', '3', '4'] as const;
const DIFFICULTY_VALUES = ['Easy', 'Medium', 'Hard'] as const;
const STATUS_VALUES = ['Active', 'Inactive'] as const;

type CorrectAnswer = (typeof CORRECT_ANSWER_VALUES)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringOrNull(value: unknown): boolean {
  return value === null || typeof value === 'string';
}

function isCorrectAnswer(value: unknown): value is CorrectAnswer {
  return (CORRECT_ANSWER_VALUES as readonly unknown[]).includes(value);
}

function isDifficulty(value: unknown): value is 'Easy' | 'Medium' | 'Hard' {
  return (DIFFICULTY_VALUES as readonly unknown[]).includes(value);
}

function isStatus(value: unknown): value is 'Active' | 'Inactive' {
  return (STATUS_VALUES as readonly unknown[]).includes(value);
}

/**
 * option_1~4 중 비어있지 않은 항목이 2개 이상인지 확인한다.
 * DB는 NOT NULL이므로 빈 옵션은 '' 로 저장(허용). 단 최소 2개는 채워져 있어야 한다.
 */
function hasEnoughOptions(input: Record<string, unknown>): boolean {
  const opts = [input.option_1, input.option_2, input.option_3, input.option_4];
  const nonEmpty = opts.filter((o) => typeof o === 'string' && o.trim().length > 0);
  return nonEmpty.length >= 2;
}

/**
 * correct_answer가 가리키는 보기(option_N)가 비어있지 않은지 확인한다.
 * 예: correct_answer='3' 이면 option_3이 비어있지 않아야 한다.
 */
function isCorrectAnswerOptionNonEmpty(
  input: Record<string, unknown>,
  correctAnswer: CorrectAnswer
): boolean {
  const optionKey = `option_${correctAnswer}` as
    | 'option_1'
    | 'option_2'
    | 'option_3'
    | 'option_4';
  const option = input[optionKey];
  return typeof option === 'string' && option.trim().length > 0;
}

/**
 * 문제 생성 입력 검증 (모든 필수 필드 존재 + 값 유효성).
 */
export function validateQuestionCreate(input: unknown): ValidationResult {
  if (!isRecord(input)) {
    return { ok: false, error: '요청 본문이 올바른 형식이 아닙니다.' };
  }

  // chapter_id 필수
  if (!isNonEmptyString(input.chapter_id)) {
    return { ok: false, error: 'chapter_id는 비어있지 않은 문자열이어야 합니다.' };
  }

  // question_text 필수
  if (!isNonEmptyString(input.question_text)) {
    return { ok: false, error: 'question_text는 비어있지 않은 문자열이어야 합니다.' };
  }

  // option_1~4 존재 여부 (string이어야 함 — 빈 값 허용)
  for (const key of ['option_1', 'option_2', 'option_3', 'option_4'] as const) {
    if (typeof input[key] !== 'string') {
      return { ok: false, error: `${key}는 문자열이어야 합니다.` };
    }
  }

  // 최소 2개 보기가 채워져 있어야 함
  if (!hasEnoughOptions(input)) {
    return { ok: false, error: '보기(option_1~4) 중 최소 2개 이상은 비어있지 않아야 합니다.' };
  }

  // correct_answer 필수 + 유효값
  if (!isCorrectAnswer(input.correct_answer)) {
    return {
      ok: false,
      error: `correct_answer는 '1', '2', '3', '4' 중 하나여야 합니다. 현재 값: ${String(input.correct_answer)}`,
    };
  }

  // 정답이 가리키는 보기가 비어있지 않아야 함
  if (!isCorrectAnswerOptionNonEmpty(input, input.correct_answer)) {
    return {
      ok: false,
      error: `correct_answer가 가리키는 option_${input.correct_answer}가 비어있습니다. 정답 보기는 반드시 내용이 있어야 합니다.`,
    };
  }

  // difficulty 필수 + 유효값
  if (!isDifficulty(input.difficulty)) {
    return {
      ok: false,
      error: `difficulty는 'Easy', 'Medium', 'Hard' 중 하나여야 합니다. 현재 값: ${String(input.difficulty)}`,
    };
  }

  // status 필수 + 유효값
  if (!isStatus(input.status)) {
    return {
      ok: false,
      error: `status는 'Active', 'Inactive' 중 하나여야 합니다. 현재 값: ${String(input.status)}`,
    };
  }

  // question_image, explanation: string|null 허용
  if (!isStringOrNull(input.question_image)) {
    return { ok: false, error: 'question_image는 문자열 또는 null이어야 합니다.' };
  }

  if (!isStringOrNull(input.explanation)) {
    return { ok: false, error: 'explanation은 문자열 또는 null이어야 합니다.' };
  }

  return { ok: true };
}

/**
 * 문제 수정 입력 검증 (부분 업데이트 — 제공된 필드만 검증).
 */
export function validateQuestionUpdate(input: unknown): ValidationResult {
  if (!isRecord(input)) {
    return { ok: false, error: '요청 본문이 올바른 형식이 아닙니다.' };
  }

  if (Object.keys(input).length === 0) {
    return { ok: false, error: '수정할 항목이 하나 이상 있어야 합니다.' };
  }

  // chapter_id: 제공된 경우에만 검증
  if ('chapter_id' in input && !isNonEmptyString(input.chapter_id)) {
    return { ok: false, error: 'chapter_id는 비어있지 않은 문자열이어야 합니다.' };
  }

  // question_text: 제공된 경우에만 검증
  if ('question_text' in input && !isNonEmptyString(input.question_text)) {
    return { ok: false, error: 'question_text는 비어있지 않은 문자열이어야 합니다.' };
  }

  // option_1~4: 제공된 경우 string이어야 함
  for (const key of ['option_1', 'option_2', 'option_3', 'option_4'] as const) {
    if (key in input && typeof input[key] !== 'string') {
      return { ok: false, error: `${key}는 문자열이어야 합니다.` };
    }
  }

  // 보기가 제공된 경우: 비어있지 않은 보기가 2개 이상인지 확인
  const hasAnyOption = (['option_1', 'option_2', 'option_3', 'option_4'] as const).some(
    (k) => k in input
  );
  if (hasAnyOption && !hasEnoughOptions(input)) {
    return { ok: false, error: '보기(option_1~4) 중 최소 2개 이상은 비어있지 않아야 합니다.' };
  }

  // correct_answer: 제공된 경우 유효값
  if ('correct_answer' in input) {
    if (!isCorrectAnswer(input.correct_answer)) {
      return {
        ok: false,
        error: `correct_answer는 '1', '2', '3', '4' 중 하나여야 합니다. 현재 값: ${String(input.correct_answer)}`,
      };
    }

    // correct_answer를 수정할 때는, 그 정답이 가리키는 보기(option_N)도 같은 요청에
    // 비어있지 않은 값으로 함께 전달돼야 한다. 그렇지 않으면 DB에 이미 빈 보기를
    // 정답으로 지정하는 무결성 위반이 가능하다(보기 없이 correct_answer만 단독 수정 차단).
    const correctOptionKey = `option_${input.correct_answer}` as const;
    if (!(correctOptionKey in input)) {
      return {
        ok: false,
        error: `correct_answer를 수정하려면 정답 보기 ${correctOptionKey}의 내용도 함께 전달해야 합니다.`,
      };
    }
    if (!isCorrectAnswerOptionNonEmpty(input, input.correct_answer)) {
      return {
        ok: false,
        error: `correct_answer가 가리키는 option_${input.correct_answer}가 비어있습니다. 정답 보기는 반드시 내용이 있어야 합니다.`,
      };
    }
  }

  // difficulty: 제공된 경우 유효값
  if ('difficulty' in input && !isDifficulty(input.difficulty)) {
    return {
      ok: false,
      error: `difficulty는 'Easy', 'Medium', 'Hard' 중 하나여야 합니다. 현재 값: ${String(input.difficulty)}`,
    };
  }

  // status: 제공된 경우 유효값
  if ('status' in input && !isStatus(input.status)) {
    return {
      ok: false,
      error: `status는 'Active', 'Inactive' 중 하나여야 합니다. 현재 값: ${String(input.status)}`,
    };
  }

  // question_image: 제공된 경우 string|null
  if ('question_image' in input && !isStringOrNull(input.question_image)) {
    return { ok: false, error: 'question_image는 문자열 또는 null이어야 합니다.' };
  }

  // explanation: 제공된 경우 string|null
  if ('explanation' in input && !isStringOrNull(input.explanation)) {
    return { ok: false, error: 'explanation은 문자열 또는 null이어야 합니다.' };
  }

  return { ok: true };
}
