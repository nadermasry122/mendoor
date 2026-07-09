// mendooR Worker – routes /api/* to functions, everything else to static files.
// This file MUST have a default export or Cloudflare rejects the deployment
// with error code 10021 ("No event handlers were registered").

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ── Health check endpoint ──
    if (url.pathname === '/api/ping') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          message: 'mendooR API is live',
          timestamp: new Date().toISOString()
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // ── Cloud Vision proxy (placeholder – comes next) ──
    if (url.pathname === '/api/vision') {
      return new Response(
        JSON.stringify({ error: 'Not implemented yet' }),
        {
          status: 501,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ── Everything else → static files (index.html, styles.css, app.js) ──
    return env.ASSETS.fetch(request);
  }
};