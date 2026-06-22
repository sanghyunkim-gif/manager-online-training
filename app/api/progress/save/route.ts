import { NextRequest, NextResponse } from 'next/server';
import {
  getUserProgress,
  createProgress,
  updateVideoWatchTime,
} from '@/lib/supabase/progress';
import { getRandomQuestions } from '@/lib/supabase/questions';
import { getChapterById } from '@/lib/supabase/chapters';
import { getUserBySessionToken } from '@/lib/supabase/users';
import type { ApiResponse } from '@/types';

export const runtime = 'nodejs';

const DEFAULT_REQUIRED_PERCENTAGE = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  // X-Session-Token 헤더로 사용자를 식별한다. body.userId는 신뢰하지 않는다(IDOR 방어).
  const sessionToken = request.headers.get('X-Session-Token') ?? '';
  const authUser = await getUserBySessionToken(sessionToken);
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: 'unauthorized' } as ApiResponse,
      { status: 401 }
    );
  }
  const userId = authUser.id;

  try {
    const body = await request.json();
    const { chapterId, watchTime } = body;

    if (!chapterId) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' } as ApiResponse,
        { status: 400 }
      );
    }

    const chapter = await getChapterById(chapterId);
    if (!chapter) {
      return NextResponse.json(
        { success: false, error: '챕터를 찾을 수 없습니다.' } as ApiResponse,
        { status: 404 }
      );
    }

    let progress = await getUserProgress(userId, chapterId);

    if (!progress) {
      const questions = await getRandomQuestions(
        chapterId,
        chapter.questions_count
      );
      const questionIds = questions.map((q) => q.id);
      progress = await createProgress(userId, chapterId, questionIds);
    }

    if (watchTime !== undefined) {
      // 클라이언트가 보낸 isWatched 는 신뢰하지 않고 서버에서 재계산한다.
      const duration = chapter.video_duration;
      const required =
        chapter.required_watch_percentage || DEFAULT_REQUIRED_PERCENTAGE;
      const safeWatchTime =
        duration > 0 ? Math.min(Math.max(watchTime, 0), duration) : 0;
      const watchedPercentage =
        duration > 0 ? (safeWatchTime / duration) * 100 : 0;
      const serverIsWatched = watchedPercentage >= required;

      await updateVideoWatchTime(progress.id, safeWatchTime, serverIsWatched);
    }

    return NextResponse.json({
      success: true,
      data: { progressId: progress.id },
    } as ApiResponse);
  } catch (err: unknown) {
    // 내부 오류는 서버 로그에만 기록하고 클라이언트에는 generic 메시지 반환
    console.error(
      '[POST /api/progress/save] 진행 저장 실패:',
      err instanceof Error ? err.message : err,
      { userId }
    );
    return NextResponse.json(
      { success: false, error: '처리 중 오류가 발생했습니다.' } as ApiResponse,
      { status: 500 }
    );
  }
}
