import { NextRequest, NextResponse } from 'next/server';
import { createChapter } from '@/lib/supabase/chapters';
import { countActiveQuestionsByChapter } from '@/lib/supabase/questions';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';
import type { ApiResponse } from '@/types';
import type { DbChapter } from '@/lib/supabase/chapters';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import { pickChapterFields } from '@/lib/validation/chapter';

interface AdminChaptersResponse {
  chapters: DbChapter[];
  questionCounts: Record<string, number>;
}

export async function GET(
  _request: NextRequest
): Promise<NextResponse<ApiResponse<AdminChaptersResponse>>> {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { success: false, error: '관리자 인증이 필요합니다.' } as ApiResponse<AdminChaptersResponse>,
        { status: 401 }
      );
    }

    // 어드민은 Active+Inactive 모두 조회 (getActiveChapters는 Active만 반환하므로 인라인 조회)
    const { data: chapters, error } = await supabase
      .from('chapters')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      throw new Error('챕터 목록을 불러올 수 없습니다.');
    }

    const questionCounts = await countActiveQuestionsByChapter();

    return NextResponse.json({
      success: true,
      data: { chapters, questionCounts },
    } as ApiResponse<AdminChaptersResponse>);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '챕터 목록을 불러올 수 없습니다.';

    return NextResponse.json(
      { success: false, error: message } as ApiResponse<AdminChaptersResponse>,
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<DbChapter>>> {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { success: false, error: '관리자 인증이 필요합니다.' } as ApiResponse<DbChapter>,
        { status: 401 }
      );
    }

    const body: unknown = await request.json();

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { success: false, error: '요청 본문이 올바른 형식이 아닙니다.' } as ApiResponse<DbChapter>,
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;

    // 필수 필드 검증
    if (typeof input.name !== 'string' || input.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'name은 비어있지 않은 문자열이어야 합니다.' } as ApiResponse<DbChapter>,
        { status: 400 }
      );
    }

    if (typeof input.video_url !== 'string' || input.video_url.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'video_url은 비어있지 않은 문자열이어야 합니다.' } as ApiResponse<DbChapter>,
        { status: 400 }
      );
    }

    if (typeof input.order !== 'number') {
      return NextResponse.json(
        { success: false, error: 'order는 숫자여야 합니다.' } as ApiResponse<DbChapter>,
        { status: 400 }
      );
    }

    if (
      'status' in input &&
      input.status !== 'Active' &&
      input.status !== 'Inactive'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `status는 'Active', 'Inactive' 중 하나여야 합니다. 현재 값: ${String(input.status)}`,
        } as ApiResponse<DbChapter>,
        { status: 400 }
      );
    }

    // mass assignment 방지: 허용된 필드만 추출 (id/created_at/updated_at 등 차단)
    const chapter = await createChapter(pickChapterFields(input));

    return NextResponse.json({ success: true, data: chapter } as ApiResponse<DbChapter>, {
      status: 201,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '챕터를 생성할 수 없습니다.';

    return NextResponse.json(
      { success: false, error: message } as ApiResponse<DbChapter>,
      { status: 500 }
    );
  }
}
