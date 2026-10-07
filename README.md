# BYTE BACK 4단계 저장점

Supabase Auth 로그인과 메모 CRUD를 유지하고, 서버에서 검증된 사용자 ID와 메모 owner_id를 비교하도록 변경했습니다. 목록·개별 읽기·수정·삭제 모두 본인 행으로 제한합니다. 요청 URL/본문의 userId/role을 신뢰하지 않으며, 추가 시 검증된 ID를 저장하고 다른 owner_id를 지정하거나 소유자를 변경하려는 본문은 JSON 403으로 거부합니다. 타인 또는 없는 ID의 읽기·수정·삭제는 동일한 JSON 404입니다. src/verify-login.mjs와 judgeIssuer는 원본 그대로입니다.

## 재실행과 DB 설정

1. npm install 후 node --test test/step2.test.mjs test/login-stage3.test.mjs 를 실행합니다. 현재 API 회귀 시험에는 A/B 소유자 검사와 소유자 변경 공격이 포함됩니다. 시작 틀의 test:r5/test:package는 이전 단계 고정 기대값이므로 현재 배포 검증으로 사용하지 않습니다.
2. Supabase SQL Editor에서 scripts/step4-rls.sql을 실행합니다. 적용 전 실제 GRANT를 조회하고 user_notes에만 anon/PUBLIC/authenticated 기존 권한을 회수한 뒤 authenticated SELECT/INSERT/UPDATE/DELETE를 부여합니다. RLS SELECT/DELETE는 USING, INSERT는 WITH CHECK, UPDATE는 USING과 WITH CHECK로 auth.uid()=owner_id를 확인합니다. restrictive guard도 두어 다른 허용 정책이 추가돼도 본인 행 조건을 유지합니다. 원본 vault_notes와 다른 테이블은 변경하지 않습니다.
3. scripts/step4-rls-test.sql은 DB authenticated 역할에 가상 A/B ID를 설정해 본인 CRUD, 상대 행 읽기·수정·삭제 거부, 소유자 변경과 타인 소유 INSERT 거부를 검사한 뒤 ROLLBACK합니다. 실제 로그인 화면 시험과 구분합니다.
4. 실제 A/B Auth 계정이 준비되면 scripts/step4-assign-owners.sql의 이메일 자리표시자를 SQL Editor에서만 교체합니다. auth.users의 ID로 원본 네 가상 메모를 user_notes에 복사하여 A 세 건, B 한 건을 연결합니다. 원본 자료는 그대로 보존하고 기존 앱 메모도 변경하지 않습니다. 실제 이메일·비밀번호를 GitHub에 올리지 않습니다.
5. Vercel Production SUPABASE_URL/SUPABASE_SECRET_KEY를 유지합니다. 서버 키는 브라우저·Git·응답·로그에 넣지 않습니다. public/app.js의 publishable key는 공개용입니다. npm run build -- --local 로 정적 메모 제거를 점검하고 Vercel 빌드는 실제 Git 커밋으로 aleph.json을 만듭니다.

## API 및 화면 확인

로그인하지 않거나 토큰 검증에 실패한 요청은 JSON 401이며 자료가 없습니다. 인증 설정 장애는 JSON 503입니다. GET /api/notes는 본인 메모 배열입니다. POST /api/notes는 {id,title,body}를 받고 UUID id 생략 시 서버가 생성하며 201 {id}를 반환합니다. GET /api/notes/:id는 {id,title,body}, PUT 본문은 {title,body}, DELETE는 삭제 후 GET404입니다. 제목 1~200자, 본문 최대10000자입니다. 기존 allowedRoutes에 실제 GET/POST/PUT/DELETE를 유지합니다.

배포 화면에서 A 로그인 → 자기 가상 메모 저장·수정·삭제 → 로그아웃 → B 로그인 순서로 자기 목록을 확인합니다. 상대 메모 ID의 GET/PUT/DELETE는404여야 합니다. 직접 Data API는 점검에서 anon 역할만 요청하며 authenticated 직접 Data API 요청은 제출 점수의 근거로 사용하지 않습니다. 서버의 service_role은 RLS를 우회하므로 API 소유자 조건은 필수입니다.

## 검증 상태와 한계

로컬 인증·CRUD·교차 소유자·소유자 변경 시험을 실행했습니다. DB 역할별 권한 적용 결과 anon 네 권한 false, authenticated 네 권한 true를 확인했습니다. 실제 DB에서 가상 A/B 역할의 본인 CRUD·상대 행 차단·소유자 변경 차단 시험이 PASS했고 모두 롤백됐습니다. 실제 A 계정 로그인 화면에서 목록 조회·추가·수정·삭제를 확인했고 테스트 메모는 사용자 승인 후 삭제했습니다. 원본 가상 메모 세 건을 A ID로 연결하여 화면에 세 카드가 보이는 것을 확인했습니다. B 계정 준비가 남아 B 한 건 연결과 실제 교차 계정 화면 시험은 미실행입니다. 계정 생성은 사용자가 직접 비밀번호를 입력해야 합니다.

저장점 커밋 후 npm run bundle은 실제 배포의 비로그인 거부·잘못된 토큰 거부·정적 메모0건·4단계 aleph.json·nosniff와 익명 Data API 차단을 요청해 기록합니다. 결과는 자기 점검이며 운영 심판 판정이 아닙니다. bundle-notes.json과 artifacts는 커밋하지 않습니다. 과거 Git 커밋과 Vercel 배포의 가상 메모 노출은 최신 접근 보호로 지워지지 않습니다.
