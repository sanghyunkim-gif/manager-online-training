import { NextRequest, NextResponse } from 'next/server';
import { getAllUserProgress } from '@/lib/supabase/progress';
import { getUserBySessionToken } from '@/lib/supabase/users';
import type { ApiResponse } from '@/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest): Promise<NextResponse> {
  // X-Session-Token 헤더로 사용자를 식별한다. query의 userId는 신뢰하지 않는다(IDOR 방어).
  const sessionToken = request.headers.get('X-Session-Token') ?? '';
  const authUser = await getUserBySessionToken(sessionToken);
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: 'unauthorized' } as ApiResponse,
      { status: 401 }
    );
  }

  try {
    const progressList = await getAllUserProgress(authUser.id);

    return NextResponse.json({
      success: true,
      data: progressList,
    } as ApiResponse);
  } catch (err: unknown) {
    // 내부 오류는 서버 로그에만 기록하고 클라이언트에는 generic 메시지 반환
    console.error(
      '[GET /api/progress/get] 진행 조회 실패:',
      err instanceof Error ? err.message : err,
      { userId: authUser.id }
    );
    return NextResponse.json(
      { success: false, error: '처리 중 오류가 발생했습니다.' } as ApiResponse,
      { status: 500 }
    );
  }
}
