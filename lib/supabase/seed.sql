-- ============================================
-- Seed Data for Manager Online Training
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 1. 챕터 데이터 삽입
INSERT INTO chapters (name, "order", video_url, video_duration, required_watch_percentage, description, questions_count, status) VALUES
  ('매치 진행 기본 규칙', 1, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 510, 60, '매치 진행 시 기본적으로 알아야 할 규칙들을 학습합니다.', 5, 'Active'),
  ('팀 구성 및 관리', 2, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 375, 60, '팀 구성과 관리 방법에 대해 학습합니다.', 4, 'Active'),
  ('경기장 준비 사항', 3, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 420, 60, '경기장 준비 체크리스트와 필수 확인 사항을 학습합니다.', 4, 'Active');

-- 2. 문제 데이터 삽입 (챕터 1 - 매치 진행 기본 규칙)
INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, status)
SELECT c.id, q.question_text, q.option_1, q.option_2, q.option_3, q.option_4, q.correct_answer, q.explanation, 'Active'
FROM chapters c,
(VALUES
  ('매치 시작 전 가장 먼저 해야 할 일은?', '공기압 확인', '참가자 명단 확인', '날씨 확인', '주차 확인', '2', '참가자 명단을 먼저 확인하여 출석을 체크하는 것이 가장 중요합니다.'),
  ('매니저의 가장 중요한 역할은?', '점수 기록', '선수 관리', '관중 통제', '음료 준비', '2', '선수들을 관리하고 팀을 이끄는 것이 매니저의 가장 중요한 역할입니다.'),
  ('경기 시작 전 확인해야 할 사항이 아닌 것은?', '공 상태', '골대 상태', '관중석 청결', '선수 출석', '3', '관중석 청결은 매니저가 확인할 사항이 아닙니다.')
) AS q(question_text, option_1, option_2, option_3, option_4, correct_answer, explanation)
WHERE c."order" = 1;

-- 3. 문제 데이터 삽입 (챕터 2 - 팀 구성 및 관리)
INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, status)
SELECT c.id, q.question_text, q.option_1, q.option_2, q.option_3, q.option_4, q.correct_answer, q.explanation, 'Active'
FROM chapters c,
(VALUES
  ('팀은 최소 몇 명으로 구성되어야 하나요?', '4명', '5명', '6명', '7명', '3', '팀은 최소 6명으로 구성되어야 경기를 진행할 수 있습니다.')
) AS q(question_text, option_1, option_2, option_3, option_4, correct_answer, explanation)
WHERE c."order" = 2;

-- 4. 문제 데이터 삽입 (챕터 3 - 경기장 준비 사항)
INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, status)
SELECT c.id, q.question_text, q.option_1, q.option_2, q.option_3, q.option_4, q.correct_answer, q.explanation, 'Active'
FROM chapters c,
(VALUES
  ('경기 중 부상자 발생 시 우선 조치는?', '경기 중단', '구급차 호출', '응급처치', '감독 통보', '3', '부상자에게 즉시 응급처치를 하는 것이 가장 중요합니다.')
) AS q(question_text, option_1, option_2, option_3, option_4, correct_answer, explanation)
WHERE c."order" = 3;

-- 확인
SELECT c.name, c."order", COUNT(q.id) as question_count
FROM chapters c
LEFT JOIN questions q ON q.chapter_id = c.id
GROUP BY c.id, c.name, c."order"
ORDER BY c."order";
