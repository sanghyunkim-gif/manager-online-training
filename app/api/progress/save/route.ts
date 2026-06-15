import { NextRequest, NextResponse } from 'next/server';
import {
  getUserProgress,
  createProgress,
  updateVideoWatchTime,
} from '@/lib/supabase/progress';
import { getRandomQuestions } from '@/lib/supabase/questions';
import { getChapterById } from '@/lib/supabase/chapters';
import type { ApiResponse } from '@/types';

const DEFAULT_REQUIRED_PERCENTAGE = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, chapterId, watchTime } = body;

    if (!userId || !chapterId) {
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
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '진행 상황을 저장할 수 없습니다.';

    return NextResponse.json(
      { success: false, error: message } as ApiResponse,
      { status: 500 }
    );
  }
}
