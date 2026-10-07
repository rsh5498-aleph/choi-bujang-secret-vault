# BYTE BACK 2단계 저장점 준비

자료를 정적 JSON에서 Supabase public.vault_notes로 옮기는 코드입니다.
홈페이지는 /api/notes를 호출하며, 서버만 환경변수 SUPABASE_URL과 SUPABASE_SECRET_KEY를 읽습니다.
공개 data.json에는 notes 빈 배열만 남습니다. aleph.json은 빌드 시 실제 저장소와 커밋으로 생성됩니다.

## 설정과 실행

1. 별도 제공한 step2-migrate.sql을 Supabase SQL Editor에서 실행합니다. SQL에는 실습용 가상 자료만 있습니다. 메모 본문이 있는 SQL은 GitHub에 올리지 않습니다.
2. Vercel Settings → Environment Variables에서 SUPABASE_URL과 SUPABASE_SECRET_KEY를 서버 환경변수로 입력합니다. 브라우저 공개 변수 접두사는 쓰지 않습니다.
3. 코드 반영 후 재배포합니다. 로컬 정적 빌드 점검은 npm run build -- --local입니다.

정상 결과: 홈페이지 네 카드, /api/notes HTTP 200과 네 가상 메모, /data.json의 notes 0건, /aleph.json의 step 2와 최신 커밋.
거부 결과: anon/authenticated 역할로 DB 직접 조회 시 자료 반환 금지. 서버 환경변수 누락 시 API는 503을 반환하며 대체 메모를 노출하지 않습니다.

## 남은 약점과 확인

2단계의 /api/notes는 비로그인으로 요청할 수 있습니다. DB 이전만으로 접근 보호가 끝나지 않으며 로그인 검증은 3단계에서 추가합니다.
이전 Git 커밋과 이전 Vercel 배포에는 가상 메모가 남아 있을 수 있습니다. 최신 파일 수정으로 과거 노출이 해소됐다고 주장하지 않습니다.
최신 파일 검색: rg -n '실습용 가상 (과제|포트폴리오|리추얼|행정) 기록' . --glob '!node_modules/**' --glob '!.git/**' --glob '!artifacts/**'
새 정적 파일은 public에서, 최신 Git 파일은 git grep으로 확인합니다. 빈 배열과 파일 상태 확인은 메모 원문 검색과 별도로 수행합니다.

## 현재 검증 상태

DB SQL 실행과 Production 환경변수 설정을 완료했습니다. SQL 확인 결과 메모 4건, RLS true, owner_id uuid, anon/authenticated SELECT 권한 false입니다. 로컬 API 오류 처리 시험과 정적 빌드가 통과했습니다. 실제 배포 검증은 배포 완료 후 수행합니다.
마지막 커밋이 실제로 반영된 뒤 이 기록을 최신 커밋과 대조하고 npm run bundle을 실행해야 합니다.
운영 심판 판정은 과제 포털에서 별도로 확인합니다.

