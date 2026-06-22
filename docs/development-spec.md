# 프로젝트 개발명세서

플랩풋볼 매니저 온라인 실습 플랫폼의 개발명세서다. 매니저 지원자가 토큰/전화번호로 진입해 챕터별 영상을 시청하고 퀴즈를 풀어 전 과정을 완료하면, 관리자가 진행/통계/콘텐츠를 운영하는 **Next.js 16 App Router + Supabase** 기반 웹 애플리케이션이다. 학습자(localStorage 세션)와 관리자(admin-token JWT 쿠키)의 인증 체계가 완전히 분리되어 있다.

> 작성 기준: 코드베이스 정적 분석. 미머지 PR(#5 ATS 통합) 미반영.
> 본 문서의 모든 핵심 주장은 화면별 상세(§2 screen-*.md)에서 `파일:줄번호`로 근거를 단다. 코드로 단정 불가한 항목은 §부록 "확인 필요 사항"으로 분리한다.

---

## 목차

1. [전체 화면 목록](#1-전체-화면-목록)
2. [화면별 상세 명세](#2-화면별-상세-명세)
3. [전체 API / Supabase 호출 목록](#3-전체-api--supabase-호출-목록)
4. [전체 권한 매트릭스](#4-전체-권한-매트릭스)
5. [보안 및 개선 포인트](#5-보안-및-개선-포인트)
6. [부록. 확인 필요 사항 종합](#부록-확인-필요-사항-종합)

---

## 1. 전체 화면 목록

| 화면명 | Route | 접근 사용자 | 주요 기능 |
|---|---|---|---|
| 랜딩 (지원 정보 입력) | `/` | 비인증 방문자(지원자), 기 진행 중 사용자(전화번호 재입력) | 지원 정보 입력 폼 작성(이름·전화번호·지역·지원동기·개인정보 동의), 클라이언트 유효성 검증, `POST /api/auth/start`로 사용자 생성/조회 + 세션 토큰 발급, 세션을 `localStorage('session')` 저장, 성공 시 `/learn` 이동·실패 시 인라인 에러 |
| 학습 홈 | `/learn` | 학습자(세션 보유), 미인증 사용자 | 세션 가드 & 진입 라우팅(미인증 시 `/`로 리다이렉트), 활성 챕터 목록 조회, 진행도 조회 및 다음 챕터 계산, 다음 챕터로 자동 리다이렉트, 챕터 없음/오류 시 안내 카드 + 새로고침 |
| 챕터 영상 시청 | `/learn/chapter/[id]` | 학습자(세션 보유), 비로그인 | 초기 로드(세션 확인·챕터 목록·진행도 계산), 영상 재생 및 약 1초 주기 진행률 자동 저장, 필수 시청률 달성 시 완료 게이트로 다음 버튼 활성화, 퀴즈 화면 이동, 챕터 description Markdown(GFM) 렌더, 진행 사이드바 및 전체 진행률(%), 나가기(confirm 후 세션 제거·홈 이동) |
| 챕터 퀴즈 | `/learn/chapter/[id]/quiz` | 학습자(세션 보유), 비로그인 사용자 | 세션 확인 및 초기화(챕터목록·진행도·문제 순차 로드), 문항 네비게이션(이전/다음/번호 점프), 선택지 선택(3지선다 대응), 전 문항 답변 후 일괄 제출 및 서버 채점, 채점 결과 sessionStorage 저장 후 결과 화면 이동, 자체 4상태 처리 |
| 챕터 결과 | `/learn/chapter/[id]/result` | 학습자(세션+결과 보유), 미인증(세션 없음), 결과 없음(직접 URL 진입) | 진입 가드 및 sessionStorage 결과 복원, 챕터 목록·진행도 로드(헤더/다음챕터 계산), 전체 정답 결과 표시(축하 카드 + 다음챕터/완료 CTA), 오답 결과 표시(내 답·정답·ReactMarkdown 해설), 다시 학습하기 재시도, 다음 챕터로/완료 이동 + `progress/complete` 호출 |
| 학습 완료 | `/complete` | 학습자(응시자), 비로그인 | 세션 확인 및 게이팅, 활성 챕터 목록 로드 후 완료 결과 카드 렌더, `POST /api/complete`로 완료 자격 서버 검증 및 `users.status='Completed'` 확정(403 시 `/learn` 이동), 완료 축하/완료 챕터 목록/배지/다음 단계 안내, 닫기 버튼(세션 제거 후 `/` 이동) |
| 관리자 로그인 | `/admin/login` | 비인증 방문자(누구나), 이미 로그인된 관리자 | 아이디/비밀번호 입력 폼(HTML5 required), `POST /api/admin/auth/login`로 자격증명 검증, 성공 시 `admin-token` httpOnly JWT 쿠키 발급 + `/admin` 이동, 실패/예외 시 role=alert 에러 표시, 제출 중 loading 버튼 disabled |
| 관리자 대시보드 | `/admin` | 관리자(admin JWT 쿠키 보유자) | 관리자 인증 확인(진입 가드), 대시보드 데이터 일괄 로드(users + 4종 통계), 통계 카드 4개 클라이언트 집계, 사용자 상태 필터, 5개 탭 통계 조회(사용자/챕터/문제/이탈/지역), 진행 중 학습자 완료 처리(쓰기), 콘텐츠 관리 페이지 이동, 로그아웃 |
| 관리자 콘텐츠 관리 | `/admin/content` | 관리자(Admin), 학습자/비인증(접근 불가) | 어드민 인증 가드, 챕터 목록 조회(Active+Inactive + 챕터별 활성 문제 수), 챕터 추가/수정·비활성화(soft)·영구삭제(hard, CASCADE), 문제 목록 조회(챕터 필터)·추가/수정·비활성화(soft)·영구삭제(hard, CASCADE→question_attempts), 챕터/문제 탭 전환 |

> 접근 사용자 표기는 각 화면 메타데이터의 `accessUserTypes`(진입 가능/리다이렉트 대상 포함)에서 가져왔다. 권한별 가능/제한 기능의 통합 정리는 §4 전체 권한 매트릭스를 참조한다.

---

## 2. 화면별 상세 명세

### 2.1 랜딩 (지원 정보 입력)

> 근거 파일(절대경로):
> - 화면: `/Users/larkkim/manager-online-training/.claude/worktrees/upbeat-gates-ad9e3c/app/page.tsx`
> - API: `/Users/larkkim/manager-online-training/.claude/worktrees/upbeat-gates-ad9e3c/app/api/auth/start/route.ts`
> - 데이터 함수: `/Users/larkkim/manager-online-training/.claude/worktrees/upbeat-gates-ad9e3c/lib/supabase/users.ts`
>
> 본 문서의 모든 핵심 주장은 `파일:줄번호`로 근거를 단다. 코드로 단정 불가한 항목은 §8 "확인 필요 사항"으로 분리한다.

---

#### 1) 화면 기본 정보

| 항목 | 내용 | 근거 |
|---|---|---|
| 화면명 | 랜딩 (지원 정보 입력) | — |
| Route | `/` | `app/page.tsx`(파일 위치) |
| 컴포넌트 | `HomePage` (default export, `'use client'`) | `app/page.tsx:1,8` |
| 접근 가능 사용자 유형 | 비인증 방문자(누구나). 로그인/세션 없이 진입 가능 | `app/page.tsx` 전체에 인증 가드·세션 확인 코드 없음 |
| 접근 조건 | 없음. 라우트 레벨 게이팅(미들웨어) 부재 — `middleware.ts`가 프로젝트에 없으므로 서버단 진입 차단 없음 | 공통 인프라(인증) §3.7, 공통(라우팅) §1-3 |
| 화면 목적 | 채용 후보(매니저 지원자)의 지원 정보(이름·전화번호·지역·지원동기)와 개인정보 동의를 입력받아, `POST /api/auth/start`로 사용자 생성/조회 + 세션 토큰을 발급받고 `localStorage`에 세션을 저장한 뒤 학습 진입(`/learn`)으로 보내는 **온라인 실습의 진입/인증 시작 화면** | `app/page.tsx:73-91`, hero/카피 `:111-123,128-134` |

비고:
- 이 화면은 단일 폼 + 마케팅 히어로/하이라이트로 구성된 클라이언트 컴포넌트다. `highlightPoints` 배열(`:9-22`)은 현재 JSX 렌더 영역(`:100-251`)에서 사용되지 않는 선언만 존재(미사용 변수 정황 — §8 참조).
- 디자인 시스템은 `plab-design-system`의 `Button, Input, Select, Badge`를 직접 import해 사용(`:5`). 동의 체크박스만 native `<input type="checkbox">`(`:210-217`).

---

#### 2) 사용자별 가능 기능

| 사용자 유형 | 가능한 기능 | 제한 사항 |
|---|---|---|
| 비인증 방문자(지원자) | 이름·전화번호·지역·지원동기 입력, 개인정보 동의 체크, "시작하기"로 세션 발급 후 `/learn` 진입 | 5개 입력(이름·전화·지역·지원동기·동의) 모두 충족해야 제출 가능(`:38-68`). 서버에서 기존 사용자가 `Completed`면 "이미 완료" 차단, `Blocked`면 "접근 차단"으로 진입 불가(`lib/supabase/users.ts:111-116`) |
| 기 진행 중 사용자(전화번호 재입력) | 동일 폼 제출 시 기존 계정으로 **세션 토큰 재발급** 후 진입 | 전화번호(`phone`)로 식별. UNIQUE 제약(`users.phone`)상 동일 번호는 1계정. 별도 비밀번호 없음 |
| 관리자(Admin) | 이 화면에 관리자 전용 기능 없음 | 해당 없음 — 관리자 진입은 `/admin/login` 별도 화면 |

> 이 화면 자체에는 role 기반 분기가 없다. "가능 기능"의 차이는 전적으로 **제출된 전화번호에 해당하는 기존 사용자의 `status`** 에 의해 서버에서 갈린다(`lib/supabase/users.ts:109-131`).

---

#### 3) 화면 기능 상세

**기능 A. 지원 정보 입력 폼 작성**
- 설명: 이름(`name`), 전화번호(`phone`), 지역(`region`), 지원동기(`applicationReason`), 개인정보 동의(`agreed`)를 입력/선택. 모두 로컬 `useState`로 관리(`:25-31`).
- 트리거 UI: `Input`(이름 `:137-147`, 전화번호 `:149-160`), `Select`(지역 `:162-189` 17개 옵션, 지원동기 `:191-207` 6개 옵션), native checkbox(`:210-221`).
- 입력값:
  - 이름: 자유 텍스트(placeholder "홍길동")
  - 전화번호: `type="tel"`(placeholder "010-1234-5678")
  - 지역: 서울/경기/인천/강원/충북/충남/대전/세종/전북/전남/광주/경북/경남/대구/울산/부산/제주 중 택1(`:172-188`)
  - 지원동기: 친구/지인 추천, SNS/광고를 보고, 금전적 이유, 축구/풋살에 관심이 많아서, 플랩 매니저에 관심이 있어서, 새로운 경험을 해보고 싶어서 중 택1(`:201-206`)
  - 동의: 체크박스 boolean
- 유효성 검증: 제출 시점에만 수행(아래 기능 B). 입력 중 실시간 검증 없음.
- 권한 조건: 없음(누구나).

**기능 B. 폼 제출 / 세션 시작("시작하기")**
- 설명: `handleSubmit`이 클라이언트 검증 통과 후 `POST /api/auth/start` 호출 → 성공 시 세션 `localStorage` 저장 → `/learn`로 이동(`app/page.tsx:33-98`).
- 트리거 UI: `<form onSubmit={handleSubmit}>`(`:136`)의 submit `Button`("시작하기" + `ArrowRight`, `loading` 시 "처리 중...")(`:229-242`).
- 입력값: 폼 state 4종(`name, phone, region, applicationReason`)을 JSON body로 전송. **`agreed`(동의)는 body에 포함되지 않음** — 클라이언트 검증에만 사용(`:78`).
- 유효성 검증(클라이언트, 순서대로, 첫 실패에서 `setError` 후 중단; `:37-68`):
  1. `name.trim()` 빈 값 → "이름을 입력해주세요." (`:38-41`)
  2. `phone.trim()` 빈 값 → "전화번호를 입력해주세요." (`:43-46`)
  3. 전화번호 정규식 `^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$` (공백 제거 후) 불일치 → "올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)" (`:49-53`)
  4. `region` 미선택 → "지역을 선택해주세요." (`:55-58`)
  5. `applicationReason` 미선택 → "지원동기를 선택해주세요." (`:60-63`)
  6. `agreed=false` → "개인정보 수집 및 이용에 동의해주세요." (`:65-68`)
- 유효성 검증(서버): `name`/`phone` 누락 시 400, `region`/`applicationReason` 누락 시 400(`route.ts:10-28`). 전화번호 형식·동의 여부는 서버에서 재검증하지 않음(§6 보안 주의점).
- 성공 시 동작:
  1. 응답 `data.data.session`(`Session` 객체) 전체를 `localStorage.setItem('session', ...)`로 저장(`:88`).
  2. `router.push('/learn')`로 학습 화면 이동(`:91`).
- 실패 시 동작:
  - `response.ok=false`면 `data.error`(없으면 "오류가 발생했습니다.")로 throw → catch에서 `error` state에 메시지 세팅(`:83-94`).
  - 에러 메시지는 폼 내 빨강 박스로 인라인 표시(`:223-227`). 별도 페이지 에러 바운더리 아님(`error.tsx` 부재 — §6/§7).
  - `finally`에서 `loading=false` 해제(`:95-97`).
  - 제출 중(`loading=true`) 모든 입력/버튼 `disabled`(`:146,159,170,199,216,233`).
- 권한 조건: 없음. 단 서버가 전화번호 기준 기존 사용자 `status`로 차단(Completed/Blocked → throw → 500 + 에러 메시지, `users.ts:111-116`, `route.ts:46-56`).

> **로딩/에러 상태**: 이 화면은 `loading`(버튼 텍스트 "처리 중..."+disabled)과 `error`(인라인 박스) 두 상태를 page 내부에서 자체 처리한다. empty 상태는 폼 화면 특성상 비해당. 라우트 레벨 `loading.tsx`/`error.tsx`는 없음(공통 §5).

---

#### 4) 백엔드 API / Supabase 명세

이 화면이 실제로 호출하는 백엔드는 **`POST /api/auth/start` 단 하나**다(`app/page.tsx:73`). 그 외 후보 API는 이 화면에서 호출하지 않는다.

| 기능 | Method · Query | Endpoint · Table | Request (params/body) | Response 구조 | Error Case | 인증 필요 | role/권한 | 관련 RLS |
|---|---|---|---|---|---|---|---|---|
| 세션 시작(사용자 생성/조회 + 토큰 발급) | `POST` (HTTP body) | Endpoint: `/api/auth/start` · Table: `users`(R+W) | body `{ name, phone, region, applicationReason }`(JSON). 동의값 미포함 | 성공 200: `{ success: true, data: { session: { userId, userName, userPhone, sessionToken }, user: <DbUser 전체> } }` (`route.ts:39-45`, `Session` 타입 `types/index.ts:29-34`) | 400: name/phone 누락(`route.ts:10-18`) · 400: region/applicationReason 누락(`:20-28`) · 500: `createOrGetUser` throw 시 `error.message` 그대로 노출 — "이미 온라인 실습을 완료하셨습니다."(Completed) / "접근이 차단된 사용자입니다."(Blocked) / "사용자 정보를 처리할 수 없습니다." 등(`users.ts:111-116,127,202`, `route.ts:46-56`) | 불필요(비인증 진입점) | 없음(공개). 서버는 `supabaseAdmin`(service_role) 사용 | service_role 전용 `FOR ALL` 정책만 존재 → service_role은 RLS 우회(공통 DB §4). anon/authenticated는 전면 거부 |

API 내부 호출 흐름(근거):
- `route.ts:30` → `createOrGetUser(name, phone, region, applicationReason)` (`users.ts:99-149`).
  - `findUserByPhone(phone)`로 기존 사용자 조회(normalized+original 후보를 `.in()` 파라미터화, `users.ts:79-97`).
  - 기존 사용자 + `status==='Completed'` → throw(`:111-113`), `'Blocked'` → throw(`:114-116`). 그 외(예: In Progress)면 `session_token`만 새로 발급해 update 후 반환(`:118-130`).
  - 신규면 `tryCreateUser`로 insert. `region`/`application_reason` 컬럼 에러 시 해당 필드 제거·원문 복원하며 **최대 3회 재시도**(`:157-203`).
- 응답 `session.sessionToken`은 `user.session_token || ''`(`route.ts:36`).

> **주의(정답/민감정보 노출 아님, 단 user 전체 반환)**: 응답 `data.user`에 `DbUser` 전체가 실린다(`route.ts:43`). 여기에는 `session_token`, `id`(UUID), `phone`, `region`, `application_reason`, `status` 등이 포함된다. `session_token`은 `session`에도 별도로 들어가므로 클라이언트가 알아야 하는 값이지만, 화면은 `data.data.session`만 저장하고(`page.tsx:88`) `data.user`는 사용하지 않는다 — 응답 본문에 불필요하게 전체 user가 노출됨(§6 보안 주의점).

---

#### 5) 데이터베이스 연관 정보

| 항목 | 내용 | 근거 |
|---|---|---|
| 사용 Table | `users` (단일) | `users.ts:99-149` |
| Views / RPC | 없음 | — |
| 주요 컬럼 | `id`(UUID PK), `name`(NOT NULL), `phone`(NOT NULL, **UNIQUE**), `region`(nullable), `application_reason`(nullable), `status`('In Progress'\|'Completed'\|'Blocked', 기본 'In Progress'), `session_token`(nullable), `total_study_time`(기본 0), `created_at` | 공통 DB §1.3, `users.ts:5-19` |
| 관계 | 이 화면 경로에서는 `users` 단일 테이블만 사용(다른 테이블 조인/쓰기 없음). `users.current_chapter_id → chapters`(NO ACTION) FK는 이 흐름에서 미사용 | 공통 DB §1.3, §2 |
| 사용 목적 | (1) 전화번호로 기존 사용자 조회 (2) 없으면 신규 insert (3) 있으면 `session_token` update | `users.ts:109-148` |
| 읽기/쓰기 | **읽기**: `findUserByPhone`(SELECT, `users.ts:79-97`) · **쓰기**: 신규 INSERT(`tryCreateUser`, `:162-166`) 또는 기존 UPDATE(`session_token`, `:119-124`) | — |

부가 처리(쓰기 전 정규화):
- `normalizePhoneNumber`(숫자·`+`만, `users.ts:61-63`)로 정규화 후 저장.
- `mapRegion`/`mapApplicationReason`(상수 맵 정규화, `users.ts:65-77`)로 매핑. 매핑 실패/없을 시 해당 필드 생략 또는 원문 복원 재시도(`:140-148,157-203`).
- 신규 사용자 `status`는 항상 `'In Progress'`로 생성(`:137`).

---

#### 6) 권한 및 보안 정책

| 항목 | 내용 | 근거 |
|---|---|---|
| 로그인 필요 여부 | 불필요 — 이 화면이 학습자 "세션"을 최초 발급하는 진입점 | `app/page.tsx`(가드 없음), `route.ts`(인증 검사 없음) |
| role 기반 접근 제어 | 없음. 화면/이 API에 role 분기 없음 | — |
| RLS 적용 | 서버가 `supabaseAdmin`(service_role)로 접근 → **RLS 우회**. anon/authenticated 직접 접근은 RLS로 전면 거부됨(브라우저에서 직접 `users` 접근 불가) | 공통 DB §4, 공통(데이터레이어) §0 |
| 본인 데이터 한정 | 해당 없음(가입/세션 발급 단계). 단 식별이 **전화번호 1요소**뿐 — 비밀번호/OTP 없이 전화번호만 알면 그 번호의 계정으로 세션 토큰을 재발급받을 수 있음(`users.ts:109-130`) | `users.ts:109-130` |
| 관리자 전용 기능 | 없음 | — |

보안 주의점 / 코드상 잠재적 권한·노출 취약점:
1. **세션 토큰 클라이언트 평문 저장**: 발급된 `Session`(토큰 포함)을 `localStorage.setItem('session', ...)`에 저장(`page.tsx:88`). `httpOnly`/`secure` 보호가 없어 XSS 시 토큰 탈취·JS 변조 가능. 공통 인프라(인증 §2.2) 결론과 동일.
2. **API 응답에 `DbUser` 전체 반환**: `route.ts:43`이 `user`(session_token·UUID·phone·region·application_reason·status 전체)를 응답에 포함. 화면은 사용하지 않으므로(`page.tsx:88`은 `session`만 사용) 불필요한 민감정보 과다 노출. 응답을 `session`으로 한정 권장(개선 여지).
3. **서버측 입력 검증 부분 누락**: 서버는 필수값 존재만 확인(`route.ts:10-28`). **전화번호 형식 검증·개인정보 동의(`agreed`) 검증은 클라이언트에만 존재**(`page.tsx:49-53,65-68`), body에 `agreed`도 미전송(`:78`). 따라서 API 직접 호출 시 형식이 틀린 전화번호·미동의 상태로도 사용자 생성이 가능. 코드 품질 규칙(server-side validation 필수)과 충돌.
4. **에러 메시지 그대로 노출**: `route.ts:47`이 `error.message`를 응답 `error`로 그대로 반환. `tryCreateUser`가 throw하는 DB 원본 메시지(`users.ts:202`)가 클라이언트에 노출될 수 있음(내부 정보 누출 여지 — 메시지 매핑 정책 확인 필요).
5. **계정 식별이 전화번호 단일 요소**: 비밀번호/인증코드 없이 전화번호만으로 기존 계정 세션을 재발급(`users.ts:109-130`). 타인 전화번호 입력 시 그 계정의 진행 컨텍스트로 진입 가능(계정 도용 표면). 단 Completed/Blocked는 차단됨.
6. **개인정보 처리**: 이름·전화번호·지역·지원동기 등 PII를 수집·저장. 화면은 "개인정보 수집 및 이용에 동의"(필수) 체크로만 동의를 받으며(`page.tsx:218-220`), 동의 사실은 DB에 별도 기록되지 않음(`users` 스키마에 동의 컬럼 없음 — 공통 DB §1.3). 동의 이력 보관 필요 여부 확인 권장.

---

#### 7) 화면 간 이동 흐름

- 진입 경로:
  - 직접 URL `/`(서비스 루트). 별도 진입 게이트 없음.
  - 다른 화면에서 "나가기"/"로그아웃" 시 이 화면으로 복귀: `ProgressHeader`의 나가기 → `localStorage.removeItem('session')` + `router.push('/')`(공통 인프라 인증 §2.2, `ProgressHeader.tsx:23-32`), `app/complete` 완료 처리(`app/complete/page.tsx:61`) 등.
- 다음 이동 가능 화면:
  - 제출 성공 시 → `/learn`(학습 챕터 목록/대시보드)로 `router.push`(`page.tsx:91`).
- redirect 조건:
  - 성공 응답(`response.ok=true`)일 때만 `/learn` 이동. 실패 시 이동 없이 현재 화면에서 에러 표시(`:83-94`).
  - 이 화면은 마운트 시 기존 세션(`localStorage`)을 검사해 자동 리다이렉트하는 로직이 **없다** — 이미 세션이 있어도 `/`에 머문다(자동 진입 없음). (§8 확인 필요: 의도 여부)
- 인증·권한 실패 시 이동 경로:
  - 서버가 Completed/Blocked로 throw하면 화면 이동 없이 에러 메시지만 표시(이동 경로 없음).
  - 라우트 레벨 인증 리다이렉트는 없음(`middleware.ts` 부재). 모든 분기는 이 페이지 클라이언트 코드 내에서 처리.

---

#### 8) 확인 필요 사항

| # | 확인 불가/불명 항목 | 이유 | 추가로 봐야 할 파일 | 개발자 확인 질문 |
|---|---|---|---|---|
| 1 | 마운트 시 기존 `localStorage.session` 검사 후 `/learn` 자동 리다이렉트가 없는 것이 의도인지 | `page.tsx`에 `useEffect`/세션 검사 코드 없음. 재방문 사용자가 매번 폼을 다시 입력해야 함 | `app/page.tsx`, `app/learn/page.tsx` | 이미 세션이 있는 사용자가 `/`에 오면 자동으로 `/learn`로 보내야 하나요, 아니면 매번 재입력이 정책인가요? |
| 2 | `highlightPoints` 배열(`page.tsx:9-22`)이 선언만 되고 렌더에 미사용 | JSX(`:100-251`)에서 참조 없음. 의도된 미완성 UI인지 dead code인지 불명 | `app/page.tsx` | 하이라이트 3종을 히어로에 렌더할 예정인가요, 제거 대상인가요? |
| 3 | API 응답에 `data.user`(DbUser 전체)를 포함하는 것이 필요한지 | 화면은 `session`만 사용(`:88`). 민감정보 과다 노출 가능 | `app/api/auth/start/route.ts` | 응답에서 `user`를 제거하고 `session`만 내려도 되나요? |
| 4 | 서버에서 전화번호 형식·동의 여부를 재검증하지 않아도 되는지 | 클라이언트 검증만 존재, body에 `agreed` 미전송 | `app/api/auth/start/route.ts`, `lib/supabase/users.ts` | 형식 검증·동의 강제를 서버에도 넣어야 하나요? 동의 이력을 DB에 남겨야 하나요? |
| 5 | 전화번호 단일 식별의 계정 도용 표면을 허용 정책으로 둘지 | 비밀번호/OTP 없이 전화번호만으로 세션 재발급(`users.ts:109-130`) | `lib/supabase/users.ts`, 인증 정책 문서 | 본인 확인(인증코드 등)을 추가할 계획이 있나요? |
| 6 | 500 응답으로 내려가는 `error.message`(DB 원문 가능)의 사용자 노출 정책 | `route.ts:47`이 message 그대로 노출 | `app/api/auth/start/route.ts`, `lib/supabase/users.ts:202` | 사용자 대상 에러 메시지를 매핑/마스킹해야 하나요? |
| 7 | 라우트 레벨 `loading.tsx`/`error.tsx` 부재로 인한 4상태 보장 책임 | 공통 인프라상 부재 확정. 이 화면은 자체 loading/error 처리하나 전역 에러 바운더리 없음 | `app/` 디렉토리 | 전역 `error.tsx`를 도입할 계획이 있나요? |


### 2.2 학습 홈

> 근거 파일(절대경로):
> - 화면: `/Users/larkkim/manager-online-training/.claude/worktrees/upbeat-gates-ad9e3c/app/learn/page.tsx`
> - API: `/Users/larkkim/manager-online-training/.claude/worktrees/upbeat-gates-ad9e3c/app/api/chapters/list/route.ts`, `/Users/larkkim/manager-online-training/.claude/worktrees/upbeat-gates-ad9e3c/app/api/progress/get/route.ts`
> - 데이터 레이어(교차 근거): `lib/supabase/chapters.ts:18-30`(`getActiveChapters`), `lib/supabase/progress.ts:63-76`(`getAllUserProgress`)
>
> 모든 핵심 주장에 `파일:줄번호` 근거를 단다. 코드로 단정 불가한 항목은 8) 확인 필요 사항으로 분리한다.

---

#### 1) 화면 기본 정보

| 항목 | 내용 | 근거 |
|---|---|---|
| 화면명 | 학습 홈 (학습 진입/라우팅 디스패처) | — |
| Route | `/learn` | `app/learn/page.tsx` (디렉토리 위치) |
| 컴포넌트 경로 | `app/learn/page.tsx` `LearnPage` (`'use client'`) | `app/learn/page.tsx:1,8` |
| 접근 가능 사용자 유형 | 학습자(응시자) — `localStorage`에 `session`이 있는 사용자. 없으면 진입 즉시 `/`로 리다이렉트 | `app/learn/page.tsx:16-20` |
| 접근 조건 | 클라이언트 측 게이트만 존재. `localStorage.getItem('session')` 존재 여부로 판정. **서버/미들웨어 게이트 없음**(프로젝트에 `middleware.ts` 부재) | `app/learn/page.tsx:16-20` |
| 화면 목적 | UI를 거의 그리지 않는 **라우팅 디스패처**. 활성 챕터 목록과 사용자 진행도를 받아 "다음에 학습할 챕터"를 계산한 뒤 `/learn/chapter/[id]`로 즉시 리다이렉트한다. 정상 흐름에서는 로딩 화면만 잠깐 보이고 본문 렌더는 `null`이다 | `app/learn/page.tsx:42-54, 132` |

핵심 동작 흐름(`app/learn/page.tsx:14-63`):
1. 마운트 시 `localStorage`의 `session`을 읽음. 없으면 `/`로 push 후 종료(`:16-20`).
2. `session`을 `JSON.parse`해 state에 저장(`:22-23`).
3. `GET /api/chapters/list` 호출 → 실패하거나 `data.length === 0`이면 에러 상태로 전환(`:26-33`).
4. `GET /api/progress/get?userId=...` 호출(`:37-40`).
5. 진행도가 있으면 `chapter_completed === true`인 챕터를 제외하고 첫 미완료 챕터를 `nextChapter`로, 없으면 마지막 챕터를 선택(`:44-52`). 진행도가 없으면 `chapters[0]`(`:42`).
6. `/learn/chapter/${nextChapter.id}`로 push(`:54`).
7. 위 과정 중 throw 발생 시 catch에서 에러 상태로 전환(`:55-59`).

---

#### 2) 사용자별 가능 기능

| 사용자 유형 | 가능한 기능 | 제한 사항 |
|---|---|---|
| 학습자(세션 보유) | 자동으로 다음 학습 챕터로 라우팅됨. 챕터 없음/오류 시 안내 카드 + 새로고침 버튼 사용 | 이 화면에서 직접 조작 가능한 입력은 "새로고침" 버튼뿐. 챕터 선택·진행도 변경 등 쓰기 동작 없음 | 
| 미인증 사용자(세션 없음) | 없음 — 진입 즉시 `/`로 리다이렉트 | 화면 콘텐츠를 전혀 보지 못함(클라이언트 가드, `:17-20`) |
| 관리자 | 별도 구분 없음 — 이 화면은 학습자 전용. 관리자가 `session`을 갖고 있으면 동일하게 학습자로 취급됨 | 관리자 전용 기능 없음 |

> 권한 분기는 코드 레벨에 **role 개념이 없다**. 오직 `session` 존재 여부만 판정한다(`:16-20`). 세션 안의 어떤 필드도 권한 검사에 쓰이지 않음.

---

#### 3) 화면 기능 상세

**기능 A — 세션 가드 & 진입 라우팅**
- 설명: 마운트 시 `localStorage`의 `session`을 확인해 미인증이면 `/`로 보낸다.
- 트리거 UI: 없음(컴포넌트 마운트 시 `useEffect` 자동 실행, `:14,62`).
- 입력값: `localStorage.getItem('session')` (`:16`).
- 유효성 검증: 존재 여부만 확인. `JSON.parse`로 파싱하나 **parse 실패에 대한 개별 try/catch는 없다** — 파싱이 try 블록 안(`:22`)에 있어 throw 시 일반 catch(`:55-59`)로 떨어져 "학습을 시작할 수 없습니다" 에러로 처리됨.
- 성공 시 동작: `session` state 저장 후 데이터 로드로 진행(`:22-26`).
- 실패 시 동작: 세션 없음 → `router.push('/')` 후 함수 종료(`:17-20`).
- 권한 조건: 클라이언트 측 세션 존재 여부만. 서버 검증 없음.

**기능 B — 활성 챕터 목록 조회**
- 설명: 활성 챕터 전체를 `order` 오름차순으로 받아 다음 챕터 계산의 기준 목록으로 사용.
- 트리거 UI: 없음(마운트 자동, `:26`).
- 입력값: 없음(쿼리/바디 파라미터 없음).
- 유효성 검증: 응답의 `success` 플래그 + `data.length` 검사(`:29`).
- 성공 시 동작: `chapters` 배열을 다음 챕터 계산에 사용(`:35`).
- 실패 시 동작: `success`가 false거나 `data.length === 0`이면 `error='챕터가 없습니다. 챕터를 추가해주세요.'` 설정 후 로딩 해제(`:30-32`). (네트워크/JSON 예외는 기능 D catch로)
- 권한 조건: 없음(공개 호출, 인증 불요).

**기능 C — 사용자 진행도 조회 & 다음 챕터 계산**
- 설명: `userId`로 진행도 목록을 받아, 완료되지 않은 첫 챕터를 다음 학습 대상으로 계산.
- 트리거 UI: 없음(마운트 자동, `:37`).
- 입력값: `parsedSession.userId`를 query string으로 전달(`:38`).
- 유효성 검증: 응답 `success` + `data.length > 0` 확인(`:44`).
- 성공 시 동작: `chapter_completed`인 챕터 id를 모아(`:45-47`) 미포함 첫 챕터를 선택, 모두 완료면 마지막 챕터 fallback(`:49-51`). 진행도가 없으면 `chapters[0]`(`:42`).
- 실패 시 동작: `progressData.success`가 false면 `if` 블록을 건너뛰어 **에러 없이 `chapters[0]`로 진행**(`:42,44`). 즉 진행도 조회 실패는 "진행 없음"과 동일하게 흡수됨(아래 6)·8) 참조).
- 권한 조건: 서버가 `userId` 소유권을 검증하지 않음. 클라이언트가 보낸 `userId`를 그대로 신뢰(`progress/get/route.ts:7-20`).

**기능 D — 다음 챕터로 리다이렉트**
- 설명: 계산된 `nextChapter.id`로 챕터 학습 화면 이동.
- 트리거 UI: 없음(자동, `:54`).
- 입력값: `nextChapter.id`.
- 유효성 검증: 없음(계산 결과를 그대로 사용).
- 성공 시 동작: `router.push('/learn/chapter/${nextChapter.id}')` (`:54`).
- 실패 시 동작: 위 A~C 흐름 중 예외 발생 시 catch에서 `console.error` + `error='학습을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.'` + 로딩 해제(`:55-59`).
- 권한 조건: 없음.

**기능 E — 에러/로딩 UI & 새로고침**
- 설명: 로딩 스피너, 챕터 없음/오류 안내 카드(준비 1~3 가이드)와 새로고침 버튼 제공.
- 트리거 UI: "새로고침" Button (`plab-design-system`, `:119-126`).
- 입력값: 없음.
- 유효성 검증: 없음.
- 성공 시 동작: `window.location.reload()`로 페이지 전체 재로딩(`:122`).
- 실패 시 동작: 해당 없음.
- 권한 조건: 없음.
- 비고: 4상태 중 loading(`:65-76`)·error(`:78-130`)는 화면 자체가 처리. loaded는 정상 흐름에서 리다이렉트되므로 본문은 `null`(`:132`). empty(챕터 0건)는 error 상태로 합쳐 표현(`:29-32`).

---

#### 4) 백엔드 API / Supabase 명세

이 화면이 **실제로 호출하는 fetch는 2개**다(`app/learn/page.tsx:26,37`). 후보 중 그 외 호출은 없다(쓰기 API 호출 없음).

| 기능 | Method·Query | Endpoint·Table | Request (params/body) | Response 구조 | Error Case | 인증 필요 | role/권한 | 관련 RLS |
|---|---|---|---|---|---|---|---|---|
| 활성 챕터 목록 조회 (기능 B) | GET / Supabase `.select().eq('status','Active').order('order')` | `GET /api/chapters/list` · table `chapters` | 없음 | `{ success: true, data: DbChapter[] }` (`chapters/list/route.ts:9-12`) | 데이터 레이어 throw 시 `{ success:false, error:string }` + 500 (`route.ts:13-22`). 빈 배열은 200이며 화면이 `data.length===0`을 에러로 처리(`page.tsx:29-32`) | 불요(가드 없음) | 없음(공개) | service_role 전용 `FOR ALL` 정책. `supabaseAdmin`(service_role)으로 RLS 우회 접근 |
| 사용자 진행도 조회 (기능 C) | GET / Supabase `.select('*').eq('user_id', userId)` | `GET /api/progress/get?userId={uuid}` · table `user_progress` | query: `userId`(string, 필수) | `{ success: true, data: DbUserProgress[] }` (`progress/get/route.ts:22-25`) | `userId` 없으면 `{success:false,error:'사용자 ID가 필요합니다.'}` + 400 (`route.ts:10-18`). 데이터 레이어 예외 시 500. **단 `getAllUserProgress`는 내부 에러 시 빈 배열 반환**이라 500은 사실상 거의 안 남(`progress.ts:63-76`) | 불요(세션 토큰 검증 없음) | 없음 — `userId`를 클라이언트 입력으로 신뢰 | service_role 전용 `FOR ALL`. RLS 우회. **행 단위 소유권 검증 없음(IDOR)** |

Request/Response 근거 상세:
- `chapters/list`: 핸들러는 파라미터를 전혀 읽지 않고 `getActiveChapters()` 결과를 그대로 `data`에 담는다(`chapters/list/route.ts:5-12`). `getActiveChapters`는 `status='Active'`, `order` 오름차순(`chapters.ts:18-30`).
- `progress/get`: `searchParams.get('userId')`만 사용(`progress/get/route.ts:7-8`). `getAllUserProgress(userId)`는 `user_id`로 필터한 `DbUserProgress[]`를 반환하고, 쿼리 에러 시 throw가 아니라 **빈 배열**을 반환(`progress.ts:63-76`).
- 화면이 사용하는 응답 필드: `DbChapter.id`(`page.tsx:50-54`), `DbUserProgress.chapter_completed`·`chapter_id`(`page.tsx:46-47`). 그 외 필드는 이 화면에서 미사용.

---

#### 5) 데이터베이스 연관 정보

| 항목 | 내용 | 근거 |
|---|---|---|
| Tables | `chapters`(읽기), `user_progress`(읽기) | `chapters/list`→`getActiveChapters`, `progress/get`→`getAllUserProgress` |
| Views / RPC | 없음 | 두 데이터 함수 모두 일반 `.select()` 쿼리 |
| 주요 컬럼 (chapters) | `id`, `status`(='Active' 필터), `"order"`(정렬 키). 화면은 `id`만 직접 사용 | `chapters.ts:22-26`, `page.tsx:50-54` |
| 주요 컬럼 (user_progress) | `user_id`(필터), `chapter_id`, `chapter_completed`(boolean). 화면은 `chapter_id`·`chapter_completed`만 사용 | `progress.ts:67-69`, `page.tsx:46-47` |
| 관계 | `user_progress.chapter_id → chapters.id`(FK, ON DELETE CASCADE). 화면은 진행도의 `chapter_id`를 챕터 목록과 매칭해 미완료 챕터를 찾음 | 공통 인프라 §2 / `page.tsx:45-52` |
| 사용 목적 | "다음에 학습할 챕터" 결정 — 활성 챕터 순서 × 완료 진행도 교집합 계산 | `page.tsx:42-52` |
| 읽기/쓰기 | **읽기 전용(read-only)**. 이 화면은 어떤 테이블에도 쓰지 않음(쓰기 API 호출 없음) | `page.tsx` 전체에 POST/PATCH 호출 없음 |

---

#### 6) 권한 및 보안 정책

- **로그인 필요 여부**: 명목상 필요(세션 없으면 `/`로 리다이렉트, `:17-20`). 단 가드는 **클라이언트 전용**이며, `localStorage`에 임의의 `session` JSON을 넣으면 진입 가능. 서버/미들웨어 강제 없음(`middleware.ts` 부재).
- **role 기반 접근 제어**: 없음. 코드에 role 분기 자체가 없다.
- **RLS 적용**: 두 API 모두 `supabaseAdmin`(service_role)으로 동작해 **RLS를 우회**한다(공통 인프라 §4). 따라서 RLS에 의한 행 단위 보호가 작동하지 않는다.
- **본인 데이터 한정 여부**: **미보장**. `progress/get`은 query의 `userId`를 그대로 사용해 진행도를 조회하며, 그 `userId`가 요청자 본인인지(세션 토큰 대조 등) 검증하지 않는다(`progress/get/route.ts:7-20`). → 전형적 IDOR. 임의 `userId`(UUID)를 알면 타인의 진행도 조회 가능.
- **관리자 전용 기능**: 없음.
- **보안 주의점**:
  1. `session.userId`가 `localStorage`에 평문 저장되고 query string으로 평문 전달됨(`page.tsx:38`). URL/로그에 노출될 수 있음.
  2. 세션 토큰(`Session.sessionToken`)을 이 화면은 **어떤 호출에도 보내지 않는다** — 서버가 검증하지 않으니 보낼 이유도 없는 구조(공통 인프라 §2.3).
- **코드상 잠재적 권한 취약점**:
  - (High) **IDOR**: `GET /api/progress/get?userId=`가 소유권 검증 없이 클라이언트 `userId`로 진행도를 반환. 화면은 본인 것만 보내지만, 엔드포인트 자체가 타인 `userId`로도 응답하므로 화면을 거치지 않은 직접 호출로 타인 진행도 열람 가능(`progress/get/route.ts:7-20`, RLS 우회).
  - (Medium) **클라이언트 전용 인증 가드**: `/learn` 진입 보호가 `localStorage` 존재 여부에만 의존(`page.tsx:16-20`). 미들웨어/서버 가드 부재로 우회 가능. 다만 이 화면 자체는 민감 데이터를 렌더하지 않고 곧장 리다이렉트하므로 노출 영향은 제한적.

---

#### 7) 화면 간 이동 흐름

- **진입 경로**:
  - `/`(로그인/세션 시작) 이후 학습 시작 동선으로 진입(추정 — `/` 본문 미독, 8) 참조).
  - URL 직접 입력으로도 진입 가능(서버 가드 없음).
- **다음 이동 가능 화면**:
  - 정상: `/learn/chapter/[id]` — 계산된 다음 챕터로 `router.push`(`:54`).
  - 미인증: `/` — `router.push('/')`(`:18`).
- **redirect 조건**:
  - `session` 없음 → `/`(`:17-20`).
  - 챕터·진행도 정상 → `/learn/chapter/{nextChapter.id}`(`:42-54`).
  - 모든 챕터 완료 → 마지막 챕터로 이동(`:51`). (전체 완료 시 `/complete`로 보내는 분기는 이 화면엔 없음 — 8) 참조)
- **인증·권한 실패 시 이동 경로**: 세션 미존재만 `/`로 처리(`:18`). 진행도 조회 실패는 리다이렉트가 아니라 `chapters[0]`로 흡수(`:42`). 챕터 0건/예외는 이동 없이 에러 카드 표시(`:30-32, 57`).

---

#### 8) 확인 필요 사항

| 항목 | 이유 | 추가로 봐야 할 파일 | 개발자 확인 질문 |
|---|---|---|---|
| `/learn` 진입 출처 | 이 화면 코드만으로는 어느 화면이 `/learn`으로 보내는지 단정 불가 | `app/page.tsx` 본문(특히 인증 성공 후 라우팅) | 로그인 성공 후 `/learn`으로 보내는 게 맞는가? |
| 전체 완료 시 동선 | 모든 챕터 완료 시 이 화면은 마지막 챕터로 보냄(`:51`). `/complete`로 보내는 책임이 어디 있는지 불명 | `app/learn/chapter/[id]/*`, `app/complete/page.tsx` | 전체 완료 사용자를 `/complete`로 보내는 분기는 챕터/결과 화면에 있는가? |
| 진행도 조회 실패의 사용자 영향 | `getAllUserProgress`가 에러 시 빈 배열 반환(`progress.ts:63-76`)이라, DB 장애 시 "진행 없음"으로 오인되어 항상 1챕터로 보낼 위험 | `lib/supabase/progress.ts:63-76` | 진행도 로드 실패를 조용히 무시(`chapters[0]`)하는 게 의도인가, 에러 노출이 맞는가? |
| `JSON.parse(session)` 손상 처리 | 손상된 `session` 문자열이면 parse가 throw → "학습을 시작할 수 없습니다" 에러로 빠짐. 손상 시 `/`로 보내는 게 더 자연스러울 수 있음 | `app/learn/page.tsx:22` | 손상된 세션은 에러 카드 대신 재로그인(`/`) 유도가 맞지 않나? |
| `userId` IDOR 방어 위치 | MEMORY에는 토큰 기반 방어 적용 기록이 있으나 현 워크트리 코드엔 없음(공통 인프라 §2.4/§6) | `app/api/progress/get/route.ts`, `lib/supabase/users.ts` | 진행도 조회를 세션 토큰→userId 도출로 바꿀 계획이 있는가? |


### 2.3 챕터 영상 시청

> 근거 파일(절대경로):
> - 화면: `/Users/larkkim/manager-online-training/.claude/worktrees/upbeat-gates-ad9e3c/app/learn/chapter/[id]/page.tsx`
> - API: `app/api/chapters/list/route.ts`, `app/api/progress/get/route.ts`, `app/api/progress/save/route.ts`
> - 데이터 레이어: `lib/supabase/chapters.ts`, `lib/supabase/progress.ts`, `lib/supabase/questions.ts`
> - 컴포넌트: `components/ui/VideoPlayer.tsx`
>
> 본 화면은 위 3개 API만 실제로 호출한다(코드 근거 후술). 후보 외 다른 학습자 API(`progress/complete`, `answer/submit` 등)는 이 화면에서 호출하지 않는다.

---

#### 1) 화면 기본 정보

| 항목 | 내용 | 근거 |
|---|---|---|
| 화면명 | 챕터 영상 시청 | — |
| Route | `/learn/chapter/[id]` (동적 세그먼트 `[id]` = 챕터 UUID) | `page.tsx:12,14-15` |
| 컴포넌트 경로 | `app/learn/chapter/[id]/page.tsx` (`ChapterPage`, `'use client'`) | `page.tsx:1,12` |
| 접근 가능 사용자 유형 | 학습자(세션 보유자). 클라이언트 가드만 존재 — `localStorage`에 `'session'` 키가 있어야 진입 유지 | `page.tsx:27-31` |
| 접근 조건 | 마운트 시 `localStorage.getItem('session')`이 없으면 즉시 `/`로 리다이렉트. 있으면 파싱해 `session` state로 보관 후 데이터 로드 | `page.tsx:27-34` |
| 화면 목적 | 특정 챕터의 학습 영상을 재생/진행률 추적하고, 필수 시청률 달성 시 다음 단계(퀴즈)로 진입하도록 한다. 챕터별 학습 진행 상황(완료/현재/대기)과 전체 진행률을 함께 표시 | `page.tsx:197-203,221-249,253-326` |

추가 사실:
- 이 화면은 서버 컴포넌트가 아니라 client component이며, 데이터는 마운트 후 `useEffect` 안에서 클라이언트 `fetch`로 가져온다(`page.tsx:25-85`).
- 라우트 레벨 인증 게이트(`middleware.ts`) 부재 — URL 직접 접근을 서버에서 막지 않으며, 보호는 위 클라이언트 가드(`page.tsx:28-31`)에만 의존(공통 인프라 §라우팅 근거).
- 라우트 레벨 `error.tsx`/`loading.tsx` 부재 — 4상태는 이 페이지가 자체 처리한다. loading(`page.tsx:117-126`), error(`page.tsx:128-142`), loaded(`page.tsx:160-329`)는 페이지 내부에 존재. empty(예: 챕터 0개)는 별도 분기 없이 error 또는 loaded로 흡수된다(후술 §8 확인 필요).

---

#### 2) 사용자별 가능 기능

| 사용자 유형 | 가능한 기능 | 제한 사항 |
|---|---|---|
| 학습자(세션 보유) | 챕터 영상 시청·진행률 추적, 학습 자료(Markdown) 열람, 챕터 진행 상황/전체 진행률 확인, 필수 시청률 달성 후 퀴즈로 이동, 나가기(세션 종료) | 영상 진행률이 `required_watch_percentage`(미설정 시 60%) 미만이면 "다음(문제풀이)" 버튼 비활성(`disabled`). 영상 스킵 불가(VideoPlayer가 되돌림) | `page.tsx:197-249`, `VideoPlayer.tsx:142-145` |
| 비로그인(세션 없음) | 없음 | 마운트 즉시 `/`로 리다이렉트되어 콘텐츠 비노출(단, 라우트 가드가 아닌 클라이언트 가드) | `page.tsx:27-31` |
| 관리자 | (이 화면 대상 아님) | 별도 어드민 화면 사용. 이 화면은 학습자 전용 | — |

> 주의: "비로그인 접근 불가"는 클라이언트 측 보장일 뿐이다. `middleware.ts`가 없어 서버에서 진입을 차단하지 않으므로, 가드 로직이 깨지면 콘텐츠가 노출될 수 있다(공통 인프라 §라우팅).

---

#### 3) 화면 기능 상세

**(가) 화면 초기 로드 (세션 확인 + 챕터/진행도 조회)**
- 설명: 마운트 시 세션을 확인하고, 활성 챕터 목록과 사용자 진행도를 받아 현재 챕터·완료 챕터·영상 시청 완료 여부를 계산한다.
- 트리거 UI: 없음(마운트 시 `useEffect` 자동 실행) — `page.tsx:25-85`.
- 입력값: `params.id`(URL의 챕터 UUID, `page.tsx:15`), `localStorage 'session'`(`Session`)에서 `userId`(`page.tsx:33,54`).
- 유효성 검증:
  - 세션 없음 → `/`로 리다이렉트(`page.tsx:28-31`).
  - `GET /api/chapters/list` 응답 `success` false → throw `'챕터 목록을 불러올 수 없습니다.'`(`page.tsx:40-42`).
  - 챕터 목록에서 `c.id === chapterId` 미발견 → throw `'챕터를 찾을 수 없습니다.'`(`page.tsx:47-50`).
- 성공 시 동작: `allChapters`/`chapter` 세팅(`page.tsx:45,51`), 진행도에서 `chapter_completed===true`인 항목의 `order`를 모아 `completedChapters`로(`page.tsx:58-65`), 현재 챕터 진행도의 `video_watched===true`면 `videoCompleted=true`로(`page.tsx:67-73`), `loading=false`(`page.tsx:76`).
- 실패 시 동작: `catch`에서 `error` state에 메시지 저장 + `loading=false` → 에러 화면 렌더(`page.tsx:77-81,128-142`).
- 권한 조건: 세션 존재만 필요(서버는 `userId` 소유권을 검증하지 않음 — §6 참조).

**(나) 영상 재생 및 진행률 자동 저장**
- 설명: `VideoPlayer`가 YouTube IFrame으로 영상을 재생하고, 시청 진행 시 콜백으로 진행률을 부모에 전달한다. 부모는 이를 서버에 저장한다.
- 트리거 UI: `VideoPlayer`(영상 재생). 재생 중 약 1초 주기로 `onProgressUpdate(currentSeconds, percentage)` 호출(최대 시청 시간이 갱신될 때만) — `VideoPlayer.tsx:136-156`.
- 입력값: `handleProgressUpdate(watchTime, percentage)`(`page.tsx:87-90`) → `POST /api/progress/save` body `{ userId, chapterId, watchTime, isWatched }`(`page.tsx:94-103`). `isWatched`는 `percentage >= (chapter?.required_watch_percentage || 60)`로 클라이언트가 계산해 보냄(`page.tsx:101`).
- 유효성 검증: 화면 측은 `if (!session) return`만 검증(`page.tsx:91`). 서버는 `userId`/`chapterId` 필수 체크 후, **클라이언트가 보낸 `isWatched`를 신뢰하지 않고 `watchTime`을 `[0, duration]`으로 clamp해 시청률을 서버에서 재계산**한다(`save/route.ts:18-23,44-55`).
- 성공 시 동작: 서버가 `user_progress` 레코드 생성/갱신, `{ progressId }` 반환(`save/route.ts:58-61`). 화면은 응답을 사용하지 않음(fire-and-forget) — `page.tsx:94-103`.
- 실패 시 동작: `catch`에서 `console.error('진행 상황 저장 오류:', err)`만 수행. 사용자에게 별도 에러 노출 없음(조용히 실패) — `page.tsx:104-106`.
- 권한 조건: 세션 존재. 서버는 `userId` 소유권 미검증.

**(다) 영상 시청 완료 처리(클라이언트 게이트)**
- 설명: 누적 시청률이 필수치 이상이 되면 `VideoPlayer`가 `onComplete()`를 1회 호출, 화면은 `videoCompleted=true`로 전환해 "다음" 버튼을 활성화한다.
- 트리거 UI: `VideoPlayer` 내부에서 `watchPercentage >= requiredPercentage` 충족 시 `onComplete` 호출(`VideoPlayer.tsx:168-177`) → `handleVideoComplete`가 `setVideoCompleted(true)`(`page.tsx:109-111`).
- 입력값: 없음(시청률 기반 내부 상태).
- 유효성 검증: `requiredPercentage`는 `chapter.required_watch_percentage || 60`로 전달(`page.tsx:200`).
- 성공 시 동작: "다음(문제풀이)" 버튼이 활성 버튼으로 렌더(`page.tsx:223-231`).
- 실패 시 동작: 미달 시 버튼 `disabled` + 안내문구 "영상을 N% 이상 시청해야 다음으로 넘어갈 수 있습니다"(`page.tsx:232-247`).
- 권한 조건: 세션 존재. 단, 이 게이트는 **클라이언트 측**이며, 다음 화면(퀴즈)으로의 이동을 서버가 막지 않는다(§6 잠재 취약점).

**(라) 퀴즈로 이동**
- 설명: 영상 완료 후 "다음(문제풀이)" 클릭 시 해당 챕터 퀴즈로 이동.
- 트리거 UI: "다음(문제풀이)" 버튼(`page.tsx:224-231`).
- 입력값: `chapterId`(`page.tsx:114`).
- 유효성 검증: 버튼 자체가 `videoCompleted` 시에만 활성(`page.tsx:223`).
- 성공 시 동작: `router.push(\`/learn/chapter/${chapterId}/quiz\`)`(`page.tsx:113-115`).
- 실패 시 동작: 해당 없음(라우팅).
- 권한 조건: 세션 존재.

**(마) 학습 자료(Markdown) 표시**
- 설명: 챕터 `description`이 있으면 GFM Markdown으로 렌더.
- 트리거 UI: 없음(조건부 렌더) — `page.tsx:206-219`.
- 입력값: `chapter.description`(`page.tsx:213-215`).
- 유효성 검증: `chapter.description` truthy일 때만 렌더(`page.tsx:206`).
- 성공/실패: `ReactMarkdown` + `remarkGfm`로 렌더(`page.tsx:5-6,213`). `dangerouslySetInnerHTML` 미사용.
- 권한 조건: 세션 존재.

**(바) 진행 상황 사이드바 / 전체 진행률 표시**
- 설명: 모든 챕터를 순회하며 완료/현재/대기 상태 배지를 표시하고, 완료 챕터 수 / 전체 챕터 수로 전체 진행률(%)을 계산해 progressbar로 표시.
- 트리거 UI: 없음(렌더) — `page.tsx:253-326`.
- 입력값: `allChapters`, `completedChapters`, `chapter.order`(`page.tsx:260-263`), `progressPercent = round(completedChapters.length / allChapters.length * 100)`(`page.tsx:155-158`).
- 유효성 검증: `allChapters.length>0`일 때만 비율 계산, 아니면 0%(`page.tsx:156-158`).
- 권한 조건: 세션 존재.

**(사) 나가기(세션 종료)**
- 설명: 확인 후 세션 제거 및 홈 이동.
- 트리거 UI: "나가기" 버튼(`page.tsx:170-172`).
- 입력값: 없음.
- 유효성 검증: `confirm('학습을 종료하시겠습니까? ...')`(`page.tsx:146-148`).
- 성공 시 동작: `localStorage.removeItem('session')` + `router.push('/')`(`page.tsx:150-151`).
- 권한 조건: 세션 존재.

---

#### 4) 백엔드 API / Supabase 명세

| 기능 | Method·Query | Endpoint·Table | Request(params/body) | Response 구조 | Error Case | 인증 필요 | role/권한 | 관련 RLS |
|---|---|---|---|---|---|---|---|---|
| 챕터 목록 조회 | GET / `getActiveChapters` (`select status='Active' order by "order" asc`) | `/api/chapters/list` · `chapters` | 없음(파라미터 없음) | `{ success:true, data: DbChapter[] }` (`list/route.ts:9-12`) | DB 에러 시 throw → `{ success:false, error }` 500 (`list/route.ts:13-23`, `chapters.ts:25-27`) | 화면 가드 외 **서버 인증 없음** | 익명 호출 가능(서버 핸들러에 가드 없음) | service_role로 RLS 우회. anon/authenticated 직접 접근은 차단 |
| 사용자 진행도 조회 | GET query `userId` / `getAllUserProgress` (`select * where user_id=userId`) | `/api/progress/get?userId=...` · `user_progress` | query: `userId`(클라이언트가 `session.userId` 전달, `page.tsx:53-54`) | `{ success:true, data: DbUserProgress[] }` (`get/route.ts:22-25`) | `userId` 없음 → 400 `'사용자 ID가 필요합니다.'`(`get/route.ts:10-18`); DB 에러는 데이터 레이어가 **빈 배열 반환**(throw 아님, `progress.ts:71-73`) | **서버 토큰 검증 없음** | `userId`를 클라이언트 입력 그대로 신뢰(소유권 미검증 → IDOR) | service_role로 RLS 우회(행수준 보호 없음) |
| 진행 상황 저장 | POST body / `getUserProgress`→없으면 `getRandomQuestions`+`createProgress`, 이후 `updateVideoWatchTime` | `/api/progress/save` · `user_progress`(R/W), `chapters`(R), `questions`(R) | body: `{ userId, chapterId, watchTime, isWatched }`(`page.tsx:97-102`). 서버는 `isWatched` 무시 | `{ success:true, data:{ progressId } }`(`save/route.ts:58-61`) | `userId`/`chapterId` 누락 → 400(`save/route.ts:18-23`); 챕터 없음 → 404(`save/route.ts:25-31`); 그 외 throw → 500(`save/route.ts:62-69`) | **서버 토큰 검증 없음** | `userId` 클라이언트 입력 신뢰(소유권 미검증 → IDOR) | service_role로 RLS 우회 |

요청/응답 보강 근거:
- `DbChapter` 필드: `id,name,order,video_url,video_duration,required_watch_percentage,description(null),questions_count,status,created_at,updated_at`(`chapters.ts:4-16`). 화면은 `id,order,name,video_url,video_duration,required_watch_percentage,description`을 사용(`page.tsx:47,183-200,206-215`).
- `DbUserProgress`에서 화면이 읽는 필드: `chapter_completed`, `chapter_id`, `video_watched`(`page.tsx:60,62,68,71`).
- `progress/save`의 최초 호출 시 진행도가 없으면 `getRandomQuestions(chapterId, chapter.questions_count)`로 출제 문항 ID를 정해 `createProgress`로 `questions_assigned`에 저장한다(`save/route.ts:33-42`, `progress.ts:78-104`). 즉 **출제 문항 확정이 영상 진행 저장 시점에 발생**할 수 있다.
- `progress/save`는 클라이언트 `watchTime`을 `[0, video_duration]`으로 clamp 후 서버에서 시청률을 재계산해 `video_watched`를 결정한다(`save/route.ts:44-55`). 클라이언트가 보내는 `isWatched`(`page.tsx:101`)는 서버에서 사용되지 않음(불필요 필드).
- 응답 공통 봉투 타입은 `ApiResponse<T>`(`types/index.ts:18-26`).

---

#### 5) 데이터베이스 연관 정보

| 테이블 | 사용 함수 | 주요 컬럼 | R/W | 사용 목적 | 근거 |
|---|---|---|---|---|---|
| `chapters` | `getActiveChapters`(list), `getChapterById`(save) | `id, name, order, video_url, video_duration, required_watch_percentage, description, questions_count, status` | R | 챕터 목록/현재 챕터 메타·영상 정보 조회 | `chapters.ts:18-44`, `list/route.ts:7`, `save/route.ts:25` |
| `user_progress` | `getAllUserProgress`(get), `getUserProgress`/`createProgress`/`updateVideoWatchTime`(save) | `user_id, chapter_id, video_watched, video_watch_time, questions_assigned, chapter_completed, started_at` | R/W | 사용자×챕터 진행도 조회·생성·영상 시청 시간/완료 여부 갱신 | `progress.ts:45-122`, `get/route.ts:20`, `save/route.ts:33-55` |
| `questions` | `getRandomQuestions`(save, 진행도 신규 생성 시) | `id`(출제 문항 ID 추출) | R | 진행도 최초 생성 시 출제 문항 셋 확정(`questions_assigned`) | `save/route.ts:36-41`, `questions.ts:68-82` |

관계(공통 인프라 §DB 근거):
- `user_progress.user_id` → `users(id)` (FK, ON DELETE CASCADE), `user_progress.chapter_id` → `chapters(id)` (FK, ON DELETE CASCADE). `UNIQUE(user_id, chapter_id)`로 사용자×챕터당 진행 레코드 1개.
- `questions.chapter_id` → `chapters(id)` (FK, ON DELETE CASCADE).
- Views/RPC: 사용 없음(모두 테이블 직접 쿼리). `getRandomQuestions`의 무작위화는 DB가 아닌 앱 레벨 Fisher-Yates 셔플(`questions.ts:68-82`).

읽기/쓰기 요약:
- 화면 진입(get/list): 읽기 전용.
- 영상 진행 저장(save): `user_progress`에 쓰기(insert 또는 update), `chapters`·`questions`는 읽기.

---

#### 6) 권한 및 보안 정책

- 로그인 필요 여부: 화면은 클라이언트 측 세션 존재(`localStorage 'session'`)를 요구한다(`page.tsx:27-31`). 단, 서버 API 3종은 어떤 세션/토큰 검증도 하지 않는다.
- role 기반 접근 제어: 없음. 이 화면의 3개 API에는 `isAdminAuthenticated`류 가드도, 학습자 세션 토큰 검증도 없다(`list/route.ts`, `get/route.ts`, `save/route.ts` 전체).
- RLS 적용: 모든 데이터 접근은 `supabaseAdmin`(service_role)로 RLS를 우회한다(`chapters.ts:2`, `progress.ts` import). 따라서 행수준 권한 보호가 없고, 접근 통제는 전적으로 라우트 핸들러에 의존하나 그 핸들러에도 가드가 없다.
- 본인 데이터 한정 여부: **보장되지 않음.** `progress/get`·`progress/save`는 클라이언트가 보낸 `userId`를 그대로 사용한다(`get/route.ts:7-20`, `save/route.ts:16-55`). 서버는 요청자가 그 `userId`의 세션 토큰을 가졌는지 확인하지 않는다.
- 관리자 전용 기능: 없음(학습자 화면).
- 보안 주의점:
  - `userId`가 `localStorage`에 평문 저장되고(`app/page.tsx:88`, 공통 인프라 §인증) query/body로 평문 전달(`page.tsx:54,98`). httpOnly 쿠키가 아니라 JS로 읽기/변조 가능.
  - Markdown 렌더는 `ReactMarkdown` 사용으로 `dangerouslySetInnerHTML` 미사용 — XSS 표면은 낮음(`page.tsx:213`).
- 코드상 잠재적 권한 취약점:
  - **(High) IDOR — 타인 진행도 조회/저장**: `userId` 소유권 미검증으로, 임의 `userId`(UUID)를 알면 타인 진행도 조회(`progress/get`)·저장(`progress/save`)을 위조 가능. service_role RLS 우회라 DB 단에서도 막히지 않음. 근거: `get/route.ts:7-20`, `save/route.ts:16-55`, `progress.ts:63-122`.
  - **(Medium) 인증 없는 콘텐츠 노출**: `GET /api/chapters/list`는 가드가 전혀 없어 누구나 활성 챕터 메타(영상 URL 포함)를 조회 가능(`list/route.ts:5-12`). 영상 URL이 비공개 자료라면 노출.
  - **(Medium) 영상 완료 게이트가 클라이언트 측에 한정**: "다음(퀴즈)" 이동 차단은 `videoCompleted` 클라이언트 상태 의존(`page.tsx:223`)이며, `/learn/chapter/[id]/quiz`로 직접 이동/접근을 서버가 막지 않는다(`middleware.ts` 부재). 영상 시청 강제는 우회 가능.
  - **(Low) 저장 실패 은닉**: `progress/save` 실패가 `console.error`로만 처리되어 사용자에게 미노출(`page.tsx:104-106`). 진행 손실을 사용자가 인지 못 할 수 있음.

---

#### 7) 화면 간 이동 흐름

- 진입 경로:
  - `/learn`(챕터 목록/대시보드)에서 특정 챕터 선택으로 진입(추정 — `/learn` 본문 미독, §8 확인 필요).
  - URL 직접 접근 가능(라우트 가드 부재). 세션 없으면 `/`로 즉시 리다이렉트(`page.tsx:28-31`).
- 다음 이동 가능 화면:
  - "다음(문제풀이)" → `/learn/chapter/[id]/quiz`(`page.tsx:113-115`). `videoCompleted` 시에만 버튼 활성.
  - "돌아가기"(에러 화면) → `/learn`(`page.tsx:136-138`).
  - "나가기" → `/`(세션 제거 후, `page.tsx:144-152`).
- redirect 조건: 세션 없음 → `/`(`page.tsx:29`).
- 인증·권한 실패 시 이동 경로: 클라이언트 세션 부재만 `/`로 리다이렉트(`page.tsx:28-31`). 서버 권한 실패에 따른 라우팅은 없음(서버 가드 자체가 없음). 데이터 로드 실패(챕터 미발견 등)는 리다이렉트가 아니라 동일 화면에서 에러 카드로 표시(`page.tsx:128-142`).

---

#### 8) 확인 필요 사항

1. `/learn`에서 이 화면으로의 실제 진입 트리거(어떤 UI에서 어떤 챕터를 선택하는지) — `app/learn/page.tsx` 본문 미독. 확인 위해 해당 파일 필요.
2. empty 상태 처리: 활성 챕터가 0개일 때 화면 거동. 현재 코드는 빈 목록이면 `find` 실패로 `'챕터를 찾을 수 없습니다.'` throw → 에러 화면(`page.tsx:47-50`). 의도된 empty UI(빈 목록 + CTA)는 없음 — 디자인 의도 확인 필요.
3. `questions_assigned`(JSONB) 구조/의미가 `getRandomQuestions` 결과 ID 배열과 일치하는지 — 스키마에 구조 명시 없음(공통 인프라 §DB 확인 필요). save 경로에서 채워지는 시점이 의도된 설계인지 확인 필요.
4. `progress/save` body의 `isWatched` 필드는 서버에서 사용되지 않으나 화면이 계속 전송함(`page.tsx:101` vs `save/route.ts:45`). 제거해도 무방한 dead field인지 확인 필요.
5. MEMORY.md의 "X-Session-Token 검증·토큰→userId 도출 적용" 기록과 현재 워크트리 코드가 불일치(이 화면의 API에 토큰 검증 없음). 다른 브랜치 적용/롤백 여부 확인 필요.
6. 영상 완료 게이트의 서버 측 강제 여부(퀴즈/채점 경로의 `hasPassedChapterQuiz` 등으로 보강되는지) — 본 화면 범위 밖. `/learn/chapter/[id]/quiz` 및 `answer/submit` 확인 필요.


### 2.4 챕터 퀴즈

> 근거 기준: 모든 핵심 주장에 `파일:줄번호`를 단다. 코드에서 확인 불가한 항목은 8) 확인 필요 사항으로 분리했다. 분석 대상 워크트리 경로는 `/Users/larkkim/manager-online-training/.claude/worktrees/upbeat-gates-ad9e3c/`.

---

#### 1) 화면 기본 정보

| 항목 | 내용 | 근거 |
|---|---|---|
| 화면명 | 챕터 퀴즈 (문제 풀이) | `app/learn/chapter/[id]/quiz/page.tsx:10` `QuizPage` |
| Route | `/learn/chapter/[id]/quiz` (동적 세그먼트 `[id]` = chapterId) | `app/learn/chapter/[id]/quiz/page.tsx:13` `params.id as string` |
| 컴포넌트 경로 | `app/learn/chapter/[id]/quiz/page.tsx` (`'use client'`) | `:1`, `:10` |
| 접근 가능 사용자 유형 | 학습자(응시자) — `localStorage`에 `'session'`이 있는 사용자 | `:30-34` |
| 접근 조건 | `localStorage.getItem('session')` 존재 시 진입. 없으면 즉시 `/`로 redirect. **서버 단 인증 게이트는 없음**(middleware.ts 부재) | `:30-34`; 공통 인프라(라우트 레벨 게이팅 부재) |
| 화면 목적 | 선택한 챕터의 출제 문항(랜덤)을 한 문제씩 풀고, 전 문항 답변 후 일괄 제출하여 채점 결과 화면으로 이동 | `:76-89`(문제 로드), `:127-164`(제출), `:158`(결과 화면 이동) |

추가 사실:
- 페이지는 **자체 4상태**를 구현한다 — loading 스피너(`:166-175`), error/빈 데이터 폴백(`:177-194`), loaded(`:201-358`). empty(문제 0개)는 error 폴백과 통합되어 `questions.length === 0` 조건으로 처리(`:177`). App Router의 `error.tsx`/`loading.tsx`가 없으므로(공통 인프라) 이 4상태는 전적으로 이 page 내부 state로 처리된다.
- 상단에 `ProgressHeader`(공통 컴포넌트, 수정 금지 주석 `:203`)를 렌더한다(`:204-210`).

---

#### 2) 사용자별 가능 기능

| 사용자 유형 | 가능한 기능 | 제한 사항 |
|---|---|---|
| 학습자 (세션 보유) | 챕터 문제 조회, 문항 간 이동(이전/다음/번호 점프), 선택지 선택, 전 문항 답변 후 제출 | 미답변 문항이 1개라도 있으면 제출 버튼 비활성 + `alert` 경고(`:128-132`, `:342`). 채점·정답 판정은 전부 서버에서 수행 |
| 비로그인 사용자 | 없음 | `localStorage`에 `'session'` 없으면 마운트 직후 `/`로 redirect(`:30-34`). 단 이는 **클라이언트 가드**일 뿐, 서버가 강제하지 않음 |
| 관리자 | (해당 화면 대상 아님) | 이 화면은 학습자 전용. 관리자 인증(JWT 쿠키)과 무관 |

> 중요(IDOR): 서버는 요청의 `userId`가 진짜 본인인지 검증하지 않는다(아래 6 참조). "본인 데이터 한정"은 클라이언트가 보낸 `userId`에만 의존한다.

---

#### 3) 화면 기능 상세

**(A) 세션 확인 및 화면 초기화**
- 설명: 마운트 시 `localStorage`의 `'session'`을 파싱해 `Session` state로 세팅. 이후 챕터 목록·진행도·문제를 순차 fetch.
- 트리거 UI: 페이지 진입(`useEffect`, deps `[chapterId, router]`) (`:26`, `:104`).
- 입력값: `localStorage` `'session'`(JSON 문자열), URL `[id]`(chapterId).
- 유효성 검증: `'session'` 부재 시 `/`로 redirect(`:31-33`). 챕터 목록에서 `chapterId`에 해당하는 챕터를 못 찾으면 에러 throw(`:53-56`).
- 성공 시 동작: `session`/`chapter`/`allChapters`/`completedChapters`/`questions` state 세팅 후 `loading=false`(`:38`, `:51,57,73,89-90`).
- 실패 시 동작: try/catch에서 `error` state 세팅 + `loading=false` → error 폴백 화면 표시(`:91-96`, `:177-194`). `mounted` 플래그로 언마운트 후 setState 방지(`:27`, `:37,44,64,81,92`, `:101-103`).
- 권한 조건: 세션 존재만 요구(클라이언트 가드).

**(B) 문항 네비게이션 (이전 / 다음 / 번호 점프)**
- 설명: 한 번에 한 문항 표시. 번호 칩으로 임의 문항 점프, 이전/다음 버튼으로 순차 이동.
- 트리거 UI: 번호 칩 `<button>`(`:230-245`), "이전 문제" `Button`(`:319-327`), "다음 문제" `Button`(`:330-337`).
- 입력값: 없음(인덱스 state 변경만).
- 유효성 검증: `handlePrevious`는 `currentQuestionIndex > 0`일 때만(`:115-119`), `handleNext`는 마지막 문항 미만일 때만(`:121-125`). 이전 버튼은 첫 문항에서 disabled(`:322`).
- 성공 시 동작: `currentQuestionIndex` 변경 → 진행바·문제 텍스트·선택지 갱신(`:197`, `:251-314`).
- 실패 시 동작: 해당 없음(범위 가드로 무동작).
- 권한 조건: 없음.

**(C) 선택지 선택**
- 설명: 현재 문항의 보기 1~4 중 하나 선택. 빈 보기(`optionText` falsy)는 렌더하지 않음(3지선다 대응).
- 트리거 UI: 선택지 `<button role="radio">`(`:284-311`), `radiogroup`(`:277`).
- 입력값: 선택지 번호 `'1'|'2'|'3'|'4'`(`:278`).
- 유효성 검증: `optionText`가 falsy면 해당 선택지 미렌더(`:279-280`). 빈 문자열 보기는 화면에서 제외.
- 성공 시 동작: `answers[currentQuestion.id] = num`으로 갱신(`:108-113`). 선택 시 시각 강조 + `aria-checked`(`:281`, `:288`).
- 실패 시 동작: 해당 없음.
- 권한 조건: 없음.

**(D) 답안 제출 및 채점**
- 설명: 전 문항 답변 시 `POST /api/answer/submit`로 `answers` 전체를 보내 서버 채점. 결과를 `sessionStorage`에 저장 후 결과 화면으로 이동.
- 트리거 UI: 마지막 문항에서만 노출되는 "제출하기" `Button`(`:339-347`). `handleSubmit`(`:127`).
- 입력값: `{ userId: session?.userId, chapterId, answers }`(`:140-144`). `answers`는 `{ [questionId]: '1'|'2'|'3'|'4' }` 맵(`:21`).
- 유효성 검증(클라이언트): 미답변 문항이 있으면 제출 차단 + `alert("N개의 문제가 답변되지 않았습니다.")`(`:128-132`). 버튼 자체도 `answeredCount < questions.length`면 disabled(`:342`).
- 유효성 검증(서버): `userId`/`chapterId`/`answers` 중 하나라도 없으면 400 "필수 정보가 누락되었습니다."(`app/api/answer/submit/route.ts:19-27`). 채점은 서버가 `question.correct_answer`와 대조(`route.ts:44`).
- 성공 시 동작: 응답 `data`(`{ allCorrect, correctCount, totalCount, incorrectQuestions, timestamp }`, `route.ts:94-100`)를 `sessionStorage.setItem('result_${chapterId}', ...)`로 저장(`:153-156`) 후 `/learn/chapter/${chapterId}/result`로 push(`:158`).
- 실패 시 동작: `data.success` falsy면 `data.error`로 throw → catch에서 `alert(message)` + `submitting=false`(`:149-163`). 제출 중에는 버튼 "제출 중..." 표시 + disabled(`:342`, `:345`).
- 권한 조건: 세션 보유. 단 `userId`는 클라이언트가 그대로 보내며 서버 검증 없음(6 참조).

---

#### 4) 백엔드 API / Supabase 명세

이 화면이 **실제로 호출하는** fetch는 4개다(`:41`, `:59-61`, `:76-78`, `:137`). 후보였던 다른 API는 이 화면에서 호출하지 않으므로 제외.

| 기능 | Method · Query/Body | Endpoint · Table | Request | Response 구조 | Error Case | 인증 필요 | role/권한 | 관련 RLS |
|---|---|---|---|---|---|---|---|---|
| 챕터 목록 로드 | GET (query 없음) | `/api/chapters/list` · `chapters` (read) | 없음 | `{ success:true, data: DbChapter[] }` — `status='Active'`, `order` 오름차순 | 500 `{success:false,error}` (예외 시 `error.message` 그대로 노출) | 코드상 미검증(세션 토큰/쿠키 안 봄) | service_role(서버 내부) | `chapters` RLS는 service_role FOR ALL만; anon/authenticated 전면 거부 |
| 진행도 로드 | GET `?userId=` | `/api/progress/get` · `user_progress` (read) | query `userId` (클라이언트 `session.userId`) | `{ success:true, data: DbUserProgress[] }` (없으면 빈 배열) | 400 userId 누락 시 "사용자 ID가 필요합니다."; 500 예외 | 미검증 — `userId`만 신뢰 | service_role | `user_progress` RLS service_role 전용 |
| 출제 문항 로드 | GET `?chapterId=` | `/api/questions/random` · `questions` (read), `chapters` (read) | query `chapterId` | `{ success:true, data: PublicQuestion[] }` — **정답·해설·통계·status 제거**(`toPublicQuestion`) | 400 chapterId 누락; 404 챕터 없음; 404 문제 0개 "문제가 없습니다…"; 500 예외 | 미검증 | service_role | `questions`/`chapters` RLS service_role 전용 |
| 답안 제출/채점 | POST (JSON body) | `/api/answer/submit` · `questions`(read+write), `chapter_history`(read+write), `question_attempts`(write) | body `{ userId, chapterId, answers:{[qid]:'1'..'4'} }` | `{ success:true, data:{ allCorrect, correctCount, totalCount, incorrectQuestions[], timestamp } }` — **오답 항목에 정답·해설 의도적 노출** | 400 필수 누락; 500 예외 | 미검증 — `userId`/`chapterId` 클라이언트 신뢰 | service_role | 4개 테이블 모두 service_role 전용 RLS |

API별 상세 근거:

- **GET `/api/chapters/list`**: `getActiveChapters()` 호출 → 성공 시 `{success:true,data}`, 예외 시 `error.message`를 그대로 담아 500(`app/api/chapters/list/route.ts:7-23`). 화면은 `chaptersData.success` 확인 후 `data`에서 `chapterId` 매칭 챕터를 찾아 `chapter`로, 전체를 `allChapters`로 세팅(`:46-57`).
- **GET `/api/progress/get`**: `userId` 쿼리 필수(`app/api/progress/get/route.ts:8-18`), `getAllUserProgress(userId)`(read) → 배열 반환(데이터레이어는 error 시 빈 배열). 화면은 `data` 중 `chapter_completed`인 항목의 챕터 `order`를 모아 `completedChapters`(헤더 진행 표시용)로 사용(`:66-73`).
- **GET `/api/questions/random`**: `chapterId` 필수(`route.ts:9-19`). `getChapterById`로 챕터 조회(없으면 404, `:21-30`), `getRandomQuestions(chapterId, chapter.questions_count)`로 Fisher-Yates 셔플 후 `questions_count`만큼 slice(`lib/supabase/questions.ts:68-82`). 결과 0개면 404(`route.ts:34-42`). 응답 직전 `questions.map(toPublicQuestion)`로 **정답(`correct_answer`)·해설(`explanation`)·통계 3종·status 제거**(`route.ts:44-48`). 화면 state 타입은 `PublicQuestion[]`(`:19`).
- **POST `/api/answer/submit`**: 본문 `{userId,chapterId,answers}` 필수(`route.ts:14-27`). `getChapterAttemptCount(userId,chapterId)+1`로 `attemptNumber` 산출(`route.ts:29`, `progress.ts:212-227`, `chapter_history` count read), `createChapterHistory`(write, `progress.ts:141-164`). `getQuestionsByIds(answers의 key들)`로 questions 일괄 조회(`.in()`, N+1 회피, `route.ts:38`, `questions.ts:100-122`). 문항별 `userAnswer === question.correct_answer`로 채점(`route.ts:44`), 오답은 정답·해설·보기 4종을 `incorrectQuestions`에 적재(`route.ts:54-68`). `updateQuestionStats`(read-modify-write, `questions.ts:124-152`)와 `createQuestionAttempt`(write, `progress.ts:188-210`)를 `Promise.all` 병렬 실행(`route.ts:70-82`). `completeChapterHistory(historyId, correctCount, total, 0)`로 이력 종료(write, `route.ts:87-92`, `progress.ts:166-186`). 최종 `resultData` 반환(`route.ts:94-105`).

> 참고(공통 인프라): 모든 데이터 레이어는 `supabaseAdmin`(service_role, RLS 우회)을 사용한다. 따라서 RLS는 anon/authenticated 직접 접근만 차단하고, 위 API들의 접근 통제는 라우트 핸들러 내부 로직에만 의존한다(여기서는 사실상 검증 없음).

---

#### 5) 데이터베이스 연관 정보

| Table | 사용 API | 읽기/쓰기 | 주요 컬럼 | 사용 목적 | 근거 |
|---|---|---|---|---|---|
| `chapters` | list, questions/random | 읽기 | id, name, order, questions_count, status | 챕터 메타/출제 수 조회, 헤더 표시 | `chapters/list/route.ts:7`, `questions/random/route.ts:21,32` |
| `questions` | questions/random, answer/submit | 읽기 + 쓰기(stats) | id, chapter_id, option_1~4, correct_answer, explanation, total/correct/incorrect_count, status | 출제 문항 로드(정답 제거 후 전송), 채점 시 정답 대조 + 통계 증분 | `questions.ts:52-66,100-122,124-152` |
| `user_progress` | progress/get | 읽기 | user_id, chapter_id, chapter_completed, order(조인 아님, 화면에서 매핑) | 완료한 챕터 order 목록 산출 → 헤더 진행 표시 | `progress.ts:63-76`; `:66-73` |
| `chapter_history` | answer/submit | 읽기(count) + 쓰기(insert/update) | user_id, chapter_id, attempt_number, start/end_time, questions_correct/total, status | 시도 횟수 산출, 채점 이력 생성·완료(서버측 통과 진실 공급원의 원천 데이터) | `progress.ts:141-186,212-227` |
| `question_attempts` | answer/submit | 쓰기(insert, append-only) | user_id, question_id, chapter_id, user_answer, attempt_number, time_spent | 문항별 응답 로그 적재 | `progress.ts:188-210` |

- Views/RPC: **사용 없음.** 통계 증분(`updateQuestionStats`)은 RPC가 아니라 현재값+1을 JS에서 계산해 update하는 read-modify-write 방식(`questions.ts:124-152`).
- 랜덤 출제는 DB `ORDER BY random()`이 아니라 앱 레벨 Fisher-Yates 셔플(`questions.ts:68-82`).
- `time_spent`는 항상 0으로 기록(화면이 측정값을 보내지 않아 `createQuestionAttempt`에 미전달, `route.ts:71-79` → 기본 0). `completeChapterHistory`의 `videoWatchTime`도 0 하드코딩(`route.ts:91`).
- 관계: `questions.chapter_id → chapters.id`, `user_progress/chapter_history/question_attempts`는 각각 `users.id`/`chapters.id`/`questions.id` FK(공통 인프라 FK도 참조).

---

#### 6) 권한 및 보안 정책

- **로그인 필요 여부**: 화면 진입은 `localStorage` `'session'` 존재만 요구하는 **클라이언트 가드**(`:30-34`). middleware.ts가 없어(공통 인프라) 서버/라우트 레벨 강제가 전혀 없다 — URL 직접 접근 시 서버가 막지 않는다.
- **role 기반 접근 제어**: 이 화면의 4개 API는 어떤 인증 헤더/쿠키도 검사하지 않는다. 관리자 가드(`isAdminAuthenticated`)도 적용 대상이 아니다(학습자 API).
- **RLS 적용**: 6개 테이블 모두 RLS 활성, 정책은 service_role FOR ALL 1종뿐. 서버는 `supabaseAdmin`(service_role)로 RLS를 우회하므로, **행 수준 권한에 의한 자연적 IDOR 방어가 없다**(공통 인프라 §4, 데이터레이어 §0).
- **본인 데이터 한정 여부**: **보장되지 않음.** `progress/get`은 query `userId`(`progress/get/route.ts:8`), `answer/submit`은 body `userId`(`answer/submit/route.ts:17`)를 그대로 신뢰한다. 화면은 `localStorage`의 `session.userId`를 평문으로 보낸다(`:60`, `:141`). 세션 토큰 대조나 토큰→userId 도출이 전혀 없다(공통 인프라 인증 §2.3-2.4).
- **관리자 전용 기능**: 없음(학습자 화면).
- **정답 노출 정책(설계 일관성, 코드 확정)**: 출제 경로(`questions/random`)는 `toPublicQuestion`으로 정답·해설을 제거해 전송(`questions/random/route.ts:44-48`). 반면 채점 경로(`answer/submit`)는 **오답 문항에 한해 `correctAnswer`·`explanation`을 의도적으로 응답에 포함**(`answer/submit/route.ts:49,57-67`). 출제 화면에는 정답이 안 나가고, 결과 화면 데이터에는 정답이 들어가는 의도된 분리다.

코드상 잠재적 권한 취약점(이 화면에서 발견):

1. **IDOR — 진행도/제출에 임의 userId 주입 가능 (High)**: 서버가 `userId` 소유권을 검증하지 않아(`progress/get/route.ts:8-20`, `answer/submit/route.ts:17-30`), 타인의 UUID를 알면 그 사용자의 진행도 조회 및 답안 제출·채점 이력 위조가 가능하다. RLS는 service_role 우회라 방어하지 못함.
2. **답안 제출 입력 검증 부족 (Medium)**: `answers` 키(questionId)가 `chapterId`에 속한 문항인지 서버가 검증하지 않는다. `getQuestionsByIds`는 키로 받은 어떤 questionId든 조회하고(`questions.ts:100-122`), `createQuestionAttempt`에는 그 questionId와 함께 본문 `chapterId`를 그대로 기록한다(`answer/submit/route.ts:71-79`). 결과적으로 다른 챕터 문항 id를 섞어 보내도 채점되며, `question_attempts.chapter_id`가 실제 문항의 챕터와 어긋나게 저장될 수 있다(DB 제약 없음 — 공통 인프라 §2 함정).
3. **서버 에러 메시지 원문 노출 (Low)**: 4개 API 모두 `error.message`를 응답에 그대로 담아 클라이언트로 전달한다(`chapters/list/route.ts:14`, `questions/random/route.ts:50`, `answer/submit/route.ts:107` 등). 내부 DB 에러 문구가 사용자에게 노출될 여지. 화면은 이 message를 `alert`/error 폴백에 그대로 표시(`:160-161`, `:183`).
4. **userId 평문 보관·전송 (Low, 1번의 전제)**: `session`이 `localStorage`에 평문 저장(공통 인프라)되고 `userId`가 query/body로 평문 전달(`:60`, `:141`)된다. XSS·로그 유출 시 즉시 악용 경로가 된다.

---

#### 7) 화면 간 이동 흐름

- **진입 경로**:
  - 챕터 영상 학습 화면(`/learn/chapter/[id]`)에서 영상 시청 완료 후 퀴즈로 진입하는 흐름으로 추정(해당 화면 코드는 본 분석 범위 밖 — 확인 필요).
  - URL 직접 접근도 가능(라우트 가드 부재). 단 `'session'`이 없으면 즉시 `/`로 이탈(`:30-34`).
- **다음 이동 가능 화면**:
  - 제출 성공 → `/learn/chapter/${chapterId}/result` (결과 화면). 직전 `sessionStorage`에 `result_${chapterId}` 저장(`:153-158`).
  - error/문제0개 폴백의 "돌아가기" 버튼 → `/learn/chapter/${chapterId}` (챕터 학습 화면)(`:185-190`).
  - `ProgressHeader`의 나가기 → `confirm` 후 `localStorage` `'session'` 제거 + `/`로 이동(공통 인프라 ProgressHeader; 이 화면은 헤더를 그대로 사용 `:204-210`).
- **redirect 조건**: 세션 부재 시 마운트 직후 `router.push('/')`(`:31-33`).
- **인증·권한 실패 시 이동 경로**: 클라이언트 가드만 존재 → 세션 없으면 `/`. API 401/403 같은 인증 실패 분기는 없다(API들이 인증을 검사하지 않으므로). 제출 API 실패(400/500)는 화면 이동 없이 `alert` 표시 후 같은 화면 유지(`:159-163`).

---

#### 8) 확인 필요 사항

| 항목 | 이유 | 추가로 봐야 할 파일 | 개발자 확인 질문 |
|---|---|---|---|
| 영상 미시청 상태에서 퀴즈 직접 진입 차단 여부 | 이 화면은 영상 시청 완료를 게이트하지 않음(진행도는 헤더 표시용으로만 사용, `:66-73`). 영상 미시청자가 URL로 바로 퀴즈에 들어올 수 있는지 미확인 | `app/learn/chapter/[id]/page.tsx`(진입 경로/시청 게이트) | 영상 필수 시청률 미달 시 퀴즈 진입을 막아야 하는가? 막는다면 어디서? |
| `chapter_history`의 `attempt_number` 증가·중복 제출 처리 | 제출 시마다 새 history가 생성됨(`route.ts:29-30`). 동일 챕터 반복 제출/재응시 정책(횟수 제한 등) 미확인 | `lib/supabase/progress.ts:212-254`, 결과 화면 코드 | 퀴즈 재응시 횟수 제한이 있는가? 통과 후 재제출을 허용하는가? |
| `userId` 서버측 검증 도입 여부 | MEMORY에는 "X-Session-Token 검증·토큰→userId 도출 적용(2026-06-19)"이라 기록됐으나 이 워크트리 코드에는 없음(공통 인프라 인증 §6-5). 의도된 미적용인지 회귀인지 불명 | 다른 브랜치의 학습자 API, `lib/auth/*` | 학습자 API의 세션 토큰 검증이 롤백된 것인가, 별도 브랜치 작업인가? |
| `answers` questionId의 챕터 소속 검증 정책 | 서버가 questionId가 해당 chapterId 소속인지 검증 안 함(위 6-2). 의도적 단순화인지 누락인지 불명 | `app/api/answer/submit/route.ts:38-79` | 제출 답안의 문항이 해당 챕터 소속임을 서버에서 강제해야 하는가? |
| 출제 수(`questions_count`) vs 실제 보유 문항 수 정합 | `getRandomQuestions`는 `min(count, 보유수)`만 출제(`questions.ts:81`). 보유 문항이 `questions_count`보다 적으면 적게 출제됨. 운영 데이터 실측 필요(공통 인프라 §5.2 불일치) | DB 실측, `lib/supabase/migration.sql:524-528` | 챕터별 `questions_count`와 실제 Active 문항 수가 일치하는가? |


### 2.5 챕터 결과

> 근거 기준: 본 섹션의 모든 주장은 worktree(`/Users/larkkim/manager-online-training/.claude/worktrees/upbeat-gates-ad9e3c/`) 실제 코드의 `파일:줄번호`에 근거한다. 추측은 "확인 필요"로 분리한다.

---

#### 1) 화면 기본 정보

| 항목 | 내용 | 근거 |
|---|---|---|
| 화면명 | 챕터 결과 (퀴즈 채점 결과) | `app/learn/chapter/[id]/result/page.tsx:26` `ResultPage` |
| Route | `/learn/chapter/[id]/result` (동적 세그먼트 `[id]` = chapterId) | 파일 경로, `result/page.tsx:30` `params.id as string` |
| 컴포넌트 경로 | `app/learn/chapter/[id]/result/page.tsx` | — |
| 렌더 방식 | 클라이언트 컴포넌트 (`'use client'`) | `result/page.tsx:1` |
| 접근 가능 사용자 유형 | 학습자(응시자). 진입 시 `localStorage`의 `session`이 있어야 함 | `result/page.tsx:41-45` |
| 접근 조건 | (1) `localStorage.getItem('session')` 존재, (2) `sessionStorage.getItem('result_{chapterId}')` 존재. 둘 중 하나라도 없으면 즉시 리다이렉트(아래 §7) | `result/page.tsx:41-54` |
| 화면 목적 | 직전 퀴즈 화면(`/learn/chapter/[id]/quiz`)에서 채점된 결과를 표시한다. 전체 정답이면 축하 + "다음 챕터로/완료" CTA, 오답이 있으면 오답 목록(내 답·정답·해설)과 "다시 학습하기" CTA를 보여준다. | `result/page.tsx:152-271` |

핵심 구조 메모:
- 채점 결과 자체(`ResultData`)는 **이 화면이 API로 받아오지 않는다.** 직전 퀴즈 화면이 `sessionStorage`에 `result_{chapterId}` 키로 저장한 값을 읽어 렌더한다(`result/page.tsx:50-57`). 즉 점수·오답·정답·해설 데이터는 클라이언트 측 임시 저장소에서 복원된다. (정답/해설이 결과에 포함되는 것은 공통 인프라 문서의 "채점 경로는 의도적으로 정답·해설 노출" 정책과 일치 — 단 그 노출 시점은 직전 퀴즈/채점 화면이며, 이 결과 화면은 그 결과를 표시만 한다.)
- 이 화면이 실제로 호출하는 백엔드는 **3개**다: `GET /api/chapters/list`(`:59`), `GET /api/progress/get`(`:71`), `POST /api/progress/complete`(`:101`). 앞 두 개는 마운트 시(`useEffect`), 마지막 하나는 "다음 챕터로/완료" 클릭 시(`handleNext`) 호출된다.

`ResultData` 형태(클라이언트 타입, API 응답 아님) — `result/page.tsx:12-24`:
```
{ allCorrect: boolean; correctCount: number; totalCount: number;
  incorrectQuestions: Array<{ questionId; userAnswer; correctAnswer; questionText; explanation?; options: {[k]:string} }> }
```

---

#### 2) 사용자별 가능 기능

| 사용자 유형 | 가능한 기능 | 제한 사항 |
|---|---|---|
| 학습자(세션 보유 + 결과 보유) | 채점 결과 확인, 오답 목록·정답·해설 열람, "다시 학습하기"(재시도)·"다음 챕터로/완료" 이동 | "다음 챕터로/완료"는 서버 `progress/complete`의 검증(영상 시청 완료 + 퀴즈 전부 정답)을 통과해야 실제 완료 처리됨. 단 화면은 이 응답을 **확인하지 않고 즉시 이동**(아래 §3·§6 취약점) |
| 미인증(세션 없음) | 없음 | `localStorage.session` 없으면 마운트 즉시 `/`로 리다이렉트 (`result/page.tsx:42-44`) |
| 결과 없음(직접 URL 진입 등) | 없음 | `sessionStorage.result_{chapterId}` 없으면 즉시 `/learn/chapter/{chapterId}/quiz`로 리다이렉트 (`result/page.tsx:51-53`) |
| 관리자 | 해당 없음 | 이 화면은 학습자 전용. 관리자 가드/분기 없음 |

> 클라이언트 가드만 존재(`middleware.ts` 부재 — 확인됨). 라우트 레벨 서버 차단이 없으므로 위 리다이렉트는 모두 클라이언트 코드에서만 실행된다.

---

#### 3) 화면 기능 상세

**기능 A — 진입 가드 & 결과 복원**
- 설명: 마운트 시 세션·결과 존재를 확인하고, 결과(`ResultData`)를 `sessionStorage`에서 복원해 state에 적재.
- 트리거 UI: 페이지 마운트(`useEffect`, `result/page.tsx:39-91`).
- 입력값: `localStorage.session`(JSON), `sessionStorage.result_{chapterId}`(JSON), URL params `id`.
- 유효성 검증: 세션 없음 → `/` 이동(`:42-44`); 결과 없음 → 퀴즈 화면 이동(`:51-53`). JSON 파싱은 `JSON.parse`를 try/catch 없이 호출(`:47,56`) → 손상 데이터 시 throw 가능(아래 §8).
- 성공 시 동작: `session`/`resultData` state 세팅 후 챕터 목록·진행도 fetch 진행.
- 실패 시 동작: 위 리다이렉트. 단, 파싱 예외 시 라우트 `error.tsx` 부재로 처리 안 됨(§8).
- 권한 조건: 학습자 세션 필요(서버 검증 없음, localStorage 존재만 확인).

**기능 B — 챕터 목록 & 진행도 로드(헤더/네비용)**
- 설명: `GET /api/chapters/list`로 전체 활성 챕터를 받아 현재 챕터(`chapter`)와 전체 목록(`allChapters`)을 세팅하고, `GET /api/progress/get?userId=`로 사용자 진행도를 받아 완료된 챕터의 `order` 배열(`completedChapters`)을 계산한다. 이 값들은 `ProgressHeader`(상단 진행 인디케이터)와 "마지막 챕터 여부"·"다음 챕터 이동 대상" 계산에 쓰인다.
- 트리거 UI: 마운트 `useEffect`(`result/page.tsx:59-85`).
- 입력값: `chaptersData.success` 가드(`:62`), `parsedSession.userId`를 query로 전달(`:72`).
- 유효성 검증: `chaptersData.success`가 false면 모든 후속(진행도 fetch 포함)을 건너뜀(`:62`). `progressData.success && progressData.data.length > 0` 가드(`:76`).
- 성공 시 동작: `allChapters`/`chapter`/`completedChapters` 세팅, `loading=false`(`:87`).
- 실패 시 동작: `chapters/list` fetch 자체가 reject(네트워크 에러 등)되면 `init`이 throw → catch 없음 → `loading`이 false로 안 바뀌어 무한 로딩 스피너 가능(§8). `success:false`(서버 500)인 경우엔 후속만 스킵하고 `loading=false`로 진행되어 `chapter`가 null → `return null`(빈 화면, `:132-134`).
- 권한 조건: 두 API 모두 서버측 세션 토큰 검증 없음. `progress/get`은 클라이언트가 보낸 `userId`를 그대로 신뢰(IDOR, §6).

**기능 C — 전체 정답 결과 표시**
- 설명: `resultData.allCorrect === true`면 축하 카드(`CheckCircle2` 아이콘, "축하합니다!", `{order}장을 완료했습니다`, `정답 {correctCount}/{totalCount}` Badge)와 "다음 챕터로/완료" 버튼 표시.
- 트리거 UI: 조건부 렌더(`result/page.tsx:152-181`).
- 입력값: `resultData.allCorrect/correctCount/totalCount`, `chapter.order`, `isLastChapter`.
- 성공/실패: 표시 전용(데이터 호출 없음).
- 권한 조건: 학습자.

**기능 D — 오답 결과 표시(오답 목록·해설)**
- 설명: `allCorrect === false`면 경고 카드(`AlertTriangle`, "아쉽습니다!", `정답 {correctCount}/{totalCount}` error Badge) + 오답 목록을 카드로 렌더. 각 오답: 문제번호, `questionText`(`whitespace-pre-wrap`), "당신의 답변"(`{userAnswer}. {options[userAnswer]}`), "정답"(`{correctAnswer}. {options[correctAnswer]}`), 그리고 `explanation`이 있으면 `ReactMarkdown`(+`remarkGfm`)으로 해설 렌더.
- 트리거 UI: 조건부 렌더(`result/page.tsx:182-270`), 리스트 `key={item.questionId}`(`:211`, index 아님 — 규칙 준수).
- 입력값: `resultData.incorrectQuestions[]`(클라이언트 sessionStorage 출처).
- 유효성 검증: `item.explanation` 존재 시에만 해설 블록 렌더(`:240`).
- 성공/실패: 표시 전용. `ReactMarkdown`은 사용자/콘텐츠 텍스트를 마크다운으로 렌더(공통 인프라의 ReactMarkdown bold+한글조사 함정 참고).
- 권한 조건: 학습자.

**기능 E — 다시 학습하기(재시도)** — `handleRetry` (`result/page.tsx:93-96`)
- 설명: 현 챕터 결과(`sessionStorage.result_{chapterId}`)를 제거하고 퀴즈 화면으로 이동.
- 트리거 UI: 오답 분기의 "다시 학습하기" Button(`:262-268`).
- 입력값/검증: 없음(상태 변경·라우팅만).
- 성공 시 동작: `router.push('/learn/chapter/{chapterId}/quiz')`(`:95`).
- 실패 시 동작: 해당 없음(동기 동작).
- 권한 조건: 학습자.

**기능 F — 다음 챕터로 / 완료** — `handleNext` (`result/page.tsx:98-119`)
- 설명: `POST /api/progress/complete`로 현 챕터 완료 처리를 요청한 뒤(응답 미확인), `result_{chapterId}` 제거, 현 챕터가 마지막이 아니면 다음 챕터 페이지로, 마지막이면 `/complete`로 이동.
- 트리거 UI: 전체 정답 분기의 "다음 챕터로/완료" Button(`:173-180`). 라벨은 `isLastChapter ? '완료' : '다음 챕터로'`(`:178`).
- 입력값: body `{ userId: session.userId, chapterId }`(`:104-107`). 사전 가드 `if (!session || !allChapters.length) return`(`:99`).
- 유효성 검증(서버측): `progress/complete`가 (1) 필수값, (2) 진행 레코드 존재, (3) `video_watched`, (4) `hasPassedChapterQuiz`(chapter_history 기준 전부 정답)를 검증(`progress/complete/route.ts:17-50`).
- 성공 시 동작: `currentChapterIndex < length-1`이면 다음 챕터(`router.push('/learn/chapter/{nextChapter.id}')`, `:113-115`), 아니면 `/complete`(`:117`).
- 실패 시 동작(주의): `fetch` 응답을 **await만 하고 `ok`/`success`를 확인하지 않는다**(`:101-108`). 서버가 403(미검증)·500을 반환해도 클라이언트는 그대로 다음 화면으로 이동한다 → 서버는 완료 처리 안 됐는데 UI는 진행(§6·§8). `fetch` 자체가 reject되면 `handleNext`가 unhandled rejection(try/catch 없음).
- 권한 조건: 학습자. 서버 가드는 위 §6.

---

#### 4) 백엔드 API / Supabase 명세

이 화면이 **실제로 호출하는 3개 API만** 명세한다(후보 중 누락 없음 — 3개 모두 호출됨).

| 기능 | Method · Query | Endpoint · Table | Request (params/body) | Response 구조 | Error Case | 인증 필요 | role/권한 | 관련 RLS |
|---|---|---|---|---|---|---|---|---|
| B. 챕터 목록 로드 | GET (쿼리 파라미터 없음) | `GET /api/chapters/list` · `chapters` (read) | 없음 | `ApiResponse`: `{ success:true, data: DbChapter[] }` (`status='Active'`, `order` 오름차순) | 500 `{ success:false, error }` (`chapters/list/route.ts:13-22`; 메시지는 `error.message` 또는 '챕터 목록을 불러올 수 없습니다.') | 서버측 인증 검증 없음 | 누구나 호출 가능(가드 부재) | `chapters` service_role 전용 FOR ALL. 서버는 `supabaseAdmin`(service_role, RLS 우회). anon/authenticated 직접 접근은 전면 거부 |
| B. 진행도 로드 | GET · `?userId={uuid}` | `GET /api/progress/get` · `user_progress` (read) | query `userId`(필수) | `ApiResponse`: `{ success:true, data: DbUserProgress[] }` (해당 user의 모든 progress) | 400 `{success:false, error:'사용자 ID가 필요합니다.'}`(userId 누락), 500(예외) (`progress/get/route.ts:10-18,26-36`) | 서버측 세션 토큰 검증 **없음** | 클라이언트가 보낸 `userId` 그대로 신뢰 → IDOR | `user_progress` service_role 전용. `getAllUserProgress`는 `supabaseAdmin`로 RLS 우회(`progress.ts:63-76`). error 시 throw 아닌 빈 배열 반환 |
| F. 챕터 완료 처리 | POST | `POST /api/progress/complete` · `user_progress`(read+write), `chapter_history`(read), `chapters`(read), `users`(write, 전체 완료 시) | body `{ userId, chapterId }` | `ApiResponse`: 성공 `{ success:true, message, allCompleted: boolean }`(전체 완료 시 `allCompleted:true` + `completeUser`) | 400 필수값 누락, 403 진행 레코드 없음/영상 미시청/퀴즈 미통과, 500 예외 (`progress/complete/route.ts:17-50,79-86`) | 서버측 세션 토큰 검증 **없음** | 클라이언트 `userId` 신뢰 → IDOR. 단 완료 자체는 chapter_history 채점기록(서버 진실)으로 게이팅 | 모든 테이블 service_role 전용. `supabaseAdmin` 사용으로 RLS 우회. 클라이언트 화면은 응답을 확인하지 않음 |

응답 봉투는 공통 `ApiResponse`(`types/index.ts:18-26`) — `success/data/error/message` + 완료 플로우용 옵션 `allCompleted/completedChapters/totalChapters`. `progress/complete`는 `allCompleted`를 봉투에 직접 실어 보낸다(`progress/complete/route.ts:70,77`).

`progress/complete` 내부 호출 체인(근거):
- `getUserProgress(userId, chapterId)` → `user_progress` SELECT `.single()` (`progress.ts:45-61`)
- `hasPassedChapterQuiz(userId, chapterId)` → `chapter_history` 최신 Completed 1건 조회, `questions_correct === questions_total && questions_total>0` (`progress.ts:231-254`)
- `completeChapter(progress.id, true)` → `user_progress` UPDATE `all_correct/chapter_completed=true` (`progress.ts:124-139`)
- `getActiveChapters()` → `chapters` SELECT Active (`chapters.ts:18-30`), `getAllUserProgress(userId)` → `user_progress` SELECT (`progress.ts:63-76`)
- 전체 완료 시 `completeUser(userId)` → `users` UPDATE `status='Completed', completed_at=now` (`users.ts:237-251`)

---

#### 5) 데이터베이스 연관 정보

| Table | R/W | 사용 함수(경유) | 주요 컬럼 | 사용 목적 |
|---|---|---|---|---|
| `chapters` | Read | `getActiveChapters` (`chapters/list`, `progress/complete`) | `id, name, "order", status` | 전체 활성 챕터 목록 → 현재 챕터·다음 챕터·전체 수·헤더 인디케이터, 완료 판정 분모(totalChapters) |
| `user_progress` | Read+Write | `getAllUserProgress`(get/complete), `getUserProgress`(complete), `completeChapter`(complete) | `user_id, chapter_id, video_watched, chapter_completed, all_correct, id` | 완료 챕터 order 계산(`chapter_completed` 필터, `result/page.tsx:77-83`), 완료 처리 시 진행 레코드 검증·갱신. UNIQUE(user_id, chapter_id) |
| `chapter_history` | Read | `hasPassedChapterQuiz` (complete) | `questions_correct, questions_total, status, created_at, user_id, chapter_id` | 서버측 퀴즈 통과 진실 공급원(최신 Completed 기록 전부 정답 여부) |
| `users` | Write(조건부) | `completeUser` (complete, 전체 완료 시) | `status, completed_at, id` | 모든 챕터 완료 시 사용자 상태 'Completed'로 전환 |

관계(공통 인프라 §2): `user_progress.user_id/chapter_id`, `chapter_history.user_id/chapter_id` 모두 `users`/`chapters`에 FK(ON DELETE CASCADE). RPC/View는 사용하지 않음(전부 PostgREST 쿼리 + JS 집계). `completedChapters` order 매핑은 DB가 아니라 클라이언트에서 `chapters.find(...).order`로 계산(`result/page.tsx:79-82`).

테이블 사용 종합(이 화면 기준): 읽기 — `chapters`, `user_progress`, `chapter_history`; 쓰기 — `user_progress`(완료 시), `users`(전체 완료 시).

---

#### 6) 권한 및 보안 정책

- 로그인 필요 여부: 명목상 필요(클라이언트가 `localStorage.session` 확인 후 미존재 시 `/`로 리다이렉트, `result/page.tsx:42-44`). 단 **서버측 강제는 없다.** `middleware.ts` 부재(확인됨)로 라우트 레벨 차단 없음.
- role 기반 접근 제어: 없음. 학습자/관리자 role 구분이 이 화면·호출 API에 없음. 3개 API 모두 인증 가드 호출이 없다(`isAdminAuthenticated`류 없음; 세션 토큰 검증 없음).
- RLS 적용: 모든 테이블 RLS 활성, service_role 전용 정책. 그러나 API는 `supabaseAdmin`(service_role)로 **RLS를 우회**한다(`lib/supabase/client.ts:12-16`, 데이터 레이어 별칭 import). 따라서 RLS는 이 화면의 데이터 접근을 통제하지 못한다 — 통제는 라우트 핸들러 로직에만 의존.
- 본인 데이터 한정 여부: **미보장(IDOR).** `progress/get`은 query `userId`, `progress/complete`는 body `userId`를 그대로 신뢰한다(`progress/get/route.ts:8`, `progress/complete/route.ts:15`). 요청자가 그 userId의 소유자인지(세션 토큰 대조) 검증하지 않는다. 임의 UUID를 알면 타인의 진행도 조회·완료 처리 위조 가능(공통 인프라 인증 문서 §2.4와 동일 결론).
- 관리자 전용 기능: 없음.
- 보안 주의점 / 코드상 잠재적 권한·노출 취약점:
  1. **IDOR (High)** — `userId`를 클라이언트가 평문 전달, 서버 미검증. `progress/get`(타인 진행도 조회), `progress/complete`(타인 챕터 완료/전체 완료→users 상태 변경) 위조 가능. 위치: `progress/get/route.ts:8,20`, `progress/complete/route.ts:15,25,65`.
  2. **완료 응답 무시 (Medium)** — `handleNext`가 `progress/complete` 응답의 `ok`/`success`를 확인하지 않고 무조건 다음 화면으로 이동(`result/page.tsx:101-118`). 서버가 403(영상 미시청·퀴즈 미통과)·500을 반환해도 UI는 진행 → 실제 완료되지 않은 채 "다음 챕터/완료" 화면으로 진입(상태 불일치). 단 서버 측 데이터는 게이트(`hasPassedChapterQuiz`)로 보호되므로 데이터 위조까진 아니며, UX/정합 불일치 성격.
  3. **결과 데이터 클라이언트 신뢰 (Low)** — 점수·오답·정답·해설(`ResultData`)이 `sessionStorage`에서 복원되며(`result/page.tsx:50-57`), 이 화면은 그 무결성을 서버로 재검증하지 않는다. 표시 전용이라 직접적 권한 상승은 아니나, 표시되는 정답/해설은 클라이언트 변조 가능(실제 완료 판정은 서버 chapter_history 기준이라 영향 제한적). 정답·해설이 직전 퀴즈 채점 경로에서 의도적으로 노출된 정책의 연장선(공통 인프라 정답노출 정책).
  4. **fetch 예외 미처리 (Low, 안정성)** — `progress/complete` fetch가 reject 시 `handleNext` unhandled rejection, 마운트 fetch reject 시 `init` throw로 무한 로딩(§8).

---

#### 7) 화면 간 이동 흐름

- 진입 경로:
  - 정상: 퀴즈 화면(`/learn/chapter/[id]/quiz`)이 채점 후 `sessionStorage.result_{chapterId}` 저장 → 이 결과 화면으로 이동(공통 인프라: `quiz/page.tsx:153` 저장). 
- 다음 이동 가능 화면:
  - "다시 학습하기"(오답 시) → `/learn/chapter/{chapterId}/quiz` (`result/page.tsx:95`, `result_{chapterId}` 제거 후).
  - "다음 챕터로"(전체 정답, 마지막 아님) → `/learn/chapter/{nextChapter.id}` (`:114-115`).
  - "완료"(전체 정답, 마지막 챕터) → `/complete` (`:117`).
  - 상단 `ProgressHeader`의 "나가기" → `localStorage.session` 제거 후 `/` (공통 인프라 `ProgressHeader.tsx:23-32`).
- redirect 조건:
  - 세션 없음 → `/` (`:42-44`).
  - 결과 없음(`sessionStorage.result_{chapterId}` 부재; 직접 URL 진입·새로고침 후 등) → `/learn/chapter/{chapterId}/quiz` (`:51-53`).
- 인증·권한 실패 시 이동:
  - 인증 실패(세션 없음)는 위 `/` 리다이렉트로만 처리(클라이언트). 서버 API의 권한 실패(403/500)는 화면 이동에 반영되지 않음 — `handleNext`가 응답을 무시하므로 실패해도 동일하게 다음 화면으로 진행(§6-2).

---

#### 8) 확인 필요 사항

| # | 항목 | 이유 / 코드 근거 | 추가로 봐야 할 파일 | 개발자 확인 질문 |
|---|---|---|---|---|
| 1 | `ResultData`(점수·오답·정답·해설)의 실제 생성·저장 위치 | 이 화면은 `sessionStorage.result_{chapterId}`를 읽기만 함(`result/page.tsx:50-57`). 저장 주체·정확한 형태는 직전 퀴즈/채점 코드에 있음 | `app/learn/chapter/[id]/quiz/page.tsx`, `app/api/answer/submit/route.ts` | 결과 데이터를 sessionStorage에만 보관하는 것이 의도인가(서버 재검증 없이 표시)? |
| 2 | `handleNext`의 응답 무시가 의도인지 | `progress/complete` 응답 `ok/success` 미확인(`result/page.tsx:101-118`). 서버 403/500 시 UI 상태 불일치 | 동일 파일 | 완료 실패(403/500) 시 에러 표시·차단 처리가 필요하지 않은가? |
| 3 | 마운트/핸들러 fetch 예외 미처리 | `init`·`handleNext`에 try/catch 없음, `JSON.parse`도 비보호(`:47,56`). 라우트 `error.tsx`/`loading.tsx` 부재(확인됨)로 throw 시 무한 로딩·미처리 | `app/learn/chapter/[id]/result/`(error/loading 파일 없음 확인됨) | 4상태(특히 error) 처리를 페이지에 추가할 계획인가? (글로벌 규칙 "비동기 4상태 필수"와 충돌) |
| 4 | IDOR 방어 적용 여부 | 코드상 `userId` 서버 미검증(§6-1). MEMORY는 "X-Session-Token 검증·토큰→userId 도출 적용(2026-06-19)"이라 하나 이 워크트리엔 없음(공통 인프라 인증 문서 §6-5) | `app/api/progress/{get,complete}/route.ts`, 다른 브랜치 | 세션 토큰 기반 userId 도출이 다른 브랜치에 있는지/롤백됐는지? |
| 5 | `chapters/list` 500(success:false) 시 부분 렌더 | `success:false`면 진행도 fetch 스킵 후 `loading=false` → `chapter` null → `return null`(빈 화면, `:62,132-134`). empty/error UI 없음 | 동일 파일 | 챕터 로드 실패 시 사용자에게 무엇을 보여줄 것인가? |


### 2.6 학습 완료

> 근거 파일: `app/complete/page.tsx`, `app/api/chapters/list/route.ts`, `app/api/complete/route.ts`, `lib/supabase/chapters.ts`, `lib/supabase/progress.ts`, `lib/supabase/users.ts`
> 모든 핵심 주장에 `파일:줄번호` 근거를 명시. 단정 불가 항목은 §8 "확인 필요"로 분리.

---

#### 1. 화면 기본 정보

| 항목 | 내용 | 근거 |
|---|---|---|
| 화면명 | 학습 완료 (모든 과정 완료 축하) | `app/complete/page.tsx:83-84` |
| Route | `/complete` | 디렉토리 경로 `app/complete/page.tsx` |
| 컴포넌트 경로 | `app/complete/page.tsx` (`CompletePage`, `'use client'`) | `page.tsx:1,9` |
| 접근 가능 사용자 유형 | 학습자(응시자) — localStorage `session` 보유자에 한함 | `page.tsx:17-21` |
| 접근 조건 | (1) localStorage `session` 존재. 없으면 즉시 `/`로 redirect. (2) 서버 검증상 **모든 활성 챕터가 완료**(`chapter_completed=true`)여야 함. 미완료 시 `POST /api/complete`가 403 → `alert` 후 `/learn`로 redirect | `page.tsx:17-21,42-48` / 서버: `app/api/complete/route.ts:32-42` |
| 화면 목적 | 전체 학습 과정 완료를 축하하고, 완료된 챕터 목록과 완료 배지를 보여주며, 서버에 사용자 상태를 `Completed`로 확정 처리(`completeUser`)하는 종료 화면. "닫기" 시 세션을 비우고 `/`로 복귀 | `page.tsx:34-49,60-63,78-138` |

핵심 동작 요약: 마운트 시 `useEffect`(`page.tsx:15-58`)에서 ① 세션 확인 → ② `GET /api/chapters/list`로 챕터 목록 로드 → ③ `POST /api/complete`로 완료 자격 검증 및 상태 확정. 두 fetch는 **순차 실행**(`await` 직렬, `page.tsx:27,34`)이며 `Promise.all` 병렬이 아니다.

---

#### 2. 사용자별 가능 기능

| 사용자 유형 | 가능한 기능 | 제한 사항 |
|---|---|---|
| 학습자 (세션 보유 + 전 챕터 완료) | 완료 축하 카드·완료 챕터 목록·"N개 챕터 완료" 배지·다음 단계 안내 열람, "닫기"로 세션 제거 후 `/` 이동 | 화면 내 추가 데이터 변경 액션 없음(읽기 + 닫기 전용). `POST /api/complete`가 서버에서 user.status를 `Completed`로 1회 확정 |
| 학습자 (세션 보유 + 일부 챕터 미완료) | (사실상 진입 불가) `POST /api/complete` 403 응답 → `alert('모든 챕터를 완료해야 합니다.')` 후 `/learn`로 강제 이동 | 완료 화면 본문에 도달하지 못함 | `page.tsx:42-47` |
| 비로그인(세션 없음) | (진입 불가) 마운트 즉시 `/`로 redirect | 화면 렌더 안 됨 | `page.tsx:18-20` |
| 관리자 | (전용 기능 없음) — 이 화면은 관리자 인증/가드와 무관한 학습자 화면 | 관리자 쿠키와 무관하게 동작 | (해당 코드 부재) |

---

#### 3. 화면 기능 상세

**기능 A — 세션 확인 및 게이팅**
- 설명: 마운트 시 localStorage `session`을 읽어 `Session` 객체로 파싱, 없으면 진입 차단.
- 트리거 UI: 없음(페이지 마운트 `useEffect`, `page.tsx:15-58`).
- 입력값: localStorage `session`(JSON 문자열). `parsedSession.userId`만 이후 사용(`page.tsx:23,37`).
- 유효성 검증: 존재 여부만 검사(`if (!sessionData)`, `page.tsx:18`). **`JSON.parse`를 try/catch 밖에서 호출**(`page.tsx:23`)하므로 손상된 값이면 파싱 예외가 처리되지 않음(§8, §6 참조).
- 성공 시: `setSession(parsedSession)` 후 데이터 로드 진행(`page.tsx:24`).
- 실패 시(세션 없음): `router.push('/')` 후 함수 return(`page.tsx:19-20`).
- 권한 조건: 세션 토큰 자체의 서버 검증은 없음. `userId`는 클라이언트 보관값(공통 인프라 §2 IDOR 참조).

**기능 B — 완료 챕터 목록 로드 (`GET /api/chapters/list`)**
- 설명: 활성 챕터 전체를 받아 "학습 결과" 카드에 `order`. `name` 형식으로 나열, 각 항목에 체크 아이콘 표시.
- 트리거 UI: 없음(마운트 시 자동, `page.tsx:27`).
- 입력값: 없음(쿼리/바디 없음).
- 유효성 검증: `chaptersData.success`가 true일 때만 `setChapters(chaptersData.data)`(`page.tsx:30-32`).
- 성공 시: `chapters` state 세팅 → 배지 "`{chapters.length}`개 챕터 완료"(`page.tsx:99`)와 목록 렌더(`page.tsx:104-116`).
- 실패 시: `success`가 false면 **무시**(빈 목록 유지) — 별도 에러 UI 없음. 네트워크 throw는 바깥 try/catch에서 `console.error` 후 `setLoading(false)`(`page.tsx:51-54`).
- 권한 조건: 인증 불필요(공개 GET).

**기능 C — 완료 자격 검증 및 상태 확정 (`POST /api/complete`)**
- 설명: 서버가 사용자 진행도를 재검증하여 **모든 활성 챕터 완료** 여부를 판정, 통과 시 `users.status='Completed'`·`completed_at` 기록.
- 트리거 UI: 없음(마운트 시 자동, `page.tsx:34-38`).
- 입력값: body `{ userId: parsedSession.userId }`(`page.tsx:37`).
- 유효성 검증(서버): `userId` 누락 시 400(`route.ts:12-20`); `completedChapters < totalChapters`면 403(`route.ts:32-42`).
- 성공 시: `completeData.success === true`면 별도 분기 없이 진행, `setLoading(false)`로 완료 화면 렌더(`page.tsx:50`). (성공 응답의 `message`는 화면에서 사용하지 않음.)
- 실패 시: 403이면 `alert('모든 챕터를 완료해야 합니다.')` + `router.push('/learn')` + return(`page.tsx:43-47`). **400·500 등 403 이외 실패는 분기 없음** → `setLoading(false)`로 그대로 완료 화면이 렌더됨(§6 보안 주의 참조).
- 권한 조건: 서버는 토큰 검증 없이 body `userId`를 신뢰(`route.ts:9-10,44`).

**기능 D — 완료 화면 렌더 (loaded 상태)**
- 설명: 완료 축하 카드(`CheckCircle2` 아이콘 + "모든 과정을 완료했습니다!" + "`{userName}`님, 수고하셨습니다."), 학습 결과 카드(완료 배지 + 챕터 목록), 다음 단계 안내 카드, 닫기 버튼.
- 트리거 UI: `loading=false` 진입 시 자동 렌더(`page.tsx:78-138`). 진입 애니메이션 `animate-scale-in`(정의: `app/globals.css:11-30`).
- 입력값: state `session`, `chapters`.
- 권한 조건: 위 게이팅 통과한 세션.

**기능 E — 닫기 (`handleClose`)**
- 설명: 세션 종료 후 진입 화면으로 복귀.
- 트리거 UI: "닫기" Button(`plab-design-system` Button, `variant="solid" size="lg"`, `page.tsx:129-136`).
- 입력값: 없음.
- 유효성 검증: 없음.
- 성공 시: `localStorage.removeItem('session')` → `router.push('/')`(`page.tsx:61-62`).
- 실패 시: 해당 없음(동기 동작).
- 권한 조건: 없음.

**상태(4-state) 처리 현황**
- loading: 자체 처리 — 스피너 + "완료 처리 중..." 카드(`page.tsx:65-76`).
- loaded: 완료 화면(`page.tsx:78-138`).
- empty: 챕터가 0개여도 별도 empty UI 없음 — 배지 "0개 챕터 완료" + 빈 목록으로 그대로 렌더(`page.tsx:99,104`). (전제상 챕터는 존재하므로 실제 발생은 드묾, §8.)
- error: **전용 error UI 없음.** fetch throw는 `console.error`만 하고 loading만 해제(`page.tsx:51-54`) → 데이터가 비거나 부분만 있는 화면이 노출될 수 있음. 라우트 레벨 `error.tsx`/`loading.tsx`도 없음(공통 인프라).

---

#### 4. 백엔드 API / Supabase 명세

이 화면이 **실제로 호출하는 fetch는 2개**다(`page.tsx:27,34`). 후보였던 그 외 API는 호출하지 않으므로 제외.

| 기능 | Method·Query | Endpoint·Table | Request (params/body) | Response 구조 | Error Case | 인증 필요 | role/권한 | 관련 RLS |
|---|---|---|---|---|---|---|---|---|
| B. 챕터 목록 로드 | GET (쿼리 없음) | `GET /api/chapters/list` · `chapters`(read) | 없음 | `{ success: true, data: DbChapter[] }` — `status='Active'`, `order` 오름차순(`chapters.ts:18-30`) | 500 `{ success:false, error }`(throw 시 `chapters.ts:26` 메시지 노출, `route.ts:13-23`) | 없음(공개) | 서버 `supabaseAdmin`(service_role) | service_role full access(우회). anon/authenticated 전면 거부 |
| C. 완료 검증·확정 | POST | `POST /api/complete` · `chapters`(read)·`user_progress`(read)·`users`(write) | body `{ userId: string }`(`page.tsx:37`, `route.ts:9-10`) | 성공 200 `{ success:true, message:'모든 과정을 완료했습니다!' }`(`route.ts:46-49`) | 400 `{success:false, error:'사용자 ID가 필요합니다.'}`(`route.ts:12-20`); 403 `{success:false, error:'모든 챕터를 완료해야 합니다.', completedChapters, totalChapters}`(`route.ts:32-42`); 500 `{success:false, error}`(`route.ts:50-59`) | 토큰 검증 없음 — body `userId`만 사용 | 서버 `supabaseAdmin`(service_role) | service_role full access(우회). RLS로 IDOR 방어 안 됨 |

서버 내부 호출 체인(C):
- `getActiveChapters()` → `chapters` SELECT `status='Active'`(`chapters.ts:18-30`), `getAllUserProgress(userId)` → `user_progress` SELECT `user_id=userId`(`progress.ts:63-76`)를 `Promise.all` 병렬 조회(`route.ts:22-25`).
- 완료 판정: `totalChapters = allChapters.length`, `completedChapters = allProgress.filter(p => p.chapter_completed).length`(`route.ts:27-30`). `completedChapters < totalChapters`면 403(`route.ts:32`).
- 통과 시 `completeUser(userId)` → `users` UPDATE `status='Completed', completed_at=now`(`users.ts:237-251`).

> `GET /api/chapters/list` 응답은 `ApiResponse<DbChapter[]>` 형태이며 봉투 옵션 필드(`completedChapters` 등)는 미사용. `POST /api/complete`의 403 응답은 봉투에 `completedChapters/totalChapters`를 직접 싣지만(`route.ts:37-38`) 화면은 이 값을 읽지 않고 status 코드(403)만 분기에 사용(`page.tsx:43`).

---

#### 5. 데이터베이스 연관 정보

| Table | 사용 API | 주요 컬럼 | 읽기/쓰기 | 사용 목적 | 근거 |
|---|---|---|---|---|---|
| `chapters` | B, C | `id, name, order, status, ...`(전 컬럼 `select('*')`) | 읽기 | 활성 챕터 목록(`status='Active'`, order 오름차순). 화면 목록 렌더 + 서버 총 챕터 수 계산 | `chapters.ts:18-30`; 화면 `page.tsx:104-116` |
| `user_progress` | C | `user_id, chapter_id, chapter_completed` | 읽기 | 해당 user의 진행 레코드 전체 조회 후 `chapter_completed=true` 개수로 완료 판정 | `progress.ts:63-76`; `route.ts:28-30` |
| `users` | C | `id, status, completed_at` | 쓰기(UPDATE) | 완료 자격 통과 시 `status='Completed'`, `completed_at` 기록 | `users.ts:237-251`; `route.ts:44` |

관계: `user_progress.user_id → users(id)` ON DELETE CASCADE, `user_progress.chapter_id → chapters(id)` ON DELETE CASCADE(공통 인프라 §2). 완료 판정은 "user_progress 중 chapter_completed=true 개수 ≥ chapters(Active) 개수" 단순 카운트 비교이며, **챕터별 매칭(어느 챕터가 완료인지)을 보지 않는다**(`route.ts:28-32`, §8 참조). Views/RPC 사용 없음 — 모두 PostgREST 쿼리 + JS 집계.

---

#### 6. 권한 및 보안 정책

- 로그인 필요 여부: 클라이언트 측 게이트만 존재. localStorage `session` 없으면 `/`로 redirect(`page.tsx:18-20`). **서버 측 세션 토큰 검증은 없음** — `POST /api/complete`는 body `userId`만 신뢰(`route.ts:9-10`).
- role 기반 접근 제어: 없음(학습자 단일 흐름). 관리자 가드 무관.
- RLS 적용: 두 API 모두 `supabaseAdmin`(service_role)로 동작해 **RLS를 우회**(공통 인프라 §0·§4). 따라서 DB 레벨의 본인 데이터 한정 보호가 없다.
- 본인 데이터 한정 여부: **미보장(IDOR).** `userId`가 클라이언트 보관·전달값이고 서버가 소유권을 검증하지 않으므로, 타인의 `userId`(UUID)를 알면 `POST /api/complete`로 **그 사용자를 완료 처리(`status='Completed'`)** 시킬 수 있다 — 단, 그 대상자가 이미 전 챕터를 완료한 경우에 한해서만 403을 넘긴다(`route.ts:32`). 즉 임의 완료 강제는 어렵지만, 이미 조건을 갖춘 타인의 상태를 대신 확정하는 위조는 가능. (공통 인프라 §2.4 IDOR 일반론과 일치.)
- 관리자 전용 기능: 없음.
- 보안 주의점 / 코드상 잠재적 권한·노출 취약점:
  1. **403 이외 실패의 무처리(완료 검증 우회 표시)** — `POST /api/complete`가 400/500을 반환해도 화면은 분기하지 않고 그대로 완료 화면을 렌더한다(`page.tsx:42-50`). 서버가 완료를 거부(500 등)했는데도 사용자에게 "모든 과정을 완료했습니다!" 축하 화면이 표시될 수 있어, 완료 상태에 대한 화면-서버 불일치가 발생. (Medium)
  2. **세션 토큰 미검증·IDOR** — 위 "본인 데이터 한정 여부" 참조. service_role + RLS 우회로 DB 방어선도 없음. (High, 공통 인프라 §2.4와 동일 근원)
  3. **에러 메시지 원문 노출** — `GET /api/chapters/list` 500과 `POST /api/complete` 500이 `error.message`(데이터레이어가 throw한 한국어 문구, 경우에 따라 내부 메시지)를 그대로 응답에 실어 보냄(`route.ts:13-15`(list), `route.ts:50-58`(complete)). 사용자 화면에는 거의 노출 안 되나(분기 부재) 응답 본문에는 노출. (Low)
  4. **`JSON.parse` 비방어** — 손상된 localStorage `session` 파싱 시 예외가 try/catch 밖이라 처리 안 됨(`page.tsx:23`). 권한 자체 문제는 아니나 비정상 입력에 대한 화면 크래시 위험. (Low)

---

#### 7. 화면 간 이동 흐름

- 진입 경로:
  - 정상: 마지막 챕터의 결과/완료 흐름에서 `/complete`로 도달(진입 출처 페이지는 본 범위 밖 — §8). URL 직접 진입도 가능하나 게이트가 작동.
- 다음 이동 가능 화면:
  - "닫기" 버튼 → `localStorage.removeItem('session')` 후 `/`(진입 화면)로 이동(`page.tsx:60-63`).
- redirect 조건:
  - 세션 없음 → `/`(`page.tsx:19`).
  - `POST /api/complete` 403(전 챕터 미완료) → `alert` 후 `/learn`(`page.tsx:44-45`).
- 인증·권한 실패 시 이동 경로:
  - 클라이언트 세션 부재 → `/`.
  - 서버 완료 자격 미충족(403) → `/learn`.
  - 그 외 서버 실패(400/500)·네트워크 throw → **이동 없음**, 완료 화면 그대로 렌더(`page.tsx:42-54`). (§6-1 취약점)

---

#### 8. 확인 필요 사항

1. **완료 판정의 챕터별 매칭 부재** — `POST /api/complete`는 `chapter_completed=true`인 user_progress **개수**만 활성 챕터 수와 비교한다(`route.ts:28-32`). 어떤 user_progress 레코드가 비활성/삭제 챕터를 가리키거나 중복될 경우 카운트가 어긋날 수 있는지(예: 비활성 챕터의 완료 레코드가 카운트에 포함되어 미완료인데 통과될 가능성) — 운영 데이터로 검증 필요. 봐야 할 곳: `lib/supabase/progress.ts`의 진행 레코드 생성·완료 로직, `user_progress` 실제 데이터.
2. **진입 직전 화면** — `/complete`로 보내는 호출부(어느 화면/조건에서 push 하는지)는 본 범위 밖. 봐야 할 파일: `app/learn/chapter/[id]/result/page.tsx`, `app/learn/page.tsx`.
3. **`Session` 직렬화 형태 일치** — localStorage `session`이 항상 `{ userId, userName, userPhone, sessionToken }` 형태로 저장되는지(저장 코드는 `app/page.tsx:88`). `userName`만 본 화면에서 사용(`page.tsx:87`).
4. **챕터 0개(empty) 발생 가능성** — `chapters`가 비면 배지 "0개 챕터 완료"·빈 목록이 노출. 운영상 활성 챕터가 항상 ≥1인지 확인 필요(전제상 그렇다고 보이나 코드 보장은 없음).
5. **개발자 확인 질문**: (a) `POST /api/complete`가 500/400을 반환할 때 화면이 완료 축하를 띄우는 현재 동작이 의도인가, 아니면 에러 화면/재시도가 필요한가? (b) 학습자 API에 세션 토큰 검증을 도입해 `userId` IDOR을 막을 계획이 있는가(MEMORY에는 적용됐다고 기록되어 있으나 본 워크트리 코드에는 없음)?


### 2.7 관리자 로그인

> 근거 기준: 본 섹션의 모든 핵심 주장은 worktree(`/Users/larkkim/manager-online-training/.claude/worktrees/upbeat-gates-ad9e3c/`) 실제 코드 `파일:줄번호`에 근거한다. 추측은 "확인 필요"로 분리한다.

---

#### 1. 화면 기본 정보

| 항목 | 내용 | 근거 |
|---|---|---|
| 화면명 | 관리자 로그인 | `app/admin/login/page.tsx:53` (`관리자 로그인`) |
| Route | `/admin/login` | 파일 경로 `app/admin/login/page.tsx` (App Router 규약) |
| 컴포넌트 경로 | `app/admin/login/page.tsx` `AdminLoginPage` (`'use client'`) | `app/admin/login/page.tsx:1,8` |
| 접근 가능 사용자 유형 | 누구나(비인증 포함) — URL 직접 접근 가능. 라우트 가드 없음 | `middleware.ts` 부재(공통 인프라 §1-3), 페이지에 진입 가드 코드 없음(`app/admin/login/page.tsx` 전체) |
| 접근 조건 | 없음. 로그인 폼은 인증 없이 노출됨 | `app/admin/login/page.tsx` 전체에 세션/토큰 확인 로직 없음 |
| 화면 목적 | 관리자(`ADMIN_USERNAME`/`ADMIN_PASSWORD`) 자격증명으로 로그인해 `admin-token` JWT 쿠키를 발급받고 `/admin` 대시보드로 진입 | `app/admin/login/page.tsx:21-33`, `app/api/admin/auth/login/route.ts:21-35` |

핵심 사실:
- 이 화면은 **client 컴포넌트**이며, 마운트 시 인증 상태를 확인하지 않는다(이미 로그인된 관리자가 `/admin/login`에 와도 자동 리다이렉트되지 않음 — 폼이 그대로 노출). 자동 리다이렉트 로직은 목적지 `/admin`에만 존재(`app/admin/page.tsx:33-52`). (확인 필요: 이미 로그인 상태에서 `/admin/login` 재진입 시 UX 의도)
- `app/`에 `error.tsx`/`loading.tsx`가 없어(공통 인프라 §5) 라우트 레벨 4상태 폴백이 없다. 이 화면은 로딩/에러를 **컴포넌트 내부 state**로 자체 처리한다(`loading`, `error` state — `:12-13`).

---

#### 2. 사용자별 가능 기능

| 사용자 유형 | 가능한 기능 | 제한 사항 |
|---|---|---|
| 비인증 방문자(누구나) | 아이디/비밀번호 입력, 로그인 시도 | 자격증명이 `ADMIN_USERNAME`/`ADMIN_PASSWORD`와 정확히 일치해야만 성공. 불일치 시 401, 폼에 머무름 |
| 이미 로그인된 관리자 | 동일 폼 재노출(재로그인 시도 가능) | 화면이 기존 세션을 인지/재사용하지 않음. 재로그인 성공 시 토큰 갱신(`maxAge` 재설정) |
| 학습자(Learner) | 해당 없음 — 학습자 세션(localStorage)과 무관한 별개 인증 체계 | 학습자 세션이 있어도 관리자 권한 부여 안 됨(완전 분리된 인증, 공통 인프라 인증 §1) |

> 이 화면은 단일 폼이며 role 분기 UI가 없다. "사용자 유형"별 차이는 자격증명 일치 여부로만 갈린다.

---

#### 3. 화면 기능 상세

##### 기능 3-1. 관리자 로그인 제출

- **기능명**: 관리자 자격증명 로그인
- **설명**: 아이디·비밀번호를 입력해 `POST /api/admin/auth/login`을 호출, 성공 시 `/admin`으로 이동
- **트리거 UI**: 로그인 폼 제출(`<form onSubmit={handleSubmit}>` `:60`, 제출 버튼 `Button type="submit"` `:92-100`)
- **입력값**:
  - `username`: 텍스트 입력(`Input type="text"` `:61-70`), state `username`(`:10`)
  - `password`: 비밀번호 입력(`Input type="password"` `:72-81`), state `password`(`:11`)
- **유효성 검증(클라이언트)**:
  - 두 `Input` 모두 `required` 속성(`:68,79`) → 브라우저 기본 빈값 차단(HTML5 검증). 그 외 클라이언트 형식 검증은 없음
  - **서버 검증이 본질적 게이트**: 서버가 환경변수 값과 평문 동등 비교(`app/api/admin/auth/login/route.ts:21`)
- **성공 시 동작**:
  - 응답 `data.success === true`이면 `router.push('/admin')` 후 `router.refresh()`(`:31-33`)
  - 서버가 `admin-token` httpOnly 쿠키를 set(`app/api/admin/auth/login/route.ts:27-33`) — JS로 읽히지 않음
- **실패 시 동작**:
  - 응답 `success`가 falsy이면 `setError(data.error || '로그인에 실패했습니다.')`(`:35`) → `role="alert"` 박스로 에러 표시(`:83-90`)
  - fetch 자체 예외(네트워크 등) 시 `catch`에서 `setError('로그인 중 오류가 발생했습니다.')`(`:37-38`)
  - 두 경우 모두 `finally`에서 `setLoading(false)`(`:39-41`) → 버튼 재활성화
- **로딩 상태**: 제출 중 `loading=true`로 버튼 `disabled` + 라벨 `'로그인 중...'`(`:96,99`)
- **권한 조건**: 없음(누구나 시도 가능). 권한 판정은 전적으로 서버의 자격증명 비교 결과

> 비고: 이 화면이 직접 호출하는 백엔드는 **`POST /api/admin/auth/login` 단 1개**다. 후보였던 `GET /api/admin/auth/session`은 이 화면에서 호출하지 않으며, 목적지 `/admin` 페이지가 마운트 시 호출한다(`app/admin/page.tsx:36`). 따라서 §4 API 명세에는 login만 포함한다.

---

#### 4. 백엔드 API / Supabase 명세

| 기능 | Method · Query | Endpoint · Table | Request (params/body) | Response 구조 | Error Case | 인증 필요 | role/권한 | 관련 RLS |
|---|---|---|---|---|---|---|---|---|
| 관리자 로그인 | POST (JSON body) | `POST /api/admin/auth/login` · **DB 테이블 미접근** | body `{ username: string, password: string }` (`route.ts:7`, 클라이언트 `page.tsx:26`) | 성공: `{ success: true }` 200 + `Set-Cookie: admin-token=<JWT>; HttpOnly; SameSite=Lax; Max-Age=86400; Path=/`(`route.ts:27-35`). 실패(불일치): `{ success: false, error: '아이디 또는 비밀번호가 일치하지 않습니다.' }` 401(`route.ts:37-40`) | (a) 계정 환경변수 미설정 → `{ success:false, error:'관리자 계정이 설정되지 않았습니다.' }` **500**(`route.ts:13-18`); (b) 자격증명 불일치 → **401**(`:37-40`); (c) `request.json()` 등 예외 → `console.error` 후 `{ success:false, error:'로그인 처리 중 오류가 발생했습니다.' }` **500**(`:42-48`) | 불필요(로그인 진입점이므로 비인증 호출) | 누구나 호출 가능. 성공 시 발급되는 JWT payload `{ username, role:'admin', exp }`(`lib/auth/admin.ts:24-28`) | 해당 없음 — 이 라우트는 **Supabase에 접근하지 않음**(테이블/RLS 무관). 자격증명을 `process.env.ADMIN_USERNAME`/`ADMIN_PASSWORD`와 비교만 함(`route.ts:10-21`) |

요청/응답 코드 근거 정리:
- 요청: 클라이언트가 `fetch('/api/admin/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, password }) })`(`page.tsx:21-27`).
- 응답 본문은 항상 `data.success` 불리언을 포함(`page.tsx:31`이 이를 분기). 성공 본문에는 `data`/`error` 없이 `{ success:true }`만(`route.ts:35`).
- **토큰 발급은 `lib/auth/admin.ts`로 단일화**: `signAdminToken(username)`(`route.ts:23` → `lib/auth/admin.ts:22-31`). 알고리즘 미지정 → 기본 HS256(대칭). 만료 `exp = now + 86400s`(24h, `lib/auth/admin.ts:4,27`). 쿠키 `maxAge`도 `ADMIN_TOKEN_MAX_AGE`(=86400, `lib/auth/admin.ts:52`)로 동일.
- 시크릿: `getAdminSecret()`가 `ADMIN_JWT_SECRET` 미설정 시 throw(fail-closed) → 미설정 환경에서는 로그인 성공 분기(`route.ts:21-35`)가 `signAdminToken` 호출 중 예외를 던져 케이스 (c) 경로로 500 반환(`route.ts:42-48`). (확인 필요: 운영 환경 `ADMIN_JWT_SECRET` 설정 여부 — 코드로 단정 불가)

---

#### 5. 데이터베이스 연관 정보

| 항목 | 내용 | 근거 |
|---|---|---|
| 사용 Tables | **없음** | `app/api/admin/auth/login/route.ts` 전체에 Supabase import/쿼리 없음 |
| Views / RPC | 없음 | 상동 |
| 주요 컬럼 | 해당 없음 | — |
| 관계 | 해당 없음 | — |
| 읽기·쓰기 여부 | DB 읽기·쓰기 모두 없음. 쓰기 대상은 **HTTP 쿠키(`admin-token`)** 뿐 | `route.ts:27-33` |
| 사용 목적 | 자격증명 검증 후 JWT 쿠키 발급. 관리자 인증은 **DB 사용자 테이블이 아니라 환경변수 기반** | `route.ts:10-21` |

핵심: 관리자 인증은 `users` 테이블(학습자용)과 **완전히 무관**하다. `ADMIN_USERNAME`/`ADMIN_PASSWORD` 환경변수와의 평문 비교가 유일한 검증이며, Supabase RLS와도 무관하다(공통 인프라 인증 §3.4 동일).

---

#### 6. 권한 및 보안 정책

로그인 필요 여부 / 접근 제어:
- 이 화면 자체는 로그인 불필요(인증 진입점). 라우트 레벨 가드 부재(`middleware.ts` 없음, 공통 인프라 §1-3)라 URL 직접 접근으로 폼 노출 가능 — **설계상 정상**(로그인 폼은 공개되어야 함).
- 발급 토큰은 `role:'admin'` claim을 갖지만(`lib/auth/admin.ts:26`), 검증 측 `isAdminAuthenticated()`는 서명·만료만 확인하고 **`role` 재검증을 하지 않음**(`lib/auth/admin.ts:44-49`). 현재 토큰 발급 경로가 admin 로그인뿐이라 실질 영향은 없으나, 발급 경로 추가 시 위험(공통 인프라 인증 §3.3).

RLS 적용 / 본인 데이터 한정:
- 이 라우트는 DB·RLS와 무관(§5). 본인 데이터 개념 없음.

관리자 전용 기능:
- 로그인 성공 시 발급되는 httpOnly 쿠키가 이후 `/api/admin/*` 라우트의 `isAdminAuthenticated()` 가드 통과 키가 됨(`lib/auth/admin.ts:34-50`).

보안 주의점 / 코드상 잠재적 권한·노출 취약점:

| # | 심각도 | 항목 | 위치 | 내용 |
|---|---|---|---|---|
| S1 | Low | 자격증명 평문 비교 | `app/api/admin/auth/login/route.ts:21` | `username === adminUsername && password === adminPassword` — 해시 없는 평문 보관(환경변수) + 일반 `===` 비교(타이밍-세이프 아님). 단일 관리자·HTTPS 전제이므로 실위험은 낮으나 개선 여지(`crypto.timingSafeEqual` 권장) |
| S2 | Low | 500 응답으로 설정 상태 누설 | `route.ts:13-18` | 계정 환경변수 미설정 시 `'관리자 계정이 설정되지 않았습니다.'`를 본문에 노출. 운영 미스컨피그를 외부에 알려줄 수 있으나 자격증명 자체 노출은 아님 |
| S3 | Info | 무차별 대입 방어 부재 | `route.ts` 전체 | 로그인 시도 횟수 제한(rate limit)·계정 잠금·CAPTCHA 없음. 단일 자격증명이라 사전/무차별 대입에 노출. (확인 필요: 인프라(WAF/Vercel) 레벨 보호 여부 — 코드로 단정 불가) |
| S4 | Info | `secure` 쿠키가 NODE_ENV 의존 | `route.ts:29` | `secure: process.env.NODE_ENV === 'production'`. 비프로덕션에선 평문 전송 허용(개발 편의). 프로덕션 배포 시 `production`이어야 쿠키가 HTTPS 전용이 됨 |

긍정적 보안 설계(코드 확인):
- 토큰을 **httpOnly 쿠키**로 발급해 XSS로부터 토큰 탈취를 차단(`route.ts:28`). 클라이언트 코드(`page.tsx`)는 토큰을 직접 다루지 않음.
- 시크릿 fail-closed: `ADMIN_JWT_SECRET` 미설정 시 하드코딩 fallback 없이 throw(`lib/auth/admin.ts:11-18`).
- `sameSite:'lax'`로 기본적인 CSRF 완화(`route.ts:30`).

---

#### 7. 화면 간 이동 흐름

진입 경로:
- URL 직접 접근 `/admin/login`(누구나).
- `/admin` 대시보드가 인증 미통과 시 이 화면으로 리다이렉트: `app/admin/page.tsx:39-41`(`!data.authenticated` → `router.push('/admin/login')`), `:46-47`(세션 확인 예외 시도 리다이렉트).
- 관리자 로그아웃 후: `app/admin/page.tsx:57`(`handleLogout` → `router.push('/admin/login')`).

다음 이동 가능 화면:
- 로그인 성공 → `/admin`(대시보드). `router.push('/admin')` + `router.refresh()`(`app/admin/login/page.tsx:32-33`).

redirect 조건:
- 이 화면 자체에는 자동 redirect가 없다(성공 시 명시적 push만). 마운트 시 세션 검사·리다이렉트 없음(§1).

인증·권한 실패 시 이동 경로:
- 로그인 실패(401/500)는 **이동 없이** 동일 화면에 에러 메시지 표시(`page.tsx:35,38`). 페이지 전환은 성공 시에만 발생.
- (역방향) `/admin` 진입 실패 시 이 화면으로 보내지는 흐름은 위 "진입 경로" 참조.

> 흐름 주의: `/admin`의 인증 게이트는 **클라이언트 측**(`useEffect`에서 `GET /api/admin/auth/session` 호출 후 분기, `app/admin/page.tsx:33-52`)이다. `middleware.ts`가 없어 서버 단 차단은 없으므로, 로그인 없이 `/admin` URL로 직접 들어가면 페이지가 잠깐 마운트된 뒤 클라이언트 리다이렉트된다(공통 인프라 §1-3). 단, 실제 데이터 API(`/api/admin/*`)는 각 라우트 가드에 의존(이 화면 범위 밖, 확인 필요).

---

#### 8. 확인 필요 사항

| # | 확인 불가 항목 | 이유 | 추가로 봐야 할 파일 | 개발자 확인 질문 |
|---|---|---|---|---|
| 1 | 운영 환경의 `ADMIN_USERNAME`/`ADMIN_PASSWORD`/`ADMIN_JWT_SECRET` 설정 여부 | 환경변수는 코드로 확인 불가 | Vercel/배포 환경 설정 | 프로덕션에 3개 환경변수가 모두 설정돼 있는가? 미설정 시 로그인이 500으로 실패 |
| 2 | 이미 로그인된 관리자가 `/admin/login` 재진입 시 의도된 UX | 화면에 세션 인지 로직이 없어 의도 추정 불가(`app/admin/login/page.tsx` 전체) | — | 로그인 상태에서 `/admin/login` 접근 시 `/admin`으로 자동 보내야 하는가? |
| 3 | 로그인 무차별 대입 방어(rate limit/잠금) 존재 여부 | 코드 레벨에 없음. 인프라 레벨 보호는 코드로 단정 불가 | Vercel/WAF 설정 | 로그인 시도 제한이 인프라에 걸려 있는가? |
| 4 | `/api/admin/*` 데이터/CRUD 라우트의 `isAdminAuthenticated()` 가드 적용 여부 | 이 화면 분석 범위 밖(login만 호출) | `app/api/admin/{users,stats/*,chapters,questions}/route.ts` | 모든 admin 데이터 라우트가 가드를 호출하는가?(미호출 시 인증 우회) |


### 2.8 관리자 대시보드

> 근거 파일(절대경로)
> - 화면: `/Users/larkkim/manager-online-training/.claude/worktrees/upbeat-gates-ad9e3c/app/admin/page.tsx`
> - 호출 API: `app/api/admin/auth/session/route.ts`, `app/api/admin/auth/logout/route.ts`, `app/api/admin/users/route.ts`, `app/api/admin/users/complete/route.ts`, `app/api/admin/stats/{chapters,questions,dropoff,regions}/route.ts`
> - 데이터 레이어: `lib/supabase/stats.ts`, `lib/supabase/users.ts`, 인증 `lib/auth/admin.ts`, 클라이언트 `lib/supabase/client.ts`
>
> 본 화면이 **실제로 fetch하는** 백엔드 호출만 명세한다. 후보 중 `app/api/admin/auth/login` 은 이 화면에서 호출하지 않으므로 제외(로그인은 `/admin/login` 별도 화면. `app/admin/page.tsx:40,47`은 `router.push`로 이동만 한다).

---

#### 1) 화면 기본 정보

| 항목 | 내용 | 근거 |
|---|---|---|
| 화면명 | 관리자 대시보드 (Admin Dashboard) | `app/admin/page.tsx:147` 헤더 라벨 "Admin Dashboard" |
| Route | `/admin` | 파일 경로 `app/admin/page.tsx` (App Router) |
| 컴포넌트 경로 | `app/admin/page.tsx` `AdminPage` (`'use client'`) | `app/admin/page.tsx:1,17` |
| 접근 가능 사용자 유형 | 관리자(admin JWT 쿠키 보유자)만 | `app/admin/page.tsx:36-44`(클라이언트 가드) + 각 API의 `isAdminAuthenticated()` 가드 |
| 접근 조건 | 마운트 시 `GET /api/admin/auth/session`이 `authenticated: true`(200)일 때만 화면 렌더. 아니면 `/admin/login`으로 리다이렉트 | `app/admin/page.tsx:33-52,134-136` |
| 화면 목적 | 학습자 현황·챕터/문제/이탈/지역 통계를 5개 탭으로 조회하고, 진행 중 학습자를 수동 "완료 처리". 콘텐츠 관리(`/admin/content`)·로그아웃 진입점 제공 | `app/admin/page.tsx:168-738`(통계 카드+탭), `:324-351`(완료 처리), `:155-163`(콘텐츠 관리/로그아웃) |

화면 구성 요약:
- 상단 헤더: 로고, "콘텐츠 관리" 링크(`/admin/content`), "로그아웃" 버튼 (`:141-166`).
- 통계 카드 4개: 전체 학습자/학습 중/완료/전체 완료율 — **클라이언트에서 `users` 배열을 집계**(`:114-119,170-198`).
- 탭 5종: `users` / `chapters` / `questions` / `dropoff` / `regions` (`:15,204-222`).
- 하단 Supabase 안내 박스(정적 텍스트, `:741-749`).

> 4상태 처리(코드 확정): **loading**은 단일 전역 `loading` 스피너로 처리(`:121-132`), 전체 데이터 fetch가 모두 끝나야 `loading=false`(`:99-101`). **empty**는 각 탭 테이블 내부에 "사용자가/데이터가 없습니다" 행으로 내장(`:270-278,385-393,482-490,587-595,670-678`). **error**는 라우트 레벨 `error.tsx`가 없고(프로젝트 전체 부재), 페이지도 에러 상태 UI를 그리지 않는다 — fetch 실패는 `console.error`로만 처리되고 화면은 빈 데이터로 남는다(`:97-102`, 후술 §3·§8).

---

#### 2) 사용자별 가능 기능

| 사용자 유형 | 가능한 기능 | 제한 사항 |
|---|---|---|
| 관리자 (유효한 `admin-token` JWT 쿠키) | 통계 카드/5개 탭 전체 조회, 진행 중 학습자 "완료 처리", 콘텐츠 관리 페이지 이동, 로그아웃 | 데이터 조회는 모두 읽기 전용. 쓰기는 "완료 처리"(`completeUser`) 단 1종뿐 |
| 미인증 사용자(쿠키 없음/만료/위조) | 없음 — 화면 진입 시 `/admin/login`으로 즉시 리다이렉트되고, 직접 API 호출 시에도 각 라우트가 401 반환 | `app/admin/page.tsx:39-41` + `auth/session/route.ts:9`, `users/route.ts:8-13` 등 모든 호출 API에 가드 존재 |
| 학습자(일반 응시자) | 없음 — 학습자 세션(`localStorage`)은 admin JWT와 무관하므로 동일하게 미인증 취급 | 학습자/관리자 인증 체계 분리(공통 인프라 §1) |

> 학습자/관리자 인증은 완전 분리(학습자=localStorage 세션, 관리자=httpOnly JWT 쿠키). 이 화면은 **관리자 쿠키 기반만** 사용한다.

---

#### 3) 화면 기능 상세

**기능 A — 관리자 인증 확인 (진입 가드)**
- 설명: 마운트 직후 세션 유효성을 서버에 확인. 미인증이면 로그인으로 보냄.
- 트리거 UI: 화면 진입(`useEffect`, 마운트 시 1회) (`app/admin/page.tsx:33-52`).
- 입력값: 없음(쿠키 `admin-token`은 브라우저가 자동 첨부, fetch 코드에 노출 안 됨).
- 유효성 검증: 서버 `isAdminAuthenticated()` — JWT verify 성공/미만료 (`lib/auth/admin.ts:37-50`).
- 성공 시: `setAuthenticated(true)` → 데이터 fetch effect 작동(`:44,63-105`).
- 실패 시: `data.authenticated` falsy → `router.push('/admin/login')`(`:39-41`). fetch 자체가 throw하면 `console.error` 후 동일 리다이렉트(`:45-48`).
- 권한 조건: 없음(이 호출이 권한을 판정).

**기능 B — 대시보드 데이터 일괄 로드**
- 설명: 인증 확인 후 사용자 목록 + 4종 통계를 순차 fetch.
- 트리거 UI: `authenticated === true`로 바뀌면 effect 실행(`:63-105`).
- 입력값: 없음(전부 GET, 파라미터 없음).
- 유효성 검증: 각 응답의 `data.success`가 true일 때만 state에 반영(`:70,76,82,88,94`).
- 성공 시: `users/chapterStats/questionStats/dropoffAnalysis/regionStats` state 채움 → 탭 렌더.
- 실패 시: 5개 fetch를 **순차 await(`try` 1개)**. 중간 throw 시 catch로 빠지며 `console.error`만, 이후 fetch는 실행 안 됨. `finally`에서 `loading=false`(`:97-101`). 개별 응답이 `success:false`면 해당 state는 빈 채로 남고 사용자에게 에러 표시 없음.
- 권한 조건: 관리자(각 API가 401 가드).

**기능 C — 사용자 상태 필터 (클라이언트)**
- 설명: 전체/진행 중/완료 칩으로 사용자 테이블 필터링.
- 트리거 UI: 필터 칩 `<button>`(`:238-249`).
- 입력값: `filter ∈ {'all','in_progress','completed'}` (`:29-31`).
- 유효성 검증: 클라이언트 `Array.filter`만(`:107-112`). 서버 호출 없음.
- 성공/실패: 즉시 재렌더(네트워크 없음).
- 권한 조건: 화면 진입 = 관리자.

**기능 D — 학습자 완료 처리 (쓰기)**
- 설명: `status === 'In Progress'` 학습자를 수동으로 완료 상태로 전환.
- 트리거 UI: 사용자 행의 "완료 처리" `<button>` (진행 중 행에만 표시, `:325-351`).
- 입력값: `userId = user.id`(body JSON), 사전 `confirm()` 확인(`:328,333`).
- 유효성 검증: 클라이언트는 `confirm`만. 서버 `users/complete/route.ts:18-26`에서 `userId` 필수 검증(누락 시 400).
- 성공 시: `data.success` true → `alert('완료 처리되었습니다.')` 후 `window.location.reload()`(`:336-338`).
- 실패 시: `data.success` false → `alert('오류: ' + data.error)`(`:339-340`). fetch throw 시 `alert('완료 처리 중 오류가 발생했습니다.')`(`:342-343`).
- 권한 조건: 관리자(`users/complete/route.ts:8-13` 401 가드).

**기능 E — 콘텐츠 관리 이동 / 로그아웃**
- 콘텐츠 관리: `<Link href="/admin/content">`(`:155-160`). 클라이언트 라우팅. 별도 화면(2.x 참조).
- 로그아웃: "로그아웃" 버튼 → `handleLogout`이 `POST /api/admin/auth/logout` 후 `/admin/login`으로 이동(`:54-61`). fetch throw 시 `console.error`만 하고 리다이렉트는 하지 않음(`:58-60`) — 실패 시 화면에 머무름(확인 필요, §8).
- 권한 조건: 화면 진입 = 관리자.

---

#### 4) 백엔드 API / Supabase 명세

요청 형태/응답 봉투는 route.ts 코드 근거다. 공통 응답 봉투는 `ApiResponse<T>`(`types/index.ts:18-26`): `{ success, data?, error?, message? }`. 단 `auth/session`은 이 봉투를 쓰지 않고 `{ authenticated: boolean }`만 반환한다.

| 기능 | Method · Query | Endpoint · Table | Request (params/body) | Response 구조 | Error Case | 인증 필요 | role/권한 | 관련 RLS |
|---|---|---|---|---|---|---|---|---|
| 인증 확인 (기능 A) | GET (no query) | `/api/admin/auth/session` · (테이블 미접근, JWT 검증만) | 없음 (쿠키 `admin-token` 자동) | `{ authenticated: boolean }` (인증 200 / 미인증 401) | 예외 시 `{ authenticated:false }`+500 (`session/route.ts:11-14`) | 예 | admin JWT | 해당 없음(DB 미접근) |
| 로그아웃 (기능 E) | POST (no body) | `/api/admin/auth/logout` · (테이블 미접근) | 없음 | `{ success: true }` | 예외 시 `{ success:false, error }`+500 (`logout/route.ts:10-16`) | 가드 없음(쿠키 삭제만) | — | 해당 없음 |
| 사용자 목록 (기능 B) | GET (no query) | `/api/admin/users` · `users` | 없음 | `{ success:true, data: DbUser[] }` (`users/route.ts:17-20`) | 미인증 401(`:8-13`), 예외 500(`:21-30`) | 예 | admin JWT | `users` RLS는 service_role 전용; `supabaseAdmin`이 RLS 우회 |
| 챕터별 통계 (기능 B) | GET (no query) | `/api/admin/stats/chapters` · `chapters`,`chapter_history`,`user_progress` | 없음 | `{ success:true, data: ChapterStats[] }` (`stats/chapters/route.ts:17-20`) | 미인증 401, 예외 500 | 예 | admin JWT | 3개 테이블 service_role 우회 조회(`stats.ts:53-153`) |
| 문제별 통계 (기능 B) | GET (no query) | `/api/admin/stats/questions` · `questions`(+`chapters(name)` 조인),`question_attempts` | 없음 | `{ success:true, data: QuestionStats[] }` — **`correct_answer` 값 자체는 응답에 미포함**(내부 계산용으로만 select) | 미인증 401, 예외 500 | 예 | admin JWT | service_role 우회. `stats.ts:159`에서 `correct_answer` select하나 응답엔 정답률만(`:202-213`) |
| 이탈 분석 (기능 B) | GET (no query) | `/api/admin/stats/dropoff` · `users`(count),`chapters`,`user_progress` | 없음 | `{ success:true, data: DropoffAnalysis }` (`stats/dropoff/route.ts:17-20`) | 미인증 401, 예외 500 | 예 | admin JWT | service_role 우회(`stats.ts:219-289`) |
| 지역별 통계 (기능 B) | GET (no query) | `/api/admin/stats/regions` · `users` | 없음 | `{ success:true, data: RegionStats[] }` (`stats/regions/route.ts:17-20`) | 미인증 401, 예외 500 | 예 | admin JWT | service_role 우회(`stats.ts:291-347`) |
| 완료 처리 (기능 D) | POST · body | `/api/admin/users/complete` · `users` | `{ userId: string }` (`users/complete/route.ts:15-16`) | `{ success:true, message:'사용자가 완료 처리되었습니다.' }` (`:30-33`) | `userId` 누락 400(`:18-26`), 미인증 401(`:8-13`), 예외 500(`:34-43`) | 예 | admin JWT | `users` UPDATE를 service_role로 수행(`completeUser` `users.ts:237-251`) |

응답 타입 상세 근거:
- `DbUser`: `lib/supabase/users.ts:5-19` (id,name,phone,email,region,application_reason,status,session_token,current_chapter_id,total_study_time,created_at,completed_at,updated_at).
- `ChapterStats`: `stats.ts:4-14` / `QuestionStats`: `:16-29` / `DropoffAnalysis`: `:31-41` / `RegionStats`: `:43-51`.
- `getAllUsers()`는 필터 없이 `users` 전체 반환(`users.ts:253-263`) → **`session_token` 등 민감 컬럼이 응답 본문에 포함**될 수 있음(후술 §6 보안).

---

#### 5) 데이터베이스 연관 정보

| 테이블 | 읽기/쓰기 | 사용 목적 | 주요 컬럼 | 관계 | 근거 |
|---|---|---|---|---|---|
| `users` | 읽기(목록·집계) + 쓰기(완료 처리) | 사용자 목록·상태 통계, 진행 중→완료 전환 | id, name, phone, status, session_token, region, total_study_time, created_at, completed_at | 부모: `user_progress`/`chapter_history`/`question_attempts`가 참조(공통 §2) | `getAllUsers` `users.ts:253-263`, `completeUser` `:237-251` |
| `chapters` | 읽기 | 챕터 메타(이름/순서) 통계 라벨 | id, name, "order" | `questions`/`user_progress`/`chapter_history` 부모 | `stats.ts:53-153,219-289` |
| `chapter_history` | 읽기 | 챕터별 시도/완료/정답률 집계 | user_id, chapter_id, status, questions_correct, questions_total | FK→users/chapters | `getChapterStats` `stats.ts:53-153` |
| `user_progress` | 읽기 | 완료율·이탈 집계 | user_id, chapter_id, chapter_completed | UNIQUE(user_id,chapter_id) | `stats.ts:53-153,219-289` |
| `questions` | 읽기 | 문제 텍스트/챕터 라벨 + 정답 대조(내부) | id, question_text, chapter_id, correct_answer | `chapters` 자식, `question_attempts` 부모 | `getQuestionStats` `stats.ts:155-216` |
| `question_attempts` | 읽기 | 문제별 시도/오답률/선택 분포 집계 | question_id, user_answer | FK→users/questions/chapters | `stats.ts:167-198` |

- View/RPC: **사용 없음**. 모든 집계는 다중 `select` 후 **JS 레벨 집계**(Map/reduce) — `stats.ts` 전반.
- 쓰기 경로는 `completeUser`(`status='Completed'`, `completed_at=NOW()`) 단 1개(`users.ts:237-251`). 그 외 전부 읽기.

---

#### 6) 권한 및 보안 정책

- 로그인 필요 여부: **필요**. 화면은 admin JWT(httpOnly 쿠키 `admin-token`) 기반. 데이터 fetch 7종 중 6종(session/users/4 stats/complete)이 핸들러에서 `isAdminAuthenticated()` 가드를 호출(`*/route.ts:8`). 단 `logout`만 가드 없음(쿠키 삭제만, 부작용 없으므로 수용 가능).
- role 기반 접근 제어: JWT verify만 통과하면 인가. `isAdminAuthenticated()`는 서명·만료만 검사하고 `role==='admin'` 재확인은 하지 않음(`lib/auth/admin.ts:44-49`). 현재 토큰 발급 경로가 admin 로그인뿐이라 실질 동일하나, 발급 경로 증가 시 위험(공통 인증 §3.3).
- RLS 적용: 모든 데이터 접근은 `supabaseAdmin`(service_role)이라 **RLS 우회**(`client.ts:12-16`, `stats.ts:2`, `users.ts:2`). 따라서 행 수준 권한 보호는 없고, 접근 통제는 전적으로 API 핸들러의 admin 가드에 의존.
- 본인 데이터 한정 여부: 해당 없음(관리자는 전체 데이터 열람·관리가 정상 권한).
- 관리자 전용 기능: 화면 전체가 관리자 전용. 완료 처리(쓰기)도 관리자 전용.
- middleware 부재: `middleware.ts`가 프로젝트에 없어(공통 §7) 라우트 레벨 게이팅이 없다. `/admin` 페이지는 `'use client'` 컴포넌트이므로 **서버에서 진입을 막지 못하고**, HTML 골격은 클라이언트로 일단 전송된 뒤 `useEffect`에서 리다이렉트한다. 실제 민감 데이터는 API 가드가 막으므로 데이터 유출은 아니나, 인증 게이트가 클라이언트 측에 의존.

보안 주의점 / 코드상 잠재 취약점:
1. (Medium) `getAllUsers()`가 `users` 행 전체를 select해 응답하므로 `session_token`(학습자 세션 토큰, `users.ts:6-19`)이 `GET /api/admin/users` 응답 본문에 포함된다. 관리자만 호출 가능하나, 화면 표시에 불필요한 민감 토큰이 그대로 노출됨 → 응답 화이트리스트 필요(확인 필요: 의도 여부).
2. (Low) `auth/session` 예외 시 500을 반환하는데, 화면은 `data.authenticated`만 보므로(`:39`) 500 응답(JSON `{authenticated:false}`)이면 정상적으로 로그인으로 보내져 노출 위험은 낮음.
3. (Low) `handleLogout` 실패 시 리다이렉트하지 않아(`:58-60`) 사용자가 로그아웃됐다고 오인할 수 있음(서버 쿠키는 그대로) — UX/보안 경미.
4. (정보) `questions` 통계는 `correct_answer`를 내부 대조용으로만 select하고 응답엔 정답률만 포함 → 정답 비노출 정책 준수(`stats.ts:188-213`).

---

#### 7) 화면 간 이동 흐름

- 진입 경로:
  - `/admin/login`에서 로그인 성공 후(별도 화면) 또는 URL 직접 진입.
  - 마운트 시 `GET /api/admin/auth/session` 통과해야 콘텐츠 렌더(`app/admin/page.tsx:33-52`).
- 다음 이동 가능 화면:
  - "콘텐츠 관리" → `/admin/content` (`<Link>`, `:155-160`).
  - "로그아웃" → `POST logout` 후 `/admin/login` (`:54-61`).
  - "완료 처리" → 페이지 내 새로고침(`window.location.reload()`, `:338`), 화면 이동 아님.
- redirect 조건:
  - `auth/session`이 `authenticated:false`(401 포함) 또는 fetch 예외 → `/admin/login`(`:39-41,45-48`).
- 인증·권한 실패 시 이동 경로:
  - 화면 진입 시: 위 redirect로 `/admin/login`.
  - 개별 API가 401을 주는 경우(예: 세션은 통과했으나 데이터 fetch 시점에 쿠키 만료): 데이터 fetch effect는 `success:false`만 무시하고 화면에 머무름 — 이 경우 자동 재인증/리다이렉트 없음(확인 필요, §8).

---

#### 8) 확인 필요 사항

| # | 항목 | 이유/근거 | 추가 확인 파일 | 개발자 확인 질문 |
|---|---|---|---|---|
| 1 | `GET /api/admin/users` 응답에 `session_token` 등 민감 컬럼 포함이 의도인지 | `getAllUsers`가 전체 컬럼 select(`users.ts:253-263`), 화면은 name/phone/status/날짜만 사용(`page.tsx:285-322`) | `lib/supabase/users.ts` | 관리자 응답에서 `session_token`을 제거(화이트리스트)할 수 있는가? |
| 2 | 데이터 fetch 중 한 요청 실패 시 사용자 피드백 부재 | 5개 fetch가 단일 try에서 순차 await, 실패는 `console.error`만(`page.tsx:97-102`); `error.tsx` 부재(프로젝트 전역) | `app/admin/page.tsx` | 부분 실패/전체 실패 시 에러 토스트·재시도 UI가 필요한가? |
| 3 | 세션 만료가 데이터 fetch 시점에 발생하면 화면이 머무름 | effect는 `success` 체크만, 401에 대한 재인증/리다이렉트 없음(`page.tsx:70-95`) | `app/admin/page.tsx` | 데이터 API 401 시 `/admin/login`으로 강제 이동해야 하는가? |
| 4 | 로그아웃 실패 시 리다이렉트 안 함 | `handleLogout` catch에서 `console.error`만(`page.tsx:58-60`) | `app/admin/page.tsx` | 로그아웃 실패 시에도 클라이언트는 로그인으로 보내야 하는가? |
| 5 | `isAdminAuthenticated`가 `role` 미검증 | `lib/auth/admin.ts:44-49` verify만 | `lib/auth/admin.ts` | 향후 토큰 발급 경로 증가 시 `role==='admin'` 재확인이 필요한가? |
| 6 | service_role 환경변수 미설정 시 통계 0건 가능 | `SUPABASE_SERVICE_ROLE_KEY` 미설정 시 anon fallback→RLS 차단(`client.ts:12-16`, 공통 §6) | 환경설정 | 프로덕션에 service_role 키가 설정되어 있는가? |


### 2.9 관리자 콘텐츠 관리

> 분석 기준 워크트리: `/Users/larkkim/manager-online-training/.claude/worktrees/upbeat-gates-ad9e3c/`
> 모든 핵심 주장은 `파일:줄번호` 근거를 명시한다. 코드로 확인 불가한 항목은 8) 확인 필요 사항으로 분리한다.

