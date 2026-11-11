# DESKTOP: DESKTOP APP RELEASE & SAFETY (supplement)

Stage: Audit (supplement) | Run: before sharing a desktop app with anyone
else, and before each release; earlier (DESIGN) if the app deletes, moves,
or changes files
Output: docs/audits/desktop_[YYYY-MM-DD].md

Follow docs/prompts/AUDIT_STANDARD.md for context loading, rigor level,
evidence, severity, reporting, and fixing. Fixes go through P06.

---

ROLE
Act as a senior desktop application engineer who has shipped Windows (and
macOS) apps to non-technical users. Make sure this app can't damage the
user's machine or data, behaves well on real computers (huge drives, cloud
folders, locked files), installs and updates cleanly, and doesn't scare
users with security warnings.

OWNS: destructive-action safety, file-system edge cases, resource use on
large scans, privileges, packaging and installers, code signing and OS
trust warnings, antivirus false positives, updates, distribution, and
desktop UX basics.
NOT HERE: general code health and correctness (P07), secrets, supply chain,
and accounts (P08), personal data and telemetry consent (P03), visual design
(P05). Flag those in passing only.

MODE
- DESIGN: before or early in the build. Turn sections 1-3 into rules and
  acceptance criteria for the build.
- AUDIT: the app exists. Check everything against the code and a real
  install.

TOOLS FIRST (run what applies and paste the output)
- Build the release package exactly as users will get it.
- Install and run it in a clean environment as a standard (non-admin) user:
  Windows Sandbox (built into Windows 11 Pro, Enterprise, and Education;
  turn it on under Windows Features) or a virtual machine.
- Windows: check the signature (e.g. signtool verify /pa) and scan the
  package with Microsoft Defender. macOS: check signing and notarization
  (e.g. spctl --assess).
- Uploading a build to multi-engine scanners such as VirusTotal shares the
  file with security vendors. Only do that with builds you're happy to make
  public, and ask me first.

---

SECTIONS (mark each APPLIES or N/A)

1. Destructive actions (highest priority if the app deletes, moves,
   renames, or overwrites anything)
   - Nothing is deleted, moved, or overwritten without an explicit
     confirmation that shows exactly what will happen (count, total size,
     and the list)
   - Delete goes to the Recycle Bin (macOS: Trash) by default, using the
     OS's own API or a well-known library; permanent delete is a separate,
     clearly labelled choice
   - A dry-run or preview mode exists for bulk actions
   - Protected locations are excluded or shown as read-only: Windows,
     Program Files, ProgramData, System Volume Information, $Recycle.Bin,
     pagefile.sys, hiberfil.sys, other users' profiles, and app install
     folders (macOS: /System, /Library, other users)
   - Bulk actions can be cancelled mid-way, and a partial failure leaves a
     clear report of what was and wasn't done
   - Defaults are safe: the first run changes nothing

2. File-system reality
   - Permission-denied folders are skipped and reported, not fatal
   - Long paths (over 260 characters on Windows) work or are reported
   - Symbolic links, junctions, and other reparse points are not followed by
     default (no infinite loops, no double-counting)
   - Cloud-synced folders (OneDrive, Google Drive for desktop, Dropbox,
     iCloud): reading sizes is fine, but opening, reading, or hashing file
     contents can trigger large downloads. Detect "online-only" files and
     skip or warn.
   - Files in use or locked, network drives, removable drives that
     disappear mid-scan, and non-English or emoji file names
   - Sizes shown correctly (logical size vs size on disk; KB vs KiB stated)

3. Performance and resource use
   - Scanning runs off the UI thread; the window stays responsive; progress
     is shown; it can be cancelled
   - Memory stays bounded on very large drives (stream results; virtualised
     lists for thousands of rows)
   - No unnecessary content reads or hashing; repeat scans reuse results
     where safe
   - Laptop-friendly: no runaway CPU or disk thrashing when idle

