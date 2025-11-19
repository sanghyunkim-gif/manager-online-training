import { NextRequest, NextResponse } from 'next/server';
import { createOrGetUser } from '@/lib/airtable/users';
import {
  findMockUserByPhone,
  createMockUser,
} from '@/lib/mock-data';
import type { ApiResponse, Session } from '@/types';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, region, applicationReason } = body;

    // 입력값 검증
    if (!name || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: '이름과 전화번호를 입력해주세요.',
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (!region || !applicationReason) {
      return NextResponse.json(
        {
          success: false,
          error: '지역과 지원동기를 선택해주세요.',
        } as ApiResponse,
        { status: 400 }
      );
    }

    let user;

    if (USE_MOCK) {
      // Mock 데이터 사용
      const existingUser = findMockUserByPhone(phone);
      if (existingUser) {
        if (existingUser.fields.Status === 'Completed') {
          return NextResponse.json(
            {
              success: false,
              error: '이미 온라인 실습을 완료하셨습니다.',
            } as ApiResponse,
            { status: 400 }
          );
        }
        user = existingUser;
      } else {
        user = createMockUser(name, phone);
      }
    } else {
      // 실제 Airtable 사용
      user = await createOrGetUser(name, phone, region, applicationReason);
    }

    // 세션 정보 생성
    const session: Session = {
      userId: user.id,
      userName: user.fields.Name,
      userPhone: user.fields.Phone,
      sessionToken: user.fields.Session_Token || '',
    };

    return NextResponse.json({
      success: true,
      data: {
        session,
        user: user.fields,
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('인증 API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || '인증 처리 중 오류가 발생했습니다.',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