---

#### 1) 화면 기본 정보

| 항목 | 내용 | 근거 |
|---|---|---|
| 화면명 | 관리자 콘텐츠 관리 (콘텐츠 관리 콘솔) | `app/admin/content/page.tsx:457-459`(헤더 "콘텐츠 관리") |
| Route | `/admin/content` | `app/admin/content/page.tsx:60`(`ContentManagementPage`), 디렉토리 경로 |
| 컴포넌트 경로 | `app/admin/content/page.tsx` (default export `ContentManagementPage`, `'use client'`) | `app/admin/content/page.tsx:1,60` |
| 접근 가능 사용자 유형 | 관리자(Admin)만 — `admin-token` JWT 쿠키 보유자 | `page.tsx:105-122`(마운트 시 세션 확인), `lib/auth/admin.ts:37-50` |
| 접근 조건 | 마운트 시 `GET /api/admin/auth/session` 호출 → `authenticated:false` 또는 fetch 예외면 `/admin/login`으로 `router.push` 후 차단. 인증 확인 전까지는 "인증 확인 중..." 스피너만 렌더 | `page.tsx:105-122,414-425` |
| 화면 목적 | 어드민이 학습 챕터(영상·필수 시청률·출제 수 등)와 퀴즈 문제(보기·정답·해설·난이도·상태)를 탭으로 구분해 조회·생성·수정·비활성화(soft delete)·영구삭제(hard delete) 하는 CRUD 콘솔 | `page.tsx:21,67`(탭), `page.tsx:196-369`(CRUD 핸들러), 상수 `page.tsx:50-54` |

