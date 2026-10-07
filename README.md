# BYTE BACK 3단계 저장점

Supabase Auth 이메일·비밀번호 로그인/로그아웃과 서버의 토큰 검증을 구현했습니다. 공식 SDK를 사용하며 src/verify-login.mjs와 judgeIssuer는 원본 그대로 보존합니다. 서버가 검증한 ID를 owner_id로 저장합니다. 로그인 실패 이유는 화면에 표시합니다.

## 설정 및 다시 실행

- Supabase SQL Editor에서 scripts/step3-migrate.sql을 실행합니다. 기존 vault_notes 네 가상 메모는 보존하고, UUID 기반 user_notes를 별도로 만듭니다. 신규 로그인 사용자의 메모 목록은 비어 있으므로 가상 메모를 추가하세요.
- Vercel Production 환경변수 SUPABASE_URL과 SUPABASE_SECRET_KEY를 유지합니다. 서버 키는 브라우저·Git·응답·로그에 넣지 않습니다. public/app.js의 publishable key는 공개용입니다.
- Supabase 이메일 제공자는 활성화되어 있으며 이메일 확인은 켜 둡니다. Site URL은 https://choi-bujang-secret-vault-black-beta.vercel.app 입니다.
- npm install 후 node --test test/step2.test.mjs test/login-stage3.test.mjs 로 현재 API·인증 시험을 실행합니다. test/step2.test.mjs는 이전 API 변경에 따라 3단계 회귀 시험으로 갱신했습니다. 시작 틀의 test:r5/test:package는 이전 단계의 고정 기대값이므로 현재 단계의 배포 검증으로 사용하지 않습니다.
- npm run build -- --local 은 정적 메모 제거를 검사합니다. Vercel 빌드는 시스템 Git 정보로 aleph.json을 생성합니다.
- 배포 화면에서 계정 만들기 → 이메일 인증 → 로그인 → 가상 메모 저장/수정/삭제 → 로그아웃 순서로 확인합니다. 비밀번호는 사용자가 직접 입력하며 제출 자료에 기록하지 않습니다.

## API 계약

인증은 Authorization Bearer 토큰을 src/verify-login.mjs로 검증합니다. 브라우저의 userId/role/owner_id는 권한 근거로 사용하지 않습니다. 토큰 없음·검증 실패는 메모 없이 JSON 401, 인증 설정 장애는 JSON 503입니다.

GET /api/notes는 검증된 사용자 소유 메모 배열을 반환합니다. POST /api/notes는 {id,title,body}를 받으며 id는 UUID이고 생략하면 서버가 생성합니다. 응답은 201 {id}입니다. GET /api/notes/:id는 {id,title,body}, PUT /api/notes/:id는 제목·본문 수정, DELETE /api/notes/:id는 삭제입니다. 삭제 후 GET은 JSON 404입니다. 제목은 1~200자, 본문은 최대 10000자입니다.

## 보존한 약점과 공개 이력

3단계는 로그인 확인 단계입니다. 목록은 본인 것으로 제한하지만 개별 ID의 GET/PUT/DELETE에는 소유자 검사를 아직 추가하지 않았습니다. 로그인한 B가 A 메모 ID를 알면 접근할 수 있으며, 이는 4단계에서 차단해야 합니다. 과거 공개 Git 커밋과 Vercel 배포의 가상 메모 노출도 남아 있으므로 과거 노출이 해소됐다고 주장하지 않습니다.

## 검증 기록

DB 실행 결과 user_notes RLS true, anon SELECT false, authenticated SELECT false를 확인했습니다. 기존 vault_notes를 변경하지 않았습니다. 로컬 시험은 비로그인 차단, 검증된 소유자 저장, CRUD, 삭제 후404, 인증 검증 실패와 발급자 구분을 다룹니다. 실제 로그인 사용자 A의 배포 화면 시험은 사용자가 계정 생성·로그인을 완료한 뒤 확인해야 하며 아직 미실행입니다.

저장점 커밋 후 npm run bundle은 공개 배포에 실제 요청을 보내 비로그인 CRUD 거부, 잘못된 토큰 거부, 정적 메모0건, 3단계 aleph.json, nosniff 헤더를 확인합니다. JSON 결과는 본인의 점검이며 심판 판정이 아닙니다. bundle-notes.json과 artifacts는 커밋하지 않습니다.
