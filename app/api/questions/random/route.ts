import { NextRequest, NextResponse } from 'next/server';
import { getRandomQuestions } from '@/lib/airtable/questions';
import { getChapterById } from '@/lib/airtable/chapters';
import {
  mockChapters,
  getMockQuestionsByChapter,
} from '@/lib/mock-data';
import type { ApiResponse } from '@/types';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

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

    let questions;

    if (USE_MOCK) {
      // Mock 데이터 사용
      const chapter = mockChapters.find((c) => c.id === chapterId);
      if (!chapter) {
        return NextResponse.json(
          {
            success: false,
            error: '챕터를 찾을 수 없습니다.',
          } as ApiResponse,
          { status: 404 }
        );
      }

      const allQuestions = getMockQuestionsByChapter(chapterId);
      // 랜덤하게 섞기
      questions = allQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, chapter.fields.Questions_Count);
    } else {
      // 실제 Airtable 사용
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

      questions = await getRandomQuestions(
        chapterId,
        chapter.fields.Questions_Count
      );
    }

    if (questions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '문제가 없습니다. Airtable에 문제를 추가해주세요.',
        } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: questions,
    } as ApiResponse);
  } catch (error: any) {
    console.error('문제 조회 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || '문제를 불러올 수 없습니다.',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
