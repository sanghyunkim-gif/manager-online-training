import { NextRequest, NextResponse, after } from 'next/server';
import { completeUser, getUserBySessionToken } from '@/lib/supabase/users';
import { getAllUserProgress } from '@/lib/supabase/progress';
import { getActiveChapters } from '@/lib/supabase/chapters';
import { fireCompletionWebhookIfPending } from '@/lib/invite/webhook';
import type { ApiResponse } from '@/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // X-Session-Token 헤더로 사용자를 식별한다. body.userId는 인증 권위값으로 사용하지 않는다.
  const sessionToken = request.headers.get('X-Session-Token') ?? '';
  const authUser = await getUserBySessionToken(sessionToken);
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: 'unauthorized' } as ApiResponse,
      { status: 401 }
    );
  }

  // authUser.id를 권위값으로 사용. body.userId 무시.
  const userId = authUser.id;

  try {
    const [allChapters, allProgress] = await Promise.all([
      getActiveChapters(),
      getAllUserProgress(userId),
    ]);

    const totalChapters = allChapters.length;
    const completedChapters = allProgress.filter(
      (p) => p.chapter_completed
    ).length;

    if (completedChapters < totalChapters) {
      return NextResponse.json(
        {
          success: false,
          error: '모든 챕터를 완료해야 합니다.',
          completedChapters,
          totalChapters,
        } as ApiResponse,
        { status: 403 }
      );
    }

    await completeUser(userId);
    after(() => fireCompletionWebhookIfPending(userId));

    return NextResponse.json({
      success: true,
      message: '모든 과정을 완료했습니다!',
    } as ApiResponse);
  } catch (err: unknown) {
    // 내부 오류는 서버 로그에만 기록하고 클라이언트에는 generic 메시지 반환
    console.error('[POST /api/complete] 완료 처리 실패:', err instanceof Error ? err.message : err, { userId });
    return NextResponse.json(
      {
        success: false,
        error: '처리 중 오류가 발생했습니다.',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
