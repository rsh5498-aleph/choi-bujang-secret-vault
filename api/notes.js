// 2단계에서는 공개 API입니다. 로그인 검증은 다음 단계에서 추가합니다.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return res.status(503).json({ error: 'database_not_configured' });
  try {
    const base = new URL(url);
    if (base.protocol !== 'https:' || base.username || base.password
        || base.search || base.hash || base.pathname !== '/') throw new Error('invalid_config');
    const endpoint = new URL('/rest/v1/vault_notes', base);
    endpoint.searchParams.set('select', 'title,content');
    endpoint.searchParams.set('order', 'display_order.asc');
    endpoint.searchParams.set('limit', '4');
    const headers = { apikey: key };
    // 기존 service_role JWT와 새 sb_secret 키를 모두 지원합니다.
    if (!key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`;
    const response = await fetch(endpoint, {
      headers, redirect: 'error', signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('database_error');
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length !== 4
        || rows.some(row => typeof row.title !== 'string' || typeof row.content !== 'string')) {
      throw new Error('invalid_data');
    }
    return res.status(200).json({ sampleMarker: 'SAMPLE_NOTE_1',
      notes: rows.map(({ title, content }) => ({ title, content })) });
  } catch {
    // DB 응답이나 환경변수 값을 브라우저와 로그에 노출하지 않습니다.
    return res.status(502).json({ error: 'notes_unavailable' });
  }
}
