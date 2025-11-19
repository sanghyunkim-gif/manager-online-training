import { NextRequest, NextResponse } from 'next/server';
import { updateChapter } from '@/lib/airtable/chapters';
import type { ApiResponse } from '@/types';

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

    // Airtable 업데이트
    const updated = await updateChapter(chapterId, updates);
    return NextResponse.json({
      success: true,
      data: updated,
    } as ApiResponse);
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
