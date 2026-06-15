-- ============================================
-- Supabase Schema for Manager Online Training
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. chapters
-- ============================================
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  video_url TEXT NOT NULL,
  video_duration INTEGER NOT NULL DEFAULT 0,
  required_watch_percentage INTEGER DEFAULT 80,
  description TEXT,
  questions_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chapters_status_order ON chapters (status, "order");

-- ============================================
-- 2. questions
-- ============================================
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_image TEXT,
  option_1 TEXT NOT NULL,
  option_2 TEXT NOT NULL,
  option_3 TEXT NOT NULL,
  option_4 TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('1', '2', '3', '4')),
  explanation TEXT,
  difficulty TEXT DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  total_attempts INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questions_chapter_status ON questions (chapter_id, status);
CREATE INDEX idx_questions_status ON questions (status);

-- ============================================
-- 3. users
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  region TEXT,
  application_reason TEXT,
  status TEXT NOT NULL DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Completed', 'Blocked')),
  session_token TEXT,
  current_chapter_id UUID REFERENCES chapters(id),
  total_study_time INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_phone ON users (phone);
CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_users_session_token ON users (session_token);
CREATE INDEX idx_users_region ON users (region);

-- ============================================
-- 4. user_progress
-- ============================================
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  video_watched BOOLEAN NOT NULL DEFAULT FALSE,
  video_watch_time INTEGER NOT NULL DEFAULT 0,
  questions_assigned JSONB,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  all_correct BOOLEAN NOT NULL DEFAULT FALSE,
  chapter_completed BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

CREATE INDEX idx_user_progress_user ON user_progress (user_id);
CREATE INDEX idx_user_progress_chapter ON user_progress (chapter_id);
CREATE INDEX idx_user_progress_user_chapter ON user_progress (user_id, chapter_id);

-- ============================================
-- 5. chapter_history
-- ============================================
CREATE TABLE chapter_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  video_watch_time INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER,
  questions_total INTEGER,
  status TEXT NOT NULL DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chapter_history_user ON chapter_history (user_id);
CREATE INDEX idx_chapter_history_chapter ON chapter_history (chapter_id);
CREATE INDEX idx_chapter_history_user_chapter ON chapter_history (user_id, chapter_id);
CREATE INDEX idx_chapter_history_status ON chapter_history (status);

-- ============================================
-- 6. question_attempts
-- ============================================
CREATE TABLE question_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL CHECK (user_answer IN ('1', '2', '3', '4')),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_question_attempts_user ON question_attempts (user_id);
CREATE INDEX idx_question_attempts_question ON question_attempts (question_id);
CREATE INDEX idx_question_attempts_chapter ON question_attempts (chapter_id);

-- ============================================
-- Auto-update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapter_history_updated_at
  BEFORE UPDATE ON chapter_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS Policies
-- 서버는 service_role 키(supabaseAdmin)로만 접근한다. anon/authenticated 에는 어떤 권한도
-- 부여하지 않아, 브라우저에 노출되는 anon 키로 공개 PostgREST 엔드포인트에 직접 접근하는 것을
-- 차단한다. 모든 데이터 접근은 서버 API 라우트(service_role)를 경유한다.
-- ============================================
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;

-- service_role 전용 전체 권한 (TO service_role 로 명시적 스코프 — anon 은 매칭되는 정책이 없어 거부됨)
CREATE POLICY "service_role full access" ON chapters FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role full access" ON questions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role full access" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role full access" ON user_progress FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role full access" ON chapter_history FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role full access" ON question_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);
