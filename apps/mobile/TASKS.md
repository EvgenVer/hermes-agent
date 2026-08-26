# TASKS — Hermes Mobile
<!-- Approved rolling-wave execution checklist. Active contains only atomic
     executable work. Later implementation phases remain blocked decomposition
     gates until contracts and file paths exist. -->

## Active

### Wave 1 — establish the current upstream baseline

- [x] HM-001 Fetch pruned origin and upstream references — files: Git references only; no working-tree files · verify: git fetch --prune origin and git fetch --prune upstream both succeed; origin/main, upstream/main, and feat/mobile-app resolve to commits · dep: none · parallel: no · result: origin and targeted upstream main fetches succeeded; all required refs resolve
- [x] HM-002 Decide whether local main can fast-forward to upstream/main — files: apps/mobile/docs/upstream-baseline.md · verify: evidence records the three SHAs, ahead/behind counts, merge-base, dirty-state check, and an explicit fast-forward-safe or blocked decision · dep: HM-001 · parallel: no · result: fast-forward-safe; see docs/upstream-baseline.md
- [x] HM-003 Fast-forward local main to upstream/main when HM-002 records fast-forward-safe — files: local main Git reference only · verify: git rev-parse main equals git rev-parse upstream/main and git status --short is empty · dep: HM-002 · parallel: no · result: local main fast-forwarded to 03c97d984b7259154545314d04d1c6093b6fcbe4
- [x] HM-004 Merge upstream/main into feat/mobile-app without rebasing or rewriting shared history — files: Git merge commit and files changed by the bounded upstream diff · verify: git merge-base --is-ancestor upstream/main HEAD succeeds; git diff --check succeeds; checks for upstream-touched packages pass · dep: HM-003 · parallel: no · result: conflict-free merge 1c77f75207; diff-check and Python runtime compilation passed; node/npm checks unavailable on host
- [ ] HM-005 Reconcile mobile planning references with the merged Hermes baseline — files: apps/mobile/SPECIFICATION.md, apps/mobile/specs/stage-1-agent-control.md, apps/mobile/PLAN.md, apps/mobile/TASKS.md, apps/mobile/docs/upstream-baseline.md · verify: baseline document records the merged HEAD; every referenced Hermes route, RPC method, and source path still exists or is explicitly marked as a gap · dep: HM-004 · parallel: no

### Wave 2 — establish the Stage 1 server contract

- [ ] HM-006 Define the API-matrix schema and coverage index — files: apps/mobile/docs/stage-1-api-matrix.md · verify: the document defines requirement ID, Desktop source, REST or JSON-RPC contract, authentication, profile/session scope, events, errors, capability status, and test-evidence columns · dep: HM-005 · parallel: no
- [ ] HM-007 Map connection, authentication, status, version, and WebSocket-ticket contracts — files: apps/mobile/docs/stage-1-api-matrix.md section Connection and compatibility · verify: every connection requirement has concrete request/response/event/error references and an existing, extend, or new classification · dep: HM-006 · parallel: no
- [ ] HM-008 Map profile, identity, avatar, SOUL, model, and provider contracts — files: apps/mobile/docs/stage-1-api-matrix.md section Agent administration · verify: every listed administration action has auth, profile scope, validation, refresh semantics, and an existing, extend, or new classification · dep: HM-007 · parallel: no
- [ ] HM-009 Map skills, tools, toolsets, MCP, and routine contracts — files: apps/mobile/docs/stage-1-api-matrix.md section Capabilities and routines · verify: every mutation identifies secret handling, enablement/test semantics, authoritative refresh, and an existing, extend, or new classification · dep: HM-008 · parallel: no
- [ ] HM-010 Map session history, canonical Bot Chat, streaming, and attachment contracts — files: apps/mobile/docs/stage-1-api-matrix.md section Agent interaction · verify: session identity, pagination, stream ordering, reconnect/replay, attachment limits, and error contracts are explicit · dep: HM-009 · parallel: no
- [ ] HM-011 Map approval, clarification, sudo, secret, interrupt, steer, and queue contracts — files: apps/mobile/docs/stage-1-api-matrix.md section Interactive requests and controls · verify: correlation IDs, expiry, masking, cancellation, single-submission, reconnect, and stale-target behavior are explicit · dep: HM-010 · parallel: no
- [ ] HM-012 Map server health, logs, restart, device registration, push, and inbox contracts — files: apps/mobile/docs/stage-1-api-matrix.md section Operations and notifications · verify: owner scope, redaction, pagination, restart lifecycle, event deduplication, expiry, and sensitive-payload prohibitions are explicit · dep: HM-011 · parallel: no
- [ ] HM-013 Close Stage 1 matrix coverage and classify every server gap — files: apps/mobile/docs/stage-1-api-matrix.md · verify: every user-facing requirement in apps/mobile/SPECIFICATION.md and every scenario in apps/mobile/specs/stage-1-agent-control.md maps to at least one matrix row; no TBD or unlabelled assumption remains · dep: HM-012 · parallel: no

