# Contact enquiry delivery

Current recipient: `dorsetdivision@gmail.com`. Public contact address stays
`marnie@dorsetdivision.co.uk`. These are separate from the sending identity.

## Configure before enabling

1. Create the owner's Resend account using `dorsetdivision@gmail.com`.
2. Verify the sending domain `forms.dorsetdivision.co.uk` in Resend. Add only
   the DNS records Resend supplies for that subdomain and its children.
   Keep the existing apex MX record (`mailserver.livemail.co.uk`) and Fasthosts
   forwarding unchanged. Do not enable Resend inbound receiving for the main domain.
3. Create a sending-only Resend API key restricted to that verified domain.
4. Add `RESEND_API_KEY` as an encrypted secret to the production Cloudflare
   Worker `dorset-division-website`. Never put the key in HTML, GitHub or chat.
5. The deployment supplies the `CONTACT_RATE_LIMITER` binding. It is a best-effort
   per-IP limit of 10 attempts per minute per Cloudflare location, not a global quota.
6. Add `CONTACT_DELIVERY_ENABLED` as a Cloudflare secret with value `true` only
   when ready for the delivery test. Using a secret here preserves the switch
   across Git deployments. Remove it or set it to `false` to pause delivery.
7. Reload `/contact`: it should show **Send enquiry**. Submit one clearly labelled
   test, check the Resend Emails delivery event and actual receipt in Gmail.
   A successful send API response confirms acceptance, not inbox delivery.
8. Only mark the setup complete after the real email has arrived. Keep the
   enable switch off if the test fails and investigate the Resend delivery log.

Until both secrets and the rate-limit binding are available, the public form
continues to prepare an email in the visitor's mail application. Requests to
the direct-send endpoint fail closed. Enquiry contents and API keys are never logged.

Server tests: `node --test tests/contact.test.mjs`

References: https://resend.com/docs/api-reference/emails/send-email and
https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
