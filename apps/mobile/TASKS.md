# TASKS — Hermes Mobile
<!-- Approved atomic execution checklist. Dependency and risk gates remain active. -->

## Active

- [ ] Synchronize the fork with current upstream Hermes and resolve conflicts without rewriting shared history — files: repository-wide only where upstream changed · verify: origin branch contains approved upstream base and clean status · dep: plan approval · parallel: no
- [ ] Build the Stage 1 Desktop-to-server contract matrix for every agreed action — files: apps/mobile/docs/stage-1-api-matrix.md · verify: each action names canonical route/RPC, auth, scope, events, errors, and server gap · dep: upstream sync · parallel: no
- [ ] Vet the proposed Expo/React Native runtime and testing dependencies — files: apps/mobile/PLAN.md, dependency review evidence · verify: registry existence, maintenance, license, scripts, versions, and monorepo compatibility checked · dep: contract matrix · parallel: yes
- [ ] Vet any server-side push dependency or confirm the existing HTTP stack is sufficient — files: apps/mobile/PLAN.md, dependency review evidence · verify: provider auth, license, maintenance, secret handling, and rollback checked · dep: push provider decision · parallel: yes
- [ ] Scaffold the Expo TypeScript application without overwriting toolkit or planning files — files: apps/mobile/package.json, apps/mobile/app.json, apps/mobile/tsconfig.json, apps/mobile/app/, apps/mobile/src/ · verify: Android development build launches · dep: dependency vetting and application ID decision · parallel: no
- [ ] Add mobile workspace scripts and root workspace integration — files: package.json, package-lock.json, apps/mobile/package.json · verify: npm workspace resolves one mobile React Native graph and existing workspaces remain checkable · dep: scaffold · parallel: no
- [ ] Define runtime-parsed Hermes REST, JSON-RPC, capability, and error contracts — files: apps/mobile/src/api/contracts/, apps/mobile/src/domain/errors/ · verify: parser tests accept fixtures and reject malformed/redacted violations · dep: contract matrix and scaffold · parallel: yes
- [ ] Make required @hermes/shared transport utilities platform-neutral — files: apps/shared/src/json-rpc-gateway.ts, apps/shared/src/websocket-url.ts, apps/shared/src/*.test.ts · verify: shared checks and Desktop transport tests pass with injected native adapters · dep: contract matrix · parallel: yes
- [ ] Implement Server URL normalization and safe transport policy — files: apps/mobile/src/features/connection/, apps/mobile/src/api/ · verify: URL, redirect, HTTPS/WSS, certificate, and wrong-service tests pass · dep: runtime contracts · parallel: yes
- [ ] Implement dashboard authentication and short-lived WebSocket ticket handling — files: apps/mobile/src/api/auth/, apps/mobile/src/features/connection/ · verify: valid, invalid, expired, and revoked credential contract tests pass with no token logging · dep: safe transport · parallel: no
- [ ] Implement Android Keystore credential storage and disconnect-and-forget — files: apps/mobile/src/storage/credential-vault.ts, apps/mobile/src/features/connection/ · verify: device test proves persistence, deletion, and no credential in SQLite/logs · dep: scaffold and authentication · parallel: no
- [ ] Implement optional biometric application locking — files: apps/mobile/src/platform/biometrics/, apps/mobile/src/features/lock/ · verify: success, cancel, unavailable, unenrolled, and enrollment-change device tests pass · dep: credential vault · parallel: yes
- [ ] Add the versioned mobile capability endpoint — files: hermes_cli/web_routers/mobile.py, hermes_cli/web_server.py, tests/dashboard/test_mobile_api.py · verify: authenticated capability/version tests pass and secrets are absent · dep: contract matrix · parallel: yes
- [ ] Implement capability handshake and incompatible-server gating — files: apps/mobile/src/features/connection/, apps/mobile/src/api/mobile.ts · verify: required-capability mismatch blocks mutations and explains remediation · dep: mobile capability endpoint and authentication · parallel: no
- [ ] Implement the redacted SQLite snapshot schema and migrations — files: apps/mobile/src/storage/database/, apps/mobile/src/storage/cache-policy.ts · verify: migration, redaction, expiry, clear, and corrupt-cache tests pass · dep: scaffold and runtime contracts · parallel: yes
- [ ] Implement lifecycle-aware REST/JSON-RPC connection and bounded reconnect — files: apps/mobile/src/api/, apps/mobile/src/domain/connection/ · verify: resume, duplicate event, expired ticket, server restart, and profile-switch race tests pass · dep: capability handshake and shared transport · parallel: no
- [ ] Implement the global locked/connecting/online/stale/offline application shell — files: apps/mobile/app/, apps/mobile/src/ui/, apps/mobile/src/features/connection/ · verify: component tests cover every connection and cache state · dep: reconnect, cache, and biometric gate · parallel: no
- [ ] Implement profile list, create, and clone flows — files: apps/mobile/src/features/profiles/ · verify: component/contract tests create exactly one profile and refresh authoritative state · dep: application shell · parallel: yes
- [ ] Implement profile rename and confirmed deletion flows — files: apps/mobile/src/features/profiles/ · verify: default/named profile rules, destructive confirmation, and ambiguous result tests pass · dep: profile list · parallel: no
- [ ] Implement identity, description, avatar, and SOUL editing — files: apps/mobile/src/features/agent-identity/ · verify: dirty-state, validation, upload, save, conflict, and refresh tests pass · dep: profile list · parallel: yes
- [ ] Implement model and provider selection — files: apps/mobile/src/features/models/ · verify: option loading, validation, impact confirmation, failure, and authoritative refresh tests pass · dep: profile list and runtime contracts · parallel: yes
- [ ] Implement skills and tools/toolsets administration — files: apps/mobile/src/features/capabilities/ · verify: enable/disable, unavailable item, stale form, and refresh tests pass · dep: profile list and runtime contracts · parallel: yes
- [ ] Implement MCP listing, configuration, authentication status, test, and enablement — files: apps/mobile/src/features/mcp/ · verify: masked secret, auth cancellation, server test, failure, and refresh tests pass · dep: profile list and runtime contracts · parallel: yes
- [ ] Implement profile-scoped routine listing and editor — files: apps/mobile/src/features/routines/ · verify: create/edit/toggle/run/delete, schedule validation, profile scope, and ambiguity tests pass · dep: profile list and runtime contracts · parallel: yes
- [ ] Implement canonical Bot Chat resolution and history/resume — files: apps/mobile/src/features/chat/ · verify: one canonical session per profile, pagination, resume, and profile-switch race tests pass · dep: reconnect and profile list · parallel: no
- [ ] Implement streaming messages and tool progress rendering — files: apps/mobile/src/features/chat/, apps/mobile/src/ui/chat/ · verify: ordered replay, partial/final transitions, error, and reconnect tests pass · dep: canonical Bot Chat · parallel: no
- [ ] Implement supported attachment selection and upload — files: apps/mobile/src/features/chat/attachments/ · verify: type/size validation, cancellation, upload failure, and message association tests pass · dep: canonical Bot Chat · parallel: yes
- [ ] Implement approval, clarification, sudo, and secret request surfaces — files: apps/mobile/src/features/chat/requests/ · verify: correlation, expiry, masking, single submission, cancellation, and reconnect tests pass · dep: streaming chat · parallel: no
- [ ] Implement interrupt, steer, and queue controls — files: apps/mobile/src/features/chat/controls/ · verify: controls follow gateway state and never target a stale session/turn · dep: streaming chat · parallel: yes
- [ ] Add authenticated mobile device registration and revocation — files: hermes_cli/web_routers/mobile.py, tests/dashboard/test_mobile_api.py · verify: owner scope, duplicate registration, revoke, and redacted response tests pass · dep: push provider vetting and capability endpoint · parallel: yes
- [ ] Add server event inbox and opaque push provider adapter — files: hermes_cli/mobile_notifications.py, hermes_cli/web_routers/mobile.py, tests/dashboard/test_mobile_api.py · verify: completion/error/approval delivery, deduplication, expiry, provider failure, and zero-sensitive-payload tests pass · dep: device registration · parallel: no
- [ ] Implement notification permission, registration, generic display, and post-unlock refresh — files: apps/mobile/src/platform/notifications/, apps/mobile/src/features/inbox/ · verify: foreground/background/killed, duplicate, denied-permission, revoked-token, and handled-event device tests pass · dep: server event inbox and biometric gate · parallel: no
- [ ] Implement server health, status, and compatibility views — files: apps/mobile/src/features/server/ · verify: healthy/degraded/offline/version-change component and contract tests pass · dep: application shell · parallel: yes
- [ ] Add or narrow authenticated server log access for mobile — files: hermes_cli/web_routers/mobile.py, tests/dashboard/test_mobile_api.py · verify: bounded pagination, redaction, auth, and no arbitrary-file access tests pass · dep: contract matrix · parallel: yes
- [ ] Implement mobile log viewing and filtering — files: apps/mobile/src/features/server/logs/ · verify: pagination, refresh, redaction display, offline state, and large-log performance tests pass · dep: mobile log endpoint · parallel: yes
- [ ] Implement confirmed graceful restart and expected-disconnect recovery — files: apps/mobile/src/features/server/restart/ · verify: confirmation, single request, expected disconnect, timeout, and reconnect tests pass · dep: lifecycle reconnect and server status · parallel: no
- [ ] Add accessibility and narrow-phone layout coverage for Stage 1 screens — files: apps/mobile/src/ui/, apps/mobile/src/features/ · verify: screen-reader labels, focus order, text scaling, touch targets, and target viewport tests pass · dep: Stage 1 feature screens · parallel: yes
- [ ] Add mobile diagnostics with strict redaction — files: apps/mobile/src/platform/diagnostics/, apps/mobile/src/domain/errors/ · verify: snapshot contains versions/states but no tokens, secrets, prompts, or message content · dep: Stage 1 integration · parallel: yes
- [ ] Run the security-review gate for auth, cache, push, logs, and administrative actions — files: review findings and affected fixes · verify: no unresolved release-blocking finding · dep: Stage 1 integration · parallel: no
- [ ] Add Android end-to-end scenarios for the Stage 1 contract — files: apps/mobile/e2e/, apps/mobile/package.json · verify: Android 12 and Android 17 emulator suites pass from clean app data · dep: Stage 1 integration · parallel: no
- [ ] Complete physical-device Tailscale acceptance outside the home LAN — files: apps/mobile/docs/stage-1-acceptance.md · verify: every SPECIFICATION acceptance criterion records pass/evidence · dep: security review and E2E · parallel: no
- [ ] Configure release signing through local/CI secrets and build the signed APK — files: apps/mobile/app.json, apps/mobile/eas.json or local build config, repository CI workflow · verify: release APK signature verifies and installs as an upgrade with no secret committed · dep: physical-device acceptance and signing decision · parallel: no
- [ ] Document installation, Tailscale prerequisites, Hermes service auto-restart, connection, update, and rollback — files: apps/mobile/README.md · verify: clean-device walkthrough succeeds · dep: signed APK · parallel: yes
- [ ] Prepare the GitHub Release artifact and contribution-ready change summary without publishing — files: release notes draft · verify: APK checksum, version, known limitations, and test evidence recorded · dep: signed APK and documentation · parallel: no

## Blocked

- [ ] Install any proposed dependency — blocker: dependency-vetting
- [ ] Publish a GitHub Release — blocker: separate explicit outward-facing authorization

## Discovered

<!-- Add newly discovered implementation work here; requirement or architecture
     changes must reopen the planning gate. -->

## Done

- [x] Bootstrap apps/mobile with the nested toolkit and host-repository AGENTS.md contract — verified: commit 1e412c5ae
- [x] Elicit and record DESCRIPTION.md through the grill workflow — verified: required template sections and interview coverage checked
- [x] Approve the Stage 1 planning package, com.evgenver.hermesmobile Application ID, Android 12 minimum, and Expo Push Service — verified: explicit owner approval