### Wave 3 — vet the dependency decisions

- [ ] HM-014 Audit current @hermes/shared transport code for React Native portability — files: apps/mobile/docs/dependencies/hermes-shared.md · verify: imported platform APIs, package exports, WebSocket injection points, Desktop consumers, test coverage, required edits, and a reuse or isolate decision are recorded · dep: HM-013 · parallel: yes
- [ ] HM-015 Vet the coupled Expo, React Native, and React runtime set — files: apps/mobile/docs/dependencies/expo-runtime.md · verify: registry identity, official compatibility table, maintenance, license, scripts, exact compatible versions, npm-workspace impact, and accept or reject decision are recorded · dep: HM-013 · parallel: yes
- [ ] HM-016 Vet Expo Router and the Android build/configuration path — files: apps/mobile/docs/dependencies/expo-router-build.md · verify: registry identity, maintenance, license, CNG/prebuild behavior, Android API 31/36/37 compatibility, build commands, risks, and accept or reject decision are recorded · dep: HM-013 · parallel: yes
- [ ] HM-017 Vet SecureStore and LocalAuthentication as one credential-security bundle — files: apps/mobile/docs/dependencies/credential-security.md · verify: registry identity, maintenance, license, Android Keystore behavior, biometric enrollment changes, backup exclusions, failure modes, and accept or reject decision are recorded · dep: HM-013 · parallel: yes
- [ ] HM-018 Vet Expo SQLite for redacted snapshots and migrations — files: apps/mobile/docs/dependencies/sqlite.md · verify: registry identity, maintenance, license, supported migration/test APIs, Android compatibility, encryption limitations, and accept or reject decision are recorded · dep: HM-013 · parallel: yes
- [ ] HM-019 Vet Expo Notifications, Expo Push Service, and the existing Hermes outbound HTTP stack — files: apps/mobile/docs/dependencies/notifications-push.md · verify: client/server package identities, maintenance, licenses, provider authentication, secret handling, payload limits, delivery semantics, existing-stack sufficiency, rollback, and accept or reject decisions are recorded · dep: HM-013 · parallel: yes
- [ ] HM-020 Vet TanStack Query and NetInfo as one connectivity-state bundle — files: apps/mobile/docs/dependencies/connectivity-state.md · verify: registry identity, maintenance, licenses, React Native compatibility, persistence/retry semantics, offline limitations, and accept or reject decisions are recorded · dep: HM-013 · parallel: yes
- [ ] HM-021 Vet DocumentPicker and ImagePicker as one attachment bundle — files: apps/mobile/docs/dependencies/attachments.md · verify: registry identity, maintenance, licenses, Android permissions, URI/content handling, size/type validation support, and accept or reject decisions are recorded · dep: HM-013 · parallel: yes
- [ ] HM-022 Vet jest-expo, React Native Testing Library, and the Android E2E harness — files: apps/mobile/docs/dependencies/testing.md · verify: registry identity, maintenance, licenses, Expo compatibility, deterministic scripts, emulator support for API 31 and 37, CI impact, and accept or reject decisions are recorded · dep: HM-013 · parallel: yes
- [ ] HM-023 Consolidate accepted versions and rejected alternatives — files: apps/mobile/docs/dependencies/README.md, apps/mobile/PLAN.md section Selected dependencies · verify: every selected dependency in PLAN links to completed evidence with an exact version policy; no rejected or unvetted package remains selected · dep: HM-014, HM-015, HM-016, HM-017, HM-018, HM-019, HM-020, HM-021, HM-022 · parallel: no

### Wave 4 — create and validate the mobile scaffold

