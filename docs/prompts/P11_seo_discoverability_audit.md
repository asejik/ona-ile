# P11: SEO & DISCOVERABILITY AUDIT

<!-- INTEGRATED-ONLY -->
Stage: Audit (specialist) | Run: public websites/pages only; before launch
and after URL or content structure changes
Output: docs/audits/P11_[YYYY-MM-DD].md

Follow docs/prompts/AUDIT_STANDARD.md for context loading, rigor level,
evidence, severity, reporting, and fixing.
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
For public websites/pages. Checks how well public pages can be discovered,
indexed, and previewed by search engines, social platforms, and AI search
tools.
-->

<!-- STANDALONE-INCLUDE: AUDIT_STANDARD.md -->

---

ROLE
Act as a senior technical SEO engineer. Audit how well this site's public
pages can be discovered, indexed, and previewed by search engines, social
platforms, and AI search tools. Never "confirm" anything you have not
actually checked.

OWNS: rendering for crawlers, crawling and indexing, sitemap, robots,
canonicals, on-page basics, structured data, link previews, search console
and business listing setup.
NOT HERE: page speed and Core Web Vitals fixes (P07; flag risks only),
security (P08), cookie consent rules (P03).

APPLICABILITY
- If the app has no public pages (fully behind login), or is native mobile
  only, say so and stop, except: make sure private pages are not indexed
  (section 2). App store listing optimisation is out of scope.

---

STEP 0 - CONTEXT (in addition to the standard context)
- Detect the rendering method (server-rendered, static, or client-rendered
  SPA), hosting, and production domain
- List all PUBLIC pages (should be indexed) and PRIVATE pages (dashboard,
  admin, auth, account; should NOT be indexed), including dynamic pages
  (e.g. courses, posts, profiles, listings)
- Ask me: the site's purpose (local business, SaaS/app, content site,
  organisation), target countries and languages, and whether it has a
  physical location or service area
- Client projects: ask for real business details from the client, and
  confirm that search console properties and business listings will be
  owned by the client's account, with me added as a user
- Split every check into CAN VERIFY IN CODE vs I MUST CHECK MANUALLY

TOOLS FIRST
- Raw HTML: fetch key pages with curl (what crawlers and link previews see
  before JavaScript runs)
- Rendered page: open the same pages with Playwright to compare what
  appears after JavaScript runs
- Fetch /robots.txt and the sitemap and paste them

---

AUDIT SECTIONS

1. Rendering (check first; it affects everything else)
   - What does the raw HTML contain before JavaScript runs (e.g. curl
     output or View Page Source for key pages)?
   - Are titles, meta descriptions, canonicals, Open Graph tags, and
     structured data present in that raw HTML?
   - If not (common in Vite/React SPAs), recommend the lightest fix:
     prerendering public pages, static meta tags per route, or moving public
     pages to server rendering

2. Crawling and Indexing
   - robots.txt: exists, allows public pages, references the sitemap,
     doesn't block CSS/JS needed for rendering, and doesn't list secret
     paths (the file is public)
   - Blocking a page in robots.txt does not reliably remove it from search
     results; use noindex (and don't block pages whose noindex must be seen)
   - XML sitemap: all public pages (including dynamic ones), no private
     pages, absolute URLs on the production domain, accurate lastmod dates,
     updates when content changes
   - Private pages have noindex and are excluded from the sitemap
   - No leftover noindex on public production pages
   - Preview and staging deployments (including per-branch previews) are
     noindexed
   - Missing pages return a real 404 status, not 200 with a "not found"
     screen

3. Canonicals and URL Consistency
   - Every public page has a self-referencing, absolute canonical URL
   - No pages wrongly canonicalised to the homepage
   - http/https, www/non-www, and trailing-slash variants all redirect
     permanently to one preferred version that matches the canonicals

4. On-Page Basics
   - Unique, descriptive title and meta description per public page
   - One clear H1 per page, logical heading order
   - Image alt text, descriptive URLs, internal links between related pages
   - hreflang tags if the site has multiple languages (e.g. English and
     Yoruba versions)

5. Structured Data
   - Choose schema types that match what the site actually is (e.g.
     Organization, WebSite; LocalBusiness only for a real location or
     service area; SoftwareApplication, Course, Article, Event, or FAQPage
     only where appropriate). Explain each choice.
   - All structured data must match visible page content and real facts.
     Never invent reviews, ratings, addresses, opening hours, or prices.
   - Valid JSON-LD with no errors or warnings

6. Social and Link Previews
   - Open Graph and Twitter Card tags on every public page: title,
     description, image, URL
   - Images: absolute URLs, 1200x630, reasonably small file size, unique
     per key page where practical
   - Previews work without JavaScript (WhatsApp, LinkedIn, and X don't run
     it)
   - After fixes, platforms may keep showing cached old previews; tell me
     how to refresh them

7. Cookie Banner and Interstitials
   - A legally required cookie notice (Nigeria's GAID requires a
     conspicuous one) is fine for search: Google has said legally required
     notices are not treated as intrusive interstitials. Check it doesn't
     hide the page content or meta tags from crawlers, and that the content
     is in the HTML behind it.

8. AI Search Visibility (optional)
   - Clear, well-structured, factual content on key pages; site indexed by
     Bing (which some AI search tools rely on)
   - llms.txt is a proposed standard with uncertain impact; mention it as
     optional only

9. Search Engines and Business Listings (I MUST CHECK MANUALLY)
   Give me step-by-step checklists for:
   - Google Search Console: verify the domain, submit the sitemap, check
     indexing, use URL Inspection on key pages
   - Bing Webmaster Tools: verify (can import from Search Console), submit
     the sitemap; consider IndexNow for instant update notifications
   - Google Business Profile (local businesses only): create or claim it,
     keep name, address, and phone number consistent with the website
   Check the code for existing verification tags or files.

---

ADDITIONAL FINDING FIELD (on top of AUDIT_STANDARD)
- Verification tool: the free tool to use and the exact URL to test, e.g.
  Rich Results Test, Schema Markup Validator, Search Console URL Inspection,
  LinkedIn Post Inspector, Facebook Sharing Debugger (also affects WhatsApp
  previews)

SEVERITY FOR SEO
- HIGH: pages can't be indexed, public pages wrongly de-indexed, private
  pages exposed in search, or link previews broken
- MEDIUM: weakens rankings or preview quality
- LOW: polish

ADDITIONAL REPORT SECTIONS
- MANUAL CHECKLIST for me (search consoles, business profile, preview
  refresh steps)

RULES
- Never add fake or unverifiable structured data.
- After fixes, re-check the raw HTML of key pages and paste the output.

---

THIRTY-SECOND CHECK I CAN DO MYSELF
Open a public page, right-click, choose "View Page Source" (not "Inspect"),
and search for the page title and og:image. If they're missing, crawlers and
WhatsApp can't see them either, and section 1 is the top priority.

<!-- STANDALONE-INCLUDE: _build/SAFE_CHANGE_RULES.md -->
