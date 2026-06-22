# 플랩풋볼 매니저 온라인 실습 플랫폼

플랩풋볼 매니저 지원자를 위한 온라인 교육·평가 시스템입니다. 영상 학습과 챕터별 문제 풀이를 통해 매니저 역할을 익히고, 관리자는 콘텐츠 관리와 학습 통계를 한곳에서 운영합니다.

## 주요 기능

### 학습자
- 이름·전화번호·지역·지원동기 입력 후 간편 시작 (개인정보 동의 필수)
- 영상 시청 추적 — 챕터별 지정 비율 이상 시청해야 다음 단계 진행
- 챕터별 랜덤 문제 출제 (4지선다)
- 오답 시 자동 재학습 유도
- 학습 진행 상황 자동 저장 (영상 시청 시간·완료 챕터)
- 전체 완료 시 결과 요약 및 다음 단계 안내

### 관리자
- 관리자 로그인 (JWT 세션 인증)
- 대시보드 요약 카드 (전체/진행 중/완료 등)
- 통계 5종: 사용자 목록·챕터별 완료율·문제별 오답률·이탈 분석·지역별 분포
- 챕터 CRUD (제목·영상·시청 강제 비율·챕터별 출제 수 등 편집)
- 문제 CRUD (보기·정답·해설·난이도 편집)

## 기술 스택

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Database**: Supabase (PostgreSQL) — `@supabase/supabase-js`, 서버에서 service_role 키로만 접근 + RLS
- **Styling**: Tailwind CSS 4, [plab-design-system](vendor/plab-design-system) (vendored), Pretendard 폰트
- **Icons**: lucide-react
- **Video**: react-player
- **Markdown**: react-markdown + remark-gfm (챕터 설명·해설 렌더링)
- **Auth**: jsonwebtoken (관리자 JWT)
- **Deployment**: Vercel

> `plab-design-system`은 비공개 저장소라 빌드 안정성을 위해 `vendor/`에 dist를 포함(vendored)하고 `package.json`에서 `file:vendor/plab-design-system`으로 참조합니다.

## 시작하기

### 1. 환경 변수 설정

`.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다.

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
# 서버 전용 — 절대 NEXT_PUBLIC_ 접두사 금지 (브라우저 노출 시 RLS 우회 위험)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# 관리자 인증
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password_here
# 관리자 JWT 서명 시크릿 (고엔트로피 랜덤 문자열, 미설정 시 관리자 인증 비활성)
ADMIN_JWT_SECRET=your_admin_jwt_secret_here

# 앱
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> 배포(Vercel) 시에는 위 환경 변수를 프로젝트 설정의 Environment Variables에 등록합니다. `service_role` 키와 JWT 시크릿은 서버 전용이며 클라이언트에 노출되지 않습니다.

### 2. Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. **Project Settings → API**에서 URL·anon 키·service_role 키 확인 후 `.env.local`에 입력
3. **SQL Editor**에서 스키마 생성:
   - [`lib/supabase/schema.sql`](lib/supabase/schema.sql) 실행 — 테이블 6종 + 인덱스 + `updated_at` 트리거 + RLS 정책(service_role 전용)
   - (선택) [`lib/supabase/seed.sql`](lib/supabase/seed.sql) 실행 — 샘플 챕터·문제 데이터

### 3. 개발 서버 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.

### 4. 빌드

```bash
npm run build
npm run start
```

## 프로젝트 구조

```
manager-online-training/
├── app/
│   ├── page.tsx                      # 랜딩 (지원 정보 입력)
│   ├── learn/                        # 학습 플로우
│   │   ├── page.tsx                  #   학습 홈 (다음 챕터로 이동)
│   │   └── chapter/[id]/
│   │       ├── page.tsx              #   영상 시청
│   │       ├── quiz/page.tsx         #   문제 풀이
│   │       └── result/page.tsx       #   채점 결과·오답 해설
│   ├── complete/page.tsx             # 전체 완료
│   ├── admin/                        # 관리자
│   │   ├── login/page.tsx            #   로그인
│   │   ├── page.tsx                  #   대시보드 (통계 5종)
│   │   └── content/page.tsx          #   챕터·문제 CRUD
│   └── api/
│       ├── auth/start                # 학습자 시작(세션 발급)
│       ├── chapters/list
│       ├── questions/random          # 정답·해설 제거 후 출제
│       ├── answer/submit             # 채점
│       ├── progress/{get,save,complete}
│       ├── complete
│       └── admin/                    # 관리자 전용 (auth·chapters·questions·stats·users)
├── components/
│   ├── ui/                           # Button, Input, Select, Textarea, Modal, VideoPlayer
│   ├── layout/                       # ProgressHeader
│   └── admin/                        # ChapterTable/FormModal, QuestionTable/FormModal, ConfirmDialog
├── lib/
│   ├── supabase/                     # client + 데이터 함수(chapters·questions·users·progress·stats) + *.sql
│   ├── auth/admin.ts                 # 관리자 JWT 발급·검증
│   ├── validation/                   # 챕터·문제 서버 검증
│   └── utils/cn.ts
├── types/                            # 공용 타입
└── vendor/plab-design-system/        # vendored 디자인 시스템 (dist)
```

## 데이터 모델 (Supabase)

| 테이블 | 설명 |
|--------|------|
| `chapters` | 챕터(영상 URL, 시청 강제 비율, 출제 수, 상태) |
| `questions` | 문제(보기 4개, 정답, 해설, 난이도, 정답률 통계) |
| `users` | 학습자(이름·전화·지역·지원동기, 세션 토큰, 진행 상태) |
| `user_progress` | 사용자×챕터 진행(영상 시청, 배정 문제, 완료 여부) |
| `chapter_history` | 챕터 시도 이력(시도 횟수, 정답 수, 소요 시간) |
| `question_attempts` | 문항별 응답 기록(선택 답, 소요 시간) |

전체 정의는 [`lib/supabase/schema.sql`](lib/supabase/schema.sql) 참조.

## 보안

- **RLS service_role 전용**: 모든 테이블에 Row Level Security를 켜고 `service_role`에만 권한을 부여합니다. 브라우저에 노출되는 anon 키로는 PostgREST 엔드포인트에 직접 접근할 수 없으며, 모든 데이터 접근은 서버 API 라우트(service_role)를 경유합니다.
- **정답 비노출**: 출제(`/api/questions/random`) 경로는 정답·해설 등 민감 필드를 제거(`toPublicQuestion`)한 뒤 클라이언트로 내려보냅니다. 정답·해설은 채점 후 복습 화면에서만 의도적으로 공개합니다.
- **관리자 인증**: 관리자 API는 JWT(HMAC) 세션으로 보호합니다. `ADMIN_JWT_SECRET` 미설정 시 관리자 인증이 비활성화됩니다.

## 라이선스

플랩풋볼 전용 프로젝트입니다.
