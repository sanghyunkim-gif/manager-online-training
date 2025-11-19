import { NextRequest, NextResponse } from 'next/server';
import {
  getUserProgress,
  createProgress,
  updateVideoWatchTime,
} from '@/lib/airtable/progress';
import { getRandomQuestions } from '@/lib/airtable/questions';
import type { ApiResponse } from '@/types';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

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

    if (USE_MOCK) {
      // Mock 모드에서는 간단히 성공 응답
      return NextResponse.json({
        success: true,
        data: { progressId: `progress_${userId}_${chapterId}` },
      } as ApiResponse);
    }

    // 기존 진행 상황 확인
    let progress = await getUserProgress(userId, chapterId);

    if (!progress) {
      // 진행 상황이 없으면 새로 생성
      console.log('⚠️  기존 progress 없음 - 새로 생성합니다');
      console.log('User ID:', userId);
      console.log('Chapter ID:', chapterId);

      // 문제 배정도 함께 수행
      const questions = await getRandomQuestions(chapterId, 5); // 임시로 5개
      const questionIds = questions.map((q) => q.id);

      progress = await createProgress(userId, chapterId, questionIds);
      console.log('✅ 새 progress 생성 완료:', progress.id);
    } else {
      console.log('✓ 기존 progress 찾음:', progress.id);
    }

    // 영상 시청 시간 업데이트
    if (watchTime !== undefined) {
      await updateVideoWatchTime(progress.id, watchTime, isWatched || false);
    }

    return NextResponse.json({
      success: true,
      data: { progressId: progress.id },
    } as ApiResponse);
  } catch (error: any) {
    console.error('진행 상황 저장 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || '진행 상황을 저장할 수 없습니다.',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
