# P12: EGRESS & EFFICIENCY AUDIT

<!-- INTEGRATED-ONLY -->
Stage: Audit (specialist) / Operate | Run: when usage or bills climb; before
scaling or a big launch; STRICT projects before launch
Output: docs/audits/P12_[YYYY-MM-DD].md

Follow docs/prompts/AUDIT_STANDARD.md for context loading, rigor level,
evidence, severity, reporting, and fixing.
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
Finds what drives data transfer (egress/bandwidth), request volume, and
usage-based API costs, ranks the causes by impact, and (on approval) fixes
them.
-->

<!-- STANDALONE-INCLUDE: AUDIT_STANDARD.md -->

---

ROLE
Act as a senior software architect specialising in cloud cost and network
efficiency. Find what drives data transfer (egress/bandwidth), request
volume, and usage-based API costs in this app, rank the causes by impact,
and fix them safely.

OWNS: egress and bandwidth, request volume, caching, payload size, media
delivery, realtime traffic, usage-based costs of third-party and AI API
calls, cost projections, and whether billing protection fits the real
usage.
NOT HERE: page speed and rendering performance (P07); abuse, bots, and rate
limiting (P08); setting up spend caps in the first place (P04). Flag those in
passing only.

---

STEP 0 - USAGE DATA (in addition to the standard context)
- Identify every usage-billed service: database/BaaS (e.g. Supabase egress
  by service; Firebase document reads and downloads), hosting (e.g. Vercel
  or Netlify bandwidth, function invocations, image optimisation quota),
  storage/CDN, AI APIs (requests and tokens), error tracking and analytics
  (events, session replays), and others (maps, SMS, email, WhatsApp).
- Ask me for the usage breakdown from each dashboard and my plan limits.
  Prioritise the audit by the real numbers. If no data is available,
  estimate from the code and label it as an estimate.

TOOLS FIRST
Use Playwright to load key pages and run the main journeys on a local or
preview URL while recording network traffic: request count, transferred
size, and duplicate requests per page visit, plus requests that keep firing
while idle. Paste the numbers; they are the "before" for verification.

---

AUDIT SECTIONS

A. Storage and media delivery
   - Images served larger than displayed; no resized or thumbnail versions
   - Missing cache headers (e.g. cacheControl on uploads) causing repeat
     downloads
   - Video or large media served from general storage (recommend
     purpose-built options such as a video platform or zero-egress-fee
     object storage)
   - Files, exports, or PDFs regenerated or re-downloaded instead of cached
   - Binary or base64 data stored in database rows

B. Auth traffic
   - Every call that hits the auth server over the network (e.g. Supabase
     getUser()) vs calls that read locally (e.g. getSession(), getClaims())
   - Multiple auth listeners or auth checks scattered across components.
     Recommend one central provider sharing the session through context.
   - Do NOT build custom session caches that interfere with the client
     library's automatic token refresh.
   - If a backend exists: can it verify tokens locally (preferably with
     asymmetric keys / JWKS) instead of a network call per request? State
     the trade-off: revoked sessions stay valid until the token expires.
     Check the provider's current docs and say if unsure.

C. Data fetching behaviour
   - Duplicate requests for the same data on one page or across navigation
   - useEffect (or equivalent) dependencies causing repeated or infinite
     fetches
   - Polling that keeps running when not needed or while the tab is hidden
   - Query library settings (e.g. TanStack Query): staleTime per data type;
     refetchOnWindowFocus, refetchOnMount, refetchOnReconnect; targeted
     cache invalidation after changes; consistent query keys. Flag default
     settings that increase requests.

D. Query payloads
   - select('*') or full-document reads where specific fields would do
   - Unbounded queries on tables that grow with users (small fixed lookup
     tables fetched once and cached are fine)
   - Totals, counts, and charts computed on the client from many rows; move
     them into database views or functions that return just the numbers
   - Offset pagination on large tables where cursor pagination fits better

E. Realtime and listeners
   - Subscriptions to whole tables or collections instead of filtered rows
   - Refetching full lists on every realtime event
   - Channels or listeners not cleaned up when components unmount

F. Third-party and AI API usage
   - Repeated identical calls that could be cached (same AI prompt, same
     geocoding lookup, same exchange-rate request)
   - Calls triggered by re-renders or keystrokes without debouncing
   - AI: model choice vs task (cheaper models for simple tasks), max tokens,
     prompt size, conversation history growing without limit, retries that
     repeat full requests, caching of repeated results
   - Notifications (SMS, email, WhatsApp) sent more often than needed

G. Hosting and hidden traffic
   - Serverless functions called more than necessary; opportunities for
     caching or static generation
   - Image optimisation quota usage; large unoptimised assets downloaded on
     every visit
   - Hidden senders: error tracking, session replay, analytics, and logging
     uploads (sampling rates, replay on every session)

H. Billing protection
   - Every usage-billed service has a spend cap or budget alert (set up in
     P04). Check each one still fits current usage: too low causes outages,
     too high or missing allows bill shock.
   - Who gets the alert, and whether they'd see it at night

---

PROJECTION
- Estimated usage per active user per month for each billed service, now
  and at 100, 1,000, and 10,000 users, compared with plan limits and the
  cost of the next tier
- Costs in USD and in local currency at today's rate, with a note on
  exchange-rate risk if revenue is in a different currency
- Which limit will be hit first, and roughly when

VERIFY (after approved fixes are made)
- Re-run the Playwright network recording: request count and transferred
  size per page visit, before vs after
- Which dashboard numbers should drop, and when to re-check (e.g. after 7
  days of real usage)

---

QUICK CHECK I CAN DO MYSELF
Open the app, press F12, go to the Network tab, and use the app normally for
two minutes. Identical requests repeating, or requests firing while I'm
idle, are leaks. Paste examples into this audit as evidence.

<!-- STANDALONE-INCLUDE: _build/SAFE_CHANGE_RULES.md -->
