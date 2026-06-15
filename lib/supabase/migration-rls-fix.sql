-- ============================================
-- RLS 정책 보안 수정 마이그레이션
-- 기존 "Allow all" (anon 포함 전체 허용) 정책을 service_role 전용으로 교체한다.
--
-- ⚠️ 적용 순서 (반드시 지킬 것):
--   1) .env 에 SUPABASE_SERVICE_ROLE_KEY 설정
--   2) 수정된 애플리케이션 코드 배포 (lib/supabase 모듈이 service_role 클라이언트 사용)
--   3) 그 다음 이 SQL 실행
--   ※ 순서가 바뀌면 anon 키로 동작하던 앱이 일시적으로 끊깁니다.
-- ============================================

-- 1. 기존 무력화 정책 제거 (FOR ALL USING(true) — anon 포함 전체 허용이었음)
DROP POLICY IF EXISTS "Allow all for service role" ON chapters;
DROP POLICY IF EXISTS "Allow all for service role" ON questions;
DROP POLICY IF EXISTS "Allow all for service role" ON users;
DROP POLICY IF EXISTS "Allow all for service role" ON user_progress;
DROP POLICY IF EXISTS "Allow all for service role" ON chapter_history;
DROP POLICY IF EXISTS "Allow all for service role" ON question_attempts;

-- 2. RLS 활성 보장 (이미 켜져 있어도 안전)
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;

-- 3. service_role 전용 전체 권한 정책 생성
--    anon/authenticated 에는 어떤 정책도 만들지 않으므로 직접 접근이 모두 거부된다.
--    (모든 데이터 접근은 서버 API → service_role 클라이언트를 경유)
CREATE POLICY "service_role full access" ON chapters FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role full access" ON questions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role full access" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role full access" ON user_progress FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role full access" ON chapter_history FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role full access" ON question_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 검증: anon 으로 SELECT 시 0 행/거부, service_role 로는 정상 동작해야 함
