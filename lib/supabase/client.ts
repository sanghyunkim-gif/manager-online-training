import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// 브라우저에 노출되는 공개 anon 클라이언트. RLS 정책의 적용 대상이다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서버 전용 클라이언트. service_role 키는 RLS를 우회하므로 절대 클라이언트 번들에서 import 하면 안 된다.
// 키가 없으면 anon 키로 fallback(개발 편의) — 프로덕션은 반드시 SUPABASE_SERVICE_ROLE_KEY 를 설정하고,
// RLS 차단 정책은 키 설정 이후에 적용해야 anon 경로가 끊기지 않는다.
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
