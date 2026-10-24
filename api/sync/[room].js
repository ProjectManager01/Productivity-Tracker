// api/sync/[room].js - Vercel Serverless Function for Cross-Device Sync between Windows & Mobile
module.exports = async function handler(req, res) {
  // CORS Headers for Windows & Mobile sync
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const room = req.query.room || req.query.roomId || 'default';
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  // GET: Fetch state for this room
  if (req.method === 'GET') {
    // 1. If Vercel KV (Redis) is connected
    if (kvUrl && kvToken) {
      try {
        const response = await fetch(`${kvUrl}/get/${encodeURIComponent(room)}`, {
          headers: { Authorization: `Bearer ${kvToken}` }
        });
        const data = await response.json();
        let parsed = { days: {} };
        if (data && data.result) {
          parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        }
        return res.status(200).json(parsed);
      } catch (err) {
        console.error('Vercel KV fetch error:', err);
      }
    }

    // 2. Fallback: Free persistent cloud relay
    try {
      const fallbackRes = await fetch(`https://kvdb.io/4y9n1k6Z9bE2bV1A7q8b3X/${encodeURIComponent(room)}`);
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return res.status(200).json(data);
      }
    } catch (e) {
      console.warn('Fallback fetch error:', e);
    }

    return res.status(200).json({ days: {} });
  }

  // POST: Save state for this room
  if (req.method === 'POST') {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {}
    }

    // 1. If Vercel KV is connected
    if (kvUrl && kvToken) {
      try {
        await fetch(`${kvUrl}/set/${encodeURIComponent(room)}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${kvToken}` },
          body: JSON.stringify(JSON.stringify(payload))
        });
        return res.status(200).json({
          status: 'ok',
          provider: 'vercel-kv',
          syncedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Vercel KV save error:', err);
      }
    }

    // 2. Fallback: Free persistent cloud relay
    try {
      await fetch(`https://kvdb.io/4y9n1k6Z9bE2bV1A7q8b3X/${encodeURIComponent(room)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.status(200).json({
        status: 'ok',
        provider: 'cloud-relay',
        syncedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Fallback save error:', e);
      return res.status(500).json({ error: 'Failed to persist state to cloud' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
