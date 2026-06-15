import { cookies } from 'next/headers';
import { sign, verify } from 'jsonwebtoken';

const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24; // 24시간

/**
 * 관리자 JWT 서명/검증에 사용하는 시크릿을 반환한다.
 * 하드코딩 fallback 없이, 환경변수 미설정 시 즉시 throw 한다(fail-closed).
 * 공개된 기본값으로 토큰이 위조되는 것을 원천 차단한다.
 */
export function getAdminSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error(
      'ADMIN_JWT_SECRET 환경변수가 설정되지 않았습니다. 관리자 인증을 사용할 수 없습니다.'
    );
  }
  return secret;
}

/** 관리자 로그인 토큰을 발급한다. */
export function signAdminToken(username: string): string {
  return sign(
    {
      username,
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + TOKEN_MAX_AGE_SECONDS,
    },
    getAdminSecret()
  );
}

/**
 * 요청 쿠키의 admin-token 을 검증해 인증 여부를 반환한다.
 * 모든 /api/admin/* 데이터·변경 라우트의 진입 가드로 사용한다.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token');
  if (!token) {
    return false;
  }

  try {
    verify(token.value, getAdminSecret());
    return true;
  } catch {
    return false;
  }
}

export const ADMIN_TOKEN_MAX_AGE = TOKEN_MAX_AGE_SECONDS;