핵심 구조:
- 단일 클라이언트 컴포넌트가 `chapters` / `questions` 두 탭을 상태로 전환한다(`page.tsx:21,67,493-524`).
- 데이터 로드 상태는 discriminated union `LoadState<T>`(`idle|loading|loaded|error`)로 모델링(`page.tsx:28-32`). 챕터/문제 각각 4상태 UI를 화면이 직접 그린다(`page.tsx:531-567,585-627`).
- 라우트 레벨 `middleware.ts`가 없어(공통 인프라 §7) 진입 가드는 전적으로 이 컴포넌트의 클라이언트 `useEffect`에 의존한다.

---

#### 2) 사용자별 가능 기능

| 사용자 유형 | 가능한 기능 | 제한 사항 |
|---|---|---|
| 관리자(Admin, 인증됨) | 챕터 목록 조회, 챕터 추가/수정, 챕터 비활성화(soft), 챕터 영구삭제(hard, CASCADE), 문제 목록 조회(챕터 필터), 문제 추가/수정, 문제 비활성화(soft), 문제 영구삭제(hard, CASCADE) | 모든 호출이 `admin-token` 쿠키(JWT) 보유 전제. 영구삭제는 복구 불가(CASCADE 경고 노출, `page.tsx:50-54`) |
| 학습자(Learner) | 없음 | 이 화면에 도달 불가 — 세션 확인 실패 시 `/admin/login`으로 리다이렉트(`page.tsx:110-112`). 학습자 세션(`localStorage`)은 어드민 인증과 별개 |
| 비로그인/비인증 | 없음 | 동일하게 `/admin/login`으로 리다이렉트(`page.tsx:110-118`). 단, 가드는 클라이언트 측이므로 API 자체는 각 라우트의 `isAdminAuthenticated()`가 별도 보호(아래 4) |

