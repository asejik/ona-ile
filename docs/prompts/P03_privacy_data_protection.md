# P03: PRIVACY & DATA PROTECTION

<!-- INTEGRATED-ONLY -->
Stage: Plan + Audit | Run: DESIGN mode right after P02, before building;
AUDIT mode before launch, after any change that adds personal data, adds a
third party, or changes who can see data, and yearly for live apps
Output: DESIGN: completed docs/DATA_INVENTORY.md + privacy tasks added to
docs/PROJECT_PLAN.md. AUDIT: docs/audits/P03_[YYYY-MM-DD].md, plus drafts in
docs/privacy/ (PRIVACY_NOTICE_DRAFT.md, DPIA_INPUT.md,
COMPLIANCE_CHECKLIST.md)

Follow docs/prompts/AUDIT_STANDARD.md for context loading, rigor level,
evidence, severity, reporting, and fixing (AUDIT mode; DESIGN mode uses
sections 1 and 3 of it).
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
Checks whether an app handles personal data lawfully (Nigeria's NDPA 2023
and GAID 2025 built in; GDPR noted), and prepares the drafts and technical
input the owner needs for their data protection paperwork.
-->

IMPORTANT: This is not legal advice. You prepare evidence, drafts, and
technical input; a licensed Data Protection Compliance Organisation (DPCO),
an NDPC-accredited Data Protection Officer (DPO), or a lawyer confirms. The
reference card below reflects the NDPA 2023, the NDPC's GAID 2025 (in force
from 19 September 2025), and the NDPC Registration Guidance Notice (December
2024). Check ndpc.gov.ng for anything newer before relying on fees,
deadlines, or forms.

<!-- STANDALONE-INCLUDE: AUDIT_STANDARD.md -->

---

ROLE
Act as a privacy engineer and data protection practitioner who knows the
Nigeria Data Protection Act, the GAID, and the GDPR. Make this app handle
personal data lawfully, with privacy built into its features, and produce
the inputs the owner needs for registration, assessments, and audits. Prefer
collecting less data over writing paperwork that justifies collecting more.

OWNS: data inventory, data minimisation and retention, lawful basis and
consent, privacy notices, cookies and trackers, user rights (access,
correction, export, deletion, complaints), third parties and cross-border
transfers, children and sensitive data, AI and automated decisions from a
privacy angle, the legal requirements of breach notification, and the data
protection paperwork checklist.
NOT HERE: technical security testing (P08; this prompt only checks that the
measures the law expects exist), the operational incident runbook (P13),
AI output quality (P10).

MODE (tell me which, or ask)
- DESIGN: before or early in the build. Complete the data inventory, decide
  lawful bases and regions, and turn privacy requirements into build tasks
  with acceptance criteria. Light on findings, heavy on decisions.
- AUDIT: the app exists. Check everything below against the real code,
  settings, and live pages, and report findings.

---

STEP 0 - ROLES AND APPLICABLE LAW
- From user locations, list the laws that apply:
  - Nigeria: NDPA 2023 + GAID 2025 (applies to anyone in Nigeria regardless
    of nationality, and to Nigerian citizens abroad)
  - EU/UK users: GDPR / UK GDPR (see the GDPR note at the end)
  - Other countries (e.g. Ghana, Kenya, South Africa): name the law and tell
    me to verify its requirements
- Who is the data controller (decides why and how data is used)? Who are
  the processors? On client projects the client is usually the controller
  and I am their processor; say so explicitly.
- Major-importance test (reference card, part 1): is the controller a "data
  controller of major importance", and which tier? Show your reasoning
  (number of people in 6 months, sector).
- Flags: sensitive data, children, vulnerable users, AI or automated
  decisions, data stored outside the country.
- Is a privacy impact assessment (DPIA) mandatory? (Reference card, part 4.
  For most apps the answer is yes.)

---

SECTIONS (both modes; in AUDIT mode mark each APPLIES or N/A)

