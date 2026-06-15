import { NextRequest, NextResponse } from 'next/server';
import {
  getUserProgress,
  completeChapter,
  getAllUserProgress,
  hasPassedChapterQuiz,
} from '@/lib/supabase/progress';
import { getActiveChapters } from '@/lib/supabase/chapters';
import { completeUser } from '@/lib/supabase/users';
import type { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, chapterId } = body;

    if (!userId || !chapterId) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' } as ApiResponse,
        { status: 400 }
      );
    }

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '챕터 완료 처리를 할 수 없습니다.';

    return NextResponse.json(
      { success: false, error: message } as ApiResponse,
      { status: 500 }
    );
  }
}
