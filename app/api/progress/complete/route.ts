import { NextRequest, NextResponse } from 'next/server';
import {
  getUserProgress,
  completeChapter,
  createProgress,
  getAllUserProgress,
} from '@/lib/airtable/progress';
import { getRandomQuestions } from '@/lib/airtable/questions';
import { getActiveChapters } from '@/lib/airtable/chapters';
import { completeUser } from '@/lib/airtable/users';
import type { ApiResponse } from '@/types';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

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

    if (USE_MOCK) {
      // Mock 모드에서는 간단히 성공 응답
      return NextResponse.json({
        success: true,
        message: '챕터가 완료되었습니다.',
      } as ApiResponse);
    }

    // 진행 상황 확인
    let progress = await getUserProgress(userId, chapterId);

    if (!progress) {
      // 진행 상황이 없으면 생성
      const questions = await getRandomQuestions(chapterId, 5);
      const questionIds = questions.map((q) => q.id);
      progress = await createProgress(userId, chapterId, questionIds);
    }

    // 챕터 완료 처리
    await completeChapter(progress.id, true);

    console.log('챕터 완료 처리 완료:', { userId, chapterId });

    // 모든 챕터를 완료했는지 확인
    const [allChapters, allProgress] = await Promise.all([
      getActiveChapters(),
      getAllUserProgress(userId),
    ]);

    const totalChapters = allChapters.length;
    const completedChapters = allProgress.filter(
      (p) => p.fields.Chapter_Completed
    ).length;

    console.log('완료 체크:', {
      totalChapters,
      completedChapters,
      userId,
    });

    // 모든 챕터를 완료했다면 사용자 완료 처리
    if (completedChapters === totalChapters) {
      console.log('모든 챕터 완료! 사용자 완료 처리 시작:', { userId });
      await completeUser(userId);
      console.log('사용자 완료 처리 완료:', { userId });

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
  } catch (error: any) {
    console.error('챕터 완료 처리 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || '챕터 완료 처리를 할 수 없습니다.',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
