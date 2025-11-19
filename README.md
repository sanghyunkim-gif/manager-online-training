# 플랩풋볼 매니저 온라인 실습 플랫폼

플랩풋볼 매니저 지원자를 위한 온라인 교육 및 평가 시스템입니다.

## 🚀 기능

### 학습자 기능
- ✅ 이름/전화번호로 간편 시작
- 📹 영상 시청 추적 (60% 이상 시청 강제)
- 📝 챕터별 랜덤 문제 출제
- 🔄 오답 시 자동 재학습
- 📊 학습 진행 상황 자동 저장
- 🎉 완료 시 결과 요약 및 다음 단계 안내

### 관리자 기능
- 👥 사용자 학습 진행률 모니터링
- 📈 문제별 정답률 통계
- 📥 학습 데이터 내보내기 (CSV/Excel)
- 📚 챕터 및 문제 관리 (Airtable)

## 🛠️ 기술 스택

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Database**: Airtable
- **Video**: React Player
- **Deployment**: Vercel (권장)

## 📋 시작하기

### 1. 환경 변수 설정

`.env.local` 파일을 열어 Airtable 정보를 입력하세요:

\`\`\`bash
AIRTABLE_API_KEY=your_api_key_here
AIRTABLE_BASE_ID=your_base_id_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 2. Airtable 설정

#### Airtable API 키 발급:
1. https://airtable.com/create/tokens 접속
2. "Create new token" 클릭
3. Scopes에서 다음 권한 추가:
   - `data.records:read`
   - `data.records:write`
4. 생성된 API 키를 `.env.local`에 추가

#### Base 생성:
1. Airtable에서 새 Base 생성
2. Base ID 확인 (URL에서 `app...` 부분)
3. Base ID를 `.env.local`에 추가

#### 테이블 생성:

다음 6개 테이블을 생성하세요:

**1. Chapters**
- Name (Single line text)
- Order (Number)
- Video_URL (URL)
- Video_Duration (Number)
- Required_Watch_Percentage (Number, Default: 60)
- Description (Long text)
- Questions_Count (Number)
- Status (Single select: Active/Inactive)

**2. Questions**
- Chapter_Category (Link to Chapters)
- Question_Text (Long text)
- Option_1 (Single line text)
- Option_2 (Single line text)
- Option_3 (Single line text)
- Option_4 (Single line text)
- Correct_Answer (Single select: 1/2/3/4)
- Explanation (Long text)
- Total_Attempts (Number, Default: 0)
- Correct_Count (Number, Default: 0)
- Incorrect_Count (Number, Default: 0)
- Status (Single select: Active/Inactive)

**3. Users**
- Name (Single line text)
- Phone (Phone number)
- Status (Single select: In Progress/Completed/Blocked)
- Session_Token (Single line text)
- Total_Study_Time (Number, Default: 0)

**4. User_Progress**
- User (Link to Users)
- Chapter (Link to Chapters)
- Video_Watched (Checkbox)
- Video_Watch_Time (Number, Default: 0)
- Questions_Assigned (Long text)
- All_Correct (Checkbox)
- Chapter_Completed (Checkbox)

**5. Chapter_History**
- User (Link to Users)
- Chapter (Link to Chapters)
- Attempt_Number (Number, Default: 1)
- Start_Time (Date, Include time)
- End_Time (Date, Include time)
- Video_Watch_Time (Number)
- Questions_Correct (Number)
- Questions_Total (Number)
- Status (Single select: In Progress/Completed)

**6. Question_Attempts**
- User (Link to Users)
- Question (Link to Questions)
- Chapter (Link to Chapters)
- User_Answer (Single select: 1/2/3/4)
- Attempt_Number (Number)
- Time_Spent (Number)

### 3. 개발 서버 실행

\`\`\`bash
npm run dev
\`\`\`

브라우저에서 http://localhost:3000 을 엽니다.

### 4. 빌드

\`\`\`bash
npm run build
npm run start
\`\`\`

## 📂 프로젝트 구조

\`\`\`
manager-online-training/
├── app/                      # Next.js App Router
│   ├── api/                  # API 라우트
│   │   ├── auth/            # 인증 관련
│   │   ├── chapters/        # 챕터 관련
│   │   ├── questions/       # 문제 관련
│   │   ├── progress/        # 진행 상황
│   │   └── admin/           # 관리자 기능
│   ├── learn/               # 학습 페이지
│   ├── complete/            # 완료 페이지
│   └── admin/               # 관리자 페이지
├── components/              # React 컴포넌트
│   ├── ui/                  # UI 컴포넌트
│   └── layout/              # 레이아웃 컴포넌트
├── lib/                     # 유틸리티 및 라이브러리
│   ├── airtable/           # Airtable 연동
│   ├── utils/              # 유틸리티 함수
│   └── hooks/              # 커스텀 훅
├── types/                   # TypeScript 타입 정의
└── public/                  # 정적 파일
\`\`\`

## ✅ 구현 완료 기능

### 학습자 기능
- [x] 랜딩 페이지 (이름/전화번호 입력)
- [x] 챕터 학습 페이지 (영상 시청)
  - 60% 이상 시청 강제
  - 스킵/배속 방지
  - 실시간 진행률 추적
- [x] 문제 풀이 페이지 (4지선다)
- [x] 결과 페이지 (정답/오답 처리)
- [x] 오답 시 자동 재학습
- [x] 완료 페이지 (결과 요약)
- [x] 진행 상황 자동 저장

### 관리자 기능
- [x] 관리자 대시보드
- [x] 사용자 목록 및 상태 확인
- [x] 기본 통계 (전체/진행 중/완료)

## 🔧 향후 개선 사항

- [ ] 사용자별 상세 학습 이력 페이지
- [ ] 문제별 통계 및 정답률 분석
- [ ] 데이터 내보내기 (CSV/Excel)
- [ ] 챕터 관리 UI (현재 Airtable에서 직접 관리)
- [ ] 관리자 인증 시스템

## 📝 Airtable 데이터 예시

### Chapters 테이블 예시:
| Name | Order | Video_URL | Video_Duration | Questions_Count | Status |
|------|-------|-----------|----------------|-----------------|--------|
| 매치 진행 기본 규칙 | 1 | https://youtube.com/... | 510 | 5 | Active |
| 팀 구성 및 관리 | 2 | https://youtube.com/... | 375 | 4 | Active |

### Questions 테이블 예시:
| Question_Text | Chapter_Category | Option_1 | Option_2 | Option_3 | Option_4 | Correct_Answer | Status |
|---------------|------------------|----------|----------|----------|----------|----------------|--------|
| 매치 시작 전 가장 먼저 해야 할 일은? | [Chapter ID] | 공기압 확인 | 참가자 명단 확인 | 날씨 확인 | 주차 확인 | 2 | Active |

## 🎯 사용 가이드

### 학습자 페이지 접속
1. http://localhost:3000 접속
2. 이름과 전화번호 입력
3. 개인정보 동의 후 "시작하기" 클릭
4. 자동으로 첫 번째 챕터로 이동

### 학습 흐름
1. **영상 시청**: 60% 이상 시청 필수
2. **문제 풀이**: 챕터별 랜덤 문제 풀이
3. **결과 확인**:
   - 전체 정답: 다음 챕터로 이동
   - 오답 있음: 오답 확인 후 재학습
4. **완료**: 모든 챕터 완료 시 완료 페이지 표시

### 관리자 대시보드 접속
- http://localhost:3000/admin 접속
- 사용자 목록 및 상태 확인
- 전체/진행 중/완료 필터링

## 🐛 문제 해결

### Airtable 연결 오류
1. `.env.local` 파일에 API 키와 Base ID가 올바른지 확인
2. Airtable에서 테이블이 모두 생성되었는지 확인
3. 필드 이름이 정확히 일치하는지 확인

### 챕터가 없다는 오류
1. Airtable Chapters 테이블에 챕터를 추가
2. Status를 'Active'로 설정
3. 페이지 새로고침

### 문제가 없다는 오류
1. Airtable Questions 테이블에 문제를 추가
2. Chapter_Category에 챕터를 링크
3. Status를 'Active'로 설정

## 📄 라이선스

이 프로젝트는 플랩풋볼 전용 프로젝트입니다.

---

## 📞 개발 관련 문의

프로젝트 개발: Claude Code
문의: README의 내용을 참고하여 Airtable 설정 및 환경 변수 구성
