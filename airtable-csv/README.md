# Airtable 테이블 구성 가이드

이 폴더에는 플랩풋볼 매니저 온라인 실습 플랫폼을 위한 Airtable 테이블 구조 CSV 파일들이 있습니다.

## 📋 테이블 구성 순서

**중요**: 테이블을 다음 순서대로 생성해야 합니다 (링크 관계 때문)

### 1️⃣ Chapters 테이블 (1_Chapters.csv)

**필드 구성:**
- Name (Single line text) - 챕터 이름
- Order (Number) - 순서
- Video_URL (URL) - 영상 주소
- Video_Duration (Number) - 영상 길이 (초)
- Required_Watch_Percentage (Number) - 필수 시청 비율 (기본값: 60)
- Description (Long text) - 설명
- Questions_Count (Number) - 문제 개수
- Status (Single select) - 상태 (Options: Active, Inactive)

**Import 방법:**
1. Airtable에서 새 테이블 생성 → "Import data" 선택
2. `1_Chapters.csv` 파일 업로드
3. 필드 타입 확인 및 수정:
   - Video_URL → URL 타입으로 변경
   - Status → Single select로 변경, Options에 `Active`, `Inactive` 추가

---

### 2️⃣ Questions 테이블 (2_Questions.csv)

**필드 구성:**
- Question_Text (Long text) - 문제 내용
- Option_1 (Single line text) - 선택지 1
- Option_2 (Single line text) - 선택지 2
- Option_3 (Single line text) - 선택지 3
- Option_4 (Single line text) - 선택지 4
- Correct_Answer (Single select) - 정답 (Options: 1, 2, 3, 4)
- Explanation (Long text) - 해설
- Total_Attempts (Number) - 총 시도 횟수 (기본값: 0)
- Correct_Count (Number) - 정답 횟수 (기본값: 0)
- Incorrect_Count (Number) - 오답 횟수 (기본값: 0)
- Status (Single select) - 상태 (Options: Active, Inactive)
- **Chapter_Category** (Link to Chapters) - ⚠️ CSV import 후 수동 추가 필요

**Import 후 추가 작업:**
1. CSV import 후 **Chapter_Category** 필드를 수동으로 추가
2. 필드 타입: "Link to another record" → Chapters 테이블 선택
3. 각 문제에 해당하는 챕터 연결

---

### 3️⃣ Users 테이블 (3_Users.csv)

**필드 구성:**
- Name (Single line text) - 사용자 이름
- Phone (Phone number 또는 Single line text) - 전화번호
- Status (Single select) - 상태 (Options: In Progress, Completed, Blocked)
- Session_Token (Single line text) - 세션 토큰
- Total_Study_Time (Number) - 총 학습 시간 (기본값: 0)

**Import 방법:**
1. `3_Users.csv` 파일 import
2. Status를 Single select로 변경, Options에 `In Progress`, `Completed`, `Blocked` 추가

---

### 4️⃣ User_Progress 테이블 (4_User_Progress.csv)

**필드 구성:**
- **User** (Link to Users) - ⚠️ CSV import 후 수동 추가
- **Chapter** (Link to Chapters) - ⚠️ CSV import 후 수동 추가
- Video_Watched (Checkbox) - 영상 시청 완료 여부
- Video_Watch_Time (Number) - 영상 시청 시간 (기본값: 0)
- Questions_Assigned (Long text) - 할당된 문제 ID 목록 (JSON)
- Questions_Answered (Number) - 답변한 문제 수 (기본값: 0)
- All_Correct (Checkbox) - 모두 정답 여부
- Chapter_Completed (Checkbox) - 챕터 완료 여부
- Started_At (Date) - 시작 시간 (Include time 옵션 체크)

**Import 후 추가 작업:**
1. CSV import 후 다음 필드들을 수동으로 추가:
   - **User** (Link to another record → Users 테이블)
   - **Chapter** (Link to another record → Chapters 테이블)

---

### 5️⃣ Chapter_History 테이블 (5_Chapter_History.csv)

