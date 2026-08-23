# specs/stage-1-agent-control — Stage 1 Agent Control
<!-- Approved behavior contract. Ref:
     SPECIFICATION.md §§ User-facing requirements, Acceptance criteria. -->

## Overview & requirement link

Stage 1 is the first installable Hermes Mobile release. It combines secure remote
connection, complete agent administration, canonical Bot Chat interaction,
background event notification, and basic server operations. It is one release
contract: partial transport or chat-only builds are internal milestones.

The Hermes server is authoritative. The app may cache confirmed reads but never
creates a second source of truth for profiles, sessions, configuration, routines,
or pending interactive requests.

## Behavior (BDD / Gherkin)

Scenario: Connect to a compatible Hermes server
  Given the user entered a syntactically valid Server URL and valid credentials
  When the app validates the server over Tailscale
  Then it confirms Hermes identity, server version, capabilities, authentication,
  and WebSocket availability before enabling mutable screens

Scenario: Reject an unsafe or incompatible connection
  Given the URL is malformed, uses a disallowed clear-text remote transport, points
  to a non-Hermes service, fails authentication, or lacks required capabilities
  When validation runs
  Then the app explains the failing category without logging credentials and keeps
  agent mutations disabled

Scenario: Unlock protected local access
  Given optional biometric locking is enabled
  When the app returns from background or cold starts
  Then server credentials and cached management screens remain inaccessible until
  local authentication succeeds or the user disconnects and clears local data

Scenario: Browse agents
  Given a compatible authenticated connection
  When the profile list loads
  Then the app shows server-confirmed profiles, current identity/model summary,
  loading/error state, and an explicit refresh action

Scenario: Create or clone an agent
  Given the user supplies values accepted by the server
  When create or clone is confirmed
  Then exactly one server profile is created and the app refreshes and opens the
  server-returned profile

Scenario: Handle an ambiguous profile mutation
  Given a create, clone, rename, or delete request loses its response
  When the transport cannot prove success or failure
  Then the app does not retry automatically, reloads the profile list, describes
  the ambiguity, and lets the user decide what to do

Scenario: Protect destructive profile operations
  Given the user requests deletion
  When the selected profile can be deleted under Hermes rules
  Then the app names the target, describes the impact, requires explicit
  confirmation, submits one deletion request, and returns to refreshed server state

Scenario: Edit an agent
  Given a selected profile
  When the user changes identity, description, avatar, SOUL, model/provider,
  skills, tools/toolsets, MCP, or routines
  Then the app validates the edit, submits it to the profile-scoped server contract,
  and shows success only after confirmed server state is re-read

Scenario: Prevent accidental loss of edits
  Given a form contains unsaved changes
  When the user navigates away, disconnects, or the connection drops
  Then the app warns before discarding local edits and never presents them as
  server-saved

Scenario: Use canonical Bot Chat
  Given a selected profile
  When the user opens Agent Chat
  Then the app resolves the canonical Bot Chat session for that profile, loads its
  history, resumes current state, and does not create duplicate canonical sessions

Scenario: Run and control an agent turn
  Given Bot Chat is connected
  When the user sends text or a supported attachment
  Then tokens, reasoning/status events, tool progress, and final state stream from
  Hermes and the user can interrupt, steer, or queue according to gateway state

Scenario: Resolve an interactive request
  Given Hermes emits an approval, clarification, sudo, or secret request
  When the mobile user responds
  Then the response is correlated to the active request exactly once, secret input
  is masked and never persisted in ordinary state, and expired requests cannot be
  submitted as current

Scenario: Manage a routine
  Given a selected profile
  When the user creates, edits, enables, disables, runs, or deletes a routine
  Then the operation remains profile-scoped, displays schedule and last/next run
  state, and follows the same ambiguous-mutation and destructive-action rules

Scenario: Receive a background event
  Given push is configured and the app is backgrounded
  When Hermes reports completion, failure, or a pending approval
  Then a generic notification is delivered without prompt, response, secret, agent
  name, or message content; opening it requires app unlock and a fresh server fetch

Scenario: Continue after network loss
  Given previously confirmed data exists locally
  When Tailscale or Hermes becomes unreachable
  Then the app marks the snapshot stale, shows its timestamp, disables every
  mutation, and reconnects with bounded backoff when the network returns

Scenario: Inspect and restart the server
  Given Hermes is reachable
  When the user views operations or confirms a graceful restart
  Then the app shows health/version/log data allowed by the mobile contract, sends
  one restart request, expects disconnection, and reconnects when the service returns

Scenario: Hermes is fully stopped
  Given no Hermes endpoint is reachable
  When the app attempts health checks
  Then it reports the server offline and does not claim it can restart the dead
  process; recovery is delegated to the host's automatic service restart