- [ ] HM-024 Generate the approved Expo reference app outside the repository — files: apps/mobile/docs/scaffold-generation.md · verify: the pinned generator/version and command reproduce in a temporary directory; generated runtime versions match HM-023; no repository source or toolkit file changes · dep: HM-023 · parallel: no
- [ ] HM-025 Classify the reference scaffold files for repository adoption — files: apps/mobile/docs/scaffold-inventory.md · verify: every generated file is marked copy, adapt, or omit with a reason; toolkit and approved planning files are all marked preserve · dep: HM-024 · parallel: no
- [ ] HM-026 Define the mobile workspace manifest and vetted dependency graph — files: apps/mobile/package.json · verify: package name, private flag, scripts, engines, and exact vetted dependency ranges match HM-023; npm pkg get succeeds for the workspace · dep: HM-023, HM-025 · parallel: no
- [ ] HM-027 Define the Expo application identity and Android build properties — files: apps/mobile/app.config.ts · verify: npx expo config --type public reports com.evgenver.hermesmobile, Android minimum API 31, initial compile/target API 36, English-only metadata, and no committed secret · dep: HM-026 · parallel: no
- [ ] HM-028 Define the TypeScript, Babel, Metro, and Expo environment configuration — files: apps/mobile/tsconfig.json, apps/mobile/babel.config.js, apps/mobile/metro.config.js, apps/mobile/expo-env.d.ts · verify: TypeScript resolves the app and workspace imports; Metro resolves exactly one React and React Native graph · dep: HM-026 · parallel: no
- [ ] HM-029 Create a thin Expo Router shell — files: apps/mobile/app/_layout.tsx, apps/mobile/app/index.tsx, apps/mobile/src/ui/AppScreen.tsx · verify: the root route renders one accessible placeholder screen without business logic or network access · dep: HM-027, HM-028 · parallel: no
- [ ] HM-030 Create the mobile unit/component test harness and one shell smoke test — files: apps/mobile/jest.config.js, apps/mobile/src/test/setup.ts, apps/mobile/src/__tests__/app-shell.test.tsx · verify: npm run test --workspace apps/mobile -- --runInBand passes from the repository root · dep: HM-029 · parallel: no
- [ ] HM-031 Ignore only generated Expo and Android-local artifacts — files: .gitignore · verify: git check-ignore matches .expo, apps/mobile/android/.gradle, apps/mobile/android/local.properties, and local build output while source/config files remain trackable · dep: HM-025 · parallel: yes
- [ ] HM-032 Integrate the mobile npm workspace and materialize the vetted lockfile graph — files: package.json, package-lock.json, apps/mobile/package.json · verify: npm install completes; npm ls reports one compatible React/React Native runtime; existing workspace scripts still resolve · dep: HM-026, HM-027, HM-028, HM-029, HM-030, HM-031 · parallel: no
- [ ] HM-033 Run the clean mobile scaffold quality gate — files: apps/mobile/docs/scaffold-validation.md · verify: workspace typecheck, lint, unit test, npx expo-doctor, npx expo config --type public, and git diff --check all pass with commands and results recorded · dep: HM-032 · parallel: no
- [ ] HM-034 Prove the scaffold on the Android 12 baseline emulator — files: apps/mobile/docs/scaffold-validation.md · verify: a clean API 31 emulator installs, launches, renders the shell, survives one restart, and records build/app identifiers plus evidence; no signing secret is committed · dep: HM-033 · parallel: no

## Blocked

- [ ] HM-B001 Push synchronized main to origin — blocker: HM-003 completion plus a separate Vibe Diff review and explicit approval for the outward Git operation
- [ ] HM-B002 Expand connection and credential security into atomic implementation tasks — blocker: HM-013 and HM-034 must establish exact contracts and scaffold file paths; expansion reopens the planning gate
- [ ] HM-B003 Expand required Hermes server contract gaps into atomic implementation tasks — blocker: HM-013 must classify concrete extend/new gaps; expansion reopens the planning gate
- [ ] HM-B004 Expand agent administration into atomic implementation tasks — blocker: HM-013 and HM-034 must establish exact contracts and scaffold file paths; expansion reopens the planning gate
- [ ] HM-B005 Expand agent interaction into atomic implementation tasks — blocker: HM-013 and HM-034 must establish exact contracts and scaffold file paths; expansion reopens the planning gate
- [ ] HM-B006 Expand operations and background notifications into atomic implementation tasks — blocker: HM-013, HM-019, and HM-034 must establish contracts, delivery choices, and scaffold file paths; expansion reopens the planning gate
- [ ] HM-B007 Expand integration, security, Android acceptance, and release hardening into atomic tasks — blocker: Stage 1 feature implementation must expose exact integration paths and risks; expansion reopens the planning gate
- [ ] HM-B008 Publish a GitHub Release — blocker: signed release acceptance plus separate explicit outward-facing authorization

## Discovered

<!-- Add newly discovered implementation work here. Requirement or architecture
     changes and every blocked-wave expansion must reopen the planning gate. -->

## Done

- [x] Bootstrap apps/mobile with the nested toolkit and host-repository AGENTS.md contract — verified: commit 1e412c5ae
- [x] Elicit and record DESCRIPTION.md through the grill workflow — verified: required template sections and interview coverage checked
- [x] Approve the Stage 1 planning package, com.evgenver.hermesmobile Application ID, Android 12 minimum, and Expo Push Service — verified: explicit owner approval
- [x] Audit the first TASKS.md decomposition — verified: all 44 entries had structural fields, but composite epics, directory-wide file scopes, and broad verification prevented direct execution
- [x] Approve the rolling-wave execution policy and revised atomic checklist — verified: explicit owner instruction to commit and push
