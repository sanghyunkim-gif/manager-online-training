import { NextRequest, NextResponse } from 'next/server';
import { updateMockChapter } from '@/lib/mock-data';
import { updateChapter } from '@/lib/airtable/chapters';
import type { ApiResponse } from '@/types';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapterId, updates } = body;

    if (!chapterId || !updates) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 정보가 누락되었습니다.',
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (USE_MOCK) {
      // Mock 모드에서는 메모리의 챕터 데이터 업데이트
      const updated = updateMockChapter(chapterId, updates);
      if (!updated) {
        return NextResponse.json(
          {
            success: false,
            error: '챕터를 찾을 수 없습니다.',
          } as ApiResponse,
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: updated,
      } as ApiResponse);
    } else {
      // 실제 Airtable 업데이트
      const updated = await updateChapter(chapterId, updates);
      return NextResponse.json({
        success: true,
        data: updated,
      } as ApiResponse);
    }
  } catch (error: any) {
    console.error('챕터 수정 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || '챕터를 수정할 수 없습니다.',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
