import burt from './integrations/burt/cloudflare-worker.mjs';
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/burt') return burt.fetch(request, env);
    if (url.pathname.startsWith('/api/')) return new Response('Not found', {status: 404});
    return env.ASSETS.fetch(request);
  }
};