---

#### 3) 화면 기능 상세

##### (a) 어드민 인증 확인 (진입 가드)
- 설명: 마운트 시 어드민 세션 유효성을 확인. 유효하지 않으면 로그인 페이지로 이동.
- 트리거 UI: 페이지 마운트(`useEffect`, 사용자 조작 아님) `page.tsx:105-122`.
- 입력값: 없음(쿠키 `admin-token`은 브라우저가 자동 첨부, fetch 본문/헤더 명시 없음).
- 유효성 검증: 응답 JSON의 `authenticated` boolean 확인(`page.tsx:109-114`).
- 성공 시 동작: `setIsAuthenticated(true)` → 챕터 목록 자동 로드(`page.tsx:114,173-176`).
- 실패 시 동작: `authenticated:false` 또는 fetch 예외 → `console.error` 후 `router.push('/admin/login')`(`page.tsx:110-118`).
- 권한 조건: 관리자 전용.

##### (b) 챕터 목록 조회
- 설명: 어드민용 전체 챕터(Active+Inactive)와 챕터별 활성 문제 수(`questionCounts`)를 함께 로드해 `ChapterTable`로 렌더.
- 트리거 UI: 인증 성공 직후 자동(`page.tsx:173-176`), "챕터 구성" 탭 활성, 에러 시 "다시 시도" 버튼(`page.tsx:547-553`).
- 입력값: 없음.
- 유효성 검증: `json.success && json.data` 확인(`page.tsx:133`).
- 성공 시 동작: `chaptersState = {status:'loaded', data}` → `ChapterTable`에 `chapters`/`questionCounts` 전달(`page.tsx:140,557-566`).
- 실패 시 동작: `json.error` 또는 '챕터 목록을 불러올 수 없습니다.'/'네트워크 오류가 발생했습니다.' 메시지를 에러 상태로 표시(`page.tsx:134-143`).
- 권한 조건: 관리자 전용.

