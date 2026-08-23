# DESCRIPTION — Hermes Mobile
<!-- Original concept / intent. Bootstrap entry point.
     Superseded by SPECIFICATION once it is approved. -->

## Idea & intent

Hermes Mobile is a standalone, Android-first client for remotely operating a
self-hosted Hermes Agent. The initial Hermes server runs on the project owner's
home computer and is currently accessible through Telegram, but Telegram exposes
only a small part of Hermes. The mobile application must make it practical to
create, configure, use, and administer Hermes agents from a phone.

The application will be built as a new mobile interface rather than a port of the
Desktop UI. Hermes Desktop is the functional and behavioral reference, while the
mobile client owns its UI, navigation, and state management and connects directly
to the Hermes server APIs. The long-term product goal is full functional parity
with Hermes Desktop, including Bot Mode and Hermes administration.

The app is useful to the owner whether or not it is accepted upstream. It should
nevertheless be structured and documented so it can be proposed as a contribution
to the main Hermes repository.

## Target users / audience

- Initially, the project owner operating a personal self-hosted Hermes instance.
- Later, other operators of self-hosted Hermes installations.
- Android users first. iOS support is a later goal.
- The first version has an English-only interface.

## Goals

- Connect directly to an up-to-date Hermes server over its REST and WebSocket
  interfaces, using a user-supplied Server URL rather than a hard-coded deployment.
- Use Tailscale for the first real deployment so the home server remains reachable
  without a static public IP or a new VPS.
- Keep the fork synchronized with current upstream Hermes and update the mobile
  client alongside current Hermes APIs. Supporting arbitrary old Hermes versions
  is not the primary compatibility goal.
- Deliver the work in operational stages:
  - **Stage 0 — internal foundation, not a product release:** Android application
    foundation, Server URL and authentication, Tailscale connectivity, secure
    credential storage, REST/WebSocket transport, compatibility checks,
    reconnect, and state synchronization.
  - **Stage 1 — Agent Control, the first installable and operational release:**
    list, create, clone, rename, and delete agent profiles; edit identity,
    description, avatar, and SOUL; select model and provider; configure skills,
    tools/toolsets, MCP, and per-agent routines; inspect agent state; use canonical
    Bot Chat with streaming and tool progress; handle approval, clarification,
    sudo, and secret requests; interrupt, steer, or queue work; use attachments,
    history, and session resume; receive background notifications for completion,
    errors, and approval requests; and inspect server status and logs and request a
    server restart.
  - **Stage 2 — full Bot Mode:** bot-to-bot interaction, mentions, group chats,
    orchestration, unread/activity state, advanced routines, and compatible state
    synchronization with other Hermes clients.
  - **Stage 3 — full Hermes administration:** global model/provider and OAuth
    configuration, secrets and API keys, Skills Hub, MCP catalog, messaging,
    pairing and webhooks, global cron, usage, configuration, update, doctor,
    audit, and backup workflows.
  - **Stage 4 — remaining Desktop parity:** terminal, file management and editing,
    artifacts, memory, learning graph, command center, advanced logs, multiple
    server profiles, recovery/supervisor support, and any remaining Desktop
    functions.
- Make Stage 1 materially more capable than Telegram: it is not considered usable
  until an owner can create, fully configure, administer, and interact with agents
  from the phone.
- Distribute the first version as a signed APK through GitHub Releases. Publishing
  through Google Play is not required for the first release.

## Guardrails / Non-Goals

- Do not depend on the Hermes Desktop application at runtime and do not embed or
  wrap its UI with Electron or a WebView. Desktop is a behavior reference, not the
  mobile implementation.
- Do not ship a chat-only or transport-only prototype as the first user release.
  Transport work belongs to the internal Stage 0.
- Do not require exposing Hermes directly to the public Internet for the initial
  deployment. Private access through Tailscale is the default.
- Support one configured Hermes server in the first release. Multiple server
  profiles are deferred, although the initial server address remains configurable.
- Do not promise general compatibility with outdated Hermes releases. Detect an
  incompatible server, warn the user, and prevent unsupported operations.
- When disconnected, show the last cached state as read-only and block mutations
  until connectivity returns.
- Never automatically retry a mutation whose result is ambiguous after a network
  failure. Refresh server state and let the user decide whether to retry, avoiding
  duplicated agents, routines, messages, or other changes.
- Require explicit confirmation for agent deletion and other destructive actions.
- Store credentials and tokens through Android Keystore. Support an optional
  biometric application lock and hide sensitive notification content by default.
- Do not treat the mobile API as an independent recovery channel when the Hermes
  process is fully stopped. The home installation must run Hermes as an
  automatically restarting service; an external recovery supervisor is deferred.
- Dedicated agent-memory administration, advanced global configuration, terminal,
  files, and the rest of Desktop parity are not required for Stage 1 unless they
  become necessary to complete its agreed Agent Control workflows.

## Domain context

The initial server is a home computer with Internet access but no static public IP.
It must remain powered on, must not enter sleep, and must start and automatically
restart Hermes as a service. Tailscale supplies the private network path; Hermes
authentication still protects the application-level connection. The client accepts
an arbitrary Server URL so this deployment choice does not become a permanent
product limitation.

Hermes Desktop defines the expected feature behavior, but some current Bot Mode
orchestration and client state live inside the Desktop plugin rather than entirely
behind server APIs. Exact parity may therefore require either a behavior-compatible
mobile implementation or moving appropriate shared behavior into a server/shared
Hermes layer. This is an integration risk to resolve during specification and
feature analysis, not a reason to reuse the Desktop UI.

Stage 1 is accepted only when, over Tailscale and away from the home network, the
owner can connect to the current Hermes server; create and configure an agent's
identity, SOUL, model, skills, toolsets, MCP access, and routines; interact through
streaming Bot Chat and respond to approvals; receive the agreed background
notifications; inspect status and logs; and request a restart. After an interrupted
connection, the app must return to a consistent server-backed state without silently
duplicating a mutation or exposing secrets.

The principal ongoing risks are changes in upstream Hermes APIs, Desktop-only Bot
Mode behavior that has no server equivalent yet, Android background-execution
limitations, and availability of the home computer. Keeping the fork current,
checking server compatibility, using conservative mutation handling, and running
Hermes as an automatically restarting service are part of the product context.
