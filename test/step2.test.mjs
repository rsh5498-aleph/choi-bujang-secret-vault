import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/notes.js';
function response() {
  return { headers: {}, setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}
test('API handles server configuration, DB output and errors safely', async () => {
  const oldFetch = globalThis.fetch;
  const oldUrl = process.env.SUPABASE_URL;
  const oldKey = process.env.SUPABASE_SECRET_KEY;
  try {
    delete process.env.SUPABASE_SECRET_KEY;
    const missing = response(); await handler({ method: 'GET' }, missing);
    assert.equal(missing.code, 503);
    assert.deepEqual(missing.body, { error: 'database_not_configured' });
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'placeholder-for-unit-test';
    globalThis.fetch = async (url, options) => {
      assert.equal(url.pathname, '/rest/v1/vault_notes');
      assert.equal(options.headers.apikey, process.env.SUPABASE_SECRET_KEY);
      return { ok: true, json: async () => Array.from({ length: 4 }, () => ({ title: 'fixture', content: 'fixture', owner_id: 'private' })) };
    };
    const res = response(); await handler({ method: 'GET' }, res);
    assert.equal(res.code, 200); assert.equal(res.body.notes.length, 4);
    assert.deepEqual(Object.keys(res.body.notes[0]), ['title', 'content']);
    globalThis.fetch = async () => { throw new Error('secret upstream detail'); };
    const failed = response(); await handler({ method: 'GET' }, failed);
    assert.equal(failed.code, 502); assert.deepEqual(failed.body, { error: 'notes_unavailable' });
    const rejected = response(); await handler({ method: 'POST' }, rejected);
    assert.equal(rejected.code, 405);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.SUPABASE_SECRET_KEY; else process.env.SUPABASE_SECRET_KEY = oldKey;
  }
});