##### (c) 챕터 추가 / 수정
- 설명: `ChapterFormModal`에서 챕터 필드를 입력해 신규 생성(POST) 또는 기존 수정(PUT).
- 트리거 UI: 테이블의 추가 버튼(`onAdd` → `handleChapterAdd`, `page.tsx:196-199,564`), 행 수정 버튼(`onEdit` → `handleChapterEdit`, `page.tsx:201-204,561`).
- 입력값: `ChapterPayload` = `{ name, order, video_url, video_duration, required_watch_percentage, description(string|null), questions_count, status }` (`page.tsx:35-44`, 모달 `ChapterFormModal.tsx:11-20,150-162`).
- 유효성 검증(클라이언트, UX용): `ChapterFormModal.tsx:89-106` — name 필수, order≥1, video_url 필수, video_duration≥1, required_watch_percentage 1~100, questions_count 정수≥1.
- 유효성 검증(서버): POST는 name·video_url 비어있지 않음, order 숫자, status 값, `validateQuestionsCount`(`chapters/route.ts:76-121`). PUT은 `pickChapterFields`(allowlist) + questions_count 포함 시 `validateQuestionsCount` + 수정 항목≥1만 검증(`chapters/[id]/route.ts:39-57`).
- 성공 시 동작: 모달 `onSubmit` 성공 → 모달 닫힘(`ChapterFormModal.tsx:114-115`) → `loadChapters()` 재조회(`page.tsx:232`).
- 실패 시 동작: `json.success===false`면 `setActionError`로 상단 인라인 에러 배너 표시 후 `throw`(모달은 제출 상태만 해제)(`page.tsx:216-230,474-488`).
- 권한 조건: 관리자 전용.

