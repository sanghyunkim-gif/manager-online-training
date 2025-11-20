import { NextRequest, NextResponse } from 'next/server';
import { completeUser } from '@/lib/airtable/users';
import { getAllUserProgress } from '@/lib/airtable/progress';
import { getActiveChapters } from '@/lib/airtable/chapters';
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

    console.log('완료 처리 요청:', { userId });

    // 모든 챕터를 완료했는지 확인
    const [allChapters, allProgress] = await Promise.all([
      getActiveChapters(),
      getAllUserProgress(userId),
    ]);

    const totalChapters = allChapters.length;
    const completedChapters = allProgress.filter(
      (p) => p.fields.Chapter_Completed
    ).length;

    console.log('완료 상태 확인:', {
      userId,
      totalChapters,
      completedChapters,
    });

    // 모든 챕터를 완료하지 않았다면 거부
    if (completedChapters < totalChapters) {
      console.warn('⚠️  모든 챕터를 완료하지 않은 사용자의 완료 시도:', {
        userId,
        completedChapters,
        totalChapters,
      });

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

    // 사용자 완료 처리
    await completeUser(userId);

    console.log('✅ 완료 처리 성공:', { userId });

    return NextResponse.json({
      success: true,
      message: '모든 과정을 완료했습니다!',
    } as ApiResponse);
  } catch (error: any) {
    console.error('완료 처리 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || '완료 처리를 할 수 없습니다.',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
