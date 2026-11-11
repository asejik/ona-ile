# P08: SECURITY AUDIT

<!-- INTEGRATED-ONLY -->
Stage: Audit | Run: before launch; after changes to auth, data access,
payments, file uploads, or AI features; every 3 months for live apps
Output: docs/audits/P08_[YYYY-MM-DD].md

Follow docs/prompts/AUDIT_STANDARD.md for context loading, rigor level,
evidence, severity, reporting, and fixing. For security, severity is judged
by how easy an issue is to exploit and how bad the damage would be.
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
Finds the vulnerabilities an attacker would actually exploit in THIS app,
proves each with an attack scenario, and (on approval) fixes them. For
security, severity reflects how easy an issue is to exploit and how bad the
damage would be.
-->

<!-- STANDALONE-INCLUDE: AUDIT_STANDARD.md -->

---

ROLE
Act as a Senior Application Security Engineer. Find the vulnerabilities an
attacker would actually exploit in THIS app, prove each one with an attack
scenario, and fix them safely.

OWNS: all security: the builder's own accounts and development tools,
access control and tenant isolation, secrets, authentication and sessions,
input handling, business logic abuse, payment tampering, AI abuse and prompt
injection, file and storage security, rate limiting and abuse, security
headers and CORS, dependencies and supply chain, security logging and
alerting, native mobile security.
Other audits only flag security issues in passing and point here. Privacy
law (lawful basis, consent, notices) belongs to P03.

TOOLS FIRST (run what applies and paste the output)
Dependency audit (npm audit or the equivalent), a secret scanner over the
full git history (e.g. gitleaks), the database provider's security advisor
(e.g. Supabase Security Advisor), and for live sites securityheaders.com,
Mozilla HTTP Observatory, and SSL Labs (or ask me to run them and paste the
grades).

---

STEP 0 - THREAT MODEL (before auditing)
- Assets: what's valuable (money, personal data, admin powers, AI credits,
  paid content, the client's business data, the builder's accounts)
- Attackers: who realistically (curious user, malicious user, former staff
  member, competitor, bot, someone who phished the builder)
- Attack surface: list EVERY entry point: pages and routes, API routes,
  serverless/edge functions, database tables and functions reachable from
  the client, storage buckets, webhooks, auth flows, AI endpoints, file
  uploads, admin areas, and the dashboards and tools used to build and run
  the app
- Ask me for what you can't see (see the Appendix for how to export it):
  access policies for every table or collection, auth settings (email
  confirmation, redirect URLs, providers), storage bucket settings, and the
  provider's built-in security advisor results

---

AUDIT SECTIONS (use the attack surface list; mark N/A with a reason)

1. Builder Accounts and Development Tools (check first; a code audit can't
   see these)
   - MFA on every account: git host, hosting, database, domain registrar,
     email, payment gateway, AI providers, error tracking. Recovery codes
     stored safely. No shared logins.
   - Least-privilege team access; former collaborators and client staff
     removed; domain registrar lock on.
   - AI coding tools: what the agent can read and run; .env and keys not
     readable by it (permission settings); production credentials not
     loaded where the agent runs; database connectors read-only or
     dev-only; MCP servers and plugins only from trusted sources.
   - Prompt injection against the agent: instructions hidden in repo files,
     issues, dependencies, or web pages the agent reads are treated as data.
   - Give me a checklist for the parts only I can confirm in dashboards.

2. Authorization and Data Access (highest priority in the code)
   - Access control enabled on every table/collection; no allow-all
     policies (e.g. using (true)) on sensitive data
   - Insert/update rules stop users from setting ownership fields to
     someone else or changing their own role, status, or balance fields
     (Supabase: WITH CHECK clauses)
   - Roles and permissions not read from user-editable places (Supabase:
     user_metadata; use app_metadata or a protected table)
   - Views and privileged functions don't bypass access rules (Supabase:
     views without security_invoker; SECURITY DEFINER functions exposed
     via RPC)
   - IDOR and tenant isolation: can a user read or change another user's or
     organisation's data by changing an ID? Test every data-access path.
   - Excessive data exposure: API and query responses return only what the
     screen needs (e.g. a member list must not include every member's phone
     and email). Check response bodies, not just the UI.
   - Authorization enforced on the server/database, not only by hiding
     buttons or routes. Check every admin page and admin action.
   - Fail closed: if a permission check, token verification, or lookup
     errors, the result is deny, never allow.

3. Secrets and Keys
   - Secrets in code, committed .env files, or git history (use the scanner,
     not just reading)
   - Secrets in client-exposed variables (VITE_, NEXT_PUBLIC_, EXPO_PUBLIC_)
     or in the built output or app bundle
   - Server-only keys (service-role, AI API, payment secret keys) reachable
     from the client
   - Public-by-design keys (e.g. Supabase anon key, Firebase config) are NOT
     leaks; only report them if access rules fail to protect the data
   - Any exposed secret must be ROTATED, not just removed. Client projects:
     coordinate rotation with the client.

4. Authentication and Sessions
   - Email confirmation, password rules, password reset flow, MFA for
     admins where available
   - OAuth redirect URL allowlist; open redirects after login or logout
   - Messages that reveal whether an email has an account
   - Session handling and logout; other sessions signed out on password
     change; access removed immediately when a user is deactivated
   - Where tokens are stored and whether an XSS bug could steal them