4. Privileges
   - Runs as a standard user by default (Windows manifest: asInvoker); asks
     for admin only for a specific action that needs it, and explains why
   - No background services, startup entries, or scheduled tasks unless the
     user asked for them, and they're visible and removable in settings

5. Packaging and install
   - A normal installer or package suited to the stack (e.g. MSIX, Inno
     Setup, NSIS, or WiX; electron-builder or Electron Forge; the Tauri
     bundler; PyInstaller plus an installer), installable per user without
     admin where possible
   - Uninstall removes the app, shortcuts, startup entries, and scheduled
     tasks, and asks about user data and settings in AppData
   - The version number is visible in the app and matches the release

6. Signing and OS trust warnings
   - Unsigned or unknown apps trigger Windows SmartScreen ("Windows
     protected your PC") and macOS Gatekeeper warnings, which put off most
     users. Recommend the realistic option for me: a code-signing
     certificate or Microsoft's managed signing service on Windows, and an
     Apple Developer ID with notarization on macOS. Check current names,
     eligibility (it can depend on your country), and prices.
   - Even signed apps build SmartScreen reputation over time; don't promise
     the warning will vanish on day one
   - If it stays unsigned (e.g. a personal tool), the README tells users
     exactly what warning they'll see and how to verify the download
     (published checksum)

7. Antivirus false positives
   - Packers and one-file bundlers (e.g. PyInstaller one-file builds) are
     often flagged. Prefer one-folder builds or a proper installer, and sign
     the files.
   - If Defender flags the build, submit it to Microsoft as a false positive
     (Microsoft Security Intelligence submission portal) and note it in the
     release notes

8. Updates
   - How users get updates (built-in updater, the Microsoft Store or winget,
     or manual download), and how they learn one exists
   - Updates are downloaded over HTTPS and their signature is verified
     before installing (most updater frameworks support this; check it's
     turned on)
   - The user is asked before a restart; an update never loses unsaved work

9. Distribution
   - A trustworthy download location (e.g. GitHub Releases, the Microsoft
     Store, winget, or your own HTTPS site), with release notes and a
     checksum
   - A licence for the app, and the licences of bundled libraries allow
     redistribution

10. Data, logs, and crashes
    - What the app stores, and where (e.g. %LOCALAPPDATA%\[App]); nothing
      sensitive in plain text
    - Logs rotate and stay small; crash reports are useful
    - Anything sent off the machine (crash reports, analytics, update
      checks) is listed. File paths often contain the user's name, so
      sending them is personal data: P03 applies, and it should be opt-in.

11. Desktop UX basics
    - Keyboard navigation, sensible tab order, screen-reader names on
      controls
    - High-DPI scaling looks sharp at 125%, 150%, and 200%; dark mode
      respected if supported
    - Clear empty, scanning, error, and "nothing found" states; actions are
      undoable where possible

---

ADDITIONAL FINDING FIELD
- Repro environment: the OS version, the user type (standard or admin), and
  the folder setup used to reproduce the finding

SELF-CHECK I CAN DO MYSELF (Windows Sandbox, about 15 minutes)
1. Install the release build in Windows Sandbox (not your real profile).
2. Create a test folder with a big file, a very long path, a file that's
   open in another program, and a folder you've denied yourself access to.
3. Run the app on it: it should stay responsive, skip or report the awkward
   items, and change nothing until you confirm.
4. Delete something through the app: it should ask first and go to the
   Recycle Bin.
5. Uninstall: nothing should be left in Start menu, startup apps, or
   Program Files.

RULES
- Never test destructive features on real data: use a sandbox or VM, or a
  throwaway folder.
- Never run the app as admin to "make an error go away".

SOURCES (check again if this supplement is reused months later)
- Microsoft: SmartScreen and code-signing guidance; Windows Sandbox
  documentation; Microsoft Security Intelligence file submission; long
  path support; Files On-Demand / cloud file attributes
- Apple: Developer ID signing and notarization
- The packaging and updater framework's own docs for the stack in use
Checked: November 2026 (general guidance; confirm specifics for the stack
and date of use).
