/**
 * darrenlin-reviews worker
 * 
 * GET /api/reviews  — list all reviews (public)
 * POST /api/reviews — submit a review (rate-limited, no auth)
 * 
 * Storage: Cloudflare KV (namespace: REVIEWS)
 */
export interface Env {
  REVIEWS: KVNamespace;
}

const REVIEW_KEY = 'reviews_json';
const MAX_PER_HOUR = 10;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function validateReview(body: any): { ok: boolean; error?: string; data?: any } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid body' };
  const name = (body.name || '').trim();
  const review = (body.review || '').trim();
  const rating = parseInt(body.rating, 10);
  if (!name || name.length < 2) return { ok: false, error: 'Name is required' };
  if (!review || review.length < 5) return { ok: false, error: 'Review must be at least 5 characters' };
  if (!rating || rating < 1 || rating > 5) return { ok: false, error: 'Rating must be 1-5' };
  return {
    ok: true,
    data: {
      name: name.slice(0, 80),
      role: (body.role || '').slice(0, 80),
      rating,
      review: review.slice(0, 500),
      ts: Date.now(),
    },
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return json(null);

    // GET reviews
    if (request.method === 'GET') {
      const raw = await env.REVIEWS.get(REVIEW_KEY);
      const reviews = raw ? JSON.parse(raw) : [];
      return json({ success: true, data: reviews });
    }

    // POST review
    if (request.method === 'POST') {
      const ip = request.headers.get('cf-connecting-ip') || 'unknown';
      const rate_key = `rate_${ip}`;
      const current = parseInt((await env.REVIEWS.get(rate_key)) || '0', 10);
      if (current >= MAX_PER_HOUR) {
        return json({ success: false, error: 'Rate limit — try again later' }, 429);
      }

      let body: any;
      try {
        body = await request.json();
      } catch {
        return json({ success: false, error: 'Invalid JSON' }, 400);
      }

      const result = validateReview(body);
      if (!result.ok) return json({ success: false, error: result.error }, 400);

      const raw = await env.REVIEWS.get(REVIEW_KEY);
      const reviews = raw ? JSON.parse(raw) : [];
      reviews.unshift(result.data);

      // Keep max 500 reviews
      if (reviews.length > 500) reviews.length = 500;

      await env.REVIEWS.put(REVIEW_KEY, JSON.stringify(reviews));
      await env.REVIEWS.put(rate_key, String(current + 1), { expirationTtl: 3600 });

      return json({ success: true, data: result.data });
    }

    return json({ success: false, error: 'Method not allowed' }, 405);
  },
};
