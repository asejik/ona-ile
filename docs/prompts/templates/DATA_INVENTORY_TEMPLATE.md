# DATA INVENTORY: [App name]

<!--
Copy to docs/DATA_INVENTORY.md. P02 starts it, P03 completes it, and every
change that touches personal data updates it (P06). The privacy notice, the
cookie banner, the DPIA input, and deletion/export features are all built
from this file, so keep it true.
Never put real personal data, passwords, or keys in this file.
-->

Last reviewed: [YYYY-MM-DD] · Controller: [me / client name] · Processor(s):
[me, if a client project] · Laws: [NDPA/GAID, GDPR, ...]

## 1. Personal data the app collects

| Data field | Who it's about | Why we need it (purpose) | Lawful basis | Sensitive? | Required or optional | Stored where (service, region) | Who can see it | Shared with | Kept for | How it's deleted |
|------------|----------------|--------------------------|--------------|------------|----------------------|--------------------------------|----------------|-------------|----------|------------------|
| e.g. email | Users | Sign-in, receipts | Contract | No | Required | Supabase Auth, [region] | The user; admins | Email provider | Until account deletion + 30 days | Account deletion job |
| e.g. session notes | Clients of counsellors | Continuity of care | Consent | Yes (health) | Required | Supabase DB, [region], field-encrypted | Assigned counsellor only | None | [period] | [method] |

Lawful bases: consent, contract, legal obligation, vital interest, public
interest, legitimate interest (attach a short assessment if used).

## 2. Hidden copies of personal data

| Place | What personal data ends up there | Can it be avoided or masked? | Kept for |
|-------|----------------------------------|------------------------------|----------|
| Server/function logs | | | |
| Error tracking | | | |
| Analytics / session replay | | | |
| Backups | | | |
| Emails, SMS, WhatsApp messages | | | |
| Exports, PDFs, spreadsheets | | | |
| AI prompts and responses | | | |
| Dev / test databases | Should be none (use fake data) | | |

## 3. Third parties that receive personal data (processors)

| Service | What it receives | Purpose | Data location (country/region) | DPA available/signed? | Retention and training settings (AI providers) | Transfer basis if outside Nigeria |
|---------|------------------|---------|-------------------------------|-----------------------|-----------------------------------------------|-----------------------------------|
| e.g. Supabase | All app data | Database, auth, storage | [region] | [yes/no] | n/a | [basis] |
| e.g. Paystack | Name, email, amount | Payments | | | n/a | |

## 4. Cookies, local storage, pixels, and SDKs

| Name / script | Set by (first or third party) | Purpose | Necessary? (security, network stability, accessibility only) | Loads before consent? (must be NO if not necessary) | Lifetime |
|---------------|-------------------------------|---------|--------------------------------------------------------------|------------------------------------------------------|----------|

## 5. Consent records

Where consent is stored (table/field), what is recorded (who, when, what
was agreed, notice version), and how withdrawal works.

## 6. Special categories

- Sensitive data handled: [list, or "none"]
- Children (under 18): [not intended / intended, with guardian consent and age check: describe]
- Automated decisions with significant effects: [none / describe, with human review]

## 7. Change log

| Date | Change | Made in (task/PR) | Privacy re-check needed? |
|------|--------|-------------------|--------------------------|