## API contracts

The implementation must inventory and test the exact current contracts before UI
work. Stage 1 is expected to compose these server-owned surfaces:

- GET /api/status and GET /api/health for identity, version, and health.
- The existing dashboard authentication and short-lived /api/ws ticket flow.
- /api/ws JSON-RPC for session lifecycle, streaming events, turn control, and
  interactive requests.
- hermes_cli/web_routers/profiles.py for profile CRUD, clone, SOUL, metadata, and
  profile-scoped configuration.
- hermes_cli/web_routers/sessions.py for history/search/resume behavior.
- hermes_cli/web_routers/skills.py, mcp.py, and cron.py for profile capabilities
  and routines.
- Existing model/config endpoints in hermes_cli/web_server.py.
- POST /api/gateway/restart and a least-privilege server log/status surface.

The plan proposes a versioned, server-owned mobile extension only for gaps:

- GET /api/mobile/capabilities returns mobile_contract_version, Hermes version,
  authentication mode, and named Stage 1 capabilities.
- POST /api/mobile/devices registers an opaque push token for the authenticated
  owner and returns a revocable registration ID.
- DELETE /api/mobile/devices/{registration_id} revokes that device.
- GET /api/mobile/inbox returns current completion/error/approval summaries after
  authentication; secrets and full message content are never returned by push.

Every new write endpoint must use Hermes authentication, validate profile/session
scope, avoid returning secret values, and define an idempotency policy. The client
still treats a result as ambiguous unless the server confirms it or authoritative
state proves it.

## Data schemas

Client-local records:

- ConnectionRecord: singleton ID, normalized base URL, display label, last server
  identity, last compatibility result, and timestamps. No credential fields.
- CredentialRecord: authentication material stored only through SecureStore under
  the connection ID.
- CapabilitySnapshot: mobile contract version, Hermes version, capability flags,
  fetched_at, and compatibility outcome.
- CachedEntity: entity kind, stable server key, profile/session scope, server
  revision when available, fetched_at, and non-secret JSON payload.
- PendingLocalEdit: in-memory form state only; it is never labelled saved and is
  not an offline mutation queue.
- DeviceRegistration: server-issued registration ID plus local notification
  permission/status. Push delivery tokens remain in SecureStore when retained.

Cache policy:

- The cache may contain server-confirmed profile metadata, configuration with
  secret fields removed, routine summaries, session metadata, and bounded rendered
  chat history.
- API keys, passwords, secret responses, raw authorization headers, WebSocket
  tickets, revealed environment values, and sudo material are never cached.
- Disconnect-and-forget deletes credentials, cache, registration metadata, and
  local notification routing state.

## Edge cases

- Tailscale is disconnected while the public Internet remains available.
- The Server URL redirects, changes scheme, has an invalid certificate, or points
  to a different installation than the cached server identity.
- Hermes updates while the app is installed and changes capability/version state.
- Authentication expires during REST or WebSocket activity.
- WebSocket reconnects after the server already completed a turn.
- A response arrives after the user switched profiles or sessions.
- The same push event is delivered more than once or arrives after the user already
  handled the approval.
- Notification permission is denied, revoked, or unavailable.
- Biometric hardware is unavailable, unenrolled, or changes enrollment.
- The default profile has different rename/delete semantics from named profiles.
- A skill, MCP server, model, or toolset disappears between form load and save.
- A routine fires while its profile is being edited.
- Restart succeeds but the connection remains unavailable beyond the expected
  service recovery window.
- Cached data migrations fail after an app update; credentials must remain
  protected and the cache may be discarded safely.

## Feature-level acceptance & validation

- Contract tests cover compatible/incompatible handshake, authentication failure,
  capability gating, profile scope, redaction, and mobile extension endpoints.
- Unit tests cover URL normalization, cache redaction, mutation ambiguity,
  reconnect state, event deduplication, and form dirty-state behavior.
- Component tests cover all Stage 1 loading, empty, stale, error, confirmation,
  approval, and locked states.
- Gateway integration tests cover canonical Bot Chat resolution, replay after
  reconnect, streaming, interactive requests, and turn control.
- Android integration tests on Android 12 (API 31) and Android 17 (API 37) verify
  Keystore storage, biometric gating, notification permission/delivery, deep-link
  refresh, and disconnect-and-forget.
- A physical-device run over Tailscale completes every top-level acceptance
  criterion in SPECIFICATION.md.
- No AI eval is required while the work changes only the client/server control
  surface and does not change product prompts or agent behavior. Any such behavior
  change reopens the eval gate.
