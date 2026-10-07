export async function runAttackChecks(config) {
  if (config.step !== 2) throw new Error('이 점검은 2단계용입니다.');
  const app = new URL(config.publicAppUrl);
  if (app.protocol !== 'https:' || app.username || app.password || app.search || app.hash || app.pathname !== '/') throw new Error('실제 HTTPS 배포 주소를 확인하세요.');
  const attempts = [];
  for (const path of ['/data.json', '/api/notes', '/aleph.json']) {
    const response = await fetch(new URL(path, app), { redirect: 'error', signal: AbortSignal.timeout(10000) });
    let data;
    try { data = await response.json(); } catch { data = null; }
    const count = Array.isArray(data?.notes) ? data.notes.length : null;
    if (path === '/data.json') attempts.push({ attackId: 'static_note_removed', expected: '정적 메모 0건 또는 HTTP 404', observed: `HTTP ${response.status} · 메모 수 ${count ?? '확인 불가'}` });
    if (path === '/api/notes') attempts.push({ attackId: 'public_api_remaining', expected: '2단계 공개 API로 가상 메모 4건 조회 가능', observed: `HTTP ${response.status} · 메모 수 ${count ?? '확인 불가'} · 로그인 보호 미구현` });
    if (path === '/aleph.json') attempts.push({ attackId: 'deployment_identity', expected: 'HTTP 200 · 2단계 · 저장소와 최신 커밋 정보', observed: `HTTP ${response.status} · 단계 ${Number.isInteger(data?.step) ? data.step : '확인 불가'} · 저장소 일치 ${data?.repoUrl === config.repoUrl}` });
  }
  return attempts;
}
