# Dorset Division

Complete Dorset Division website, served from `dist` by Cloudflare Workers Static Assets.

Deploy from the repository root with `npx wrangler deploy`; no build command is required. Production branch: `main`.

Burt's chat runs at `/api/burt` on the same website using the Workers AI binding named `AI`. The configuration is in `wrangler.jsonc`; the request router is `worker.mjs` and the chat source is `integrations/burt/cloudflare-worker.mjs`.

Includes six main pages, two case studies, seven policy pages, all assets and cookie preferences. Services & Prices uses `contact.html`.
