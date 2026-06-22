import { NextRequest, NextResponse, after } from 'next/server';
import {
  getUserProgress,
  completeChapter,
  getAllUserProgress,
  hasPassedChapterQuiz,
} from '@/lib/supabase/progress';
import { getActiveChapters } from '@/lib/supabase/chapters';
import { completeUser, getUserBySessionToken } from '@/lib/supabase/users';
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: '요청 본문을 파싱할 수 없습니다.' } as ApiResponse,
      { status: 400 }
    );
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('chapterId' in body) ||
    typeof (body as Record<string, unknown>).chapterId !== 'string' ||
    !(body as Record<string, unknown>).chapterId
  ) {
    return NextResponse.json(
      { success: false, error: 'chapterId가 누락되었습니다.' } as ApiResponse,
      { status: 400 }
    );
  }

  const chapterId = (body as Record<string, unknown>).chapterId as string;

  try {
    // 클라이언트가 보낸 완료 결과를 신뢰하지 않고 서버에서 직접 검증한다.
    const progress = await getUserProgress(userId, chapterId);

    if (!progress) {
      return NextResponse.json(
        { success: false, error: '해당 챕터를 시작하지 않았습니다.' } as ApiResponse,
        { status: 403 }
      );
    }

    if (!progress.video_watched) {
      return NextResponse.json(
        { success: false, error: '영상 시청을 먼저 완료해야 합니다.' } as ApiResponse,
        { status: 403 }
      );
    }

    const passed = await hasPassedChapterQuiz(userId, chapterId);
    if (!passed) {
      return NextResponse.json(
        {
          success: false,
          error: '퀴즈를 모두 맞혀야 챕터를 완료할 수 있습니다.',
        } as ApiResponse,
        { status: 403 }
      );
    }

    await completeChapter(progress.id, true);

    const [allChapters, allProgress] = await Promise.all([
      getActiveChapters(),
      getAllUserProgress(userId),
    ]);

    const totalChapters = allChapters.length;
    const completedChapters = allProgress.filter(
      (p) => p.chapter_completed
    ).length;

    if (completedChapters === totalChapters) {
      await completeUser(userId);
      after(() => fireCompletionWebhookIfPending(userId));

      return NextResponse.json({
        success: true,
        message: '모든 챕터를 완료했습니다! 축하합니다!',
        allCompleted: true,
      } as ApiResponse);
    }

    return NextResponse.json({
      success: true,
      message: '챕터가 완료되었습니다.',
      allCompleted: false,
    } as ApiResponse);
  } catch (err: unknown) {
    // 내부 오류는 서버 로그에만 기록하고 클라이언트에는 generic 메시지 반환
    console.error('[POST /api/progress/complete] 챕터 완료 처리 실패:', err instanceof Error ? err.message : err, { userId, chapterId });
    return NextResponse.json(
      { success: false, error: '처리 중 오류가 발생했습니다.' } as ApiResponse,
      { status: 500 }
    );
  }
}
