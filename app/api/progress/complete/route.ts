import { NextRequest, NextResponse } from 'next/server';
import {
  getUserProgress,
  completeChapter,
  createProgress,
  getAllUserProgress,
} from '@/lib/supabase/progress';
import { getRandomQuestions } from '@/lib/supabase/questions';
import { getActiveChapters } from '@/lib/supabase/chapters';
import { completeUser } from '@/lib/supabase/users';
import type { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, chapterId } = body;

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
      {
        success: false,
        error: message,
      } as ApiResponse,
      { status: 500 }
    );
  }
}
