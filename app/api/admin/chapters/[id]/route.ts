import { NextRequest, NextResponse } from 'next/server';
import { updateChapter, deleteChapter } from '@/lib/supabase/chapters';
import type { ApiResponse } from '@/types';
import type { DbChapter } from '@/lib/supabase/chapters';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import { pickChapterFields, validateQuestionsCount } from '@/lib/validation/chapter';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<DbChapter>>> {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { success: false, error: '관리자 인증이 필요합니다.' } as ApiResponse<DbChapter>,
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '챕터 ID가 필요합니다.' } as ApiResponse<DbChapter>,
        { status: 400 }
      );
    }

    const body: unknown = await request.json();

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { success: false, error: '요청 본문이 올바른 형식이 아닙니다.' } as ApiResponse<DbChapter>,
        { status: 400 }
      );
    }

    // mass assignment 방지: 허용된 필드만 추출 (id/created_at/updated_at 등 차단)
    const updates = pickChapterFields(body);

    // 출제 수가 포함된 경우 값 검증 (1 이상 정수)
    if ('questions_count' in updates) {
      const qcError = validateQuestionsCount(updates.questions_count);
      if (qcError) {
        return NextResponse.json(
          { success: false, error: qcError } as ApiResponse<DbChapter>,
          { status: 400 }
        );
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: '수정할 항목이 하나 이상 있어야 합니다.' } as ApiResponse<DbChapter>,
        { status: 400 }
      );
    }

    const chapter = await updateChapter(id, updates);

    return NextResponse.json({ success: true, data: chapter } as ApiResponse<DbChapter>);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '챕터를 수정할 수 없습니다.';

    return NextResponse.json(
      { success: false, error: message } as ApiResponse<DbChapter>,
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<DbChapter>>> {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { success: false, error: '관리자 인증이 필요합니다.' } as ApiResponse<DbChapter>,
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '챕터 ID가 필요합니다.' } as ApiResponse<DbChapter>,
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    if (mode === 'hard') {
      // 하드 삭제: CASCADE로 문제·진행기록 동반 삭제
      const success = await deleteChapter(id);

      if (!success) {
        return NextResponse.json(
          { success: false, error: '챕터를 삭제할 수 없습니다.' } as ApiResponse<DbChapter>,
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true } as ApiResponse<DbChapter>);
    }

    // 기본: soft delete (비활성화)
    const chapter = await updateChapter(id, { status: 'Inactive' });

    return NextResponse.json({ success: true, data: chapter } as ApiResponse<DbChapter>);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '챕터를 삭제할 수 없습니다.';

    return NextResponse.json(
      { success: false, error: message } as ApiResponse<DbChapter>,
      { status: 500 }
    );
  }
}
