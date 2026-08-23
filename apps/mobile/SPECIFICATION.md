# SPECIFICATION — Hermes Mobile
<!-- Approved top-level requirements. Authoritative on conflict.
     Feature behavior lives in specs/stage-1-agent-control.md. -->

## Problem statement

Operators of self-hosted Hermes instances cannot access the full Hermes control
surface from a phone. Telegram provides basic conversation access but does not let
the owner create and configure agents, manage their capabilities and routines,
handle the complete interactive session protocol, or administer the server.

Hermes Mobile must provide an independent mobile control surface for the current
Hermes server, starting with Android and the owner's home deployment.

## Goals

- Ship an Android application that connects to one user-configured, current Hermes
  server through Tailscale and Hermes authentication.
- Make the first user release operationally useful: the owner can create,
  configure, administer, and use agents without returning to Desktop for the
  agreed Agent Control workflows.
- Preserve server authority: every mutable state is confirmed by Hermes, and the
  app reconciles from server state after interruption.
- Provide secure credential storage, optional biometric app locking, conservative
  destructive actions, and non-sensitive background notifications.
- Keep the mobile client compatible with current upstream Hermes by updating the
  fork and the mobile API contract together.
- Reach full Hermes Desktop functional parity in later stages without depending on
  Desktop at runtime.
- Produce a signed APK through GitHub Releases for the first distribution channel.

## Non-Goals

- Reusing, embedding, or wrapping the Desktop UI, Electron runtime, or a WebView.
- Shipping Stage 0 transport work as a chat-only user release.
- Supporting multiple Hermes servers in the first release.
- Guaranteeing compatibility with arbitrary historical Hermes versions.
- Exposing the home Hermes service directly to the public Internet.
- Automatically retrying mutations whose result is unknown.
- Recovering a fully stopped Hermes process through the Hermes process itself.
- Delivering iOS, full Bot Mode orchestration, full global administration,
  terminal/files, or complete Desktop parity in Stage 1.
- Changing Hermes prompts or agent reasoning behavior as part of the mobile client.

## User-facing requirements

- The user can enter and validate an arbitrary Hermes Server URL, authenticate,
  disconnect, and replace the saved connection.
- The app shows connection, authentication, compatibility, and reconnect state
  explicitly.
- The user can list, create, clone, rename, inspect, and delete profiles with the
  server's validation and destructive-action confirmation.
- The user can edit the selected agent's identity, description, avatar, SOUL,
  model/provider, skills, tools/toolsets, MCP configuration, and routines.
- The user can open the profile's canonical Bot Chat, resume history, stream agent
  and tool progress, attach supported files, and interrupt, steer, or queue work.
- Approval, clarification, sudo, and secret requests are rendered as explicit
  mobile actions with the same server semantics as Desktop.
- The user receives background notifications for completion, errors, and pending
  approvals. Notification lock-screen content is generic by default.
- The user can inspect server health/status and logs and request a graceful
  gateway restart.
- When offline, the app displays a timestamped read-only snapshot and disables
  mutations until current server state is restored.
- Detailed Stage 1 behavior is defined in specs/stage-1-agent-control.md.

## Constraints

- Android is the first platform; iOS is deferred but the application architecture
  must not make an iOS client unnecessarily impossible.
- The minimum supported release is Android 12 (API 31). The initial stable Expo
  toolchain compiles and targets Android 16 (API 36), and the application must also
  be compatibility-tested on Android 17 (API 37). The target advances when a
  stable vetted Expo release supports the newer API.
- The first interface language is English only.
- The repository remains an npm workspace monorepo. The mobile package lives at
  apps/mobile and may depend on platform-neutral exports from apps/shared, but
  never on apps/desktop.
- The current Hermes REST routes and /api/ws JSON-RPC gateway remain the canonical
  integration surfaces. Server extensions are allowed where Desktop-only behavior
  or mobile push delivery lacks a stable server contract.
- Tailscale is the initial network path. The app still accepts an arbitrary Server
  URL and requires Hermes authentication.
- Tokens and credentials must be stored with Android Keystore-backed storage and
  must never enter logs, ordinary application state snapshots, analytics, or push
  payloads.
- The home computer must remain awake and run Hermes as an automatically
  restarting service.
- No production dependency may be installed until it passes the toolkit's
  dependency-vetting gate.
- The fork must be synchronized with upstream before implementation begins and
  regularly throughout development.

## Assumptions

- The Android device and home computer can remain members of the same Tailscale
  network.
- The current Hermes authentication and short-lived WebSocket ticket flow can be
  reused by a native client.
- Existing Hermes REST and JSON-RPC contracts cover most Stage 1 operations; any
  gaps can be added to server-owned modules without importing Desktop UI logic.
- The current server can expose a small capability manifest so the client can
  reject incompatible operations safely.
- Background push delivery may use an optional external delivery provider while
  keeping notification payloads opaque and fetching all sensitive detail directly
  from Hermes after unlock.

## Acceptance criteria

- From outside the home LAN, an Android device reaches Hermes over Tailscale,
  authenticates, completes a compatibility handshake, and reconnects after a
  transient network interruption.
- On the phone, the owner creates or clones an agent and configures identity,
  SOUL, model/provider, skills, toolsets, MCP access, and at least one routine.
- The owner starts and resumes canonical Bot Chat, observes streaming output and
  tool progress, sends supported attachments, and completes each interactive
  request type defined for Stage 1.
- Completion, error, and approval notifications arrive while the app is
  backgrounded without exposing prompt, response, secret, or agent content on the
  lock screen by default.
- The owner views server status and logs and requests a graceful restart; the app
  reconnects when Hermes returns.
- During an ambiguous failed mutation, the app performs no automatic write retry,
  refreshes authoritative server state, and asks the owner before another attempt.
- Offline screens are visibly stale and read-only, and no secret is present in the
  offline cache or diagnostic logs.
- A signed release APK installs on Android 12 (API 31) and passes
  the Stage 1 physical-device acceptance checklist.

## Risks

- Some Bot Mode behavior and state currently live in the Desktop plugin rather
  than stable server contracts.
- Upstream Hermes API changes may invalidate mobile assumptions unless capability
  tests and fork synchronization remain continuous.
- Expo/React Native versions must coexist with the repository's existing React and
  npm workspace dependency graph without duplicated native packages.
- Reliable background notification delivery requires a server-to-push path; a
  foreground WebSocket alone is not reliable after Android suspends or kills the
  app.
- The home computer, Tailscale, and Internet connection remain availability
  dependencies even if the app itself is healthy.
- Server logs, secret-entry flows, and restart behavior may require narrower
  mobile-specific contracts to avoid overexposing administrative data.

## Open questions

- **Application ID and signing identity:** proposed personal release ID is
  com.evgenver.hermesmobile. An upstream-owned flavor/ID can be introduced if the
  project is accepted; signing identities must never be committed.
- **Push provider:** proposed Stage 1 provider is Expo Push Service behind a
  server-side provider interface. Payloads contain only an opaque event reference
  and generic category; the app unlocks and fetches details from Hermes. A direct
  FCM/APNs or self-hosted provider can replace it later.
