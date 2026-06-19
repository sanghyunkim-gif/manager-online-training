// 서버 전용 모듈. service_role 클라이언트를 supabase 별칭으로 사용한다.
import { supabaseAdmin as supabase } from './client';
import { randomBytes } from 'crypto';

export interface DbUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  region: string | null;
  application_reason: string | null;
  status: 'In Progress' | 'Completed' | 'Blocked';
  session_token: string | null;
  current_chapter_id: string | null;
  total_study_time: number;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

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

function mapApplicationReason(reason?: string): string | undefined {
  if (!reason) return reason;
  const trimmed = reason.trim();
  if (!trimmed) return trimmed;
  return APPLICATION_REASON_MAP[trimmed] || trimmed;
}

function mapRegion(region?: string): string | undefined {
  if (!region) return region;
  const trimmed = region.trim();
  if (!trimmed) return trimmed;
  return REGION_MAP[trimmed] || trimmed;
}

export async function findUserByPhone(phone: string): Promise<DbUser | null> {
  const normalized = normalizePhoneNumber(phone);
  const original = phone.trim();

  // 사용자 입력을 PostgREST 필터 문자열에 보간하지 않고, 안전한 .in() 파라미터로 조회한다.
  const candidates = Array.from(new Set([normalized, original]));
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('phone', candidates)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function createOrGetUser(
  name: string,
  phone: string,
  region?: string,
  applicationReason?: string
): Promise<DbUser> {
  const normalizedPhone = normalizePhoneNumber(phone);
  const mappedRegion = mapRegion(region);
  const mappedReason = mapApplicationReason(applicationReason);

  const existingUser = await findUserByPhone(phone);
  if (existingUser) {
    if (existingUser.status === 'Completed') {
      throw new Error('이미 온라인 실습을 완료하셨습니다.');
    }
    if (existingUser.status === 'Blocked') {
      throw new Error('접근이 차단된 사용자입니다.');
    }

    const sessionToken = generateSessionToken();
    const { data, error } = await supabase
      .from('users')
      .update({ session_token: sessionToken })
      .eq('id', existingUser.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error('사용자 정보를 처리할 수 없습니다.');
    }

    return data;
  }

  return tryCreateUser(
    {
      name,
      phone: normalizedPhone,
      status: 'In Progress' as const,
      session_token: generateSessionToken(),
      total_study_time: 0,
      ...(mappedRegion ? { region: mappedRegion } : {}),
      ...(mappedReason ? { application_reason: mappedReason } : {}),
    },
    {
      region: mappedRegion,
      originalReason: applicationReason,
      mappedReason,
    }
  );
}

interface CreateUserMetadata {
  region?: string | null;
  originalReason?: string;
  mappedReason?: string;
}

async function tryCreateUser(
  fields: Record<string, unknown>,
  metadata: CreateUserMetadata,
  attempt: number = 1
): Promise<DbUser> {
  const { data, error } = await supabase
    .from('users')
    .insert(fields)
    .select()
    .single();

  if (!error && data) {
    return data;
  }

  const message = error?.message || '';

  if (
    metadata.region &&
    fields.region &&
    message.includes('region') &&
    attempt < 3
  ) {
    const { region: _removed, ...rest } = fields;
    return tryCreateUser(rest, { ...metadata, region: null }, attempt + 1);
  }

  if (
    metadata.originalReason &&
    metadata.mappedReason &&
    metadata.originalReason !== metadata.mappedReason &&
    message.includes('application_reason') &&
    attempt < 3
  ) {
    const updated = {
      ...fields,
      application_reason: metadata.originalReason,
    };
    return tryCreateUser(
      updated,
      { ...metadata, mappedReason: metadata.originalReason },
      attempt + 1
    );
  }

  throw new Error(message || '사용자 정보를 처리할 수 없습니다.');
}

/**
 * 세션 토큰으로 사용자를 조회한다. IDOR 방어용 인증 검증에 사용한다.
 * 빈 토큰은 즉시 null 반환(DB 쿼리 불필요).
 */
export async function getUserBySessionToken(token: string): Promise<DbUser | null> {
  if (!token) return null;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('session_token', token)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function getUserById(userId: string): Promise<DbUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function updateUser(
  userId: string,
  updates: Partial<Omit<DbUser, 'id' | 'created_at' | 'updated_at'>>
): Promise<DbUser> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) {
    throw new Error('사용자 정보를 업데이트할 수 없습니다.');
  }

  return data;
}

export async function completeUser(userId: string): Promise<void> {
  const completedAt = new Date().toISOString();

  const { error } = await supabase
    .from('users')
    .update({
      status: 'Completed',
      completed_at: completedAt,
    })
    .eq('id', userId);

  if (error) {
    throw new Error('완료 처리를 할 수 없습니다.');
  }
}

export async function getAllUsers(): Promise<DbUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    throw new Error('사용자 목록을 불러올 수 없습니다.');
  }

  return data;
}