##### (d) 챕터 비활성화 (soft delete)
- 설명: 챕터 `status`를 `Inactive`로 변경(데이터 보존, 학습자 비노출). `DELETE` 기본 모드.
- 트리거 UI: 행의 비활성화 액션(`onDelete` → `handleChapterSoftDelete`, `page.tsx:239-241,562`) → `ConfirmDialog`(variant `default`, `page.tsx:378-384`).
- 입력값: 대상 `chapter.id`(경로). 본문/쿼리 없음.
- 유효성 검증: 없음(확인 다이얼로그 확인만).
- 성공 시 동작: `loadChapters()` 재조회 후 다이얼로그 닫힘(`page.tsx:325,362`).
- 실패 시 동작: '챕터 비활성화에 실패했습니다.' 인라인 에러(`page.tsx:321-324`).
- 권한 조건: 관리자 전용.

##### (e) 챕터 영구 삭제 (hard delete, CASCADE)
- 설명: 챕터를 물리 삭제. FK CASCADE로 소속 문제·전체 학습자 진행 기록 동반 삭제(복구 불가). `DELETE ...?mode=hard`.
- 트리거 UI: 행의 영구삭제 액션(`onHardDelete` → `handleChapterHardDelete`, `page.tsx:243-245,563`) → `ConfirmDialog`(variant `danger`, 경고문 `CASCADE_CHAPTER_WARNING`, `page.tsx:50-51,385-391`).
- 입력값: 대상 `chapter.id`(경로) + `?mode=hard`(쿼리)(`page.tsx:327-330`).
- 유효성 검증: 확인 다이얼로그 확인.
- 성공 시 동작: `loadChapters()` 재조회 후 다이얼로그 닫힘(`page.tsx:336,362`).
- 실패 시 동작: '챕터 영구 삭제에 실패했습니다.' 인라인 에러(`page.tsx:332-335`).
- 권한 조건: 관리자 전용.

##### (f) 문제 목록 조회 (챕터 필터)
- 설명: 선택한 챕터의 문제(또는 전체) 어드민용 목록(Active+Inactive)을 `QuestionTable`로 렌더. 챕터 Select로 필터.
- 트리거 UI: "문제 관리" 탭 진입/`selectedChapterId` 변경 시 자동(`page.tsx:187-190`), Select(`page.tsx:575-581`), 에러 시 "다시 시도"(`page.tsx:609-615`).
- 입력값: `selectedChapterId`(빈 문자열이면 전체) → 쿼리 `?chapterId=` (`page.tsx:147-152`).
- 유효성 검증: `json.success && json.data` 확인(`page.tsx:155`).
- 성공 시 동작: `questionsState = {status:'loaded', data}` → `QuestionTable` 렌더(`page.tsx:162,619-627`).
- 실패 시 동작: `json.error`/'문제 목록을 불러올 수 없습니다.'/'네트워크 오류가 발생했습니다.'(`page.tsx:156-165`).
- 권한 조건: 관리자 전용.

##### (g) 문제 추가 / 수정
- 설명: `QuestionFormModal`에서 보기 4개·정답·해설·난이도·상태를 입력해 생성(POST)/수정(PUT). 수정 시 챕터 선택 잠금(`disabled={!!question}`, `QuestionFormModal.tsx:188`).
- 트리거 UI: 추가 버튼(`onAdd` → `handleQuestionAdd`, `page.tsx:251-254,625`), 수정 버튼(`onEdit` → `handleQuestionEdit`, `page.tsx:256-259,622`).
- 입력값: `QuestionCreateInput` = `{ chapter_id, question_text, question_image(string|null), option_1~4, correct_answer('1'~'4'), explanation(string|null), difficulty, status }` (`QuestionFormModal.tsx:150-162`).
- 유효성 검증(클라이언트): `QuestionFormModal.tsx:128-142` — chapter_id 필수, question_text 필수, option_1·2 필수, 정답으로 선택한 보기 비어있지 않음. 빈 보기는 정답 라디오 disabled(`:262`).
- 유효성 검증(서버): POST `validateQuestionCreate`, PUT `validateQuestionUpdate`(`questions/route.ts:49`, `questions/[id]/route.ts:33`). 상세는 `lib/validation/question.ts` — 보기 최소 2개, 정답 보기 내용 존재, correct_answer 단독 수정 차단 등(`question.ts:68-230`).
- 성공 시 동작: 모달 닫힘 → `loadQuestions(selectedChapterId)` + `loadChapters()`(questionCounts 갱신) 재조회(`page.tsx:289-291`).
- 실패 시 동작: `setActionError`로 인라인 에러 후 `throw`(`page.tsx:273-287`).
- 권한 조건: 관리자 전용.

##### (h) 문제 비활성화 (soft delete)
- 설명: 문제 `status`를 `Inactive`로 변경. `DELETE` 기본 모드.
- 트리거 UI: `onDelete` → `handleQuestionSoftDelete`(`page.tsx:298-300,623`) → `ConfirmDialog`(variant `default`, `page.tsx:392-398`).
- 입력값: 대상 `question.id`(경로).
- 성공 시 동작: `loadQuestions` + `loadChapters` 재조회 후 다이얼로그 닫힘(`page.tsx:347-348,362`).
- 실패 시 동작: '문제 비활성화에 실패했습니다.'(`page.tsx:343-346`).
- 권한 조건: 관리자 전용.

##### (i) 문제 영구 삭제 (hard delete, CASCADE)
- 설명: 문제 물리 삭제. `question_attempts` CASCADE 동반 삭제(복구 불가). `DELETE ...?mode=hard`.
- 트리거 UI: `onHardDelete` → `handleQuestionHardDelete`(`page.tsx:302-304,624`) → `ConfirmDialog`(variant `danger`, `CASCADE_QUESTION_WARNING`, `page.tsx:53-54,399-405`).
- 입력값: 대상 `question.id`(경로) + `?mode=hard`(`page.tsx:350-353`).
- 성공 시 동작: `loadQuestions` + `loadChapters` 재조회 후 닫힘(`page.tsx:359-360,362`).
- 실패 시 동작: '문제 영구 삭제에 실패했습니다.'(`page.tsx:355-358`).
- 권한 조건: 관리자 전용.

---

#### 4) 백엔드 API / Supabase 명세

> 이 화면이 **실제로 호출하는** 6개 호출만 명세한다. 후보였던 `app/api/admin/chapters/update/route.ts`(PUT, body `{chapterId, updates}`)는 **이 화면에서 호출하지 않는다** — 화면은 챕터 수정 시 `PUT /api/admin/chapters/${id}`(경로 파라미터)를 쓴다(`page.tsx:210`). 따라서 제외.

| 기능 | Method·Query | Endpoint·Table | Request (params/body) | Response 구조 | Error Case | 인증 필요 | role/권한 | 관련 RLS |
|---|---|---|---|---|---|---|---|---|
| 인증 확인 | GET | `/api/admin/auth/session` · (테이블 없음, 쿠키 검증만) | 없음(쿠키 `admin-token` 자동) | `{ authenticated: boolean }` (인증 200 / 미인증 401) `auth/session/route.ts:6-10` | 예외 시 `{authenticated:false}` 500 `:11-14` | 예(쿠키) | admin | 해당 없음(DB 미접근) |
| 챕터 목록 조회 | GET | `/api/admin/chapters` · `chapters`(+`countActiveQuestionsByChapter`→`questions`) | 없음 | `ApiResponse<{ chapters: DbChapter[]; questionCounts: Record<string,number> }>` `chapters/route.ts:38-41` | 미인증 401 `:19-24`, 조회 실패/예외 500 `:42-50` | 예 `isAdminAuthenticated()` `:19` | admin | service_role FOR ALL(우회). anon/auth 전면 거부 |
| 챕터 생성 | POST | `/api/admin/chapters` · `chapters` (`createChapter`) | body: `ChapterPayload`(name·order·video_url·video_duration·required_watch_percentage·description·questions_count·status) `page.tsx:221-225` | `ApiResponse<DbChapter>` 201 `chapters/route.ts:126-128` | 미인증 401, 본문 형식/필수값 400(`:66-121`), 예외 500 `:129-136` | 예 `:57` | admin | 동일(service_role) |
| 챕터 수정 | PUT | `/api/admin/chapters/{id}` · `chapters` (`updateChapter`) | params `id`; body `ChapterPayload`(`pickChapterFields`로 allowlist 추출) `page.tsx:210-213`, `[id]/route.ts:39` | `ApiResponse<DbChapter>` 200 `:61` | 미인증 401, id 없음/본문 형식/questions_count/수정항목0 400(`:22-57`), 예외 500 `:62-70` | 예 `:13` | admin | 동일 |
| 챕터 삭제(soft) | DELETE | `/api/admin/chapters/{id}` · `chapters`(`updateChapter status=Inactive`) | params `id` `page.tsx:316-318` | `ApiResponse<DbChapter>` 200 `:114` | 미인증 401, id 없음 400, 예외 500 `:115-122` | 예 `:78` | admin | 동일 |
| 챕터 삭제(hard) | DELETE · `?mode=hard` | `/api/admin/chapters/{id}` · `chapters`(`deleteChapter`, CASCADE→`questions`/`user_progress`/`chapter_history`/`question_attempts`) | params `id`, query `mode=hard` `page.tsx:327-330` | `ApiResponse`(`{success:true}` data 없음) 200 `:108` | 미인증 401, 삭제 실패 500 `:101-106`, 예외 500 | 예 `:78` | admin | 동일 + FK CASCADE(`schema.sql:32,83,106,130`) |
| 문제 목록 조회 | GET · `?chapterId=` (선택) | `/api/admin/questions` · `questions` (`getQuestionsByChapterAdmin`/`getAllQuestionsAdmin`) | query `chapterId`(없으면 전체) `page.tsx:150-153` | `ApiResponse<DbQuestion[]>` 200 `questions/route.ts:27` | 미인증 401 `:13-18`, 예외 500 `:28-36` | 예 `:13` | admin | 동일 |
| 문제 생성 | POST | `/api/admin/questions` · `questions` (`createQuestion`) | body `QuestionCreateInput` `page.tsx:278-281` | `ApiResponse<DbQuestion>` 201 `:72-74` | 미인증 401, `validateQuestionCreate` 실패 400 `:51-56`, 본문 형식 400 `:59-67`, 예외 500 `:75-82` | 예 `:41` | admin | 동일 |
| 문제 수정 | PUT | `/api/admin/questions/{id}` · `questions` (`updateQuestion`) | params `id`; body 부분 `QuestionCreateInput` `page.tsx:267-270` | `ApiResponse<DbQuestion>` 200 `[id]/route.ts:45` | 미인증 401, id 없음 400, `validateQuestionUpdate` 실패 400 `:35-40`, 예외 500 `:46-54` | 예 `:16` | admin | 동일 |
| 문제 삭제(soft) | DELETE | `/api/admin/questions/{id}` · `questions`(`softDeleteQuestion status=Inactive`) | params `id` `page.tsx:338-341` | `ApiResponse<DbQuestion>` 200 `:97` | 미인증 401, id 없음 400, 예외 500 `:98-106` | 예 `:62` | admin | 동일 |
| 문제 삭제(hard) | DELETE · `?mode=hard` | `/api/admin/questions/{id}` · `questions`(`hardDeleteQuestion`, CASCADE→`question_attempts`) | params `id`, query `mode=hard` `page.tsx:350-353` | `ApiResponse`(`{success:true}`) 200 `:91` | 미인증 401, 삭제 실패 500 `:84-89`, 예외 500 | 예 `:62` | admin | 동일 + FK CASCADE(`schema.sql:129`) |

응답 봉투: 모든 어드민 API는 공통 `ApiResponse<T>`(`{success, data?, error?, ...}`, `types/index.ts:18-26`)를 사용. 화면은 `json.success`/`json.data`/`json.error`만 사용(`page.tsx:133,155,216` 등).

---

#### 5) 데이터베이스 연관 정보

| 항목 | 내용 | 읽기/쓰기 | 근거 |
|---|---|---|---|
| `chapters` (Table) | 챕터 조회(GET, Active+Inactive 인라인 select), 생성/수정/soft delete(status=Inactive)/hard delete | 읽기+쓰기 | `chapters/route.ts:27-30,124`, `[id]/route.ts:59,99,112` |
| `questions` (Table) | 어드민 문제 목록(Active+Inactive), 생성/수정/soft·hard delete, 챕터별 활성 문제 수 집계(`countActiveQuestionsByChapter`) | 읽기+쓰기 | `questions/route.ts:23-25,70`, `[id]/route.ts:43,82,95`, `chapters/route.ts:36` |
| `user_progress`·`chapter_history`·`question_attempts` (Tables) | 직접 쿼리하지 않음. 챕터/문제 **hard delete 시 FK CASCADE로 자동 동반 삭제**되는 대상 | 쓰기(간접, CASCADE) | `schema.sql:83,106,130`(chapter FK), `:129`(question FK) |
| 주요 컬럼 | `chapters`: id, name, order, video_url, video_duration, required_watch_percentage, description, questions_count, status / `questions`: id, chapter_id, question_text, question_image, option_1~4, correct_answer, explanation, difficulty, total_attempts/correct_count/incorrect_count(통계), status | — | `chapters.ts:4-16`, `questions.ts:4-22` |
| 관계 | `chapters` 1—N `questions`(chapter_id FK, CASCADE), `questions` 1—N `question_attempts`(CASCADE) | — | `schema.sql:32,129` |
| Views / RPC | 없음 — 모두 단순 select/insert/update/delete. `questionCounts`는 단일 쿼리 후 JS reduce(N+1 회피) | — | `questions.ts:287-304` |
| 사용 목적 | 어드민 콘텐츠(챕터·문제) CRUD + 챕터별 활성 문제 수 표시 | — | 화면 전반 |

> 정답 노출 관점: 이 화면은 어드민 전용이므로 문제 목록 GET이 `correct_answer`/`explanation`을 포함한 `DbQuestion`을 그대로 반환한다(학습자용 `toPublicQuestion` 미적용). 어드민 컨텍스트에서는 의도된 동작(공통 인프라 §2.1, MEMORY 정답 노출 정책).

---

#### 6) 권한 및 보안 정책

- 로그인 필요 여부: 필요. 어드민 JWT(`admin-token`, httpOnly 쿠키) 보유자만. 화면은 마운트 시 `GET /api/admin/auth/session`으로 확인(`page.tsx:105-122`).
- role 기반 접근 제어: 모든 호출 API가 핸들러 첫 줄에서 `isAdminAuthenticated()`를 호출해 미인증 시 401 반환(`chapters/route.ts:19,57`, `[id]/route.ts:13,78`, `questions/route.ts:13,41`, `[id]/route.ts:16,62`, `auth/session/route.ts:6`). 본 화면이 호출하는 6개 엔드포인트 전부 가드가 걸려 있음 — 공통 인프라가 우려한 "가드 누락 라우트"는 이 화면 범위에서는 해당 없음(확인 완료).
- RLS 적용: DB는 `service_role` 전용 FOR ALL 정책만 존재(anon/authenticated 전면 거부, `schema.sql:185-191`). 어드민 API는 `supabaseAdmin`(service_role)로 접근해 RLS를 우회하므로(`chapters/route.ts:4,27`), 실질 접근 통제는 라우트 핸들러의 `isAdminAuthenticated()` 게이트가 유일한 경계다.
- 본인 데이터 한정 여부: 해당 없음 — 콘텐츠(챕터/문제)는 전역 공용 자원이므로 "본인 데이터" 개념이 없다. 인증된 어드민은 전체 콘텐츠를 조작.
- 관리자 전용 기능: 화면 전체가 관리자 전용. 특히 hard delete는 CASCADE로 학습자 진행/시도 기록까지 영구 삭제(복구 불가) — 파괴력이 큰 관리자 전용 기능.
- 보안 주의점:
  - 진입 가드가 **클라이언트 측**(`useEffect`+`router.push`)이라 `middleware.ts` 부재(공통 인프라 §7)와 결합 시, 서버 단 진입 차단이 없다. 다만 데이터/CRUD API 자체는 모두 서버 `isAdminAuthenticated()`로 보호되므로, 비인증 사용자가 URL로 직접 진입해도 데이터는 401로 막힌다(노출되는 것은 빈 UI 골격뿐).
  - `admin-token` JWT는 `role==='admin'` 재확인 없이 "서명·미만료"만으로 통과(`lib/auth/admin.ts:44-49`, 공통 인프라 §3.3). 현재 발급 경로가 admin 로그인뿐이라 사실상 동일하나, 토큰 발급 경로 증가 시 위험.
- 코드상 잠재적 권한/무결성 취약점:
  - **챕터 PUT 검증 약화(High)**: `PUT /api/admin/chapters/{id}`는 POST와 달리 `name`/`video_url` 비어있지 않음·`order` 숫자 검증이 **없다**. `pickChapterFields`(allowlist)와 `questions_count`만 검증한다(`[id]/route.ts:39-57`). 화면 모달은 클라이언트 검증을 하지만(`ChapterFormModal.tsx:89-106`), API 직접 호출 시 `name:''`·`video_url:''`·비정수 `order` 같은 무결성 깨진 값이 통과해 학습자 화면을 깨뜨릴 수 있다. (서버 검증 비대칭 — 공통 규칙 "server-side validation 필수" 위반 소지)
  - **mass-assignment 부분 노출(Medium)**: 챕터는 `pickChapterFields` allowlist로 막혀 있으나, **문제 PUT은** `validateQuestionUpdate` 통과 후 `body`를 `updateQuestion`에 그대로 전달한다(`questions/[id]/route.ts:42-43`). validation은 허용 필드를 검사할 뿐 unknown 키를 제거하지 않으므로, 클라이언트가 통계 컬럼(`total_attempts` 등) 등 임의 키를 함께 보내면 `updateQuestion`의 update 객체에 섞일 수 있다(영향은 `updateQuestion`/DB 컬럼 제약에 의존 — 확인 필요).
  - **에러 메시지 원문 노출(Low)**: 모든 라우트가 `error.message`(데이터 레이어의 한국어 문구 또는 DB 에러)를 그대로 응답에 실어 화면 인라인 배너로 노출(`chapters/route.ts:43-47`, `page.tsx:217`). 내부 에러가 사용자에게 그대로 전달될 여지(메시지 매핑 정책 부재).

---

#### 7) 화면 간 이동 흐름

- 진입 경로:
  - `/admin`(대시보드)에서의 링크 추정 — 화면 자체에 `/admin`으로 돌아가는 "대시보드로" 링크가 있음(`page.tsx:462-468`). 역방향 진입 링크 위치는 `/admin` 페이지 본문이라 이 화면 범위 밖(확인 필요).
  - URL 직접 진입(`/admin/content`).
- 다음 이동 가능 화면:
  - `/admin` — 헤더의 "대시보드로" `Link`(`page.tsx:462-468`).
  - `/admin/login` — 인증 실패 리다이렉트(`page.tsx:111,117`).
- redirect 조건: 마운트 시 세션 확인에서 `authenticated:false` 또는 fetch 예외 → `router.push('/admin/login')`(`page.tsx:110-118`).
- 인증·권한 실패 시 이동 경로: `/admin/login`. (API 레벨 401은 화면 내 인라인 에러로 표시될 뿐 라우팅하지 않음 — 단 최초 마운트 세션 확인 401은 곧바로 로그인으로 리다이렉트.)
- 화면 내부 전환: 탭 전환(`chapters` ↔ `questions`)은 라우팅 없이 컴포넌트 상태로 처리(`page.tsx:493-524`). 모달(`ChapterFormModal`/`QuestionFormModal`/`ConfirmDialog`)도 오버레이로 페이지 이동 없음.

---

#### 8) 확인 필요 사항

