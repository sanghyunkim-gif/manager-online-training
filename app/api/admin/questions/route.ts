import { NextRequest, NextResponse } from 'next/server';
import {
  getAllQuestionsAdmin,
  getQuestionsByChapterAdmin,
  createQuestion,
} from '@/lib/supabase/questions';
import { validateQuestionCreate } from '@/lib/validation/question';
import type { ApiResponse } from '@/types';
import { isAdminAuthenticated } from '@/lib/auth/admin';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { success: false, error: '관리자 인증이 필요합니다.' } as ApiResponse,
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');

    const questions = chapterId
      ? await getQuestionsByChapterAdmin(chapterId)
      : await getAllQuestionsAdmin();

    return NextResponse.json({ success: true, data: questions } as ApiResponse);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '문제 목록을 불러올 수 없습니다.';

    return NextResponse.json(
      { success: false, error: message } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { success: false, error: '관리자 인증이 필요합니다.' } as ApiResponse,
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const validation = validateQuestionCreate(body);

    if (!validation.ok) {
      return NextResponse.json(
        { success: false, error: validation.error } as ApiResponse,
        { status: 400 }
      );
    }

    // validation 통과 후 body를 QuestionCreateInput으로 안전하게 추출
    if (
      typeof body !== 'object' ||
      body === null
    ) {
      return NextResponse.json(
        { success: false, error: '요청 본문이 올바른 형식이 아닙니다.' } as ApiResponse,
        { status: 400 }
      );
    }

    const input = body as Parameters<typeof createQuestion>[0];
    const question = await createQuestion(input);

    return NextResponse.json({ success: true, data: question } as ApiResponse, {
      status: 201,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '문제를 생성할 수 없습니다.';

    return NextResponse.json(
      { success: false, error: message } as ApiResponse,
      { status: 500 }
    );
  }
}
