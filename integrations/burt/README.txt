BURT 2.0 - DORSET DIVISION
===========================
FILES:
- burt.css: appearance and animated navy/gold robot
- burt.js: accessible chat UI, chat history, API integration and human handoff
- burt-embed.html: snippet to add to your website's shared footer or every HTML page
- cloudflare-worker.js: NEW Worker source for Dorset Division (do not overwrite old SOS Worker)

INSTALL:
1. Add burt.css and burt.js to your site's public/root files.
2. Paste the contents of burt-embed.html before the closing </body> on each page (or in shared site layout).
3. Create a NEW Cloudflare Worker, add Workers AI binding named AI, and paste cloudflare-worker.js.
4. Update ALLOWED_ORIGINS in cloudflare-worker.js to the EXACT published or preview domain(s) used by your site; redeploy the Worker.
5. Replace YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev in burt-embed.html with the new Worker URL.
6. Test on your private preview domain, including handoff and mobile.

IMPORTANT:
- Without the Worker URL, the widget appears but clearly reports its chat is not connected.
- Without the exact preview domain in ALLOWED_ORIGINS, Cloudflare blocks requests.
- The Worker uses approved service descriptions, but DOES NOT include unverified prices or promises.
- Replace contactUrl/bookingUrl with the real Dorset Division paths if different.
- Do not put API keys in website JavaScript.
- This is a working integration template, not a verified live deployment. A preview domain and actual Worker URL are still required.
- If Sites cannot accept raw JS/CSS files, the files need integrating into the exported site's code or supported custom-code feature.
