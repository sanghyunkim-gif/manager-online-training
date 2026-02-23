import { NextRequest, NextResponse } from 'next/server';
import { getRandomQuestions } from '@/lib/supabase/questions';
import { getChapterById } from '@/lib/supabase/chapters';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');

    if (!chapterId) {
      return NextResponse.json(
        {
          success: false,
          error: '챕터 ID가 필요합니다.',
        } as ApiResponse,
        { status: 400 }
      );
    }

    const chapter = await getChapterById(chapterId);
    if (!chapter) {
      return NextResponse.json(
        {
          success: false,
          error: '챕터를 찾을 수 없습니다.',
        } as ApiResponse,
        { status: 404 }
      );
    }

    const questions = await getRandomQuestions(chapterId, chapter.questions_count);

    if (questions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '문제가 없습니다. 문제를 추가해주세요.',
        } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: questions,
    } as ApiResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '문제를 불러올 수 없습니다.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      } as ApiResponse,
      { status: 500 }
    );
  }
}