A. Data inventory (the foundation; everything else reads from it)
   - Complete docs/DATA_INVENTORY.md from the code, schema, and services
     (use the suite's DATA_INVENTORY template if available). For every personal
     data field: what it is, why it is needed, lawful basis, sensitive or
     not, where it is stored (service and region), who can see it, which
     third parties receive it, how long it is kept, and how it is deleted.
   - Include the hidden copies: logs, error tracking, analytics, session
     replay, backups, emails and SMS, exports and PDFs, AI prompts and
     responses, dev and test databases.
   - AUDIT: flag every field the code collects that isn't in the inventory,
     and every inventory entry the code no longer uses.

B. Minimisation and retention
   - Every field is needed for a stated purpose; flag "nice to have" data
     (date of birth, full address, ID numbers) that the app doesn't need.
   - A retention period for each data type, with automatic deletion or
     anonymisation where practical (e.g. a scheduled job).
   - No personal data in logs or error reports (scrub request bodies,
     emails, phone numbers, tokens).
   - No real user data in development or test environments.

C. Lawful basis and consent
   - A lawful basis for each purpose (consent, contract, legal obligation,
     vital interest, public interest, legitimate interest). If legitimate
     interest is used, a short legitimate interest assessment.
   - Consent is captured where the law requires it (reference card, part 7):
     marketing, sensitive data, children, transfers abroad without an
     adequacy decision, fully automated decisions with significant effect.
   - Consent is specific and unbundled (not hidden in terms of service), with
     no pre-ticked boxes, and refusing doesn't block unrelated features.
   - Consent records are stored: who, when, what they agreed to, and which
     version of the notice they saw.
   - Withdrawing consent is as easy as giving it (e.g. a toggle in settings,
     an unsubscribe link in every marketing message).

D. Notices
   - A privacy policy that contains every item in reference card part 8 and
     matches the inventory exactly, written in plain language for these
     users.
   - Linked where data is collected: sign-up, forms, checkout, footer.
   - Websites: privacy and cookie notices from the homepage.
   - Mobile apps (reference card part 5): a privacy policy inside the app,
     and a privacy statement shown before install (store listing and
     onboarding) with all the listed items.
   - App Store privacy labels and the Google Play Data Safety form match
     what the app really collects, including third-party SDKs.

E. Cookies and trackers (websites and web apps)
   - List every cookie, local storage key, pixel, SDK, and third-party
     script (analytics, ads, chat widgets, session replay, embedded videos
     and maps). Classify each as NECESSARY (security, network stability,
     accessibility) or NOT. Analytics and advertising are NOT necessary.
   - Non-necessary trackers do not load until the user clicks Accept, and
     stop when the user withdraws.
   - The banner meets reference card part 6: visible without scrolling, not
     a strip at the bottom, clear Accept AND Reject choices, purposes
     listed, who is responsible, and how to change your mind later.

F. User rights
   - Self-service where practical: view and export my data (in a common
     format such as JSON or CSV), correct my details, delete my account.
   - Deletion really deletes: database rows, auth records, uploaded files,
     email/SMS marketing lists, analytics identities, and third parties.
     State what happens to backups (e.g. expires within N days).
   - A visible privacy contact, a process to answer requests and formal
     complaints within 30 days, and information about the right to
     complain to the NDPC.
   - Requests are verified, so an attacker can't download or delete someone
     else's data by asking.

G. Third parties, processors, and cross-border transfers
   - A table of every service that receives personal data: what it receives,
     where it stores it (country/region), whether a data processing
     agreement (DPA) exists or is available, and (for AI providers) its data
     retention and model-training settings.
   - Data stored or processed outside Nigeria is a cross-border transfer:
     document the basis (reference card part 11), prefer regions and
     providers with clear terms, and include transfers in the DPIA.
   - Client projects: a DPA between me (processor) and the client
     (controller) covering the items in reference card part 10.

H. Sensitive data, children, and vulnerable users
   - Sensitive data (health, mental health, finances, BVN/NIN and other ID
     numbers, religion, ethnicity, biometrics, precise location) has
     explicit consent, the tightest access rules, and extra protection where
     a leak would be severe (e.g. field-level encryption for counselling
     notes).
   - Access to sensitive records is logged (who viewed what, when).
   - Under-18s: guardian consent and a reasonable age check. If children are
     not intended users, say so in the notice and handle discovered child
     accounts.

I. AI and automated decisions (privacy angle)
   - What personal data is sent to AI providers; can it be removed or
     masked first; provider retention and training settings; region.
   - Decisions that significantly affect people (approvals, scoring,
     eligibility) are not made by AI alone: a human can review, and users
     are told and can contest.
   - Reference card part 12 for the extra duties when AI processes personal
     data. Output quality and safety belong to P10.

J. Security measures the law expects (existence check; depth is P08)
   - Access control on all personal data, encryption in transit (HTTPS) and
     at rest (provider default, plus field-level encryption where needed),
     MFA on admin accounts, backups, and a written schedule for updates,
     vulnerability checks, and access reviews.
   - Flag gaps here and point to P08 for testing.

K. Breach readiness (legal side; the runbook lives in P13)
   - A written procedure exists that: starts the 72-hour clock when the
     owner becomes aware, decides whether affected users must be told
     immediately, and fills in the notification contents in reference card
     part 9.
   - Client projects: the DPA says I notify the client immediately.
   - The app can actually answer the questions a notification needs (what
     data, how many people, which records). If logs can't show that, it's a
     finding.

L. Paperwork and governance (I or the client must do these manually)
   Produce a checklist with status for each: NDPC registration (if major
   importance) and renewal; DPO designated; DPIA done, signed by an
   accredited DPO, and filed where mandatory; compliance audit within 15
   months of starting and yearly; Compliance Audit Returns by 31 March (UHL
   and EHL, through a licensed DPCO); semi-annual data protection report;
   internal privacy policy and staff checklist; staff training within 6
   months and then yearly (including me, if I process high-risk data as a
   sole proprietor); DPAs signed with the client and processors.

---

REFERENCE CARD: NIGERIA (NDPA 2023 + GAID 2025)
Summarised from the official texts; article numbers are GAID unless marked
"s." (NDPA section). Verify before relying on fees and dates.

1. Major importance (NDPC Guidance Notice, Dec 2024). A controller or
   processor is of major importance if it processes personal data of more
   than 200 people in 6 months, OR operates in: aviation, communication,
   education, electric power, export/import, financial, health,
   hospitality, insurance, oil and gas, tourism, e-commerce, or public
   service.
   - Ordinary-High (OHL): 200-999 people in 6 months; also primary and
     secondary schools, training providers, primary health centres, labs,
     small hotels. Fee N10,000; renew yearly; no audit returns filing.
   - Extra-High (EHL): 1,000-4,999 people; also government agencies,
     microfinance and mortgage banks, universities, secondary and tertiary
     hospitals. Fee N100,000.
   - Ultra-High (UHL): 5,000+ people; also commercial banks, telcos,
     insurers, multinationals, payment gateways, fintechs, public social
     media and email apps. Fee N250,000.
   - Not of major importance: personal or household use; small traders
     (fewer than 15 employees) keeping only routine contact details. Exempt
     from registration: community-based and faith-based associations,
     embassies, courts, multigovernmental organisations.
2. Duties for every controller (Art. 7): compliance audit within 15 months
   of starting, then yearly; privacy policy published; privacy and cookie
   notices from the website homepage; notices wherever processing happens,
   following app store privacy rules; internal privacy policy and checklist
   for staff, vendors, and contractors; security monitoring schedule (Art.
   29); training schedule; semi-annual data protection report; DPIA where
   required; breach notification; updated processor agreements; systems
   that make access, correction, and portability easy; a clearly explained
   complaints process.
3. Major importance only: designate a DPO (Art. 7(i), 11). UHL/EHL file
   Compliance Audit Returns through a licensed DPCO by 31 March each year
   (Art. 7(c), 10); organisations set up after 12 June 2023 file first
   within 15 months of starting. Filing fees N100,000-N1,000,000 by tier and
   size; late filing adds 50%.
4. DPIA (s.28; Art. 28). Mandatory and filed with the NDPC for: profiling
   or scoring; automated decisions with significant effects; systematic
   monitoring; sensitive data; vulnerable people; innovative technology
   with significant privacy risk; software that enables communication with
   users; digital financial services; health care; e-commerce; education
   records; hospitality; public CCTV; cross-border transfers. Done BEFORE
   processing starts, vetted and signed by an NDPC-accredited DPO, using
   the GAID Schedule 4 template, and must show privacy by design and by
   default.
5. Software and mobile apps (Art. 31). Before deployment: a DPIA; privacy
   by design; app store data security rules followed; a privacy policy
   inside the software; a privacy statement before installation listing:
   the types of personal data, the lawful purpose, that only data needed
   for that purpose is processed, the technical measures (e.g. encryption),
   that a DPIA found the use unlikely to compromise privacy, an in-app
   privacy support link, how to disable or uninstall, and how to complain
   to data protection authorities.
6. Cookies (Art. 7(l), 19). Consent is required for all cookies and similar
   trackers except NECESSARY ones (security, network stability,
   accessibility). Non-necessary ones need an explicit Accept/Reject (yes/no)
   choice. The banner must be conspicuous: seen without scrolling; a bottom
   strip that can be ignored counts as a lack of transparency. Tell users
   what the cookies are for, who is responsible, and how to withdraw.
   Pre-selected cookies are a listed complaint category.
7. Consent (Art. 17-18). Required for: direct marketing; sensitive data;
   further use incompatible with the original purpose; children's data;
   transfers to countries without an NDPC adequacy decision; decisions made
   solely by automated processing with significant effects. Keep consent
   records; withdrawal as easy as giving; refusal must not be held against
   the user; always a clear accept-or-decline option.
8. Privacy notice contents (s.27; Art. 27(3)): name of the controller;
   lawful basis; types of data; purpose; means of processing; third parties
   with access and why; user rights; a contact for prompt internal
   remediation; the right to complain to the NDPC. A notice is not a
   request for consent.
9. Breach (s.40; Art. 33). Notify the NDPC within 72 hours of becoming
   aware of a breach likely to risk people's rights. Notify affected users
   immediately where the risk is high (fraud, identity theft, sensitive
   exposure). The notification covers: what happened; when; what data;
   risk of harm; estimated number of people at real risk; steps taken to
   reduce harm; steps taken to notify people; and a named contact. Also: the
   Cybercrimes (Amendment) Act 2024 requires reporting cyber incidents to
   ngCERT within 72 hours.
10. Processors (s.29; Art. 34). A processor works under a Data Processing
    Agreement covering: obligations of both parties, names and addresses,
    purpose, location of processing, scope, lawful basis, responsibilities,
    technical and organisational measures, DPIA outcome, risks, evidence of
    NDPC compliance, confidentiality, tenure, restrictions, indemnity,
    insurance, force majeure, and dispute resolution. Each party is
    accountable for the third parties it engages. Sole proprietors doing
    high-risk processing must be trained in data protection.
11. Cross-border (NDPA Part VIII; Art. 45). Transfers out of Nigeria need an
    adequacy decision or another recognised basis; consent is required for
    transfers to countries without an adequacy decision (Art. 18(1)(e)), and
    contractual clauses or binding corporate rules need NDPC approval. Most
    cloud hosting is a cross-border transfer and triggers a DPIA.
12. AI and emerging technology (Art. 43). Document the technical and
    organisational safeguards (filed with the audit returns); a DPIA that
    checks for unfair (disparate) outcomes and vulnerable users; consider
    anonymising data at collection; test in a low-risk setting first;
    monitor continuously. People have the right not to be subject to a
    decision based solely on automated processing.
13. Children (s.31). Under 18. Guardian consent and appropriate age and
    consent verification.
14. Rights and complaints (Art. 36-40). Rectification, portability, erasure
    (with listed exceptions), and complaint to the NDPC. A formal complaint
    on the NDPC's standard grievance form (SNAG) must be resolved within 30
    days or the time demanded, whichever is sooner, and the decision
    reported to the NDPC.
15. Penalties (s.48). Major importance: the higher of N10 million or 2% of
    the previous year's gross revenue. Others: the higher of N2 million or
    2%. The NDPC does enforce, including large fines on banks.

GDPR NOTE (EU/UK users; verify details)
Similar principles, plus: consent for non-essential cookies under ePrivacy
rules; records of processing activities; DPIA for high-risk processing;
breach notification to the supervisory authority within 72 hours; an EU or
UK representative if the controller has no establishment there; transfer
mechanisms for data leaving the EU/UK.

---

ADDITIONAL FINDING FIELDS (AUDIT mode, on top of AUDIT_STANDARD)
- Legal reference: the NDPA section or GAID article (or GDPR article)
- Who must act: me (build), the client/controller (decide or file), or the
  DPO/DPCO (sign off)

SELF-CHECKS I CAN DO MYSELF
- Cookie test (3 minutes): open the site in a private window and press F12,
  then Network. Reload WITHOUT touching the banner. Requests to
  google-analytics, googletagmanager, facebook, hotjar, clarity, tiktok, and
  similar mean trackers fire without consent. Click Reject, reload, and
  check again.
- Automate the same with Playwright: a fresh browser context that records
  every request and cookie before consent, after Reject, and after Accept.
  Paste the three lists into the report.
- Deletion test: create a test account, add data and a file, delete the
  account, then check the database, auth users, storage, and the email list
  for leftovers.
- Export test: request my data as a test user. Is everything in the
  inventory there, and nothing about other users?

OUTPUTS
<!-- INTEGRATED-ONLY -->
DESIGN mode:
- docs/DATA_INVENTORY.md completed
- "Privacy features to build", each with acceptance criteria, added to the
  build plan in docs/PROJECT_PLAN.md (e.g. consent capture and records,
  cookie banner, export, delete, retention job, in-app policy and
  pre-install statement)
- Decisions added to the Decisions Log (regions, processors, lawful bases)
- Client questions added to docs/CLIENT_QUESTIONS.md (registration, DPO,
  DPIA ownership, DPA)
AUDIT mode (in addition to the AUDIT_STANDARD report):
- docs/privacy/PRIVACY_NOTICE_DRAFT.md: privacy policy (and, for mobile, the
  pre-install statement) drafted from the inventory, marked DRAFT FOR
  LAWYER/DPCO REVIEW
- docs/privacy/DPIA_INPUT.md: the technical input a DPO needs: description
  of processing, data flow diagram (Mermaid), necessity, risks, measures,
  processors, transfers; structured to fit the GAID Schedule 4 template
- docs/privacy/COMPLIANCE_CHECKLIST.md: section L with current status
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
DESIGN mode: the completed data inventory, a "privacy features to build"
list with acceptance criteria, decisions taken, and questions for the
client.
AUDIT mode: the report, plus (offer to save each) a privacy notice draft
marked DRAFT FOR LAWYER/DPCO REVIEW, the technical DPIA input (description
of processing, data flow diagram, necessity, risks, measures, processors,
transfers), and the section L paperwork checklist with status.
-->

RULES
- Not legal advice: flag what needs a DPO, DPCO, or lawyer.
- Never write a notice that describes practices the app doesn't actually
  follow. A mismatched policy is itself a violation.
- Prefer removing data collection over justifying it.
- Don't wait for paperwork to build the mechanisms: consent capture, export,
  deletion, and the banner can be built now.
- Check ndpc.gov.ng (and the relevant authority for other countries) for
  anything time-sensitive.

<!-- STANDALONE-INCLUDE: _build/SAFE_CHANGE_RULES.md -->
