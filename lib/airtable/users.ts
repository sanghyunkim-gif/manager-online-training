import base, { TABLES } from './client';
import type { User, AirtableRecord } from '@/types';
import { randomBytes } from 'crypto';

const APPLICATION_REASON_MAP: Record<string, string> = {
  '친구/지인 추천': '친구/지인 추천',
  'SNS/광고를 보고': 'SNS/광고를 보고',
  '금전적 이유': '금전적 이유',
  '축구/풋살에 관심이 많아서': '축구/풋살에 관심이 많아서',
  '플랩풋볼 매니저에 관심이 있어서': '플랩풋볼 매니저에 관심이 있어서',
  '새로운 경험을 해보고 싶어서': '새로운 경험을 해보고 싶어서',
  '축구에 대한 열정': '축구/풋살에 관심이 많아서',
  '코칭 경험 쌓기': '플랩풋볼 매니저에 관심이 있어서',
  '아이들과 함께하는 활동': '새로운 경험을 해보고 싶어서',
  봉사활동: '새로운 경험을 해보고 싶어서',
  '경력 개발': '플랩풋볼 매니저에 관심이 있어서',
  '지인 추천': '친구/지인 추천',
  기타: '금전적 이유',
};

const REGION_MAP: Record<string, string> = {
  서울: '서울',
  경기: '경기',
  인천: '인천',
  강원: '강원',
  충북: '충북',
  충남: '충남',
  대전: '대전',
  세종: '세종',
  전북: '전북',
  전남: '전남',
  광주: '광주',
  경북: '경북',
  경남: '경남',
  대구: '대구',
  울산: '울산',
  부산: '부산',
  제주: '제주',
};

function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

function escapeFormulaValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function buildPhoneMatchFormula(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  const safeNormalized = escapeFormulaValue(normalized);
  const safeOriginal = escapeFormulaValue(phone.trim());

  if (safeNormalized === safeOriginal) {
    return `{Phone} = '${safeNormalized}'`;
  }

  return `OR({Phone} = '${safeOriginal}', {Phone} = '${safeNormalized}')`;
}

function mapApplicationReason(reason?: string) {
  if (!reason) return reason;
  const trimmed = reason.trim();
  if (!trimmed) return trimmed;
  return APPLICATION_REASON_MAP[trimmed] || trimmed;
}

function mapRegion(region?: string) {
  if (!region) return region;
  const trimmed = region.trim();
  if (!trimmed) return trimmed;
  return REGION_MAP[trimmed] || trimmed;
}

export async function findUserByPhone(
  phone: string
): Promise<AirtableRecord<User> | null> {
  try {
    const records = await base!(TABLES.USERS)
      .select({
        filterByFormula: buildPhoneMatchFormula(phone),
        maxRecords: 1,
      })
      .all();

    if (records.length === 0) {
      return null;
    }

    return {
      id: records[0].id,
      fields: records[0].fields as unknown as User,
      createdTime: records[0]._rawJson.createdTime,
    };
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    return null;
  }
}

export async function createOrGetUser(
  name: string,
  phone: string,
  region?: string,
  applicationReason?: string
): Promise<AirtableRecord<User>> {
  try {
    const normalizedPhone = normalizePhoneNumber(phone);
    const mappedRegion = mapRegion(region);
    const mappedReason = mapApplicationReason(applicationReason);

    const existingUser = await findUserByPhone(phone);
    if (existingUser) {
      if (existingUser.fields.Status === 'Completed') {
        throw new Error('이미 온라인 실습을 완료하셨습니다.');
      }
      if (existingUser.fields.Status === 'Blocked') {
        throw new Error('접근이 차단된 사용자입니다.');
      }

      const sessionToken = generateSessionToken();
      const updated: any = await base!(TABLES.USERS).update(existingUser.id, {
        Session_Token: sessionToken,
      } as any);

      return {
        id: updated.id,
        fields: updated.fields as unknown as User,
        createdTime: updated._rawJson.createdTime,
      };
    }

    const baseFields: any = {
      Name: name,
      Phone: normalizedPhone,
      Status: 'In Progress',
      Session_Token: generateSessionToken(),
      Total_Study_Time: 0,
    };

    if (mappedRegion) {
      baseFields.Region = mappedRegion;
    }
    if (mappedReason) {
      baseFields.Application_Reason = mappedReason;
    }

    const record: any = await tryCreateUser(baseFields, {
      region: mappedRegion,
      originalReason: applicationReason,
      mappedReason,
    });

    return {
      id: record.id,
      fields: record.fields as unknown as User,
      createdTime: record._rawJson.createdTime,
    };
  } catch (error: any) {
    const airtableMessage =
      error?.error?.message ||
      error?.message ||
      (typeof error === 'string' ? error : '');

    if (
      airtableMessage?.includes('이미') ||
      airtableMessage?.includes('차단')
    ) {
      throw error;
    }

    console.error('사용자 생성/조회 오류:', airtableMessage);
    throw new Error(
      airtableMessage || '사용자 정보를 처리할 수 없습니다.'
    );
  }
}

