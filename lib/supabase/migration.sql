-- ============================================
-- Migration: Airtable → Supabase
-- 실행 전 기존 seed 데이터를 삭제합니다
-- ============================================

-- 기존 데이터 삭제 (FK 순서)
DELETE FROM question_attempts;
DELETE FROM chapter_history;
DELETE FROM user_progress;
DELETE FROM questions;
DELETE FROM chapters;

-- ============================================
-- 1. 챕터 데이터 (6개)
-- ============================================
INSERT INTO chapters (name, "order", video_url, video_duration, required_watch_percentage, description, questions_count, status) VALUES
  ('매치 준비', 1, 'https://youtu.be/OqE1cGQ7awY?si=8GGmbx3xxZuB7Rrs', 56, 80, '**1. 매치 선택**

- `매치 선택` 페이지에서 내가 진행할 매치를 선택해요.
- 매니저 페이지 “나의 매치”에서 확인가능해요.
- 매니저 활동을 지속하기 위해서는 3개월 동안 5개 이상의 매치를 진행해야해요.

✅ [**매치 선택 및 양도 자세히 알아보기**](https://www.notion.so/cbd82fb3e51a4ff5b020abd6ea89b0ca?pvs=21)

**2. 매니저 프리/서브**

- 특정 조건을 충족하면 내가 진행하는 혹은 진행하지 않는 매치에 무료로 참여할 수 있어요.
- 내 매치에 무료로 참여할 경우 아래 사항을 지켜야해요. 1. 매니저의 역할을 충실히 수행해요.

2. 지인들과 같은 팀 배정은 가급적 지양해요.

3. 기본 로테이션을 준수해요.

4. 패스 플레이 위주로 참여해요
✅ [**매니저 프리&서브 자세히 알아보기**](https://www.notion.so/14d6b418921149a2be214ef67ab9ad90?pvs=21)

**3. 런드리**

- 런드리는 장비를 들고 다니지도 관리하지도 않고 편하고 자유롭게 활동하실 수 있게 끔 구장과 플랩에서 장비를 세탁, 보관, 대여해 드리는 서비스예요.

✅ [**런드리서비스 자세히 보기**](https://www.notion.so/aca531517ab4492a8ac0bb945edaca71?pvs=21)

**4. 장비 준비**

- 런드리구장 여부를 확인하여 장비를 준비하세요
- 비런드리 구장에서 매치를 진행한다면 풋살공 2개 / 매니저조끼 /플랩조끼 / 손목 시계 / 볼 펌프 / 풋살화 를 준배해요.

✅ [**장비에 대해 자세히 알아보기**](https://www.notion.so/702f110e15d7434bb8b7e3bf200d683d?pvs=21)

**5. 출발 체크**

- 매니저 페이지에서 경기시작 1시간 반 전까지 꼭! `출발 체크`를 해주세요.
- 출발전 구장별 특이사항을 확인해 주세요(주차/구장이용 관련)
- 경기 시작 20분 전에 도착해서 경기를 준비해주세요.

✅ [**자세히 보기**](https://www.notion.so/3418dbe54b954b618623e466855671ba?pvs=21)', 7, 'Active');

INSERT INTO chapters (name, "order", video_url, video_duration, required_watch_percentage, description, questions_count, status) VALUES
  ('구장 도착', 2, 'https://youtu.be/3dkE6EwGNK0?si=M7FuUfeeKjeTqwMg', 77, 80, '**4. 팀 배정**

- 참가자가 매니저를 쉽게 찾을 수 있도록 매니저 조끼를 착용해 주세요.
- 미리 도착해서 경기장에 온 순서대로 팀을 배정하고 조끼를 나눠주세요.

✅ [**팀 배정 가이드 자세히 보기**](https://www.notion.so/ea38f1a84997482487d45752afbebb3a?pvs=21)

**5. 매치 안내**

- 시작 전 참가자를 중앙에 모아 오늘 경기에 대해 간단히 안내해 주세요.
- 경기 시작 시간으로부터 3분 이내에 매치를 시작해 주세요.

🎤  안내 멘트 가이드

1. 참가자 모으기

2. 매니저 소개

3. 진행 방식 안내

4. 주의 사항

5. 경기 시작', 5, 'Active');

INSERT INTO chapters (name, "order", video_url, video_duration, required_watch_percentage, description, questions_count, status) VALUES
  ('매치 진행', 3, 'https://youtu.be/FutjdcgNB30?si=jnEpd-b90pTwyR0m', 122, 80, '**6. 매치 진행**

- **경기 규칙**

- 모든 파울은 사이드 라인에서 시작해요.

✅ [**경기 규칙 자세히 보기**](https://www.notion.so/2e8596fc629b4b99902b16b367d3ce1a?pvs=21)

- **로테이션**

- 모두가 같은 시간을 즐길 수 있도록 경기 시간을 운영해요.

- 매치 타입과 참석 인원에 따라 로테이션이 달라요.

✅ [**로테이션 가이드 자세히 보기**](https://www.notion.so/30914b7a3fdd4af1879df0ea2a06c6f3?pvs=21)

- **레벨 입력**

- 플래버의 레벨을 입력해요.

✅ [**레벨 입력 가이드 자세히 보기**](https://www.notion.so/20015c2f16f94958a432e40441063ada?pvs=21)

- **밸런스 조정**

- 레벨로 팀을 짜도 밸런스가 맞지 않으면 선수를 교체해주세요.

✅ [**밸런스 조정 쉽게 하기**](https://www.notion.so/5ce07ff055eb4fb0a254facb93436f2f?pvs=21)

- **POM 선정하기**

- 매너가 좋고 경기 분위기를 좋게 만들어주는 유저에게 주는 선물이에요.

✅ [**POM 선정 가이드**](https://www.notion.so/e7da189cc69c4878a8cf8162568a37dc?pvs=21)

- **경기 운영**

- 경기가 과열되지 않도록 안내해요.

- 폭행 또는 싸움으로 진행이 어려운 경우

- 참가자를 진정 시키고 서로 마주치지 않도록 조치 해주세요.

- 퇴장 조치 후 경기를 진행해주세요.

- 도저히 경기 진행을 할 수 없는 경우 참가자들에게 양해를 구한 후 경기를 종료해주세요.

✅ [**경기 운영 팁**](https://www.notion.so/2e8596fc629b4b99902b16b367d3ce1a?pvs=21)', 5, 'Active');

INSERT INTO chapters (name, "order", video_url, video_duration, required_watch_percentage, description, questions_count, status) VALUES
  ('매치 종료', 4, 'https://youtu.be/FutjdcgNB30?si=jnEpd-b90pTwyR0m', 56, 80, '**7. 구장 특이사항 확인**

- 매치 진행 페이지에서 소음 주의, 조명 끄기 등 구장의 특이사항을 꼭 확인해주세요.

**8. 리포트 작성**

- 매치 리포트를 작성 해야 매치 진행비가 정산돼요.
- 부상, 다툼 등의 특이사항을 써주세요.

**9. 장비 세탁**

- 한 번 사용한 장비는 반드시 세탁해주세요.', 5, 'Active');

INSERT INTO chapters (name, "order", video_url, video_duration, required_watch_percentage, description, questions_count, status) VALUES
  ('주의사항', 5, 'https://youtu.be/ZBYP3TWOXYk?si=Eeq3HZHDrY-0aW9Z', 72, 80, '**😥 이런 건 안 돼요**

**아래 내용이 지켜지지 않았을 때 플래버가 좋지 못한 경험을 하고 아쉽다는 리뷰를 남길 수 있어요.**

1. 자리를 비우면 안 돼요.

- 부득이하게 자리를 비워야 할 경우 참가자들에게 양해를 구한 뒤 이동해주세요.

2. 슬리퍼를 착용하면 안 돼요.

3. 앉아서 진행하면 안 돼요.

- 부득이하게 서서 진행하기 어려울 경우 참가자들에게 미리 양해를 구해주세요.

4. 진행 중 흡연을 하면 안 돼요.

5. 지인들과 참가자를 평가하는 말을 하면 안 돼요.

6. 플레이를 지시하면 안 돼요.

7. 경기 운영 목적 외에 핸드폰을 보거나 통화를 하면 안 돼요.

**🚫 매니저 주의/경고/해지**

플래버들이 남긴 리뷰들이 모여 매니저님의 평점으로 기록돼요.

**3.9 이하 평점을 받거나, 같은 내용의 컴플레인이 계속되면 주의/경고**를 받아요.

플래버들이 남긴 리뷰로 평점을 관리하다 보니 매니저님이 납득하기 어렵고 억울한 상황이 생길 수 있어요. 플랩풋볼은 매니저님들이 불합리하게 주의, 경고를 받는 일이 없도록 여러 매치, 여러 명의 유저에게 받는 리뷰를 살펴보고 공정성을 확보하고 있어요.

**<주의>**

**3.9 이하 평점을 받거나, 같은 내용의 컴플레인이 계속되면 주의/경고**를 받을 수 있어요.

여러 번 주의 후에도 개선되지 않으면 경고와 함께 재평가 기간을 가져요.

아래 사항은 바로 주의를 받을 수 있어요.

- 흡연
- **지각**
- **불참 통보**
- 참가자와 다툼

**<경고>**

**여러 번 주의를 받은 경우, 누적 3.9 이하 월 평점 지속(2개월), 같은 내용의 컴플레인이 다시 발생하는 경우 경고**를 받아요. 알림톡으로 경고 안내를 드리고 5경기 동안 **재평가 기간**을 가져요.

**<재평가 기간>**

경고 이후 5경기 동안 매니저님의 매치 진행이 더 나아지는 것을 기대해요.
재평가 기간의 리뷰를 바탕으로 평가를 하고 **합격/불합격** 결과에 따라 매니저 활동 여부를 결정합니다.
(*재평가 기간 중에도 월 평점 기준 이하 시 추가 주의를 받으실 수 있으며, 매니저 권한 유지 여부는 재평가 결과를 우선합니다)

**<매니저 권한 해지>**

아래와 같은 사유는 매니저 권한이 바로 해지될 수 있어요.

- **무단 불참**
- **재평가 불합격**
- **주의 → 경고 이후 추가 주의/경고 시**
- **중대한 문제 발생 시 (폭력, 시설물 훼손, 도난 등)**

## **🛡️개인정보 보호**

매치 진행을 위해 제공 된 **참가자의 개인정보(연락처, 레벨, 차량번호 등**)를 다른 목적으로 사용하면 안돼요.

- 지각자에게 매치 참여 가능 여부를 확인하거나 현장 취소를 전달할 때 사용해요.
- 다른 참가자에게 개인정보를 공유하면 안돼요.
- 매치가 끝난 후 참가자의 개인정보를 보관하면 안돼요.
- 구장 관계자에게 참가자의 개인정보를 공유하면 안돼요.', 5, 'Active');

INSERT INTO chapters (name, "order", video_url, video_duration, required_watch_percentage, description, questions_count, status) VALUES
  ('팁', 6, 'https://youtu.be/vbISMG0pPt8?si=U-NvLcds4aiyg2JY', 109, 80, '**돌발 상황에 대처하는 팁**

**⚠️ 매치 중 돌발 상황이 일어나는 경우 아래의 항목별 팁을 확인해 보세요.**

[**✅  큰 부상을 당한 참가자가 있어요**](https://www.notion.so/b51d27ac2fd44c3e86e1c9eae0858b8b?pvs=21)

[**✅  매치 중 다툼이 일어났어요**](https://www.notion.so/dfdd0b69858d4a2598161161ac1eef01?pvs=21)

[**✅  거친 플레이, 비매너 참가자가 있어 진행이 어려워요**](https://www.notion.so/9640d1f419794522959e08c86375558f?pvs=21)

[**✅  매치 도중 비가 너무 많이 와 경기 진행할 수 없어요**](https://www.notion.so/c73fe5c3fdd84f9589d9275033bc6022?pvs=21)

[**✅  구장 조명이 꺼졌어요 / 켜지지 않아요**](https://www.notion.so/dbbc1c523ff7440ba13d495d18e6341d?pvs=21)

[**✅  주차 등록이 되지 않았어요**](https://www.notion.so/4bb5a0d7a0254aff8682664b4b51e086?pvs=21)

[**✅  담당 매치에 지각할 것 같아요**](https://www.notion.so/32261aaebe5e4d778b993fae53e7b680?pvs=21)', 5, 'Active');

-- ============================================
-- 2. 문제 데이터 (50개)
-- Chapter_Category → chapter_id 매핑
-- ============================================
-- 챕터: 매치 준비 (Order 1) - 10개 문제
INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '다음 중 매치 긴급양도 방법으로 올바르지 않은 것은?', '긴급양도는 긴급한 상황에 본인의 1회 매치비를 차감 혹은 양도비를 입금하고 양도하는 방식이다.', '긴급양도는 매치시작 3시간전에 신청 해야 경고를 받지 않는다.', '긴급양도를 요청을 하더라도 양도되지 않는 경우 매치를 직접 진행해야 한다.', '긴급양도비로 결제하는 비용은 긴급양도 매치를 진행하는 매니저에게 전달된다.', '4', '💡매치 선택시 주의 사항과 양도시 주의사항을 확인해보세요.
💡진행 매치에서 차감되거나 입금한 긴급양도 비용 (25,000원)은 긴급양도 매치를 진행하는 매니저에게 전달되지 않아요.

[**[매치 선택 및 양도]**](https://www.notion.so/cbd82fb3e51a4ff5b020abd6ea89b0ca?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 준비';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '다음 중 매치 선택 방법으로 올바른 것은?', '같은 시간대에 다른 매치를 선택 할 수 있다.', '하루에 여러 구장을 진행할 경우, 이동 시간을 충분히 고려하여 매치를 잡는다.', '선택한 매치는 개인 일정에 따라 자유롭게 취소할 수 있다.', '선택한 매치는 개인 일정에 따라 자유롭게 다른 매치와 변경 가능하다.', '2', '💡매치 선택시 주의 사항과 양도시 주의사항을 확인해보세요.
💡진행 매치에서 차감되거나 입금한 긴급양도 비용 (25,000원)은 긴급양도 매치를 진행하는 매니저에게 전달되지 않아요.

[**[매치 선택 및 양도]**](https://www.notion.so/cbd82fb3e51a4ff5b020abd6ea89b0ca?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 준비';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '다음 중 장비 준비 방법으로 올바른 것은?', '비런드리 구장: 공2개/매니저조끼/플랩조끼/손목시계/볼펌프/풋살화 준비', '연타임일 경우 앞타임 조끼 재사용', '장비 오래되어도 교환 불가', '런드리 구장이라도 개인 장비를 준비해야 한다', '1', '💡런드리와 비런드리 매치 준비 과정의 차이와 장비 사용법에 대해 확인하세요.', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 준비';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '다음 런드리 서비스에 관한 설명 중 옳지 않은 것은?', '런드리 서비스는 장비를 세탁·보관·대여하는 서비스', '런드리 장비와 개인 지급 장비는 혼용 불가', '런드리 구장에서만 활동하면 개인 장비 없이 진행 가능', '런드리 구장에서만 활동하더라도 개인 장비를 보유해야 한다', '4', '💡런드리와 비런드리 매치 준비 과정의 차이와 장비 사용법에 대해 확인하세요.', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 준비';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '매치 전 장비 준비 단계에서 옳지 않은 것은?', '비런드리 구장에서 공은 대여해주지만 조끼는 준비해야 한다', '런드리 사용 전 구장별 가이드 숙지', '런드리 장비 직접 회수·반납', '비런드리일 경우 내가 가진 장비 수 확인 후 매치 선택', '1', '💡런드리와 비런드리 매치 준비 과정의 차이와 장비 사용법에 대해 확인하세요.', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 준비';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '다음 중 매치 진행이 불가능할 때 올바른 대처 방법은?', '중요한 개인 사정이 있으므로 별도 연락 없이 매치에 가지 않아도 된다.', '일반양도,긴급양도를 올렸다면 양도 결과와 상관없이 안 가도 된다.', '매치 참가자에게 대리 진행을 요청하고 매치를 가지 않아도 된다.', '양도가 안 될 시 채널톡을 통하여 불가피한 상황을 알리고 도움을 요청한다.', '4', '💡매치 선택시 주의 사항과 양도시 주의사항을 확인해보세요.
💡진행 매치에서 차감되거나 입금한 긴급양도 비용 (25,000원)은 긴급양도 매치를 진행하는 매니저에게 전달되지 않아요.

[**[매치 선택 및 양도]**](https://www.notion.so/cbd82fb3e51a4ff5b020abd6ea89b0ca?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 준비';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '장비의 사용에서 옳지 않은 것은?', '장비는 플랩 매치에서만 사용해야 한다', '연타임에서 앞타임 조끼 재사용', '런드리 장비 개인 소유 시 도난 간주', '비런드리 구장에서 런드리 장비 사용 발견 시 신고', '2', '💡런드리와 비런드리 매치 준비 과정의 차이와 장비 사용법에 대해 확인하세요.', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 준비';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '다음 중 매니저 서브와 매니저 프리의 설명으로 올바르지 않은 것은?', '매니저 프리는 매치 진행을 조건으로 경기 참여도 가능한 혜택으로 매치 양도 시 참여도 취소', '매니저 서브는 30일 내 2경기 이상 진행, 무카드 조건으로 무료 참여 가능', '매니저 서브/프리 모두 자유롭게 취소할 수 있다.', '', '3', '💡매니저 프리와 서브는 매니저가 매치에 무료로 참가할 수 있는 혜택이지만, 차이점이 있어요.', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 준비';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '다음 중 출발체크 방법으로 올바르지 않은 것은?', '매치 시작 1시간 반 전 까지 구장 특이사항을 확인하고 출발체크', '경기장이 가까워 출발이 늦을 경우 임박하여 출발체크해도 된다', '구장 소음·주차·조명 등 특이사항 확인', '출발체크 미실시 시 경고 및 활동중단 가능', '2', '💡매니저가 구장을 향해 출발하여 매치가 제시간에 진행 될수 있음을 알리는 중요한 체크 사항이에요.', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 준비';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '다음 중 매치 양도 방법으로 올바르지 않은 것은?', '개인 사정으로 매치를 진행하기 어려운 경우 양도를 신청할 수 있다', '나의 매치를 양도 신청 하였더라도, 양도 완료되지 않았다면 해당 매치에 대한 진행 책임이 있다', '양도신청을 했으나, 양도가 완료되지 않은 경우 조건에 따라 긴급양도를 사용할 수 있다', '일반 양도의 경우 양도 비용이 발생한다', '4', '💡매치 선택시 주의 사항과 양도시 주의사항을 확인해보세요.
💡진행 매치에서 차감되거나 입금한 긴급양도 비용 (25,000원)은 긴급양도 매치를 진행하는 매니저에게 전달되지 않아요.

[**[매치 선택 및 양도]**](https://www.notion.so/cbd82fb3e51a4ff5b020abd6ea89b0ca?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 준비';

-- 챕터: 구장 도착 (Order 2) - 5개 문제
INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '팀 배정 참고 정보로 옳지 않은 것은?', '데뷔: 실력 미확인', '루키: 첫 레벨은 정확하지 않을 수 있음', '5회 이상 레벨 기록 시 인증 마크 생김', '10회 이상 레벨 기록 시 인증 마크 생김', '3', '💡밸런스에 맞게 팀배정을 할때 고려해야할 사항들을 살펴보세요.

[**[팀 배정]**](https://www.notion.so/ea38f1a84997482487d45752afbebb3a?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '구장 도착';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '출석체크 시 해야하는 것으로 올바른 것은?', '지인에게 여러 조끼를 주고 나눠 입게 한다', '명단과 실제 인물 이름 일치 여부 확인', '명단 외 참가자여도 왔으면 참여 가능', '풋살 매치에 축구화 착용해도 가능', '2', '💡팀 배정과 올바른 레벨 입력을 위해 출석체크를 해야 하요.

[**[팀 배정]**](https://www.notion.so/ea38f1a84997482487d45752afbebb3a?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '구장 도착';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '매치 시작 전 필요 없는 안내는?', '매니저 소개', '매치 참여 인원 안내', '참가자 개별 소개', '진행 방식 안내', '3', '💡매치 진행전 참가자에게 전달해야할 사항은 어떤 것이 있는지 숙지해요.

[**[매치 안내]**](https://www.notion.so/2e00a0cc31d54b149536e5505647fdef?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '구장 도착';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '단체 참가자 팀 배정의 올바른 방법은?', '단체 고려 않고 무조건 밸런스만 맞춤', '단체는 무조건 같은 팀 배정', '평균 레벨 1단계 이내면 단체 동일팀 배정 가능', '', '3', '💡밸런스에 맞게 팀배정을 할때 고려해야할 사항들을 살펴보세요.

[**[팀 배정]**](https://www.notion.so/ea38f1a84997482487d45752afbebb3a?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '구장 도착';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '각 팀의 레벨이 2단계 이상 차이가 날 때 올바른 대처 방법은?', '한다 보면 비슷해진다', '평균 레벨이 1단계 이내로 맞도록 팀 수정', '레벨 높은 팀이 살살 뛰도록 요청', '매니저가 레벨 낮은 팀에서 뛰기', '2', '💡밸런스에 맞게 팀배정을 할때 고려해야할 사항들을 살펴보세요.

[**[팀 배정]**](https://www.notion.so/ea38f1a84997482487d45752afbebb3a?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '구장 도착';

-- 챕터: 매치 진행 (Order 3) - 18개 문제
INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '6vs6 / 18명 / 3파전 올바른 키퍼 교체 방법은?', '쿼터당 2명·6분30초', '쿼터당 1명·13분', '득점 시 교체', '쿼터당 3명·4분', '1', '💡로테이션은 매치 진행 방식이나 참여 인원에 따라 달라져요.

[**[로테이션]**](https://www.notion.so/30914b7a3fdd4af1879df0ea2a06c6f3?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 진행';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '매치 규칙이 아닌 것은?', '파울 시 킥인', '득점 후 하프라인 재시작', '천장 닿으면 킥인', '파울 시 프리킥 또는 PK', '4', '💡모든 파울은 사이드 라인에서 시작해요.

[**[경기 규칙]**](https://www.notion.so/2e8596fc629b4b99902b16b367d3ce1a?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 진행';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '레벨 입력 가능 시간은?', '10분', '20분', '30분', '다음날 자정', '3', '💡 레벨입력 방법과, 레벨기준에 대한 내용을 살펴보세요.
[레벨입력]', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 진행';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '레벨 필수 입력 대상이 아닌 것은?', '최근 3매치 미기록', '2매치 이하 참여', '레벨 비기너', '', '3', '💡 레벨입력 방법과, 레벨기준에 대한 내용을 살펴보세요.
[레벨입력]', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 진행';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '매치 최소 인원으로 옳지 않은 것은?', '4v4 최소 6명', '6v6 최소 12명', '8v8 최소 16명', '11v11 최소 20명', '2', '💡로테이션은 매치 진행 방식이나 참여 인원에 따라 달라져요.

[**[로테이션]**](https://www.notion.so/30914b7a3fdd4af1879df0ea2a06c6f3?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 진행';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '경기 규칙이 아닌 것은?', '슈팅 세기 제한', '하프라인 뒤 슛 가능', '키퍼 백패스 손으로 받기 불가', '태클 제한', '1', '💡모든 파울은 사이드 라인에서 시작해요.

[**[경기 규칙]**](https://www.notion.so/2e8596fc629b4b99902b16b367d3ce1a?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 진행';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '레벨 입력 내용 중 틀린 것은?', '필수 입력 유저 먼저 지켜보기', '매치 중 입력 가능', '실력과 무관하게 임의 입력 가능', '종료 후 30분까지 가능', '3', '💡 레벨입력 방법과, 레벨기준에 대한 내용을 살펴보세요.
[레벨입력]', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 진행';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '플랩에서 진행하지 않는 매치 형태는?', '2v2', '4v4', '8v8', '11v11', '1', '💡로테이션은 매치 진행 방식이나 참여 인원에 따라 달라져요.

[**[로테이션]**](https://www.notion.so/30914b7a3fdd4af1879df0ea2a06c6f3?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 진행';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '아마추어 레벨에 해당하는 참가자는?', '압박에 쉽게 당황', '후반 활동량 감소', '기본기 있으나 정확도 낮음', '패스로 반복 기회 창출', '3', '💡 레벨입력 방법과, 레벨기준에 대한 내용을 살펴보세요.
[레벨입력]', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 진행';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '밸런스 조정 설명이 아닌 것은?', '진행 중 조정 가능', '밸런스 어시스터 가능', '조끼만 바꾸면 매치 페이지 변경 필요 없음', '다른 번호끼리 변경 가능', '3', '💡 밸런스 조정할때 주의해야할 사항에 대해 생각해보세요.[밸런스조정]', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 진행';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '상황별 대처가 아닌 것은?', '비매너 지속 시 신고', '폭행 시 구장 밖 분리', '과열 시 멈추고 중재', '현장 해결되면 리포트 작성 안 함', '4', '💡매치 진행 중 과열된 상황이 발생했을 때 어떻게 대처하면 좋을지 알아보세요.
[경기운영]', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 진행';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '8vs8 축구·11vs11 축구 공통 규칙은?', '사이드 아웃 시 스로인', '오프사이드 존재', '골킥·코너 없음', '프리킥 없음', '1', '💡로테이션은 매치 진행 방식이나 참여 인원에 따라 달라져요.

[**[로테이션]**](https://www.notion.so/30914b7a3fdd4af1879df0ea2a06c6f3?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 진행';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '5vs5 / 15명 / 3파전 마지막 9쿼터 키퍼 교체 방법은?', '쿼터당 2명', '쿼터당 1명', '득점 시 교체', '쿼터당 3명', '3', '💡로테이션은 매치 진행 방식이나 참여 인원에 따라 달라져요.

[**[로테이션]**](https://www.notion.so/30914b7a3fdd4af1879df0ea2a06c6f3?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 진행';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '중재해야 하는 상황이 아닌 것은?', '가까운 거리 강슛', '거친 태클', '가벼운 볼 경합', '뒤에서 민 행위', '3', '💡매치 진행 중 과열된 상황이 발생했을 때 어떻게 대처하면 좋을지 알아보세요.
[경기운영]', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 진행';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '7vs7 / 21명 / 3파전 올바르지 않은 키퍼 교체 방법은?', '쿼터당 2명·5분', '득점 시 교체(30초 이내 연속 득점 시 계속)', '득점 시 교체(3분 이상 무득점 시 교체)', '', '1', '💡로테이션은 매치 진행 방식이나 참여 인원에 따라 달라져요.

[**[로테이션]**](https://www.notion.so/30914b7a3fdd4af1879df0ea2a06c6f3?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 진행';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '6vs6 3파전 17명 참여 시 대처가 아닌 것은?', '부족한 팀에 매니저 합류', '쉬는 팀 참가자에게 지원 요청', '부족 팀에 높은 레벨 넣어 밸런스 맞춤', '부족 팀은 쉬는 팀 지원 또는 매니저가 뛸 수 있음', '3', '💡로테이션은 매치 진행 방식이나 참여 인원에 따라 달라져요.

[**[로테이션]**](https://www.notion.so/30914b7a3fdd4af1879df0ea2a06c6f3?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 진행';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, 'POM 내용이 아닌 것은?', '실력과 무관', '꼭 선정해야 함', '격려·매너 좋을 때 부여', '3명 선정 가능', '2', '💡 플래버 오브 더 매치(POM)은 좋은 매너와 이타적인 플레이로 매치를 즐겁게 만들어 준 플래버에게 매니저가 주는 작은 선물이에요. 2파전 매치는 2명, 3파전 매치는 최대 3명까지 선정할 수 있어요.
[POM 선정]', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 진행';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '과열 방지를 위해 매니저가 할 수 없는 행동?', '주의 주기', '넘어진 참가자 케어', '잘잘못 판단해 질책', '반복 과격플레이 귀가 조치 후 기록', '3', '💡매치 진행 중 과열된 상황이 발생했을 때 어떻게 대처하면 좋을지 알아보세요.
[경기운영]', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 진행';

-- 챕터: 매치 종료 (Order 4) - 5개 문제
INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '매치 종료 후 해야하는 일이 아닌 것은?', '구장 관계자에게 종료 보고', '리포트 작성', '비런드리 장비 회수·세탁', '조명·잠금 확인', '1', '💡구장마다 매치 진행 시 참고해야 하는 특이사항이 있어요.
플랩매니저는 특수한 상황이 아닌 이상, 구장 관자계(구장측)과 직접 소통하지 않아요.', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 종료';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '구장 특이사항 설명이 아닌 것은?', '주차 방식 확인', '마지막 매치 후 소등', '소음 특이사항은 무시 가능', '상주자 있어도 확인 필요', '3', '💡구장마다 매치 진행 시 참고해야 하는 특이사항이 있어요.
플랩매니저는 특수한 상황이 아닌 이상, 구장 관자계(구장측)과 직접 소통하지 않아요.', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 종료';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '장비 관리법 중 옳지 않은 것은?', '조끼·공 직접 수거', '런드리 규정 확인 후 반납', '개인 장비도 런드리함에 넣기', '공 바람 채워 반납', '3', '💡런드리 장비는 구장에서 관리하지만, 개인 장비의 관리는 매니저가 직접 해야해요.
[매니저 장비], [런드리]', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 종료';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '리포트 수정 기한은?', '다음 날 오전 8시까지', '1시간 이내', '일주일 이내', '3일 이내', '1', '💡리포트 작성 방법과 작성 기한에 대해 살펴보세요.
[리포트 작성]', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 종료';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '리포트 작성 내용이 아닌 것은?', '리포트 작성해야 정산', '부상 해결되면 작성 안 해도 됨', '중단 시간만큼 작성', '특이사항 없으면 체크 후 종료', '2', '💡리포트 작성 방법과 작성 기한에 대해 살펴보세요.
[리포트 작성]', 'Medium', 'Active'
FROM chapters c WHERE c.name = '매치 종료';

-- 챕터: 주의사항 (Order 5) - 3개 문제
INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '매치 중 해도 되는 행동은?', '흡연', '사적 핸드폰 사용', '앉아서 진행(사전 양해)', '자리 이탈', '3', '💡매니저의 역할을 수행하면서 하지말아야 할 행동들이 있어요.

[**[매니저 경고]**](https://www.notion.so/6f484dfe05fc46edb2ec95440d2bc6ea?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '주의사항';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '권한 해지 사유가 아닌 것은?', '지각', '런드리 장비 도난', '주의→경고 이후 추가 경고', '중대한 문제 발생', '1', '💡매니저의 역할을 수행하면서 하지말아야 할 행동들이 있어요.

[**[매니저 경고]**](https://www.notion.so/6f484dfe05fc46edb2ec95440d2bc6ea?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '주의사항';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '참가자가 주는 피드백 이유가 아닌 것은?', '지인끼리 팀 구성', '지인과 사적 대화', '지인끼리 장난·비속어', '경기 중 필요 이상 핸드폰 사용', '4', '💡매니저의 역할을 수행하면서 하지말아야 할 행동들이 있어요.

[**[매니저 경고]**](https://www.notion.so/6f484dfe05fc46edb2ec95440d2bc6ea?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '주의사항';

-- 챕터: 팁 (Order 6) - 9개 문제
INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '비매너 신고 대상이 아닌 것은?', '열심히 하나 실력 부족', '보복 행위', '폭언·욕설·일방적 지시', '', '1', '💡다툼이 발생하면 빠르게 대처해 주세요. 대처 후 매치를 계속 진행하고, 종료 후 다툼 상황에 대해 매치 리포트에 자세히 작성해야 해요.

[**[매치중 다툼, 비매너]**](https://www.notion.so/dfdd0b69858d4a2598161161ac1eef01?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '팁';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '강수 매치 인원수별 대처 틀린 것은?', '8명 미만 현장취소', '8~9명 미니게임 후 전액 반환', '10명 이상 정상 진행', '현장 취소는 환불되지 않음', '4', '💡강수(비, 눈 등)에는 어떻게 대처해야 하는지 확인해보세요.

[**[강수]**](https://www.notion.so/c73fe5c3fdd84f9589d9275033bc6022?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '팁';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '강수 매치 설명이 아닌 것은?', '현장 도착 인원에게 참여 의사 확인', '약간의 비는 매니저 판단으로 취소 가능', '취소 시 대기 후 지각자 안내', '다음날 오전 환불', '2', '💡강수(비, 눈 등)에는 어떻게 대처해야 하는지 확인해보세요.

[**[강수]**](https://www.notion.so/c73fe5c3fdd84f9589d9275033bc6022?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '팁';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '긴급문의 전화 사용 가능한 내용?', '현장 긴급 상황 발생', '서비스 궁금증 문의', '캐시 충전 문의', '', '1', '💡일반문의는 채널톡으로 문의하고, 현장에서 발생하는 긴급상황에서만 전화상담을 사용해요.', 'Medium', 'Active'
FROM chapters c WHERE c.name = '팁';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '플래버 연락처 활용 방법으로 적절한 것은?', '종료 후 연락처 보관', '부상 시 상대 번호 전달', '구장이 요청하면 전달', '지각자에게 취소 사실 전달', '4', '💡매니저에게 제공되는 참가자의 개인정보는 다른 목적으로 사용할 수 없어요.', 'Medium', 'Active'
FROM chapters c WHERE c.name = '팁';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '다툼 발생 시 대처가 아닌 것은?', '당사자 구장 밖 안내', '재발 방지 위해 참여 금지', '화해 중재', '리포트 상세 기재', '2', '💡다툼이 발생하면 빠르게 대처해 주세요. 대처 후 매치를 계속 진행하고, 종료 후 다툼 상황에 대해 매치 리포트에 자세히 작성해야 해요.

[**[매치중 다툼, 비매너]**](https://www.notion.so/dfdd0b69858d4a2598161161ac1eef01?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '팁';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '지각 설명으로 올바른 것은?', '5분 늦어도 지각 아님', '지각은 주의만 있고 경고 없음', '지각 시 즉시 연락해 사유 전달', '누적돼도 영향 없음', '3', '💡매니저의 지각은 매치참가를 위해 모인 모두에게 피해를 주는 행동이에요.

불가피하게 지각을 하게된 상황이라면 빠르게 상황을 플랩운영팀에게 알려야해요.

[**[매니저 지각]**](https://www.notion.so/32261aaebe5e4d778b993fae53e7b680?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '팁';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '부상 시 잘못된 행동은?', '심하면 구급차 먼저 부름', '경미 시 밖에서 휴식', '중단 시 빠르게 수습 후 재개', '상호 접촉 시 연락처 교환 안내', '1', '💡부상자와 의사 소통이 가능하다면, 어떻게 조치할지 부상자의 의견을 꼭 물어봐야 해요.
[부상]', 'Medium', 'Active'
FROM chapters c WHERE c.name = '팁';

INSERT INTO questions (chapter_id, question_text, option_1, option_2, option_3, option_4, correct_answer, explanation, difficulty, status)
SELECT c.id, '매치 시작 지연 시 잘못된 행동은?', '정식 인원 모일 때까지 대기', '먼저 온 사람들과 미니게임', '10분 넘기면 미진행 시간 기록', '', '1', '💡인원이 부족하더라도 매치시작이 늦어지지 않도록 해야해요.

[**[인원미달]**](https://www.notion.so/10aed330f0e9494a98fd35948c081522?pvs=21)', 'Medium', 'Active'
FROM chapters c WHERE c.name = '팁';

-- ============================================
-- 검증 쿼리
-- ============================================
SELECT c.name, c."order", c.questions_count as expected, COUNT(q.id) as actual
FROM chapters c
LEFT JOIN questions q ON q.chapter_id = c.id
GROUP BY c.id, c.name, c."order", c.questions_count
ORDER BY c."order";