// Cloudflare Pages Function - Test endpoint
// Dies aktiviert Functions-Support für dein Projekt.
// Erreichbar unter: https://mendoor.kimanhhang122.workers.dev/api/ping

export async function onRequest(context) {
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