async function tryCreateUser(
  fields: any,
  metadata: {
    region?: string | null;
    originalReason?: string;
    mappedReason?: string;
  },
  attempt: number = 1
): Promise<any> {
  try {
    return await base!(TABLES.USERS).create(fields as any);
  } catch (error: any) {
    const message =
      error?.error?.message ||
      error?.message ||
      (typeof error === 'string' ? error : '');

    if (
      metadata.region &&
      fields.Region &&
      message.includes('Region') &&
      attempt < 3
    ) {
      const { Region, ...rest } = fields;
      console.warn(
        '[Users] Region 값이 허용되지 않아 Region 없이 재시도합니다.',
        { region: metadata.region, message }
      );
      return tryCreateUser(rest, { ...metadata, region: null }, attempt + 1);
    }

    if (
      metadata.originalReason &&
      metadata.mappedReason &&
      metadata.originalReason !== metadata.mappedReason &&
      message.includes('Application_Reason') &&
      attempt < 3
    ) {
      const updated = {
        ...fields,
        Application_Reason: metadata.originalReason,
      };
      console.warn(
        '[Users] 매핑된 지원동기가 허용되지 않아 원본 값으로 재시도합니다.',
        {
          original: metadata.originalReason,
          mapped: metadata.mappedReason,
          message,
        }
      );
      return tryCreateUser(
        updated,
        { ...metadata, mappedReason: metadata.originalReason },
        attempt + 1
      );
    }

    const fieldMatch =
      message.match(/Unknown field name: ([^.\n]+)/) ||
      message.match(/field '([^']+)'/i);

    if (fieldMatch) {
      const problematicField = fieldMatch[1]?.trim();
      if (
        problematicField &&
        Object.prototype.hasOwnProperty.call(fields, problematicField) &&
        !['Name', 'Phone'].includes(problematicField) &&
        attempt < 5
      ) {
        const { [problematicField]: _removed, ...rest } = fields;
        console.warn(
          `[Users] '${problematicField}' 필드로 인해 저장에 실패하여 해당 필드를 제외하고 재시도합니다.`,
          { message }
        );
        return tryCreateUser(rest, metadata, attempt + 1);
      }
    }

    console.error('Airtable 사용자 생성 실패:', {
      message,
      attempt,
      fields: Object.keys(fields),
    });
    throw error;
  }
}

export async function getUserById(
  userId: string
): Promise<AirtableRecord<User> | null> {
  try {
    const record = await base!(TABLES.USERS).find(userId);

    return {
      id: record.id,
      fields: record.fields as unknown as User,
      createdTime: record._rawJson.createdTime,
    };
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    return null;
  }
}

export async function updateUser(
  userId: string,
  updates: Partial<User>
): Promise<AirtableRecord<User>> {
  try {
    const record: any = await base!(TABLES.USERS).update(userId, updates as any);

    return {
      id: record.id,
      fields: record.fields as unknown as User,
      createdTime: record._rawJson.createdTime,
    };
  } catch (error) {
    console.error('사용자 업데이트 오류:', error);
    throw new Error('사용자 정보를 업데이트할 수 없습니다.');
  }
}

export async function completeUser(userId: string): Promise<void> {
  try {
    console.log('사용자 완료 처리 시작:', { userId });

    const completedAt = new Date().toISOString();

    await base!(TABLES.USERS).update(userId, {
      Status: 'Completed',
      Completed_At: completedAt,
    } as any);

    console.log('✅ 사용자 완료 처리 성공:', { userId, completedAt });
  } catch (error: any) {
    console.error('사용자 완료 처리 오류:', error);
    console.error('에러 상세:', error?.message || error);
    throw new Error('완료 처리를 할 수 없습니다.');
  }
}

export async function getAllUsers(): Promise<AirtableRecord<User>[]> {
  try {
    const records = await base!(TABLES.USERS)
      .select()
      .all();

    return records.map((record) => ({
      id: record.id,
      fields: record.fields as unknown as User,
      createdTime: record._rawJson.createdTime,
    }));
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    throw new Error('사용자 목록을 불러올 수 없습니다.');
  }
}
