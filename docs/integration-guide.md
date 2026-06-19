# ATS 연동 규격서

> 대상 독자: ATS 시스템 개발자
> 최종 업데이트: 2026-06

---

## 1. 전체 플로우

```
ATS                     매니저 트레이닝             ATS 웹훅 엔드포인트
 |                             |                         |
 |-- POST /api/invite -------->|                         |
 |   (X-API-Key 헤더 + body)   |                         |
 |<-- { token, url, expiresAt }|                         |
 |                             |                         |
 |-- [지원자에게 url 발송] ----->|                         |
 |                             |                         |
 |                  지원자가 url(/enter?token=...) 접속    |
 |                             |-- 토큰 검증             |
 |                             |-- 세션 발급             |
 |                             |-- /learn으로 이동       |
 |                             |                         |
 |                  (지원자가 모든 챕터 수료)              |
 |                             |                         |
 |                             |-- POST callback_url --->|
 |                             |   X-Signature 헤더      |
 |                             |   { applicantId,        |
 |                             |     status: "passed",   |
 |                             |     completedAt }       |
 |                             |<-- 2xx 응답 ------------|
```

---

## 2. 초대 발급 API

### 엔드포인트

```
POST /api/invite
```

### 요청 헤더

| 헤더 | 필수 | 설명 |
|------|------|------|
| `X-API-Key` | 필수 | 사전에 발급된 API 키 |
| `Content-Type` | 필수 | `application/json` |

### 요청 본문 (JSON)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `applicantId` | string | 필수 | ATS 내부 지원자 식별자 (비어있지 않은 문자열) |
| `callbackUrl` | string | 필수 | 완료 웹훅을 수신할 ATS 엔드포인트 URL (http/https만 허용) |
| `name` | string | 선택 | 지원자 이름 (user 생성에 활용) |
| `phone` | string | 선택 | 지원자 전화번호 (user 생성에 활용) |

### 요청 예시 (curl)

```bash
curl -X POST https://manager-online-training.vercel.app/api/invite \
  -H "X-API-Key: YOUR_INVITE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "applicantId": "applicant-abc123",
    "callbackUrl": "https://your-ats.example.com/webhook/training-complete",
    "name": "홍길동",
    "phone": "01012345678"
  }'
```

### 성공 응답 (200 OK)

```json
{
  "success": true,
  "data": {
    "token": "base64url-encoded-token-string",
    "url": "https://manager-online-training.vercel.app/enter?token=base64url-encoded-token-string",
    "expiresAt": "2026-07-03T10:00:00.000Z"
  }
}
```

| 필드 | 설명 |
|------|------|
| `token` | 원문 토큰 (지원자에게 직접 노출되지 않도록 url로만 전달 권장) |
| `url` | 지원자에게 발송할 개인 입장 링크 |
| `expiresAt` | 토큰 만료 시각 (ISO 8601, 발급 후 14일) |

### 에러 응답

| HTTP 상태 | 원인 | 응답 예시 |
|-----------|------|----------|
| 401 | X-API-Key 누락 또는 불일치 | `{ "success": false, "error": "unauthorized" }` |
| 400 | 요청 본문 검증 실패 | `{ "success": false, "error": "callbackUrl은 http 또는 https 프로토콜만 허용됩니다." }` |
| 500 | 서버 내부 오류 | `{ "success": false, "error": "초대 발급 중 오류가 발생했습니다." }` |

---

## 3. 개인 링크 사용법

`url` 필드에 포함된 링크를 지원자에게 이메일/문자로 발송합니다.

```
https://manager-online-training.vercel.app/enter?token=<TOKEN>
```

- 링크는 **14일** 동안 유효합니다.
- 동일한 `applicantId`로 재발급하면 새 토큰이 생성됩니다 (이전 토큰은 여전히 유효).
- 지원자가 링크를 통해 입장하면 세션이 발급되고 학습 페이지(`/learn`)로 이동합니다.
- 이미 완료한 지원자가 재입장하면 `reason: "completed"` 응답이 표시됩니다.

---

## 4. 완료 웹훅

지원자가 모든 챕터를 수료하면 초대 발급 시 지정한 `callbackUrl`로 웹훅을 발송합니다.

### 요청 헤더

| 헤더 | 설명 |
|------|------|
| `Content-Type` | `application/json` |
| `X-Signature` | HMAC-SHA256 서명 (hex 인코딩, 아래 검증 방법 참조) |

### 페이로드 (JSON)