**필드 구성:**
- **User** (Link to Users) - ⚠️ CSV import 후 수동 추가
- **Chapter** (Link to Chapters) - ⚠️ CSV import 후 수동 추가
- Attempt_Number (Number) - 시도 번호 (기본값: 1)
- Start_Time (Date) - 시작 시간 (Include time 옵션 체크)
- End_Time (Date) - 종료 시간 (Include time 옵션 체크)
- Video_Watch_Time (Number) - 영상 시청 시간
- Questions_Correct (Number) - 정답 문제 수
- Questions_Total (Number) - 전체 문제 수
- Status (Single select) - 상태 (Options: In Progress, Completed)

**Import 후 추가 작업:**
1. CSV import 후 다음 필드들을 수동으로 추가:
   - **User** (Link to another record → Users 테이블)
   - **Chapter** (Link to another record → Chapters 테이블)
2. Status를 Single select로 변경, Options에 `In Progress`, `Completed` 추가

---

### 6️⃣ Question_Attempts 테이블 (6_Question_Attempts.csv)

**필드 구성:**
- **User** (Link to Users) - ⚠️ CSV import 후 수동 추가
- **Question** (Link to Questions) - ⚠️ CSV import 후 수동 추가
- **Chapter** (Link to Chapters) - ⚠️ CSV import 후 수동 추가
- User_Answer (Single select) - 사용자 답변 (Options: 1, 2, 3, 4)
- Attempt_Number (Number) - 시도 번호
- Time_Spent (Number) - 소요 시간 (초)

**Import 후 추가 작업:**
1. CSV import 후 다음 필드들을 수동으로 추가:
   - **User** (Link to another record → Users 테이블)
   - **Question** (Link to another record → Questions 테이블)
   - **Chapter** (Link to another record → Chapters 테이블)
2. User_Answer를 Single select로 변경, Options에 `1`, `2`, `3`, `4` 추가

---

## 🎯 전체 Import 프로세스

### 단계 1: 기본 테이블 생성
1. Chapters 테이블 import
2. Questions 테이블 import → Chapter_Category 필드 추가 및 연결
3. Users 테이블 import

### 단계 2: 관계형 테이블 생성
4. User_Progress 테이블 import → User, Chapter 필드 추가
5. Chapter_History 테이블 import → User, Chapter 필드 추가
6. Question_Attempts 테이블 import → User, Question, Chapter 필드 추가

---

## ⚠️ 중요 체크리스트

### 필드 이름 정확성
모든 필드 이름은 **대소문자와 언더스코어(_)까지 정확히** 일치해야 합니다:
- ✅ Session_Token (올바름)
- ❌ session_token (잘못됨)
- ❌ SessionToken (잘못됨)

### Single Select 옵션 설정
다음 필드들은 정확한 옵션 값을 설정해야 합니다:

**Chapters.Status:**
- Active
- Inactive

**Questions.Status:**
- Active
- Inactive

**Questions.Correct_Answer:**
- 1
- 2
- 3
- 4

**Users.Status:**
- In Progress
- Completed
- Blocked

**Chapter_History.Status:**
- In Progress
- Completed

**Question_Attempts.User_Answer:**
- 1
- 2
- 3
- 4

### Date 필드 설정
다음 필드들은 "Include time" 옵션을 체크해야 합니다:
- User_Progress.Started_At
- Chapter_History.Start_Time
- Chapter_History.End_Time

---

## 🔗 링크 필드 관계도

```
Users ←─────┐
             │
Chapters ←───┼─── User_Progress
             │
Questions ←──┴─── Question_Attempts
                  
                  Chapter_History
```

---

## 📝 샘플 데이터

- Chapters: 3개 샘플 챕터 포함
- Questions: 5개 샘플 문제 포함
- Users: 빈 테이블 (사용자가 가입하면 자동 추가)
- User_Progress, Chapter_History, Question_Attempts: 빈 테이블

---

## 🚀 완료 후 확인 사항

1. ✅ 6개 테이블이 모두 생성되었는지 확인
2. ✅ 모든 필드 이름이 정확한지 확인
3. ✅ Link 필드가 올바른 테이블에 연결되었는지 확인
4. ✅ Single select 옵션이 정확히 설정되었는지 확인
5. ✅ Date 필드의 "Include time" 옵션이 체크되었는지 확인

완료되면 애플리케이션에서 테스트해보세요!
