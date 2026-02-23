import { NextRequest, NextResponse } from 'next/server';
import { completeUser } from '@/lib/supabase/users';
import { getAllUserProgress } from '@/lib/supabase/progress';
import { getActiveChapters } from '@/lib/supabase/chapters';
import type { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: '사용자 ID가 필요합니다.',
        } as ApiResponse,
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      message: '모든 과정을 완료했습니다!',
    } as ApiResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '완료 처리를 할 수 없습니다.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      } as ApiResponse,
      { status: 500 }
    );
  }
}
