import { randomUUID } from 'node:crypto';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
export function createNotesHandler(runtime) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const authorization = req.headers?.authorization;
    if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'login_required' });
    }
    let db, identity;
    try {
      const services = runtime();
      db = services.db;
      identity = await services.verify(authorization);
    } catch { return res.status(503).json({ error: 'auth_unavailable' }); }
    if (!identity) return res.status(401).json({ error: 'invalid_login' });
    const id = req.query?.id;
    if (id !== undefined && (typeof id !== 'string' || !UUID.test(id))) {
      return res.status(400).json({ error: 'invalid_id' });
    }
    const method = req.method;
    const allowed = id ? ['GET', 'PUT', 'DELETE'] : ['GET', 'POST'];
    if (!allowed.includes(method)) {
      res.setHeader('Allow', allowed.join(', '));
      return res.status(405).json({ error: 'method_not_allowed' });
    }
    const table = () => db.from('user_notes');
    const fields = 'id,title,body';
    try {
      if (method === 'GET' && !id) {
        const { data, error } = await table().select(fields).eq('owner_id', identity.userId).order('created_at');
        if (error) throw error;
        return res.status(200).json(data);
      }
      if (method === 'DELETE') {
        const { data, error } = await table().delete().eq('id', id).eq('owner_id', identity.userId).select('id').maybeSingle();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'note_not_found' });
        return res.status(200).json({ id: data.id, deleted: true });
      }
      if (method === 'GET') {
        const { data, error } = await table().select(fields).eq('id', id).eq('owner_id', identity.userId).maybeSingle();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'note_not_found' });
        return res.status(200).json(data);
      }
      let input = req.body;
      if (typeof input === 'string') { try { input = JSON.parse(input); } catch { input = null; } }
      if (!input || typeof input.title !== 'string' || typeof input.body !== 'string'
          || !input.title.trim() || input.title.length > 200 || input.body.length > 10000) {
        return res.status(400).json({ error: 'invalid_note' });
      }
      if (input.owner_id !== undefined && input.owner_id !== identity.userId) {
        return res.status(403).json({ error: 'owner_change_forbidden' });
      }
      const values = { title: input.title.trim(), body: input.body };
      let query;
      if (method === 'POST') {
        if (input.id !== undefined && (typeof input.id !== 'string' || !UUID.test(input.id))) {
          return res.status(400).json({ error: 'invalid_id' });
        }
        query = table().insert({ ...values, id: input.id ?? randomUUID(), owner_id: identity.userId });
      } else query = table().update(values).eq('id', id).eq('owner_id', identity.userId);
      const { data, error } = await query.select(fields).maybeSingle();
      if (error?.code === '23505') return res.status(409).json({ error: 'note_exists' });
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'note_not_found' });
      return res.status(method === 'POST' ? 201 : 200).json(method === 'POST' ? { id: data.id } : data);
    } catch { return res.status(502).json({ error: 'notes_unavailable' }); }
  };
}
