import base, { TABLES } from './client';
import type { User, AirtableRecord } from '@/types';
import { randomBytes } from 'crypto';

/**
 * 세션 토큰 생성
 */
function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * 전화번호로 사용자 찾기
 */
export async function findUserByPhone(
  phone: string
): Promise<AirtableRecord<User> | null> {
  try {
    const records = await base(TABLES.USERS)
      .select({
        filterByFormula: `{Phone} = '${phone}'`,
        maxRecords: 1,
      })
      .all();

    if (records.length === 0) return null;

    return {
      id: records[0].id,
      fields: records[0].fields as User,
      createdTime: records[0]._rawJson.createdTime,
    };
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    return null;
  }
}

/**
 * 사용자 생성 또는 가져오기
 */
export async function createOrGetUser(
  name: string,
  phone: string,
  region?: string,
  applicationReason?: string
): Promise<AirtableRecord<User>> {
  try {
    // 기존 사용자 확인
    const existingUser = await findUserByPhone(phone);

    if (existingUser) {
      // 완료 상태인 경우 에러
      if (existingUser.fields.Status === 'Completed') {
        throw new Error('이미 온라인 실습을 완료하셨습니다.');
      }

      // 차단된 경우 에러
      if (existingUser.fields.Status === 'Blocked') {
        throw new Error('접근이 차단된 사용자입니다.');
      }

      // 진행 중인 경우 세션 토큰 갱신
      const sessionToken = generateSessionToken();
      const updated = await base(TABLES.USERS).update(existingUser.id, {
        Session_Token: sessionToken,
      } as any);

      return {
        id: updated.id,
        fields: updated.fields as User,
        createdTime: updated._rawJson.createdTime,
      };
    }

    // 신규 사용자 생성
    const sessionToken = generateSessionToken();
    const record = await base(TABLES.USERS).create({
      Name: name,
      Phone: phone,
      Region: region,
      Application_Reason: applicationReason,
      Status: 'In Progress',
      Session_Token: sessionToken,
      Total_Study_Time: 0,
    } as any);

    return {
      id: record.id,
      fields: record.fields as User,
      createdTime: record._rawJson.createdTime,
    };
  } catch (error: any) {
    if (error.message.includes('이미') || error.message.includes('차단')) {
      throw error;
    }
    console.error('사용자 생성/조회 오류:', error);
    throw new Error('사용자 정보를 처리할 수 없습니다.');
  }
}

/**
 * 사용자 ID로 조회
 */
export async function getUserById(
  userId: string
): Promise<AirtableRecord<User> | null> {
  try {
    const record = await base(TABLES.USERS).find(userId);

    return {
      id: record.id,
      fields: record.fields as User,
      createdTime: record._rawJson.createdTime,
    };
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    return null;
  }
}

/**
 * 사용자 업데이트
 */
export async function updateUser(
  userId: string,
  updates: Partial<User>
): Promise<AirtableRecord<User>> {
  try {
    const record = await base(TABLES.USERS).update(userId, updates as any);

    return {
      id: record.id,
      fields: record.fields as User,
      createdTime: record._rawJson.createdTime,
    };
  } catch (error) {
    console.error('사용자 업데이트 오류:', error);
    throw new Error('사용자 정보를 업데이트할 수 없습니다.');
  }
}

/**
 * 사용자 완료 처리
 */
export async function completeUser(userId: string): Promise<void> {
  try {
    await base(TABLES.USERS).update(userId, {
      Status: 'Completed',
      Completed_At: new Date().toISOString(),
    } as any);
  } catch (error) {
    console.error('사용자 완료 처리 오류:', error);
    throw new Error('완료 처리를 할 수 없습니다.');
  }
}

/**
 * 모든 사용자 조회 (관리자용)
 */
export async function getAllUsers(): Promise<AirtableRecord<User>[]> {
  try {
    const records = await base(TABLES.USERS)
      .select()
      .all();

    return records.map((record) => ({
      id: record.id,
      fields: record.fields as User,
      createdTime: record._rawJson.createdTime,
    }));
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    throw new Error('사용자 목록을 불러올 수 없습니다.');
  }
}
