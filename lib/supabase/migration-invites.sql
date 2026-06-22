-- ============================================
-- invites 테이블 마이그레이션
-- ATS 연동 초대 발급/검증 플로우를 지원한다.
--
-- ⚠️ 사람이 Supabase SQL Editor에서 직접 실행하는 파일이다.
--    실행 전 update_updated_at_column() 함수가 이미 존재하는지 확인할 것.
--    (schema.sql을 먼저 적용했다면 이미 존재함)
--
-- 적용 순서:
--   1) 이 파일을 Supabase 대시보드 > SQL Editor에 붙여넣고 실행
--   2) 애플리케이션 코드 배포 (.env에 INVITE_API_KEY, WEBHOOK_SIGNING_SECRET 설정)
-- ============================================

-- ============================================
-- 1. invites 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS invites (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id     TEXT         NOT NULL,
  token_hash       TEXT         NOT NULL UNIQUE,
  callback_url     TEXT         NOT NULL,

  -- 선택적 사용자 정보 (ATS가 전달한 경우 user lazy 연결에 활용)
  name             TEXT,
  phone            TEXT,

  status           TEXT         NOT NULL DEFAULT 'issued'
                   CHECK (status IN ('issued', 'entered', 'completed', 'expired', 'failed')),
  user_id          UUID         REFERENCES users(id) ON DELETE SET NULL,
  expires_at       TIMESTAMPTZ  NOT NULL,
  entered_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  webhook_attempts INTEGER      NOT NULL DEFAULT 0,
  last_webhook_error TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. 인덱스
-- ============================================

-- token_hash는 UNIQUE 제약으로 이미 인덱스가 있지만 명시적으로 선언한다.
CREATE INDEX IF NOT EXISTS idx_invites_token_hash    ON invites (token_hash);
CREATE INDEX IF NOT EXISTS idx_invites_applicant_id  ON invites (applicant_id);
CREATE INDEX IF NOT EXISTS idx_invites_user_id       ON invites (user_id);
CREATE INDEX IF NOT EXISTS idx_invites_status        ON invites (status);

-- ============================================
-- 3. updated_at 자동 갱신 트리거
-- (update_updated_at_column 함수는 schema.sql에서 이미 생성됨)
-- ============================================
CREATE TRIGGER update_invites_updated_at
  BEFORE UPDATE ON invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. RLS
-- service_role 전용 전체 권한. anon/authenticated는 매칭 정책 없어 거부됨.
-- ============================================
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role full access" ON invites
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