```json
{
  "applicantId": "applicant-abc123",
  "status": "passed",
  "completedAt": "2026-06-19T14:30:00.000Z"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `applicantId` | string | 초대 발급 시 전달한 ATS 내부 지원자 ID |
| `status` | `"passed"` | 항상 `"passed"` (합격/수료) |
| `completedAt` | string | 수료 시각 (ISO 8601 UTC) |

### X-Signature 헤더 검증 (Node.js 예시)

서버는 요청 바디를 **그대로** `JSON.stringify(payload)` 한 문자열에 대해 HMAC-SHA256을 계산합니다. ATS 수신 서버도 동일한 방법으로 서명을 재계산해 비교해야 합니다.

```js
const crypto = require('crypto');

/**
 * 웹훅 X-Signature 헤더를 검증한다.
 * @param {string} rawBody   - req.body를 Buffer/string으로 받은 원문 바디
 * @param {string} signature - X-Signature 헤더 값 (hex)
 * @param {string} secret    - WEBHOOK_SIGNING_SECRET (ATS 측 보관)
 * @returns {boolean}
 */
function verifyWebhookSignature(rawBody, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  // 상수 시간 비교 — 타이밍 어택 방지
  if (expected.length !== signature.length) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

// Express 사용 예 (raw body가 반드시 필요)
app.post('/webhook/training-complete', express.raw({ type: 'application/json' }), (req, res) => {
  const rawBody = req.body.toString('utf-8'); // Buffer → string
  const signature = req.headers['x-signature'] ?? '';
  const secret = process.env.WEBHOOK_SIGNING_SECRET;

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return res.status(401).json({ error: 'invalid signature' });
  }

  const payload = JSON.parse(rawBody);
  // payload.applicantId, payload.status, payload.completedAt 처리
  console.log('수료 완료:', payload.applicantId);
  res.status(200).json({ received: true });
});
```

> **중요**: Express에서 `express.json()` 미들웨어를 먼저 거치면 rawBody가 손실됩니다.
> 웹훅 엔드포인트에는 반드시 `express.raw()` 또는 `bodyParser.raw()`를 사용하고,
> 서명 검증 후 `JSON.parse(rawBody)`로 파싱하세요.

### 재시도 정책

- 웹훅 발송 실패(네트워크 오류 또는 2xx 이외 응답) 시 **3회 지수 백오프** 재시도합니다.
  - 1차 실패 후 500ms 대기
  - 2차 실패 후 1,000ms 대기
  - 3차 실패 후 최종 실패로 기록

- 3회 모두 실패하면 초대 상태가 `failed`로 변경됩니다.
  - 이 경우 Supabase `invites` 테이블의 `last_webhook_error` 컬럼에 오류 내용이 기록됩니다.
  - **수동 재시도가 필요합니다.** ATS 운영팀에 문의하세요.

- ATS 수신 서버는 **멱등성**을 보장해야 합니다. 동일한 `applicantId`로 웹훅이 중복 수신될 수 있습니다.

---

## 5. 토큰 수명 및 만료

- 초대 토큰은 발급 후 **14일** 동안 유효합니다.
- 만료된 토큰으로 `/enter`에 접속하면 `reason: "expired"` 화면이 표시됩니다.
- 만료된 경우 새 초대를 재발급(`POST /api/invite`)하세요.

---

## 6. 보안 주의사항

1. **API 키 보안**: `INVITE_API_KEY`는 ATS 서버 환경변수에만 저장하세요. 절대 클라이언트 코드, 소스코드 저장소, 로그에 노출하지 마세요.

2. **웹훅 시크릿 보안**: `WEBHOOK_SIGNING_SECRET`은 ATS 서버에만 보관하세요. 이 값이 유출되면 공격자가 위조 웹훅을 보낼 수 있습니다.

3. **HTTPS 필수**: `callbackUrl`은 반드시 `https://`를 사용하세요. `http://`는 프로덕션에서 사용하지 마세요.

4. **서명 검증 필수**: 웹훅 수신 시 `X-Signature` 검증을 반드시 구현하세요. 검증 없이 페이로드를 신뢰하면 위조 완료 신호를 받을 수 있습니다.

5. **rawBody 보존**: 서명 검증에는 HTTP 수신 시의 **원문 바디 바이트**가 필요합니다. JSON 파싱 후 재직렬화하면 키 순서나 공백이 달라져 서명이 맞지 않습니다.

6. **callbackUrl은 공인 IP만 사용 권장(내부망 차단 v1.1)**: 현재 MVP에서는 스킴(http/https) 검증만 수행합니다. 내부망 IP(127.x/10.x/169.254.x 등)로의 SSRF 차단은 v1.1에서 IP allowlist로 구현 예정입니다. 운영 환경에서는 `callbackUrl`에 공인 도메인/IP만 사용하세요.
