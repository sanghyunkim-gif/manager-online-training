import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sign } from 'jsonwebtoken';

const SECRET_KEY = process.env.ADMIN_JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // 환경 변수에서 관리자 계정 정보 가져오기
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return NextResponse.json(
        { success: false, error: '관리자 계정이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 로그인 검증
    if (username === adminUsername && password === adminPassword) {
      // JWT 토큰 생성
      const token = sign(
        { username, role: 'admin', exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, // 24시간
        SECRET_KEY
      );

      // 쿠키에 토큰 저장
      const cookieStore = await cookies();
      cookieStore.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24시간
        path: '/',
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: '아이디 또는 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('관리자 로그인 오류:', error);
    return NextResponse.json(
      { success: false, error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
