/**
 * 챕터 입력 필드 허용 목록(allowlist) 헬퍼.
 * 요청 본문에서 편집 가능한 필드만 추출해 mass assignment를 방지한다.
 * (id/created_at/updated_at 등 클라이언트가 임의 조작하면 안 되는 필드 차단)
 * questions_count(출제 수)는 어드민이 챕터 편집 시 조정 가능하므로 허용 목록에 포함된다.
 * (이 헬퍼는 isAdminAuthenticated 가드가 걸린 어드민 API에서만 사용됨)
 */
import type { DbChapter } from '@/lib/supabase/chapters';

// 클라이언트가 생성·수정 시 전달 가능한 챕터 필드만 정의한다.
export type ChapterWritableInput = Partial<
  Pick<
    DbChapter,
    | 'name'
    | 'order'
    | 'video_url'
    | 'video_duration'
    | 'required_watch_percentage'
    | 'description'
    | 'questions_count'
    | 'status'
  >
>;

const ALLOWED_CHAPTER_FIELDS = [
  'name',
  'order',
  'video_url',
  'video_duration',
  'required_watch_percentage',
  'description',
  'questions_count',
  'status',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 요청 본문에서 허용된 챕터 필드만 골라 새 객체로 반환한다.
 * 허용 목록에 없는 키(예: id, created_at, updated_at)는 모두 제거된다.
 * 값 자체의 타입 검증은 호출부(POST 필수 검증) 및 DB 제약(CHECK)에 위임한다.
 */
export function pickChapterFields(body: unknown): ChapterWritableInput {
  if (!isRecord(body)) {
    return {};
  }

  const result: ChapterWritableInput = {};
  for (const key of ALLOWED_CHAPTER_FIELDS) {
    if (key in body) {
      // 허용된 키만 복사. 값 검증은 상위 레이어/DB 제약이 담당.
      (result as Record<string, unknown>)[key] = body[key];
    }
  }
  return result;
}

/**
 * 출제 수(questions_count) 값을 검증한다.
 * 1 이상의 정수가 아니면 에러 메시지를, 유효하면 null을 반환한다.
 * 학습자 퀴즈는 활성 문제 풀에서 이 수만큼 무작위로 출제되므로 최소 1이어야 한다.
 */
export function validateQuestionsCount(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    return '출제 수는 1 이상의 정수여야 합니다.';
  }
  return null;
}