1. 챕터 PUT의 `name`/`video_url`/`order` 서버 검증 부재(`[id]/route.ts:39-57`)가 의도된 설계인지 — POST와 비대칭. (개발자 확인 질문: "챕터 수정 API에 생성과 동일한 필수값 검증을 추가해야 하는가?")
2. 문제 PUT의 `body` 직접 전달(`questions/[id]/route.ts:42-43`)이 `updateQuestion`/DB에서 unknown 키(통계 컬럼 등)를 어떻게 처리하는지 — 추가로 `lib/supabase/questions.ts:231-247`(`updateQuestion`)의 실제 update 컬럼 화이트리스트 여부 확인 필요.
3. `/admin` 대시보드에서 이 화면으로의 진입 링크/네비게이션 존재 여부 — `app/admin/page.tsx` 본문 미확인.
4. 프로덕션 환경변수(`ADMIN_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) 실제 설정 여부 — 코드로 확인 불가(공통 인프라 §6). 미설정 시 401 또는 RLS 차단으로 전 화면 동작 불가.
5. hard delete의 CASCADE 범위(학습자 진행/시도 기록 동반 삭제)에 대한 운영 정책/백업 절차 존재 여부 — 코드 외 영역.


---

## 3. 전체 API / Supabase 호출 목록

전 화면의 `apiCalls`를 평탄화한 표다. 동일 endpoint가 여러 화면에서 호출되는 경우(예: `/api/chapters/list`, `/api/progress/get`)는 각 행을 분리해 **어느 화면에서 호출되는지**를 명시한다 — 호출처가 다르면 인증 가드·신뢰 경계 점검 포인트도 화면마다 동일하게 반복 적용해야 하기 때문이다.

> 권한 칸 표기 약속:
> - **인증**: 서버 핸들러가 세션 토큰/쿠키를 실제로 검증하는지 여부
> - **Role**: 호출에 사용되는 DB 권한 주체. 학습자 API는 거의 전부 `supabaseAdmin(service_role)`로 RLS를 우회하며, `userId`는 클라이언트 입력을 그대로 신뢰(IDOR)한다.
> - **RLS**: 6개 테이블 전부 RLS 활성 + `service_role` 전용 `FOR ALL` 정책만 존재 → `anon/authenticated` 직접 접근은 전면 거부, 서버는 service_role로 우회.

### 3.1 학습자 / 공개 경로

| 화면 | 기능 | Method · Query | Endpoint · Table | 권한 |
|---|---|---|---|---|
| 랜딩(`/`) | 세션 시작(사용자 생성/조회 + 토큰 발급) | POST (HTTP body) | `/api/auth/start` · `users(R+W)` | 인증: 불필요(비인증 진입점) / Role: 없음(공개), 서버는 service_role / RLS: service_role 우회. body `{name,phone,region,applicationReason}`, `agreed` 미전송. 응답에 `session` + `user(DbUser 전체)` 노출 |
| 학습 홈(`/learn`) | 활성 챕터 목록 조회 | GET / `.select().eq('status','Active').order('order')` | `/api/chapters/list` · `chapters` | 인증: 불요(핸들러 가드 없음) / Role: 없음(공개) / RLS: service_role 우회. 파라미터 없음, 화면은 `DbChapter.id`만 사용 |
| 학습 홈(`/learn`) | 사용자 진행도 조회 | GET / `.select('*').eq('user_id', userId)` | `/api/progress/get?userId={uuid}` · `user_progress` | 인증: 불요(세션 토큰 검증 없음) / Role: 없음 — `userId`를 클라이언트 입력으로 신뢰(IDOR) / RLS: service_role 우회, 행 단위 소유권 검증 없음. 내부 에러 시 빈 배열 반환(`progress.ts:63-76`) |
| 챕터 영상(`/learn/chapter/[id]`) | 챕터 목록 조회(초기 로드) | GET / `getActiveChapters` | `/api/chapters/list` · `chapters` | 인증: 없음 / Role: 익명 호출 가능 / RLS: service_role 우회. 파라미터 없음 |
| 챕터 영상(`/learn/chapter/[id]`) | 사용자 진행도 조회(초기 로드) | GET ?userId / `getAllUserProgress` | `/api/progress/get?userId=...` · `user_progress` | 인증: 없음(세션 토큰 검증 부재) / Role: `userId` 클라이언트 입력 신뢰 — 소유권 미검증(IDOR) / RLS: service_role 우회. DB 에러 시 데이터 레이어 빈 배열(`progress.ts:71-73`) |
| 챕터 영상(`/learn/chapter/[id]`) | 진행 상황 저장(영상 진행률) | POST (body) | `/api/progress/save` · `user_progress(R/W), chapters(R), questions(R)` | 인증: 없음(세션 토큰 검증 부재) / Role: `userId` 클라이언트 입력 신뢰(IDOR) / RLS: service_role 우회. body `{userId,chapterId,watchTime,isWatched}` — 서버는 `isWatched` 무시, `watchTime` clamp 후 시청률 재계산 |
| 챕터 퀴즈(`/learn/chapter/[id]/quiz`) | 챕터 목록 로드 | GET (query 없음) | `/api/chapters/list` · `chapters(read)` | 인증: 미검증(세션 토큰/쿠키 미확인) / Role: service_role(RLS 우회) / RLS: chapters service_role `FOR ALL`만 |
| 챕터 퀴즈(`/learn/chapter/[id]/quiz`) | 진행도 로드 | GET ?userId | `/api/progress/get` · `user_progress(read)` | 인증: 미검증 — `userId`만 신뢰(IDOR) / Role: service_role / RLS: service_role 전용. 없으면 빈 배열 |
| 챕터 퀴즈(`/learn/chapter/[id]/quiz`) | 출제 문항 로드 | GET ?chapterId | `/api/questions/random` · `questions(read), chapters(read)` | 인증: 미검증 / Role: service_role / RLS: service_role 전용. 응답 `PublicQuestion[]` — `toPublicQuestion`으로 정답·해설·통계·status 제거 |
| 챕터 퀴즈(`/learn/chapter/[id]/quiz`) | 답안 제출/채점 | POST (JSON body) | `/api/answer/submit` · `questions(R+W stats), chapter_history(R count+W), question_attempts(W)` | 인증: 미검증 — `userId/chapterId` 클라이언트 신뢰(IDOR) / Role: service_role / RLS: 4개 테이블 모두 service_role 전용. body `{userId,chapterId,answers}`, 응답에 오답의 정답·해설 의도적 노출 |
| 챕터 결과(`/learn/chapter/[id]/result`) | 챕터 목록 로드(헤더/다음챕터 계산) | GET (쿼리 없음) | `/api/chapters/list` · `chapters(read)` | 인증: 서버측 검증 없음 / Role: 누구나 호출 가능(가드 부재) / RLS: service_role 우회, anon/authenticated 거부 |
| 챕터 결과(`/learn/chapter/[id]/result`) | 사용자 진행도 로드(완료 챕터 order 계산) | GET ?userId={uuid} | `/api/progress/get` · `user_progress(read)` | 인증: 세션 토큰 검증 없음 / Role: 클라이언트 `userId` 신뢰 → IDOR / RLS: service_role 우회(`progress.ts:63-76`), error 시 빈 배열. 400 `사용자 ID가 필요합니다.` |
| 챕터 결과(`/learn/chapter/[id]/result`) | 챕터 완료 처리(다음 챕터로/완료 클릭) | POST | `/api/progress/complete` · `user_progress(R+W), chapter_history(R), chapters(R), users(W,전체완료시)` | 인증: 세션 토큰 검증 없음 / Role: 클라이언트 `userId` 신뢰(IDOR). 단 완료는 `chapter_history` 채점기록(`hasPassedChapterQuiz`)으로 서버 게이팅 / RLS: 전 테이블 service_role 우회. 응답 `{success, message, allCompleted}`; 403 진행레코드없음/영상미시청/퀴즈미통과. 클라이언트는 응답 ok/success 미확인 |
| 학습 완료(`/complete`) | 완료 챕터 목록 로드 | GET (쿼리 없음) | `/api/chapters/list` · `chapters(read)` | 인증: 불필요(공개 GET) / Role: service_role / RLS: service_role full access 우회, anon/authenticated 거부 |
| 학습 완료(`/complete`) | 완료 자격 검증 및 상태 확정 | POST | `/api/complete` · `chapters(R), user_progress(R), users(W)` | 인증: 세션 토큰 검증 없음 — body `userId`만 사용 / Role: service_role / RLS: service_role full access 우회, DB 레벨 IDOR 방어 없음. body `{userId}`; 403 `{error, completedChapters, totalChapters}` |

### 3.2 관리자 경로 (admin-token JWT 쿠키)

| 화면 | 기능 | Method · Query | Endpoint · Table | 권한 |
|---|---|---|---|---|
| 관리자 로그인(`/admin/login`) | 관리자 로그인 | POST (JSON body) | `/api/admin/auth/login` · 없음(DB 미접근) | 인증: 불필요(로그인 진입점) / Role: 누구나 호출, 성공 시 JWT `{username,role:'admin',exp}` 발급 / RLS: 해당 없음 — `ADMIN_USERNAME/ADMIN_PASSWORD` 환경변수 평문 비교. 성공 200 + Set-Cookie `admin-token`(HttpOnly,SameSite=Lax,Max-Age=86400,Path=/) / 불일치 401 |
| 관리자 대시보드(`/admin`) | 관리자 인증 확인 | GET (no query) | `/api/admin/auth/session` · DB 미접근(JWT 검증만) | 인증: 예 / Role: admin JWT / RLS: 해당 없음. 응답 `{authenticated}` — 인증 200 / 미인증 401 |
| 관리자 대시보드(`/admin`) | 로그아웃 | POST (no body) | `/api/admin/auth/logout` · DB 미접근(쿠키 삭제) | 인증: 아니오(가드 없음, 쿠키 삭제만) / Role: — / RLS: 해당 없음. 응답 `{success:true}`, 예외 시 500 |
| 관리자 대시보드(`/admin`) | 사용자 목록 조회 | GET (no query) | `/api/admin/users` · `users` | 인증: 예 / Role: admin JWT / RLS: users service_role 전용, supabaseAdmin 우회. 응답 `DbUser[]`(select '*' → session_token 등 포함), 401/500 |
| 관리자 대시보드(`/admin`) | 챕터별 통계 | GET (no query) | `/api/admin/stats/chapters` · `chapters, chapter_history, user_progress` | 인증: 예 / Role: admin JWT / RLS: service_role 우회(`stats.ts:53-153`). 응답 `ChapterStats[]`, 401/500 |
| 관리자 대시보드(`/admin`) | 문제별 통계 | GET (no query) | `/api/admin/stats/questions` · `questions(+chapters(name) 조인), question_attempts` | 인증: 예 / Role: admin JWT / RLS: service_role 우회(`stats.ts:155-216`). 응답 `QuestionStats[]` — `correct_answer` 값 자체는 미포함(내부 정답률 계산용 select), 401/500 |
| 관리자 대시보드(`/admin`) | 이탈 분석 | GET (no query) | `/api/admin/stats/dropoff` · `users(count), chapters, user_progress` | 인증: 예 / Role: admin JWT / RLS: service_role 우회(`stats.ts:219-289`). 응답 `DropoffAnalysis`, 401/500 |
| 관리자 대시보드(`/admin`) | 지역별 통계 | GET (no query) | `/api/admin/stats/regions` · `users` | 인증: 예 / Role: admin JWT / RLS: service_role 우회(`stats.ts:291-347`). 응답 `RegionStats[]`, 401/500 |
| 관리자 대시보드(`/admin`) | 학습자 완료 처리 | POST · body | `/api/admin/users/complete` · `users` | 인증: 예 / Role: admin JWT / RLS: users UPDATE를 service_role로 수행(`completeUser users.ts:237-251`), 우회. body `{userId}`, 누락 400 / 미인증 401 / 500 |
| 관리자 콘텐츠(`/admin/content`) | 어드민 인증 확인 | GET | `/api/admin/auth/session` · DB 미접근(JWT 검증) | 인증: 예(쿠키 기반) / Role: admin / RLS: 해당 없음. `{authenticated}` 200/401 |
| 관리자 콘텐츠(`/admin/content`) | 챕터 목록 조회 | GET | `/api/admin/chapters` · `chapters(+questions via countActiveQuestionsByChapter)` | 인증: 예(`isAdminAuthenticated`, `chapters/route.ts:19`) / Role: admin / RLS: service_role `FOR ALL` 우회. 응답 `{chapters:DbChapter[], questionCounts}` |
| 관리자 콘텐츠(`/admin/content`) | 챕터 생성 | POST | `/api/admin/chapters` · `chapters(createChapter)` | 인증: 예(`chapters/route.ts:57`) / Role: admin / RLS: service_role 우회. body `ChapterPayload`, 응답 `DbChapter` 201 |
| 관리자 콘텐츠(`/admin/content`) | 챕터 수정 | PUT | `/api/admin/chapters/{id}` · `chapters(updateChapter)` | 인증: 예(`[id]/route.ts:13`) / Role: admin / RLS: service_role 우회. body `ChapterPayload`(pickChapterFields allowlist), 응답 `DbChapter` 200 |
| 관리자 콘텐츠(`/admin/content`) | 챕터 비활성화(soft delete) | DELETE | `/api/admin/chapters/{id}` · `chapters(status=Inactive)` | 인증: 예(`[id]/route.ts:78`) / Role: admin / RLS: service_role 우회. 응답 `DbChapter` 200 |
| 관리자 콘텐츠(`/admin/content`) | 챕터 영구삭제(hard delete) | DELETE ?mode=hard | `/api/admin/chapters/{id}?mode=hard` · `chapters + CASCADE→questions/user_progress/chapter_history/question_attempts` | 인증: 예(`[id]/route.ts:78`) / Role: admin / RLS: service_role 우회 + FK CASCADE. 응답 `{success:true}` 200 |
| 관리자 콘텐츠(`/admin/content`) | 문제 목록 조회 | GET ?chapterId=(선택) | `/api/admin/questions` · `questions` | 인증: 예(`questions/route.ts:13`) / Role: admin / RLS: service_role 우회. `chapterId` 없으면 전체, 응답 `DbQuestion[]` 200 |
| 관리자 콘텐츠(`/admin/content`) | 문제 생성 | POST | `/api/admin/questions` · `questions(createQuestion)` | 인증: 예(`questions/route.ts:41`) / Role: admin / RLS: service_role 우회. body `QuestionCreateInput`, 응답 `DbQuestion` 201 |
| 관리자 콘텐츠(`/admin/content`) | 문제 수정 | PUT | `/api/admin/questions/{id}` · `questions(updateQuestion)` | 인증: 예(`[id]/route.ts:16`) / Role: admin / RLS: service_role 우회. body 부분 `QuestionCreateInput`(allowlist 미적용 — §부록), 응답 `DbQuestion` 200 |
| 관리자 콘텐츠(`/admin/content`) | 문제 비활성화(soft delete) | DELETE | `/api/admin/questions/{id}` · `questions(status=Inactive)` | 인증: 예(`[id]/route.ts:62`) / Role: admin / RLS: service_role 우회. 응답 `DbQuestion` 200 |
| 관리자 콘텐츠(`/admin/content`) | 문제 영구삭제(hard delete) | DELETE ?mode=hard | `/api/admin/questions/{id}?mode=hard` · `questions + CASCADE→question_attempts` | 인증: 예(`[id]/route.ts:62`) / Role: admin / RLS: service_role 우회 + FK CASCADE. 응답 `{success:true}` 200 |

### 3.3 중복 호출 및 신뢰 경계 요약

- **`/api/chapters/list`** — 학습 홈·챕터 영상·챕터 퀴즈·챕터 결과·학습 완료 **5개 화면**에서 공통 호출. 전부 인증 가드 없음(공개). `video_url` 포함 활성 챕터 메타가 비인증 노출됨(§5 Medium "인증 없는 콘텐츠 노출").
- **`/api/progress/get`** — 학습 홈·챕터 영상·챕터 퀴즈·챕터 결과 **4개 화면**에서 공통 호출. 전부 `userId`를 클라이언트 입력으로 신뢰(IDOR, §5 Critical). 호출처가 늘어도 동일 신뢰 경계 결함이 반복된다.
- **세션 토큰 검증 부재** — 모든 학습자 API에서 `X-Session-Token`/쿠키 기반 본인 도출 경로가 코드 전역 0건. MEMORY.md의 2026-06-19 적용 기록과 현재 워크트리 코드가 불일치(§부록 다수 항목). 관리자 API는 반대로 전부 `isAdminAuthenticated()` 가드 적용.
- **`/api/admin/chapters/update`(레거시)** — 본 표의 `/api/admin/chapters/{id}` PUT과 별개로 존재하는 중복 라우트. `pickChapterFields` allowlist 미적용으로 mass assignment 갭(§5 Medium). 화면 메타에는 등장하지 않으나 보안 분석에서 확인됨.


---

## 4. 전체 권한 매트릭스

전 화면의 `accessUserTypes`와 `userMatrix`를 사용자 유형별로 통합 정리한 표다. 본 시스템은 **학습자(localStorage 세션)** 와 **관리자(admin-token JWT 쿠키)** 의 인증 체계가 완전히 분리되어 있으며, 학습자 화면에는 role 분기가 없다(세션 보유 시 관리자도 학습자와 동일 취급). 학습자 측 진입 가드는 전부 클라이언트 `useEffect`+`router.push`이며 `middleware.ts` 부재로 서버 강제가 아니다.

| 사용자 유형 | 접근 가능 화면 | 가능 기능 | 제한 기능 |
|---|---|---|---|
| **비로그인 / 비인증 방문자** | `/`(랜딩, 입력·제출), `/admin/login`(폼·로그인 시도). 그 외 학습자 화면은 진입 즉시 `/`로 리다이렉트, `/admin*`는 `/admin/login`으로 리다이렉트 | 랜딩에서 지원 정보 입력·동의·"시작하기"로 세션 발급, 관리자 로그인 폼 제출 | 학습자 화면(`/learn*`)은 세션 없으면 마운트 즉시 `/`로 리다이렉트되어 콘텐츠 미노출(클라이언트 가드). 관리자 화면은 `/admin/login` 리다이렉트 + API는 각 라우트 `isAdminAuthenticated()`로 401. 랜딩 제출은 5개 입력 모두 충족해야 가능, 기존 사용자가 `Completed/Blocked`면 서버 차단 |
| **학습자 (세션 보유)** | `/learn`, `/learn/chapter/[id]`, `/learn/chapter/[id]/quiz`, `/learn/chapter/[id]/result`, `/complete` | 다음 학습 챕터 자동 라우팅, 영상 시청·진행률 자동 저장·학습 자료 열람·전체 진행률 확인, 퀴즈 문항 이동/선택지 선택/일괄 제출, 채점 결과·오답·정답·해설 열람, 다시 학습하기(재시도), 다음 챕터로/완료 이동, 완료 축하/배지/다음 단계 열람, 나가기·닫기(세션 제거 후 `/`) | 영상: `required_watch_percentage`(미설정 시 60%) 미만이면 "다음(문제풀이)" 버튼 disabled, 스킵 불가(`seekTo` 되돌림). 퀴즈: 미답변 1개라도 있으면 제출 비활성+alert, 채점·정답 판정은 전부 서버. 진행도 변경 등 직접 쓰기 없음(학습 홈은 read-only). 결과의 다음챕터/완료는 서버 `progress/complete` 검증(영상 시청 완료+퀴즈 전부 정답) 통과해야 실제 완료(단 화면은 응답 미확인 후 즉시 이동 — 취약). 완료 화면은 `POST /api/complete` 403 시 `/learn` 강제 이동 |
| **학습자 (결과/진행 미충족)** | `/learn/chapter/[id]/result`(결과 없음 시), `/complete`(일부 챕터 미완료 시) — 사실상 진입 불가 | 없음(직전 화면으로 자동 리다이렉트) | `sessionStorage.result_{chapterId}` 없으면 `/learn/chapter/{id}/quiz`로 리다이렉트. 완료 자격 미충족 시 `POST /api/complete` 403 → alert 후 `/learn` 강제 이동, 완료 화면 본문 미도달 |
| **관리자 (admin-token JWT 쿠키 보유)** | `/admin`, `/admin/content`. (`/admin/login`은 재로그인용으로 노출 — 기존 세션 인지/리다이렉트 없음) | 통계 카드/5개 탭 전체 조회(사용자·챕터·문제·이탈·지역), 사용자 상태 필터, 진행 중 학습자 완료 처리(쓰기), 콘텐츠 관리 이동, 로그아웃. 콘텐츠: 챕터 조회/추가/수정/비활성화(soft)/영구삭제(hard), 문제 조회(챕터 필터)/추가/수정/비활성화(soft)/영구삭제(hard) | 대시보드 데이터 조회는 읽기 전용, 쓰기는 `completeUser`(완료 처리) 1종. 모든 호출이 admin-token JWT 쿠키 보유 전제(각 라우트 `isAdminAuthenticated()`). 콘텐츠 영구삭제(hard)는 CASCADE로 학습자 진행·시도 기록까지 동반 삭제, 복구 불가 |
| **관리자 화면의 학습자 / 미인증** | 없음 — `/admin*` 접근 불가 | 없음 | 학습자 localStorage 세션은 admin JWT와 완전 무관(미인증 취급). 진입 시 `/admin/login` 리다이렉트, 직접 API 호출 시 각 라우트 401(`auth/session` 401 + 데이터 API `isAdminAuthenticated` 가드) |

> 핵심 분리 원칙:
> - 학습자/관리자 인증 체계는 **완전 분리** — 한쪽 세션이 다른 쪽 권한을 부여하지 않는다.
> - 학습자 화면에는 role 분기가 없어, 세션만 있으면 관리자도 학습자로 취급된다(관리자 전용 학습 기능 없음).
> - 모든 학습자 진입 가드는 **클라이언트 측**(`middleware.ts` 부재)이라 localStorage 주입/직접 URL 접근으로 우회 가능하며, 서버는 `userId`를 신뢰(IDOR). 관리자 API만 서버 가드로 보호된다. 상세는 §5 보안 및 개선 포인트, §부록 확인 필요 사항 참조.


---

## 5. 보안 및 개선 포인트

본 섹션은 입력으로 받은 세 갈래(화면별 분석 / DB·RLS·권한 / 클라이언트·API 노출) findings를 실제 코드를 정독해 **비판적으로 교차검증**한 결과다. 모든 핵심 주장에 `파일:줄번호` 근거를 달았고, 코드로 단정 불가능한 항목은 별도의 "확인 필요" 절로 분리했다. 거짓양성으로 판단한 항목은 본문 "교차검증으로 기각/완화된 주장"에 명시했다.

요청된 5개 관점을 모두 포괄한다.
1. RLS 누락 가능성 → 5.1 (a)
2. 클라이언트에서만 검증되는 권한 → 5.2 (Critical IDOR, 라우트 게이팅, 영상 게이팅)
3. 관리자 권한 검증 취약점 → 5.3
4. 민감 데이터 노출 가능성 → 5.4
5. API 응답 과다 노출 여부 → 5.4

### 핵심 요약

- **가장 큰 위험은 학습자 인증 계층의 완전 부재(IDOR)**다. 모든 학습자 API가 클라이언트가 보낸 `userId`를 소유권 검증 없이 신뢰하고, 데이터 레이어가 `service_role`(RLS 우회)로 동작해 DB 단 2차 방어도 없다. (`grep` 확인: 코드 전역에서 세션 토큰을 **검증·대조**하는 경로 0건.)
- RLS 설계 자체와 어드민 데이터 라우트 가드는 견고하다. 단 **`middleware.ts` 부재**(라우트 레벨 게이팅 전무)와 **`client.ts`의 anon 키 fail-open fallback**이 심층 방어 공백을 만든다.
- 채용 필수 이수 단계라는 맥락상(MEMORY '채용 통합') "완료 위조"는 채용 무결성을 직접 훼손하므로 IDOR의 비즈니스 영향이 특히 크다.

---

### 5.1 RLS / DB 접근 통제

#### (a) RLS 잠금 상태 — 설계는 안전, 단 환경변수 의존 [Medium~High]

- 6개 테이블 전부 `ENABLE ROW LEVEL SECURITY` (`lib/supabase/schema.sql:178-183`), 정책은 `FOR ALL TO service_role` 6종만 존재 (`schema.sql:186-191`). `anon`/`authenticated`에 매칭되는 정책이 하나도 없어 PostgreSQL 기본 거부 규칙에 따라 anon 키로의 PostgREST 직접 접근은 전 테이블 거부된다. `migration-rls-fix.sql:13-18`이 과거 취약 정책(`"Allow all for service role"`)을 DROP하고 명시적 `TO service_role`로 교체. **RLS 설계 자체는 안전(confirmed).**

- 다만 **보안 경계가 런타임 환경변수 설정에 100% 의존**한다.
  - 근거: `lib/supabase/client.ts:12-13`
    ```ts
    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
    ```
  - `SUPABASE_SERVICE_ROLE_KEY` 미설정 시 anon 키로 fallback 생성된다. 이는 (1) 가용성 측면에서 RLS 잠금 상태에서 모든 서버 쿼리가 조용히 0행/실패하고, (2) 보안 측면에서 운영 DB에 anon 허용 정책이 하나라도 잘못 남아 있으면 서버가 anon 권한으로 동작하게 만든다.
  - **권장 조치**: 프로덕션에서 미설정 시 fallback 대신 `throw`(fail-closed). `lib/auth/admin.ts:11-19`의 `getAdminSecret()`이 이미 쓰는 fail-closed 패턴과 일관되게 맞출 것.
    ```ts
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key && process.env.NODE_ENV === 'production') throw new Error('SERVICE_ROLE_KEY 미설정');
    ```
  - severity 판단: fallback 코드 자체는 confirmed 사실이므로 코드 결함으로는 **High**. 단 실제 사고로 이어지려면 "프로덕션에 키 미설정 + 운영 DB에 anon 정책 잔존"이라는 두 운영 조건이 겹쳐야 하므로 실현 위험은 환경 의존 → **High(코드)/Medium(실현)**으로 표기.

---

### 5.2 클라이언트에서만 검증되는 권한 (인증/인가 우회)

#### (b) 학습자 API 전면 IDOR — userId 클라이언트 신뢰, 소유권 검증 0 [Critical]

전 학습자 라우트가 `userId`를 query/body에서 직접 받아 소유권(세션 토큰 대조) 검증 없이 DB 작업에 사용한다. **모든 경로를 정독해 confirmed.**

| 라우트 | userId 출처 | 가능한 악용 |
|---|---|---|
| `app/api/progress/get/route.ts:8,20` | query `userId` | 타인 진척도 **조회** (`getAllUserProgress` → `.eq('user_id', userId)` `progress.ts:69`) |
| `app/api/progress/save/route.ts:16,33,41,55` | body `userId` | 타인 진척도 **위조 저장** |
| `app/api/progress/complete/route.ts:15,25,65` | body `userId` | 타인 챕터 **완료 처리** + 전체완료 시 `completeUser` 호출로 status 전이 |
| `app/api/answer/submit/route.ts:17,30,72` | body `userId` | 타인 명의 **답안/시도 기록 위조** (`question_attempts` 오염) |
| `app/api/complete/route.ts:10,44` | body `userId` | 타인 과정 **완료(채용 단계 통과) 위조** |

- 검증 부재 증거: 코드 전역 `grep` 결과 세션 토큰을 검증·대조하는 코드 0건. `sessionToken`/`session_token`이 등장하는 곳은 발급·저장(`lib/supabase/users.ts:118,121,138`)과 응답 매핑(`app/api/auth/start/route.ts:36`)뿐이며, 학습자 라우트에서 `headers.get`으로 토큰을 읽는 코드는 없다.
- 데이터 레이어가 모두 `supabaseAdmin`(service_role) 별칭으로 동작하므로(`lib/supabase/progress.ts:2`, `questions.ts:2`, `users.ts:2`) RLS 2차 방어도 없다.
- **MEMORY.md의 "X-Session-Token 검증·토큰→userId 도출(2026-06-19 적용)" 기록은 이 워크트리 코드와 불일치** — 코드 사실은 미적용이다.
- **권장 조치**: 학습자 API는 클라이언트 `userId`를 신뢰하지 말 것. `httpOnly` 쿠키 또는 `Authorization`/`X-Session-Token` 헤더로 `session_token`을 받아 `users` 테이블에서 매칭 행의 `id`를 서버에서 도출(`getUserBySessionToken` 신설)하고, body/query의 `userId`는 무시하거나 도출값과 불일치 시 403. 어드민 라우트의 `isAdminAuthenticated` 패턴과 동일 구조로 통일.

> **악용 난이도 — 완화 요소(confirmed but weak)**: `users.id`는 `uuid_generate_v4()` = UUIDv4 랜덤(`schema.sql:57`)이라 순차 열거는 불가능하다. 그러나 `auth/start`가 응답에 `user` 전체(=`id` 포함)를 반환하고(`route.ts:43`), 클라이언트가 그 세션을 localStorage 평문 저장하므로(`app/page.tsx:88`) UUID가 한 번이라도 유출(로그·공유 기기·XSS)되면 즉시 악용된다. UUID는 "비밀"이 아니라 "식별자"이므로 권한 통제의 대체물이 될 수 없다. → 완화 요소이나 IDOR severity를 낮추지 않음.

#### (c) `/learn`·`/admin` 라우트 게이팅 부재 (middleware.ts 없음) [High]

- 프로젝트 루트에 `middleware.ts`가 **없다**(`find` 결과 0건, confirmed). 라우트 레벨 인증 게이팅이 전무하다.
- 학습자 페이지 진입 가드는 모두 클라이언트 측 `localStorage.getItem('session')` 존재 여부 + `router.push`뿐:
  - `app/learn/page.tsx:16-18`, `app/learn/chapter/[id]/page.tsx:27-31`, `app/learn/chapter/[id]/result/page.tsx:41-45`, `app/complete/page.tsx:17-19`.
  - localStorage에 임의 `{userId,...}` JSON만 주입하면 모든 학습자 화면 진입 가능.
- **권장 조치**: `middleware.ts` 추가. `/learn/*`은 세션 토큰 쿠키, `/admin/*`(login 제외)은 `admin-token` 쿠키를 edge에서 검증해 미인증 시 리다이렉트. 단 IDOR(5.2 b)가 근본 원인이므로 토큰 기반 서버 검증 도입이 선행돼야 한다.
- 영향 한정: 학습자 페이지 자체는 진입 후에도 IDOR API(5.2 b)에 데이터를 의존하므로, 게이팅 우회의 실질 피해는 5.2 b 해결로 대부분 차단된다.

#### (d) 영상 시청 게이트가 클라이언트 상태에만 존재 [Medium]

- "다음(문제풀이)" 버튼 활성화는 클라이언트 state `videoCompleted`로만 제어된다(`app/learn/chapter/[id]/page.tsx:223`, 미충족 시 `disabled`). `middleware.ts` 부재로 `/learn/chapter/[id]/quiz`로 직접 URL 이동 시 영상 시청 여부와 무관하게 퀴즈가 렌더되고, `questions/random`이 문제를 내려준다(`app/api/questions/random/route.ts`에 시청 여부 검증 없음).
- **부분 완화(서버 검증 존재 — 양호)**: 최종 챕터 "완료" 판정은 서버가 지킨다. `progress/complete`는 (1) progress 존재, (2) `video_watched`(서버 재계산값), (3) `hasPassedChapterQuiz`(채점 기록 재검증)를 강제하고 위반 시 403 (`app/api/progress/complete/route.ts:25-50`). `progress/save`도 클라이언트 `isWatched`를 무시하고 서버에서 `watchedPercentage`를 재계산한다(`progress/save/route.ts:44-55`, 주석으로 명시). 따라서 단순 URL 점프로 완료를 위조하긴 어렵다.
- 남는 리스크: 영상 미시청 상태로 퀴즈 화면/문제 데이터를 받아볼 수 있다는 게이팅 우회. **권장 조치**: 퀴즈 진입/`questions/random`에 "해당 userId가 그 챕터 영상을 봤는지" 서버 사전조건 검증 추가(이 역시 5.2 b 해결로 userId 신뢰가 선결돼야 의미 있음).

#### (e) 진행/완료 응답 미확인으로 인한 화면-서버 상태 불일치 [Medium]

- `result/page.tsx`의 `handleNext`가 `progress/complete` 응답의 `ok`/`success`를 확인하지 않고 무조건 다음 화면으로 이동한다(`app/learn/chapter/[id]/result/page.tsx:101-118`, fetch 결과를 await하지만 분기 없이 곧장 `router.push`). 서버가 403(영상 미시청·퀴즈 미통과)/500을 반환해도 UI는 다음 챕터/완료 화면으로 진입.
- `complete/page.tsx`는 `status===403`만 분기하고(`app/complete/page.tsx:43`), 그 외 실패(400/500)는 `setLoading(false)`로 떨어져 "모든 과정을 완료했습니다!" 축하 화면을 그대로 렌더(`page.tsx:42-54`). 전용 error UI 없음(`console.error`만).
- 서버 데이터는 `chapter_history` 게이트(5.2 d)로 보호되므로 권한 상승은 아니나, **표시 상태와 실제 완료 상태가 불일치**할 수 있다. **권장 조치**: 응답 `success`/`status`를 분기해 실패 시 전용 에러 UI + 재시도 제공(`code-quality` 4상태 규칙: empty/loading/loaded/error).

---

### 5.3 관리자 권한 검증

#### 어드민 데이터 라우트 가드 — 14개 전수 일관 적용 [양호, confirmed]

14개 admin `route.ts`를 전수 정독한 결과, 데이터/CRUD/stats 라우트 전부에서 `isAdminAuthenticated()`가 `try` 블록 첫 문장으로 호출되고 실패 시 DB 접근 전에 401 반환한다. **가드 누락 라우트는 없다(코드 확정).**

확인한 가드 위치(예): `admin/chapters/route.ts:19,57`, `admin/chapters/[id]/route.ts:13,78`, `admin/chapters/update/route.ts:8`, `admin/questions/route.ts`(GET/POST), `admin/questions/[id]/route.ts:16,62`, `admin/users/route.ts:8`, `admin/users/complete`, `admin/stats/*`(4종), `admin/auth/session/route.ts:6`. `admin/auth/login`·`logout`은 가드 비대상(정상). 어드민 페이지(`app/admin/page.tsx:33-52`)는 마운트 시 `/api/admin/auth/session`(200/401)으로 확인 후 미인증이면 `/admin/login`으로 redirect한다. 클라이언트 redirect라 페이지 셸 진입 자체는 막지 못하나(middleware 부재), 데이터 API가 401로 차단하므로 **비인증자가 `/admin` HTML을 직접 열어도 데이터는 새지 않는다.**

#### (a) `admin/chapters/update` mass-assignment (allowlist 누락) [Medium]

- `app/api/admin/chapters/update/route.ts:16,28`이 body의 `updates`를 `pickChapterFields`(allowlist) 없이 `updateChapter(chapterId, updates)`로 그대로 전달한다.
  ```ts
  const { chapterId, updates } = body;
  const updated = await updateChapter(chapterId, updates);
  ```
- 같은 기능의 `app/api/admin/chapters/[id]/route.ts:39`는 `pickChapterFields` + `validateQuestionsCount`로 화이트리스트 처리하는데(`lib/validation/chapter.ts:45-58`), 이 레거시 라우트만 누락. 인증은 통과하지만(가드 O) 검증 없는 임의 키가 DB로 직행할 수 있다.
- 어드민 권한자만 호출 가능하므로 외부 공격면은 아니나 일관성·무결성 규칙(`code-quality`: server-side validation 필수) 위반. **권장 조치**: `[id]:39`와 동일하게 `pickChapterFields(updates)` 적용. 중복 라우트이므로 `[id]` 라우트로 통합 권장.

> **중요 정정(거짓양성 제거)**: 화면별 findings의 "챕터 PUT(수정) API가 POST와 달리 name/video_url/order 검증을 하지 않는다"(location `app/api/admin/chapters/[id]/route.ts:39-57`)는 **REFUTED**다. 실제 `[id]/route.ts`는 `pickChapterFields`(allowlist) + `questions_count` 검증을 수행한다(`route.ts:38-50`). 진짜 갭은 *별도 파일* `chapters/update/route.ts`다. 단, `[id]` PUT도 POST(`chapters/route.ts:76-95`)와 달리 `name`/`video_url` 비어있지 않음·`order` 숫자 타입을 검증하지 않으므로(부분 업데이트 특성상 의도적이나) "수정 시 빈 문자열로 덮어쓰기"는 막지 못한다 → 이 잔여 갭은 **uncertain/Low**로 남긴다.

#### (b) 어드민 로그인 평문 비교 + rate limit 부재 [Medium]

- `app/api/admin/auth/login/route.ts:21`: `username === adminUsername && password === adminPassword` — 평문 동등 비교, 타이밍 세이프 아님. 비밀번호는 환경변수 평문 보관(`route.ts:11`).
- 로그인 시도 횟수 제한·계정 잠금·CAPTCHA 부재(`grep` 0건). 단일 관리자·HTTPS 전제라 실위험은 낮으나, 채용 무결성 시스템의 유일한 관리 경로다.
- **권장 조치**: `crypto.timingSafeEqual` 상수시간 비교, 가능하면 `ADMIN_PASSWORD`를 bcrypt/argon2 해시로 보관, IP/계정 단위 시도 제한(예: 5회/15분) 추가.
- (대비되는 양호점: `getAdminSecret()`은 fail-closed로 잘 처리됨 — `lib/auth/admin.ts:11-19`. 어드민 JWT 쿠키는 `httpOnly`+`secure`(prod)+`sameSite:lax` — `login/route.ts:27-33`.)

#### (c) `isAdminAuthenticated`가 `role==='admin'` 재검 안 함 [Low]

- `lib/auth/admin.ts:44-46`: `verify` 성공·미만료이면 인가하고 payload의 `role==='admin'`을 재확인하지 않는다. 현재 토큰 발급 경로가 `signAdminToken`(login) 1곳뿐(`admin.ts:22`, 항상 `role:'admin'` 부여)이라 실해는 없으나, 발급 경로가 늘면 비-admin 토큰으로 우회 가능. **권장 조치**: `verify` 후 `payload.role === 'admin'` 명시 확인.

#### (d) `secure` 쿠키 플래그가 `NODE_ENV` 의존 [Low]

- `app/api/admin/auth/login/route.ts:29`: `secure: process.env.NODE_ENV === 'production'`. 비프로덕션에선 평문 전송 허용. 프로덕션 배포 시 `NODE_ENV`가 반드시 `production`이어야 HTTPS 전용 쿠키가 된다(환경 의존, 확인 필요).

#### (e) 어드민 세션 만료·로그아웃 실패 처리 미흡 [Low]

- `app/admin/page.tsx:63-105`의 데이터 fetch effect는 응답 `success`만 검사하고 401(세션 만료)을 무시해 화면에 머문다(자동 `/admin/login` 이동 없음). `handleLogout` 실패 시에도 `console.error`만 하고 리다이렉트하지 않아 로그아웃됐다고 오인 가능(`page.tsx:54-61`). **권장 조치**: fetch 401 감지 시 재인증 리다이렉트.

---

### 5.4 민감 데이터 노출 / API 응답 과다 노출

#### (a) `auth/start` 응답에 `user` 전체(session_token·PII) 노출 [Medium~High]

- `app/api/auth/start/route.ts:39-45`가 `session` 객체와 별도로 `user`(=`DbUser` 전체)를 반환한다.
  ```ts
  data: { session, user },
  ```
- `user`는 `session_token`(인증 토큰), `phone`/`region`/`application_reason`(PII), `status` 등을 전부 담는다(`DbUser` 정의 `lib/supabase/users.ts:5-19`). `session`(`route.ts:32-37`)에 이미 화면에 필요한 4필드가 들어가므로 `user` 전체 동봉은 **불필요한 과다 노출**이며, IDOR 표적 식별자(`id`)와 인증 토큰이 동일 응답에 중복 노출된다.
- 화면은 `data.data.session`만 localStorage에 저장(`app/page.tsx:88`)하므로 `user`는 미사용.
- **권장 조치**: 응답에서 `user` 제거, `session`만 반환. `session_token`은 가능하면 `httpOnly` 쿠키로 내려 JS 접근 차단.
- severity: 토큰+PII+IDOR 식별자 동시 노출이라 입력 3은 High로 봤고 화면별 분석은 Medium으로 봤다. 본 섹션은 **Medium(노출 자체)~High(IDOR 결합 시)**로 표기.

#### (b) 세션 토큰 localStorage 평문 저장 [Low~Medium]

- `app/page.tsx:88`: `localStorage.setItem('session', JSON.stringify(data.data.session))` — `sessionToken` 포함 전체를 평문 저장. `httpOnly`/`secure`/`sameSite` 보호 전무, XSS 시 탈취·변조 가능.
- 현 시점에는 이 토큰이 **서버 검증에 전혀 안 쓰이므로**(5.2 b) 토큰 탈취보다 `userId` 탈취가 더 직접적 위협이다. 단 토큰 기반 인증 도입 시 그대로 취약점이 되므로 5.2 b 수정과 함께 `httpOnly` 쿠키로 전환 권장.
- (양호점: 토큰 자체는 `randomBytes(32).toString('hex')` CSPRNG 256비트라 추측·열거 불가 — `lib/supabase/users.ts:57-59`.)

#### (c) `GET /api/admin/users` 응답에 `session_token` 포함 [Medium]

- `getAllUsers`가 컬럼 화이트리스트 없이 `select('*')` (`lib/supabase/users.ts:253-256`) → `app/api/admin/users/route.ts:15-20`이 그대로 반환. 학습자 `session_token`(인증 토큰)이 어드민 응답 본문에 실린다. 화면은 name/phone/status/날짜만 사용.
- `isAdminAuthenticated` 가드가 선행하므로(`users/route.ts:8`) 인증된 어드민에게만 노출 — 설계상 허용 범위이나, **어드민이 타 사용자의 세션 토큰을 받을 필요는 없다**(최소권한 위반). **권장 조치**: 응답 컬럼 화이트리스트(예: id/name/phone/region/status/created_at/completed_at)를 `getAllUsers`에 적용해 `session_token` 등 제외.

#### (d) `GET /api/chapters/list` 비인증 노출 (video_url 포함) [Medium]

- `app/api/chapters/list/route.ts:5-12`에 인증/세션 검증이 전무하다. `getActiveChapters`가 `video_url`을 포함한 챕터 전체를 반환한다(`lib/supabase/chapters.ts:18-30`, `select('*')`).
- 비공개 학습 영상이라면 URL이 비인증 사용자에게 노출된다. **권장 조치**: 세션 검증 추가, 또는 `video_url`이 서명 URL/접근 제한 스토리지인지 확인 후 정책 결정(확인 필요: video_url의 실제 접근 통제 방식).

#### (e) 서버 에러 메시지(`error.message`) 클라이언트 노출 [Low]

- 다수 라우트의 catch가 `error instanceof Error ? error.message`를 그대로 응답 `error` 필드에 담는다: `auth/start:47`, `progress/get:27`, `progress/save:63-64`, `progress/complete:80`, `answer/submit:107`, `complete:51`, `chapters/list:14`, `questions/random:50`, `admin/chapters/route.ts:43-44` 등.
- 데이터 레이어 throw 메시지는 대부분 한국어 사용자 문구라 무해하나, 예기치 못한 DB/드라이버 에러는 내부 구조(테이블/컬럼명)를 노출할 여지가 있다. **권장 조치**: 일반화 메시지로 매핑하고 상세는 서버 로그로만(확인 필요: 실제 노출되는 message의 내부정보 함량은 런타임 의존).

#### (f) 채점 응답 정답/해설 노출 정책 — 적용 누락 없음 [양호, confirmed]

- 학습자 출제 유일 경로 `questions/random`은 `toPublicQuestion`으로 `correct_answer`·`explanation`·통계·`status`를 제거 후 전송(`app/api/questions/random/route.ts:47`, 변환 함수 `lib/supabase/questions.ts:36-50`). `progress/save`도 내부적으로 `getRandomQuestions`를 호출하나 응답엔 `{ progressId }`만 싣는다(`progress/save/route.ts:60`).
- 채점 라우트 `answer/submit`은 **의도적으로** 오답 항목에만 `correctAnswer`·`explanation`을 노출(`answer/submit/route.ts:54-67`) — 채점 후 해설 제공 정책에 부합(MEMORY '정답 노출 정책').
- **주의(향후 회귀 방지)**: `answer/submit`의 내부 `results` 배열은 각 항목에 `question` 객체 전체(=`DbQuestion`의 정답 포함)를 담지만(`route.ts:46-52`), 최종 응답 `resultData`에는 `results`가 **포함되지 않고** `incorrectQuestions`만 담기므로 현재는 새지 않는다(`route.ts:94-105`). 향후 `results`를 응답에 추가하면 전체 정답이 통째로 유출되므로 직렬화 시 `question` 객체를 싣지 않도록 주의.

#### (g) 답안 제출 시 questionId-chapterId 소속 미검증 [Medium]

- `getQuestionsByIds`는 키로 받은 어떤 `questionId`든 조회하고(`lib/supabase/questions.ts:100-122`, chapterId 필터 없음), `createQuestionAttempt`에 본문 `chapterId`를 그대로 기록한다(`app/api/answer/submit/route.ts:38,72-79`, 데이터 함수 `progress.ts:188-205`).
- 다른 챕터 문항 id를 섞어 보내도 채점되며 `question_attempts.chapter_id`가 실제 문항 챕터와 어긋나게 저장될 수 있다(DB에 questionId↔chapterId 일관성 제약 없음 — `schema.sql:126-135`는 FK만 있고 교차 제약 없음). **권장 조치**: 채점 전 각 question의 `chapter_id`가 본문 `chapterId`와 일치하는지 서버 검증, 불일치 시 해당 문항 제외 또는 400.

---

### 5.5 안정성·에러 처리 (보안 인접 코드 품질)

#### (a) 클라이언트 `JSON.parse` try/catch 미보호 [Low]

- `app/complete/page.tsx:23`, `app/learn/chapter/[id]/result/page.tsx:47,56`의 `JSON.parse(localStorage/sessionStorage)`가 try 블록 밖에 있어 손상된 저장값 파싱 시 throw → 화면 크래시. 게이트는 존재 여부만 확인하고 파싱 예외는 처리하지 않는다.

#### (b) 라우트 레벨 error.tsx/loading.tsx 부재 [Low]

- `app` 디렉토리에 `error.tsx`/`loading.tsx`가 **없다**(`find` 결과 0건, confirmed). `result/page.tsx`의 init/`handleNext` fetch가 try/catch 미보호라 reject 시 무한 로딩/unhandled rejection 가능. `code-quality` 규칙(App Router page마다 `error.tsx`, 4상태 필수)과 충돌. **권장 조치**: 비동기 화면에 error/loading 경계 추가.

#### (c) 진행 저장 실패가 사용자에게 비노출 [Low]

- `app/learn/chapter/[id]/page.tsx:104-106`: `handleProgressUpdate` fetch 실패가 `console.error`로만 처리돼 사용자가 진행 손실을 인지하지 못할 수 있다.

#### (d) 랜딩 서버측 검증 누락 (전화번호 형식·동의) [Medium]

- 서버는 `name/phone/region/applicationReason` 누락만 400 처리한다(`app/api/auth/start/route.ts:10-28`). 전화번호 정규식 검사와 `agreed`(개인정보 동의)는 클라이언트에만 존재하고(`app/page.tsx:49-53,65-68`), body에 `agreed`가 전송되지 않으므로(`page.tsx:78`) API 직접 호출 시 형식 불량·미동의로도 사용자 생성이 가능하다. `code-quality`(server-side validation 필수) 위반. **권장 조치**: 서버에서 전화번호 형식·`agreed` 필수 검증 추가.

---

### 5.6 종합 우선순위

| # | 항목 | severity | 근거 위치 |
|---|---|---|---|
| 1 | 학습자 API 전면 IDOR (userId 클라이언트 신뢰, 소유권 검증 0) | **Critical** | `progress/get:8`, `save:16`, `complete:15`, `answer/submit:17`, `complete:10` |
| 2 | `client.ts` service_role 키 fail-open fallback | **High** | `lib/supabase/client.ts:12-13` |
| 3 | `middleware.ts` 부재 — 라우트 게이팅 공백 | **High** | (루트, find 0건) |
| 4 | `auth/start` 응답 `user` 전체(token+PII) 노출 | **Medium~High** | `auth/start/route.ts:39-45` |
| 5 | `admin/chapters/update` mass-assignment | **Medium** | `admin/chapters/update/route.ts:16,28` |
| 6 | 어드민 로그인 평문 비교 + rate limit 부재 | **Medium** | `admin/auth/login/route.ts:21` |
| 7 | 답안 제출 questionId-chapterId 소속 미검증 | **Medium** | `answer/submit/route.ts:38`, `questions.ts:100-122` |
| 8 | `admin/users` 응답 session_token 포함 | **Medium** | `users.ts:253-256`, `admin/users/route.ts:15` |
| 9 | `chapters/list` 비인증 노출(video_url) | **Medium** | `chapters/list/route.ts:5-12` |
| 10 | 영상 시청 게이트 클라이언트 전용 | **Medium** | `chapter/[id]/page.tsx:223` |
| 11 | 완료/진행 응답 미확인 화면-서버 불일치 | **Medium** | `result/page.tsx:101-118`, `complete/page.tsx:42-50` |
| 12 | 랜딩 서버측 검증 누락(형식·동의) | **Medium** | `auth/start/route.ts:10-28`, `page.tsx:78` |
| 13 | 기존 계정 단일요소(전화번호) 세션 재발급 | **Medium** | `users.ts:109-130` |
| 14 | 문제 PUT mass-assignment(allowlist 미적용) | **Medium** | `questions/[id]/route.ts:42-43` |
| 15 | 세션 토큰 localStorage 평문 저장 | **Low~Medium** | `app/page.tsx:88` |
| 16 | `error.message` 응답 노출 (다수 라우트) | **Low** | 전 catch 블록 |
| 17 | `isAdminAuthenticated` role 미재검 | **Low** | `lib/auth/admin.ts:44-46` |
| 18 | secure 쿠키 NODE_ENV 의존 | **Low** | `admin/auth/login/route.ts:29` |
| 19 | 클라이언트 JSON.parse 미보호 / error.tsx 부재 | **Low** | `complete:23`, `result:47,56` |
| 20 | 어드민 세션 만료·로그아웃 실패 미처리 | **Low** | `admin/page.tsx:54-105` |

---

### 5.7 교차검증으로 기각/완화된 주장 (거짓양성 제거)

- **REFUTED — "챕터 PUT(`[id]`)이 POST와 달리 입력 검증을 하지 않는다"**: `app/api/admin/chapters/[id]/route.ts:38-50`은 `pickChapterFields`(allowlist) + `validateQuestionsCount`를 적용한다. 진짜 갭은 별도 레거시 라우트 `chapters/update/route.ts`(5.3 a). 단 `[id]` PUT이 부분 업데이트라 `name`/`video_url` 빈 문자열 덮어쓰기는 막지 못하는 잔여 갭은 uncertain/Low로만 남김.
- **완화 — "어드민 4개 라우트 중 가드 호출은 session뿐"(공통 인프라 문서 주장)**: 코드 사실과 불일치. 14개 admin 데이터/CRUD/stats 라우트 전부가 `isAdminAuthenticated()`를 선행 호출함(5.3). 본 섹션의 전수 검증을 신뢰.
- **완화 — "어드민 화면이 비인증 우회로 데이터 노출"**: 데이터 API가 모두 401로 차단되므로 노출되는 것은 빈 UI 골격뿐. 페이지 진입 자체만 클라이언트 가드(`admin/page.tsx:33-52`)에 의존.
- **양호 확인 — 정답/해설 비노출(`toPublicQuestion`)**: 출제 경로 적용 누락 없음(5.4 f).

---

### 5.8 확인 필요 (코드로 단정 불가 — 런타임/DB/운영 실측 요)

1. 프로덕션에 `SUPABASE_SERVICE_ROLE_KEY`가 실제 설정됐는지, 운영 DB에 `migration-rls-fix.sql`이 적용돼 anon 허용 잔존 정책이 없는지 (5.1 a — `client.ts` fallback 위험의 실현 조건).
2. 프로덕션 `NODE_ENV`가 `production`으로 설정돼 admin 쿠키 `secure`가 활성인지, `ADMIN_USERNAME`/`ADMIN_PASSWORD`/`ADMIN_JWT_SECRET`가 실제 설정됐는지 (5.3 b,d).
3. `chapters.video_url`이 서명 URL/접근 제한 스토리지인지 — `chapters/list` 비인증 노출(5.4 d)의 실제 피해 정도.
4. catch 블록에서 실제 노출되는 `error.message`의 내부정보 함량 (5.4 e) — 런타임 에러 종류에 의존.
5. ReactMarkdown 렌더 경로(`chapter/[id]/page.tsx`, `result/page.tsx`)에서 어드민 입력 콘텐츠의 XSS sanitize 방식 (`dangerouslySetInnerHTML` 미사용은 확인했으나 마크다운 링크/이미지 표면은 별도 검토 권장).


---

## 부록. 확인 필요 사항 종합

전 화면의 `confirmNeeded`를 화면별로 묶었다. 각 항목은 **코드/메타데이터만으로 단정할 수 없어 개발자/기획자 확인이 필요한** 설계 의도·운영 정책·데이터 실측 질문이다. 파일 경로는 메타데이터 표기를 그대로 옮겼다(프로젝트 루트 기준 상대경로).

---

### 랜딩 (지원 정보 입력) — `/`

| 항목 | 이유 | 봐야 할 파일 | 개발자 확인 질문 |
|---|---|---|---|
| 마운트 시 기존 세션 검사 후 `/learn` 자동 리다이렉트 부재가 의도인지 | `page.tsx`에 useEffect/세션 검사 코드 없음. 재방문 사용자가 매번 폼 재입력해야 함 | `app/page.tsx`, `app/learn/page.tsx` | 이미 세션이 있는 사용자가 `/`에 오면 자동으로 `/learn`로 보내야 하나요, 매번 재입력이 정책인가요? |
| `highlightPoints` 배열(`page.tsx:9-22`)이 선언만 되고 렌더 미사용 | JSX(`:100-251`)에서 참조 없음. 미완성 UI인지 dead code인지 불명 | `app/page.tsx` | 하이라이트 3종을 히어로에 렌더할 예정인가요, 제거 대상인가요? |
| API 응답에 `data.user`(DbUser 전체) 포함 필요 여부 | 화면은 session만 사용(`:88`). 민감정보 과다 노출 가능 | `app/api/auth/start/route.ts` | 응답에서 user를 제거하고 session만 내려도 되나요? |
| 서버측 전화번호 형식·동의 재검증 필요 여부 | 클라이언트 검증만 존재, body에 `agreed` 미전송 | `app/api/auth/start/route.ts`, `lib/supabase/users.ts` | 형식 검증·동의 강제를 서버에도 넣어야 하나요? 동의 이력을 DB에 남겨야 하나요? |
| 전화번호 단일 식별의 계정 도용 표면 허용 정책 여부 | 비밀번호/OTP 없이 전화번호만으로 세션 재발급(`users.ts:109-130`) | `lib/supabase/users.ts`, 인증 정책 문서 | 본인 확인(인증코드 등)을 추가할 계획이 있나요? |
| 500 응답 `error.message`(DB 원문 가능)의 사용자 노출 정책 | `route.ts:47`이 message 그대로 노출 | `app/api/auth/start/route.ts`, `lib/supabase/users.ts:202` | 사용자 대상 에러 메시지를 매핑/마스킹해야 하나요? |
| 라우트 레벨 `loading.tsx`/`error.tsx` 부재로 인한 4상태 보장 책임 | 공통 인프라상 부재 확정. 화면 자체 loading/error는 처리하나 전역 에러 바운더리 없음 | `app/` 디렉토리 | 전역 error.tsx를 도입할 계획이 있나요? |

### 학습 홈 — `/learn`

| 항목 | 이유 | 봐야 할 파일 | 개발자 확인 질문 |
|---|---|---|---|
| `/learn` 진입 출처 | 이 화면 코드만으로는 어느 화면이 `/learn`으로 보내는지 단정 불가 | `app/page.tsx` | 로그인 성공 후 `/learn`으로 보내는 게 맞는가? |
| 전체 완료 시 동선 | 모든 챕터 완료 시 이 화면은 마지막 챕터(`page.tsx:51`)로 보냄. `/complete`로 보내는 책임이 어디 있는지 불명 | `app/learn/chapter/[id]/*`, `app/complete/page.tsx` | 전체 완료 사용자를 `/complete`로 보내는 분기는 챕터/결과 화면에 있는가? |
| 진행도 조회 실패의 사용자 영향 | `getAllUserProgress`가 에러 시 빈 배열 반환(`progress.ts:63-76`)이라 DB 장애 시 '진행 없음'으로 오인되어 항상 1챕터로 보낼 위험 | `lib/supabase/progress.ts:63-76` | 진행도 로드 실패를 조용히 무시(chapters[0])하는 게 의도인가, 에러 노출이 맞는가? |
| `JSON.parse(session)` 손상 처리 | 손상된 session 문자열이면 parse가 throw되어 '학습을 시작할 수 없습니다' 에러 카드로 빠짐. 손상 시 `/`로 보내는 게 더 자연스러울 수 있음 | `app/learn/page.tsx:22` | 손상된 세션은 에러 카드 대신 재로그인(`/`) 유도가 맞지 않나? |
| `userId` IDOR 방어 위치 | MEMORY에는 토큰 기반 방어 적용 기록이 있으나 현 워크트리 코드엔 없음(공통 인프라 §2.4/§6) | `app/api/progress/get/route.ts`, `lib/supabase/users.ts` | 진행도 조회를 세션 토큰→userId 도출로 바꿀 계획이 있는가? |

### 챕터 영상 시청 — `/learn/chapter/[id]`

| 항목 | 이유 | 봐야 할 파일 | 개발자 확인 질문 |
|---|---|---|---|
| `/learn`에서 이 화면으로의 진입 트리거(어떤 UI에서 챕터 선택) | `/learn` 본문을 읽지 않아 진입 경로를 단정 불가 | `app/learn/page.tsx` | 챕터 목록에서 영상 시청 화면으로 이동하는 UI/조건은 무엇인가? |
| 활성 챕터 0개일 때 empty 상태 처리 | 빈 목록이면 '챕터를 찾을 수 없습니다.' throw로 에러 화면에 흡수됨(`page.tsx:47-50`). 별도 empty UI 없음 | `app/learn/chapter/[id]/page.tsx` | 챕터가 없을 때 에러가 아닌 별도 empty UI를 의도했는가? |
| `questions_assigned`(JSONB) 구조 및 save 경로 채움 시점 | 스키마에 JSONB 내부 구조 명시 없음. 출제 문항 확정이 영상 저장 시점에 발생하는 것이 의도인지 불명 | `lib/supabase/schema.sql`, `lib/supabase/progress.ts`, `app/api/progress/save/route.ts` | `questions_assigned`에 저장되는 값 구조와, 출제 셋 확정 시점(영상 진행 저장 시)이 의도된 설계인가? |
| `progress/save` body의 `isWatched` 필드 | 화면은 계속 전송하나 서버가 사용하지 않음(`page.tsx:101` vs `save/route.ts:45`) | `app/learn/chapter/[id]/page.tsx`, `app/api/progress/save/route.ts` | `isWatched`는 제거 가능한 dead field인가? |
| MEMORY.md의 X-Session-Token 검증 기록과 코드 불일치 | 메모리는 토큰 검증·토큰→userId 도출이 적용됐다고 기록하나 이 화면의 API에는 없음 | `app/api/progress/get/route.ts`, `app/api/progress/save/route.ts`, `lib/auth/*` | 세션 토큰 검증이 다른 브랜치에 있거나 롤백되었는가? 현재 워크트리 기준 미적용이 맞는가? |
| 영상 완료 게이트의 서버 측 강제 여부 | 본 화면 범위 밖. 퀴즈/채점 경로의 `hasPassedChapterQuiz` 등으로 보강되는지 미확인 | `app/learn/chapter/[id]/quiz/page.tsx`, `app/api/answer/submit/route.ts`, `lib/supabase/progress.ts` | 영상 미시청 상태로 퀴즈/채점에 진입할 때 서버가 차단하는 로직이 있는가? |

### 챕터 퀴즈 — `/learn/chapter/[id]/quiz`

| 항목 | 이유 | 봐야 할 파일 | 개발자 확인 질문 |
|---|---|---|---|
| 영상 미시청 상태에서 퀴즈 직접 진입 차단 여부 | 이 화면은 영상 시청 완료를 게이트하지 않음(진행도는 헤더 표시용, `page.tsx:66-73`). 영상 미시청자가 URL로 바로 진입 가능한지 미확인 | `app/learn/chapter/[id]/page.tsx` | 영상 필수 시청률 미달 시 퀴즈 진입을 막아야 하는가? 막는다면 어디서(클라이언트/서버)? |
| `chapter_history` `attempt_number` 증가·중복/재응시 처리 정책 | 제출 시마다 새 `chapter_history` 생성(`answer/submit/route.ts:29-30`). 반복 제출/재응시 횟수 제한 정책 미확인 | `lib/supabase/progress.ts:212-254`, `app/learn/chapter/[id]/result/page.tsx` | 퀴즈 재응시 횟수 제한이 있는가? 통과 후 재제출을 허용하는가? |
| `userId` 서버측 검증(세션 토큰) 도입 여부 | MEMORY에는 X-Session-Token 검증·토큰→userId 도출 적용(2026-06-19)이라 기록됐으나 이 워크트리 코드에는 없음. 의도된 미적용인지 회귀인지 불명 | `lib/auth/*`, 다른 브랜치의 학습자 API route.ts | 학습자 API의 세션 토큰 검증이 롤백된 것인가, 별도 브랜치 작업인가? |
| `answers` `questionId`의 챕터 소속 검증 정책 | 서버가 `questionId`가 해당 `chapterId` 소속인지 검증하지 않음(securityFindings Medium). 의도적 단순화인지 누락인지 불명 | `app/api/answer/submit/route.ts:38-79` | 제출 답안의 문항이 해당 챕터 소속임을 서버에서 강제해야 하는가? |
| `questions_count` vs 실제 보유 Active 문항 수 정합 | `getRandomQuestions`는 `min(count, 보유수)`만 출제(`questions.ts:81`). 보유 문항이 `questions_count`보다 적으면 적게 출제됨. 운영 데이터 실측 필요(공통 인프라 §5.2 불일치) | `lib/supabase/migration.sql:524-528`(DB 실측) | 챕터별 `questions_count`와 실제 Active 문항 수가 일치하는가? |

### 챕터 결과 — `/learn/chapter/[id]/result`

| 항목 | 이유 | 봐야 할 파일 | 개발자 확인 질문 |
|---|---|---|---|
| `ResultData`(점수·오답·정답·해설)의 실제 생성·저장 위치 | 이 화면은 `sessionStorage.result_{chapterId}`를 읽기만 함(`result/page.tsx:50-57`). 저장 주체·형태는 직전 퀴즈/채점 코드에 있음 | `app/learn/chapter/[id]/quiz/page.tsx`, `app/api/answer/submit/route.ts` | 결과 데이터를 sessionStorage에만 보관하는 것이 의도인가(서버 재검증 없이 표시)? |
| `handleNext`의 `progress/complete` 응답 무시가 의도인지 | 응답 ok/success 미확인으로 서버 403/500 시 UI 상태 불일치 발생(`result/page.tsx:101-118`) | `app/learn/chapter/[id]/result/page.tsx` | 완료 실패(403/500) 시 에러 표시·이동 차단 처리가 필요하지 않은가? |
| 마운트/핸들러 fetch 예외 및 4상태 처리 | init·handleNext try/catch 없음, JSON.parse 비보호, 라우트 error.tsx/loading.tsx 부재(확인됨)로 throw 시 무한 로딩·미처리 | `app/learn/chapter/[id]/result/`(error/loading 파일 부재 확인됨) | 비동기 4상태(특히 error) 처리를 페이지에 추가할 계획인가? (글로벌 규칙과 충돌) |
| IDOR 방어(세션 토큰→userId 도출) 적용 여부 | 코드상 `userId` 서버 미검증인데 MEMORY는 2026-06-19 적용이라 기록 — 워크트리 코드와 불일치 | `app/api/progress/get/route.ts`, `app/api/progress/complete/route.ts`, 다른 브랜치 | 세션 토큰 기반 userId 도출이 다른 브랜치에 있는지/롤백됐는지? |
| `chapters/list` 500(`success:false`) 시 부분 렌더 동작 | `success:false`면 진행도 스킵 후 loading=false → chapter null → return null(빈 화면). empty/error UI 없음(`result/page.tsx:62,132-134`) | `app/learn/chapter/[id]/result/page.tsx` | 챕터 로드 실패 시 사용자에게 무엇을 보여줄 것인가? |

### 학습 완료 — `/complete`

| 항목 | 이유 | 봐야 할 파일 | 개발자 확인 질문 |
|---|---|---|---|
| 완료 판정의 챕터별 매칭 부재 | `POST /api/complete`는 `chapter_completed=true`인 `user_progress` 개수만 활성 챕터 수와 비교(개수 비교만, 어느 챕터인지 매칭 안 함). 비활성/삭제 챕터의 완료 레코드나 중복이 카운트를 왜곡할 가능성 | `lib/supabase/progress.ts`(진행 생성·완료 로직), `user_progress` 실제 데이터, `app/api/complete/route.ts:28-32` | 비활성 챕터의 완료 레코드가 카운트에 포함되어 미완료인데 통과되는 경우가 실데이터에서 발생할 수 있는가? |
| 진입 직전 화면(`/complete`로 push하는 호출부) | 본 화면 범위 밖이라 어느 화면/조건에서 `/complete`로 보내는지 확인 불가 | `app/learn/chapter/[id]/result/page.tsx`, `app/learn/page.tsx` | 마지막 챕터 완료 후 어떤 조건에서 `/complete`로 이동하는가? |
| Session 직렬화 형태 일치 | localStorage 'session' 저장 코드는 `app/page.tsx:88`에 있어 본 화면에서는 형태 보장 확인 불가 | `app/page.tsx:88`, `types/index.ts:29-34` | session이 항상 `{userId,userName,userPhone,sessionToken}` 형태로 저장되는가? |
| 챕터 0개(empty) 발생 가능성 | chapters가 비면 '0개 챕터 완료' 배지+빈 목록이 노출되나, 활성 챕터가 항상 ≥1인지 코드로 보장되지 않음 | `lib/supabase/migration.sql`, `chapters` 운영 데이터 | 운영 환경에서 활성(Active) 챕터가 항상 1개 이상 존재한다고 보장되는가? |
| 403 이외 실패 시 완료 축하 표시가 의도인지 / IDOR 방어 계획 | 현재 코드 동작과 MEMORY 기록(세션 토큰 검증 적용됨)이 불일치하며, 에러 시 완료 화면 노출이 설계 의도인지 단정 불가 | `app/complete/page.tsx:42-50`, `app/api/complete/route.ts` | (a) 500/400 시 완료 축하를 띄우는 현재 동작이 의도인가? (b) 학습자 API에 세션 토큰 검증을 도입해 userId IDOR을 막을 계획이 있는가? |

### 관리자 로그인 — `/admin/login`

| 항목 | 이유 | 봐야 할 파일 | 개발자 확인 질문 |
|---|---|---|---|
| 운영 환경의 `ADMIN_USERNAME`/`ADMIN_PASSWORD`/`ADMIN_JWT_SECRET` 설정 여부 | 환경변수는 코드로 확인 불가. 미설정 시 로그인이 500으로 실패(`signAdminToken`이 시크릿 미설정 시 throw) | Vercel/배포 환경 설정 | 프로덕션에 3개 환경변수가 모두 설정돼 있는가? |
| 이미 로그인된 관리자가 `/admin/login` 재진입 시 의도된 UX | 화면에 세션 인지/리다이렉트 로직이 없어 의도 추정 불가 | `app/admin/login/page.tsx` | 로그인 상태에서 `/admin/login` 접근 시 `/admin`으로 자동 보내야 하는가? |
| 로그인 무차별 대입 방어(rate limit/계정 잠금) 존재 여부 | 코드 레벨에 없음. 인프라 레벨 보호는 코드로 단정 불가 | Vercel/WAF 설정 | 로그인 시도 제한이 인프라에 걸려 있는가? |
| `/api/admin/*` 데이터·CRUD 라우트의 `isAdminAuthenticated()` 가드 적용 여부 | 이 화면은 login만 호출하므로 분석 범위 밖. 가드 누락 시 인증 우회 가능 | `app/api/admin/{users,stats/*,chapters,questions}/route.ts` | 모든 admin 데이터 라우트가 `isAdminAuthenticated()` 가드를 호출하는가? |

### 관리자 대시보드 — `/admin`

| 항목 | 이유 | 봐야 할 파일 | 개발자 확인 질문 |
|---|---|---|---|
| `GET /api/admin/users` 응답에 `session_token` 등 민감 컬럼 포함이 의도인지 | `getAllUsers`가 전체 컬럼 select(`users.ts:253-263`), 화면은 name/phone/status/날짜만 사용(`page.tsx:285-322`) | `lib/supabase/users.ts`, `app/api/admin/users/route.ts` | 관리자 응답에서 `session_token`을 제거(화이트리스트)할 수 있는가? |
| 데이터 fetch 중 일부/전체 실패 시 사용자 피드백 부재 | 5개 fetch가 단일 try에서 순차 await, 실패는 console.error만(`page.tsx:97-102`), error.tsx 전역 부재 | `app/admin/page.tsx` | 부분/전체 실패 시 에러 토스트·재시도 UI가 필요한가? |
| 세션 만료가 데이터 fetch 시점에 발생하면 화면이 머무름 | effect는 success 체크만, 401에 대한 재인증/리다이렉트 없음(`page.tsx:70-95`) | `app/admin/page.tsx` | 데이터 API 401 시 `/admin/login`으로 강제 이동해야 하는가? |
| 로그아웃 실패 시 리다이렉트 안 함 | `handleLogout` catch에서 console.error만(`page.tsx:58-60`) | `app/admin/page.tsx` | 로그아웃 실패 시에도 클라이언트는 로그인으로 보내야 하는가? |
| `isAdminAuthenticated`가 role 미검증 | `lib/auth/admin.ts:44-49` verify만 수행 | `lib/auth/admin.ts` | 향후 토큰 발급 경로 증가 시 `role==='admin'` 재확인이 필요한가? |
| `service_role` 환경변수 미설정 시 통계 0건 가능 | `SUPABASE_SERVICE_ROLE_KEY` 미설정 시 anon fallback→RLS 차단(`client.ts:12-16`) | `lib/supabase/client.ts`, 환경설정 | 프로덕션에 `SUPABASE_SERVICE_ROLE_KEY`가 설정되어 있는가? |

### 관리자 콘텐츠 관리 — `/admin/content`

| 항목 | 이유 | 봐야 할 파일 | 개발자 확인 질문 |
|---|---|---|---|
| 챕터 PUT 서버 검증 부재가 의도인지 | POST와 비대칭 — PUT은 name/video_url/order 필수값 검증 없음 | `app/api/admin/chapters/[id]/route.ts:39-57`, `app/api/admin/chapters/route.ts:76-121` | 챕터 수정 API에 생성과 동일한 필수값(name/video_url 비어있지 않음, order 숫자) 검증을 추가해야 하는가? |
| 문제 PUT의 body 직접 전달 시 unknown 키 처리 | `validateQuestionUpdate` 통과 후 body를 `updateQuestion`에 그대로 넘김. allowlist 미적용 | `app/api/admin/questions/[id]/route.ts:42-43`, `lib/supabase/questions.ts:231-247` | `updateQuestion`이 update 컬럼을 화이트리스트로 제한하는가, 아니면 받은 키를 그대로 update하는가? |
| `/admin` 대시보드에서 이 화면으로의 진입 네비게이션 | 역방향 링크(콘텐츠 관리로) 위치가 `/admin` 본문이라 이 화면 범위 밖 | `app/admin/page.tsx` | 대시보드에서 `/admin/content`로 이동하는 메뉴/링크가 존재하는가? |
| 프로덕션 환경변수 설정 여부 | `ADMIN_JWT_SECRET`/`SUPABASE_SERVICE_ROLE_KEY` 미설정 시 전 화면 동작 불가(401 또는 RLS 차단) | `lib/auth/admin.ts:11-19`, `lib/supabase/client.ts:12-16` | 프로덕션에 어드민 JWT 시크릿과 service_role 키가 실제로 설정되어 있는가? |
| hard delete CASCADE 운영 정책 | 챕터/문제 영구삭제 시 학습자 진행·시도 기록까지 동반 삭제(복구 불가) | `lib/supabase/schema.sql:32,83,106,129,130` | 영구삭제 전 백업/감사 로그 등 운영 안전장치가 필요한가? |

---

> 반복 등장 항목(교차 화면 우선 확인 권장):
> - **세션 토큰 검증·IDOR 방어**: 학습 홈·챕터 영상·챕터 퀴즈·챕터 결과·학습 완료에서 모두 MEMORY 기록과 코드 불일치를 지적. 단일 결정(토큰→userId 도출 도입 여부)으로 5개 화면이 동시에 정리된다. §5 Critical 항목과 직결.
> - **전역 `error.tsx`/`loading.tsx` 부재**: 랜딩·챕터 결과에서 4상태 보장 책임을 질문. App Router 전역 에러 바운더리 도입 여부 결정 필요.
> - **프로덕션 환경변수**(`ADMIN_*`, `SUPABASE_SERVICE_ROLE_KEY`): 관리자 로그인·대시보드·콘텐츠 관리 3개 화면이 공통 의존. 미설정 시 fail-open(통계 0건)·fail-closed(로그인 500) 동작이 갈림(§5 High).

