# AGENT_RUNS — audit trail of non-trivial runs

## 2026-08-26 — materialize and validate Expo mobile scaffold
- Intent: complete the approved HM-032/HM-033 scaffold dependency, lint, and quality-gate work.
- Risk class: high · approvals: approved TASKS/PLAN; explicit user `go` for local dependency installation; no outward operation.
- Changed files: mobile manifest/config/docs/TASKS, repository root npm manifest, and root package-lock.
- Validation: npm 11.17.0 install; mobile `npm run check` → pass; `npm ls` runtime/peer tree → pass; Expo Doctor 1.20.1 → 20/20; public Expo config → pass; Metro resolver probe → pass; `git diff --check` → pass; mobile audit → 9 moderate / 8 high / 0 critical.
- Skipped checks / waivers: Android API 31 smoke skipped because this host has no Android SDK, adb, emulator, Java, or Gradle; recorded as HM-034 infrastructure blocker. No audit waiver granted.
- Outcome: HM-032 and HM-033 complete; HM-034 remains blocked. Scaffold is development-quality validated but not release-ready until the age-safe Expo/Metro dependency chain has a clean audit.

## 2026-08-26 — unblock and harden Android smoke prerequisites
- Intent: execute HM-034 after provisioning the local Android API 31 toolchain and repair the runtime failures found by the first real native launch.
- Risk class: high · approvals: explicit user `go` for local SDK/JDK downloads, SDK licenses, user environment changes, AVD creation, and native build; no outward operation.
- Changed files: root/mobile package manifests and lockfile, `apps/mobile/app.config.ts`, workspace-resolution regression test, dependency/validation docs, PLAN, and TASKS.
- Validation: official Android Command-line Tools and Microsoft OpenJDK 17 archives SHA-256 verified; API 31 AVD boots as Android 12 / SDK 31 with WHPX; first `assembleDebug` passed; CNG regenerated minSdk 31 / compile-target 36 properties; Expo Router Node-resolution regression test and full mobile check pass; ordinary workspace install dry-run passes.
- Findings: first Expo launch failed on missing `expo-router/_ctx-shared` due npm workspace hoisting; Gradle initially reported minSdk 24 despite public config 31. Both root causes are fixed and covered/documented. The final clean install/launch/restart evidence is not yet recorded.
- Security: no secrets added; current audit is 9 moderate / 9 high / 0 critical, with `nanoid` via the existing Expo Router path plus the known Expo/Metro chain; no age-safe remediation was available.
- Outcome: HM-034 is unblocked and remains in progress pending the second native build and Android shell smoke flow.

## 2026-08-26 — complete Android API 31 scaffold smoke
- Intent: finish HM-034 with a clean API 31 build/install/launch/restart check.
- Risk class: high · approvals: same explicit user `go` for local native tooling and emulator actions; no outward operation.
- Validation: `expo run:android --device hermes-api31` → `BUILD SUCCESSFUL` and APK installed; package `com.evgenver.hermesmobile`, activity `.MainActivity`, version `0.1.0` / code `1`, `minSdk=31`, `targetSdk=36`; shell screenshot verified before and after restart; force-stop removed the old PID and Metro deep-link relaunch produced a new PID and rendered shell.
- Evidence: screenshots stored outside the repository in `%LOCALAPPDATA%\\HermesMobileToolchain\\evidence`; no signing secret or generated native tree is intended for commit.
- Outcome: HM-034 complete. The existing 9 moderate / 9 high / 0 critical audit residual remains documented and release-blocking.

## 2026-09-08 — revalidate merged mobile dependency/security baseline
- Intent: complete HM-040 against merged revision `ddde04baf8da57b20fd184eda8e29d5424f0fd0a` without installing packages or applying audit fixes.
- Risk class: low read-only audit; advisory lookup sent only package names and locked versions; no secrets or package contents were sent.
- Validation: parsed npm lockfile v3; walked the mobile production dependency graph (664 reachable nodes); checked 27 direct mobile entries; confirmed one React `19.2.7` and one React Native `0.86.2`; compared installed package-lock metadata; queried npm bulk advisories; `pnpm audit` correctly refused because no `pnpm-lock.yaml` exists.
- Findings: 9 advisory/path matches affect mobile production (6 high, 3 moderate, 0 critical) through `nanoid`, `@xmldom/xmldom`, `image-size`, `decode-uri-component`, and `uuid`; nested `nanoid@3.3.17` copies remain despite the existing override; the only installed-vs-lock mismatch is unrelated `apps/desktop` `0.17.0` versus `0.17.2`.
- Outcome: HM-040 complete. High findings remain a release blocker; no override, install, lockfile rewrite, or audit-fix was performed. HM-B009 owns separately authorized remediation and fresh native validation.
