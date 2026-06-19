/**
 * 초대 토큰 암호화 유틸리티. node:crypto만 사용 (Edge runtime 비호환 — nodejs runtime 필수).
 */
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

/**
 * 256비트(32바이트) 무작위 초대 토큰을 base64url 형식으로 생성한다.
 * URL 안전 문자만 포함되어 쿼리 파라미터로 바로 사용 가능하다.
 */
export function generateInviteToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * 토큰을 SHA-256 해시로 변환해 반환한다(hex 인코딩).
 * DB에는 평문 토큰이 아닌 이 해시만 저장한다.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * 두 문자열을 상수 시간(constant-time)으로 비교해 타이밍 어택을 방지한다.
 * 두 입력을 동일 길이의 SHA-256 다이제스트로 변환한 뒤 비교하므로 길이 정보도 노출하지 않는다.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  const ah = createHash('sha256').update(a).digest();
  const bh = createHash('sha256').update(b).digest();
  return timingSafeEqual(ah, bh);
}
