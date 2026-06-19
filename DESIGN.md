# DESIGN — ATS 연동 표면

> 별도 시스템(매니저 지원페이지/ATS)과 트레이닝 앱 간 자동 연동을 위한 "연동 표면" 설계 기준서.
> 상세 PRD/아키텍처: `.agent-state/outputs/prd.md`, `.agent-state/outputs/architecture.md`

## 전체 플로우
```
[ATS 서버] --(1) POST /api/invite (X-API-Key)--> [트레이닝 앱]
           <-- {token, url, expiresAt} --
   |
   | 개인 링크(url)를 지원자에게 전달
   v
[지원자 브라우저] --(2) GET /enter?token=--> [/enter 화면]
                       --(2) POST /api/invite/verify {token}-->
                       <-- {session, redirect:'/learn'} --
                       세션 저장 → /learn 이동 → 이수 진행
   |
   | 전 챕터 이수 완료(completeUser)
   v
[트레이닝 앱] --(3) POST callbackUrl (X-Signature: HMAC-SHA256)--> [ATS 서버]
              payload {applicantId, status:'passed', completedAt, trainingId?}
```

## 보안 경계
- 채널 분리: ATS↔앱(API Key) / 지원자↔앱(일회용 토큰) / 앱→ATS(HMAC 서명). 학습자·어드민 인증과 독립.
- 토큰: 256bit randomBytes, DB엔 sha256 해시만, 14일 만료 강제, 입장 시 issued→entered.
- 멱등: 완료 웹훅은 invites.status CAS(entered→completed)로 1회만 발사.
- PII: 토큰/시크릿/PII는 로그에 평문 노출 금지. invites는 RLS service_role 전용(anon 차단).

## UI — /enter 화면 (plab-design-system 재사용)
- 4상태: loading(스피너) / ok(즉시 /learn 리다이렉트) / invalid(무효·이미완료 안내+홈 버튼) / expired(만료 안내+홈 버튼) / error(재시도).
- 기존 app/page.tsx(이름·전화 폼)는 fallback으로 유지(토큰 경로가 정식).
- 톤: 기존 화면과 동일(bg-bg-surface, text-text-primary 등 시맨틱 토큰, lucide 아이콘).

## 데이터 계약 (고정)
- POST /api/invite/verify → 200 {success,data:{session:{userId,userName,userPhone,sessionToken},redirect:'/learn'}}
- 4xx {success:false,error,reason:'invalid'|'expired'|'completed'}
- 웹훅 payload: {applicantId:string,status:'passed',completedAt:ISO8601,trainingId?:string}
- 웹훅 헤더: X-Signature = hex(HMAC-SHA256(WEBHOOK_SIGNING_SECRET, JSON.stringify(payload)))

## 환경변수
- INVITE_API_KEY — ATS↔앱 사전공유 키
- WEBHOOK_SIGNING_SECRET — 웹훅 HMAC 서명 시크릿
- (운영값은 Vercel에서 사람이 설정, 코드 하드코딩 금지)
