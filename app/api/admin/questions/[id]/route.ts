import { NextRequest, NextResponse } from 'next/server';
import {
  updateQuestion,
  softDeleteQuestion,
  hardDeleteQuestion,
} from '@/lib/supabase/questions';
import { validateQuestionUpdate } from '@/lib/validation/question';
import type { ApiResponse } from '@/types';
import { isAdminAuthenticated } from '@/lib/auth/admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { success: false, error: '관리자 인증이 필요합니다.' } as ApiResponse,
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '문제 ID가 필요합니다.' } as ApiResponse,
        { status: 400 }
      );
    }

    const body: unknown = await request.json();
    const validation = validateQuestionUpdate(body);

    if (!validation.ok) {
      return NextResponse.json(
        { success: false, error: validation.error } as ApiResponse,
        { status: 400 }
      );
    }

    const updates = body as Parameters<typeof updateQuestion>[1];
    const question = await updateQuestion(id, updates);

    return NextResponse.json({ success: true, data: question } as ApiResponse);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '문제를 수정할 수 없습니다.';

    return NextResponse.json(
      { success: false, error: message } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { success: false, error: '관리자 인증이 필요합니다.' } as ApiResponse,
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '문제 ID가 필요합니다.' } as ApiResponse,
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    if (mode === 'hard') {
      const success = await hardDeleteQuestion(id);

      if (!success) {
        return NextResponse.json(
          { success: false, error: '문제를 삭제할 수 없습니다.' } as ApiResponse,
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true } as ApiResponse);
    }

    // 기본: soft delete (비활성화)
    const question = await softDeleteQuestion(id);

    return NextResponse.json({ success: true, data: question } as ApiResponse);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '문제를 삭제할 수 없습니다.';

    return NextResponse.json(
      { success: false, error: message } as ApiResponse,
      { status: 500 }
    );
  }
}
