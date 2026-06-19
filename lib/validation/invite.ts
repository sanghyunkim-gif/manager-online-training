/**
 * 초대 API 입력 서버 검증 헬퍼.
 * zod 미설치 환경이므로 unknown + type guard 패턴으로 수동 구현 (question.ts 패턴 참조).
 */

// 길이 제한 상수 (매직 넘버 금지)
const MAX_APPLICANT_ID_LEN = 256;
const MAX_CALLBACK_URL_LEN = 2048;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

/**
 * SSRF 방어: callbackUrl이 내부망/루프백/링크로컬/메타데이터 주소인지 검사한다.
 * 호스트명 기반 차단이라 DNS rebinding까지 막지는 못한다(INVITE_API_KEY 보유 호출자 한정 +
 * v1.1에서 resolve된 IP 검증 예정). 169.254.0.0/16에 클라우드 메타데이터(169.254.169.254)가 포함된다.
 */
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[/, '').replace(/\]$/, '');
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host === '0.0.0.0' || host === '::1' || host === '::') return true;
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (/^(fc|fd)/.test(host)) return true; // IPv6 ULA
  if (host.startsWith('fe80')) return true; // IPv6 링크로컬
  return false;
}

/**
 * POST /api/invite 요청 본문 검증.
 * applicantId: 비어있지 않은 string, 256자 이하.
 * callbackUrl: URL 파싱 가능 + http: 또는 https: 프로토콜만 허용, 2048자 이하.
 * name, phone: 옵셔널 string.
 */
export function validateInviteCreate(input: unknown):
  | { ok: true; value: { applicantId: string; callbackUrl: string; name?: string; phone?: string } }
  | { ok: false; error: string } {
  if (!isRecord(input)) {
    return { ok: false, error: '요청 본문이 올바른 형식이 아닙니다.' };
  }

  if (!isNonEmptyString(input.applicantId)) {
    return { ok: false, error: 'applicantId는 비어있지 않은 문자열이어야 합니다.' };
  }

  if ((input.applicantId as string).length > MAX_APPLICANT_ID_LEN) {
    return { ok: false, error: `applicantId는 ${MAX_APPLICANT_ID_LEN}자를 초과할 수 없습니다.` };
  }

  if (!isNonEmptyString(input.callbackUrl)) {
    return { ok: false, error: 'callbackUrl은 비어있지 않은 문자열이어야 합니다.' };
  }

  if ((input.callbackUrl as string).length > MAX_CALLBACK_URL_LEN) {
    return { ok: false, error: `callbackUrl은 ${MAX_CALLBACK_URL_LEN}자를 초과할 수 없습니다.` };
  }

  // URL 파싱 및 프로토콜 검증
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(input.callbackUrl as string);
  } catch {
    return { ok: false, error: 'callbackUrl이 유효한 URL 형식이 아닙니다.' };
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return { ok: false, error: 'callbackUrl은 http 또는 https 프로토콜만 허용됩니다.' };
  }

  // SSRF 방어: 내부망/루프백/링크로컬/메타데이터 주소 차단(호스트명 기반)
  if (isBlockedHost(parsedUrl.hostname)) {
    return { ok: false, error: 'callbackUrl에 내부망 주소는 사용할 수 없습니다.' };
  }

  if (!isOptionalString(input.name)) {
    return { ok: false, error: 'name은 문자열이어야 합니다.' };
  }

  if (!isOptionalString(input.phone)) {
    return { ok: false, error: 'phone은 문자열이어야 합니다.' };
  }

  return {
    ok: true,
    value: {
      applicantId: (input.applicantId as string).trim(),
      callbackUrl: input.callbackUrl as string,
      ...(input.name !== undefined ? { name: input.name as string } : {}),
      ...(input.phone !== undefined ? { phone: input.phone as string } : {}),
    },
  };
}

/**
 * POST /api/invite/verify 요청 본문 검증.
 * token: 비어있지 않은 string.
 */
export function validateInviteVerify(input: unknown):
  | { ok: true; value: { token: string } }
  | { ok: false; error: string } {
  if (!isRecord(input)) {
    return { ok: false, error: '요청 본문이 올바른 형식이 아닙니다.' };
  }

  if (!isNonEmptyString(input.token)) {
    return { ok: false, error: 'token은 비어있지 않은 문자열이어야 합니다.' };
  }

  return { ok: true, value: { token: (input.token as string).trim() } };
}