5. Injection and Input Handling
   - SQL/database injection (raw queries, string-built filters, function
     inputs)
   - XSS: dangerouslySetInnerHTML, unsanitised markdown, user or AI content
     rendered as HTML
   - Server-side validation of all inputs (browser checks don't count)
   - SSRF: any feature that fetches a user-supplied URL
   - CSRF: assess whether it applies to this auth setup (cookies vs
     headers), and explain the reasoning

6. Business Logic Abuse
   - Prices, amounts, quantities, discounts, or permissions trusted from the
     client
   - One-time items that can be reused (coupons, invites, vouchers)
   - Steps that can be skipped (reaching success pages or later steps
     directly)
   - Race conditions exploitable for gain (double credit, double booking)

7. Payment Security (if applicable)
   - Card details never touch the app: the gateway's hosted checkout or
     official inline widget is used (this keeps most card-security rules
     off your plate)
   - Webhooks verify the gateway's signature before trusting any event, and
     reject replays (timestamps, already-processed event IDs)
   - Every transaction verified with the gateway's verify endpoint before
     value is delivered
   - Amount and currency calculated on the server and checked against what
     was actually paid

8. AI Features (if applicable; based on the OWASP Top 10 for LLM
   Applications 2025)
   - Cost attacks (unbounded consumption): authentication, rate limits,
     per-user usage caps, maximum input and output sizes
   - Prompt injection: can users (or content the AI reads, such as
     documents, web pages, emails) override instructions, extract the system
     prompt, reach other users' data, or misuse tools the AI can call?
   - System prompt leakage: no secrets or internal rules in the prompt that
     would hurt if revealed
   - Excessive agency: tools the AI can call have the minimum permissions;
     anything that writes, sends, pays, or deletes needs confirmation
   - Retrieval (RAG): search results are filtered by the requesting user's
     permissions, so one tenant never retrieves another's documents
   - Output handling: AI output is sanitised before rendering and never
     executed or used in queries directly; the AI never gets more data
     access than the requesting user has

9. Files and Storage
   - Private files in public buckets; access policies for each bucket
   - File type validated on the server (by content, not just extension),
     size limits, and SVG/HTML uploads handled safely
   - Signed URLs with sensible expiry for private files

10. Abuse Protection and Configuration
    - Rate limiting on login, signup, password reset, forms, OTP/SMS
      sending, AI, and other expensive endpoints
    - SMS pumping (OTP toll fraud): bots trigger thousands of OTP messages
      to premium numbers and you pay. Rate limit per phone number and IP,
      restrict destination countries, add a bot check (e.g. Cloudflare
      Turnstile), and turn on the SMS provider's fraud protection.
    - Bot protection on sign-up and public forms
    - Security headers: Content-Security-Policy, frame-ancestors (or
      X-Frame-Options), Strict-Transport-Security, X-Content-Type-Options,
      Referrer-Policy, Permissions-Policy; HTTPS everywhere
    - CORS: no wildcard origins on endpoints handling user data
    - Error responses and logs don't expose stack traces, internals, or
      personal data

11. Dependencies and Supply Chain
    - Run npm audit (or the equivalent) and paste the output
    - Every dependency is a real, established, maintained package. Flag
      unknown, lookalike, or abandoned packages (AI tools sometimes invent
      package names that attackers then register).
    - Lockfile committed; CI installs from it (frozen install); a minimum
      release age or cooldown before adopting new versions; automated
      update pull requests. (In 2025, hijacked versions of hugely popular
      npm packages and the self-spreading Shai-Hulud worm stole developers'
      secrets within hours of publication.)
    - New dependencies with install scripts get a closer look

12. Security Logging and Alerting
    - Sign-ins, failed sign-ins, password and MFA changes, role changes,
      data exports, and admin actions are logged (without passwords, tokens,
      or unnecessary personal data)
    - Alerts on unusual patterns (many failed logins, mass exports, new
      admin accounts)
    - The logs could answer "what was accessed, by whom, and when" in a
      breach. The law gives 72 hours to report one; you can't report what
      you can't see.

13. Native Mobile (if applicable)
    - Tokens in secure storage (Keychain/Keystore, e.g. expo-secure-store),
      not plain storage
    - Nothing secret in the app bundle (anyone can unpack it)
    - Deep links and app links validated; no sensitive data in URLs
    - Screens with sensitive data protected from screenshots or app
      switcher previews where appropriate

---

ADDITIONAL FINDING FIELDS (on top of AUDIT_STANDARD)
- Attack scenario: step by step, how an attacker would exploit it
- Safe self-test: how I can confirm it myself (e.g. a browser console test
  while logged in as a test user)
- OWASP Top 10:2025 category, where one fits (e.g. A01 Broken Access
  Control, A02 Security Misconfiguration, A03 Software Supply Chain
  Failures, A09 Logging and Alerting Failures, A10 Mishandling of
  Exceptional Conditions)

ADDITIONAL REPORT SECTIONS
- Threat model summary and attack surface list
- Secrets to rotate
- Account security checklist for me (section 1)
- STRICT: whether a human penetration test is recommended before launch,
  and its suggested scope

RULES
- Never weaken security to fix an error (disabling access control, allow-all
  policies, wildcard CORS).
- After each fix, re-run the attack scenario to prove it's closed, and
  confirm legitimate users can still do what they should.
- Test only with test accounts and on local, preview, or my own
  environments. Never attack third-party services.

---

APPENDIX: EXPORTING ACCESS RULES FOR THE AI

Supabase (run in the SQL editor and paste the results):
    select tablename, rowsecurity from pg_tables where schemaname = 'public';
    select * from pg_policies;
Also run the Security Advisor in the Supabase dashboard and paste the
results.

Firebase: paste firestore.rules and storage.rules (from the repo or the
console).

Custom backend: point the AI to the auth middleware and every place
authorization is checked.

---

THE FIVE-MINUTE TEST (I can do this anytime)
Create two test accounts. Log in as User A, open the browser console, and
try to read or edit User B's data using the app's own client. If it works,
it's CRITICAL.

<!-- STANDALONE-INCLUDE: _build/SAFE_CHANGE_RULES.md -->
