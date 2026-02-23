import { NextRequest, NextResponse } from 'next/server';
import {
  getUserProgress,
  createProgress,
  updateVideoWatchTime,
} from '@/lib/supabase/progress';
import { getRandomQuestions } from '@/lib/supabase/questions';
import type { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, chapterId, watchTime, isWatched } = body;

    if (!userId || !chapterId) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 정보가 누락되었습니다.',
        } as ApiResponse,
        { status: 400 }
      );
    }

    let progress = await getUserProgress(userId, chapterId);

    if (!progress) {
      const questions = await getRandomQuestions(chapterId, 5);
      const questionIds = questions.map((q) => q.id);
      progress = await createProgress(userId, chapterId, questionIds);
    }

    if (watchTime !== undefined) {
      await updateVideoWatchTime(progress.id, watchTime, isWatched || false);
    }

    return NextResponse.json({
      success: true,
      data: { progressId: progress.id },
    } as ApiResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '진행 상황을 저장할 수 없습니다.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      } as ApiResponse,
      { status: 500 }
    );
  }
}
