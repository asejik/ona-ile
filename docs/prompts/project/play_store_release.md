# PLAY: Google Play Release for a Web-Tech Game (supplement)

Stage: Pre-release | Run: alongside P07 before the first closed-test upload; again before each major update and each August (target API deadline) | Output: docs/audits/play_store_release_[YYYY-MM-DD].md report
Follow docs/prompts/AUDIT_STANDARD.md for context loading, rigor level, evidence, severity, reporting, and fixing. Fixes go through P06.

ROLE
Act as an Android release engineer who has shipped Capacitor/WebView games to Google Play from a personal developer account.

OWNS: Play Console account and testing rules, build targets and signing, store policy declarations (Data safety, account deletion, target audience, content rating), Play Billing integration rules, WebView game performance on real Android devices, the store listing, and keeping up with policy.
NOT HERE:
- What personal data is collected and the privacy policy wording: P03.
- Purchase correctness logic (entitlements, restores, refunds): P07, payments.
- Secrets, auth, leaderboard abuse: P08.
- The go/no-go decision: P14.
- Web landing page discoverability: P11.

TOOLS FIRST
- `npx cap doctor`, `npx cap sync android`
- `./gradlew bundleRelease`, `bundletool build-apks`
- Android Studio: Profiler and App Inspection
- `chrome://inspect` for WebView devtools on a device
- Play Console: Pre-launch report, Android vitals, policy status
- `aapt2 dump badging` to confirm targetSdk, versionCode and the app label

SECTIONS (mark N/A where they don't apply)

1. Account and testing track
   - Personal or organisation account? A new personal account must run a closed test with at least 12 opted-in testers for 14 continuous days before it can apply for production access. Recruit testers early.
   - The developer name and contact email on the listing are ones you're happy to publish.
   - MFA is on for the Google account that owns the Console. Any second user has the least role they need.

2. Build targets and packaging
   - targetSdkVersion meets the current requirement. Since 2026-08-31, new apps and updates must target API 36 (Android 16). It rises every year.
   - minSdk is chosen deliberately for low-end Nigerian handsets. Note the WebView version that minSdk implies.
   - Uploaded as an Android App Bundle (AAB). versionCode increases on every build. The release build has `debuggable=false`, and WebView debugging is off in release.
   - The app label and launcher name render the diacritics in "Ọ̀nà Ilé", or a fallback "Ona Ile" is chosen on purpose.
   - Download size: stay well under the 200 MB base-module limit. Prefer small zone files, and use Play Asset Delivery only if needed.

3. Signing and keys
   - Play App Signing is enrolled. The upload key lives outside the repo, is backed up in two places, and its password is in a password manager.
   - No keystore, `google-services.json` with live secrets, or service-account JSON is committed (cross-check with P08).

4. Permissions and manifest
   - Only the permissions the game needs: INTERNET, probably nothing else. No location, contacts or storage permissions.
   - Capacitor plugins audited: remove any that add permissions you don't use.
   - `usesCleartextTraffic` is false. Every network call uses HTTPS.

5. Store policy declarations
   - **Data safety form** matches what the build actually sends: analytics SDK, crash reporter, leaderboard and account data. Check against network traffic, not the SDK's marketing page. Take the inputs from the P03 inventory.
   - **Account deletion:** if players can create an account, deletion must be requestable in the app and through a web link given in the Console. It deletes the associated data; deactivation doesn't count.
   - **Privacy policy URL** is live, public and matches the app.
   - **Target audience and content:** declare the age groups. If any are under 13, Families policy applies (approved ad and analytics SDKs only, stricter data rules), so re-triage.
   - **Content rating (IARC)** questionnaire is answered honestly: violence (collisions), crude humour, real-world references, in-app purchases.
   - **Ads declaration** says no ads (unless that changes; re-triage if so).
   - **Government or official-looking content:** depicting the police, the NYSC or the Emir's palace must not imply endorsement. Link to S2.

6. Play Billing (if in-app purchases exist)
   - Digital goods are sold only through Google Play Billing. No links or prompts to pay elsewhere inside the Android app.
   - A current Play Billing Library version (check the deprecation schedule) through a maintained Capacitor plugin.
   - Purchases are acknowledged within 3 days, or Google refunds them automatically.
   - Products and prices are set in Console for Nigeria (NGN) and other markets. Test with licence testers before release.
   - Correctness of entitlements, restores and refunds: P07 owns it. Confirm here only that the flows exist.

7. WebView game performance on real devices
   - Tested on at least one low-end Android (2–3 GB RAM, an older GPU) and one mid-range phone. Record fps, load time and memory against the PRD budgets (30 fps, 300k triangles or fewer, 150 draw calls or fewer, under 10 s load).
   - WebGL context loss is handled (backgrounding, low memory): the game recovers or shows a reload message.
   - Pausing on `visibilitychange` and app pause stops audio, timers and the challenge clock.
   - Back button behaviour is defined: it pauses, then confirms exit. It never kills a trip silently.
   - Pre-launch report: no crashes, no ANRs. Android vitals thresholds are known (crash rate and ANR rate bad-behaviour thresholds).

8. Store listing
   - Title, short description and full description, with the Yoruba name and meaning.
   - Screenshots for phone, and tablet if supported. A feature graphic. An optional trailer.
   - No real brand logos or identifiable private people in the art.
   - OSM attribution in the description (link to S2).
   - Category: Games, then Simulation or Adventure. Tags chosen.

9. Updates and upkeep
   - A release checklist: bump versionCode, a changelog, a staged rollout percentage.
   - Calendar reminders: the target API deadline each August, Play Billing Library deprecations, and policy emails sent to the Console address.

SELF-CHECK I CAN DO MYSELF
- Install the closed-test build from the Play Store link on a cheap Android phone with mobile data off. Play the first stage, put the phone to sleep for a minute, come back.
- Then open Settings, then Apps, then the game, and check that Permissions shows nothing unexpected.
- In the Play listing, read the "Data safety" section aloud. Does it describe exactly what the game does?

RULES
- Policy facts change often. Re-check every SOURCES link on the day you run this and note any differences in the report.
- Never upload a build that hasn't passed the self-check on a real device.
- Changing the Data safety form, the target audience or Billing products is a store-facing change. Confirm with the owner first.

SOURCES (checked 2026-11-07)
- Target API requirements: https://developer.android.com/google/play/requirements/target-sdk and https://support.google.com/googleplay/android-developer/answer/11926878
- Account deletion requirement: https://support.google.com/googleplay/android-developer/answer/13327111
- Testing requirement for new personal accounts: https://support.google.com/googleplay/android-developer/answer/14151465
- To check at run time (not yet re-verified this run): Data safety form help, Families policy, Play Billing Library deprecation schedule, Play Payments policy, IARC content ratings, app size limits.
