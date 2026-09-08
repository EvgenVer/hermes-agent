# Stage 1 API matrix

Baseline: reviewed upstream target `upstream/main`
`22488b8c62d3c92f25149053ae8df68fb0afcb35`, merged into `feat/mobile-app` by
`ddde04baf8da57b20fd184eda8e29d5424f0fd0a`; the merge's first parent was the
mobile checkout and its second parent was that upstream target. Release tag
`v2026.9.7` is an earlier ancestor. HM-038 records topology decisions against
this synchronized revision; HM-039 still revalidates every route, field, event,
error, and test pointer. No live mobile/server compatibility run is claimed.

An Existing handler is not automatically a mobile-ready workflow. Native login,
MCP return, session surface, missing canonical chat creation, local storage and
push require the explicit evidence/gaps below.

## Schema

Every contract row uses the following fields:

| Field | Meaning |
| --- | --- |
| Requirement ID | Stable matrix identifier; `UR-*` and `SC-*` are coverage references. |
| Desktop source | Existing Desktop API/store/UI source that demonstrates the client behavior. |
| REST or JSON-RPC contract | Concrete HTTP route, WebSocket route, or RPC method and the primary request/response shape. |
| Authentication | Required server authentication or explicit client-only scope. |
| Profile/session scope | Connection, device, profile, or session ownership boundary. |
| Events | Server event names or an explicit `none` when refresh is required. |
| Errors | Validation, authorization, stale-target, transport, and ambiguous-result behavior. |
| Capability status | `Existing`, `Extend`, or `New (client)`; gaps are stated inline. |
| Test evidence | Existing source/test evidence or an explicit planned test gap. |

Common rules for all writes: the client submits once; an unknown result is
ambiguous, never automatically retried, and followed by an authoritative read.
Tokens, tickets, secrets, and raw authorization headers are excluded from
ordinary state, logs, push payloads, and all matrix response examples.

### HM-038 topology decisions

| Area | Reusable contract | Mobile decision and remaining gap |
| --- | --- | --- |
| Native auth | `GET /auth/native/authorize`, `POST /auth/native/token`, and `POST /auth/native/refresh` implement the gateway-brokered RFC8252/PKCE flow. | Bind an ephemeral HTTP loopback listener on the phone, use S256 PKCE and state, open the system browser, exchange the one-time code, and store only bearer/refresh credentials in SecureStore. The server accepts loopback IP redirects, not an Expo app-link; password-provider login remains in the server browser form. |
| MCP OAuth | `mcp.servers.oauth.start`, `.callback`, `.poll`, and `.cancel` support a client-supplied loopback redirect. | The phone supplies `client_redirect_uri`, relays only callback code/state/error to the authenticated WS, and polls until the server stores MCP credentials. This covers URL OAuth MCP servers; stdio/API-key servers use their existing setup and are not silently folded into this flow. |
| Session surface | `session.create` accepts and persists an explicit source; `session.resume` accepts the source for the new runtime agent; `_load_enabled_toolsets` derives GUI tools from that source. | Always send `source: "mobile"` on create and resume instead of relying on the backend environment fallback. Mobile may receive the project surface but must not receive Desktop renderer tools, even when the backend runs with Desktop environment variables. Resume/reconnect must preserve the conversation's cached prompt/tool schema. |
| Canonical Bot Chat | `profiles.list` exposes `canonical_session`; `session.list` supports exact title lookup with hidden rows and compression-tip resolution; `session.resume` opens the resolved row. | Resolve `(profile, "Bot Chat")` by name on every open. An absent row has no complete atomic get-or-create primitive in the reviewed surface: add the smallest server-owned create/adopt extension, rechecking the registry before minting and adopting a concurrent winner. Never use a stored ID, recency, visibility, or per-bot browser. |

The bounded Android proof is: connect to the home server over the user's secure
Tailscale path; complete native PKCE sign-in in the system browser; verify
`/api/auth/me`, a fresh `/api/auth/ws-ticket`, and the ticketed `/api/ws`
`gateway.ready`; force one access-token refresh and verify refresh-token rotation;
cancel a pending flow and verify cleanup; then run the MCP callback relay and
poll to approval. A 401 after refresh failure disables mutations and requires
sign-in; a 503 preserves credentials and reports provider unavailability. No
mutation is replayed after an ambiguous response. The proof uses no app-link,
server-loopback, direct password, or client-side MCP-token assumption.

## Connection and compatibility

| Requirement ID | Desktop source | REST or JSON-RPC contract | Authentication | Profile/session scope | Events | Errors | Capability status | Test evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `UR-01`, `SC-01`, `SC-02` / `CON-001` URL validation and identity | Desktop `connection-config.ts`, `native-oauth-login.ts` | Normalize an HTTPS or permitted local base URL; `GET /api/health`, `/api/status` expose identity/auth information. Existing native routes: `GET /auth/native/authorize`, `POST /auth/native/token`, `/auth/native/refresh`, `GET /api/auth/me`. Native authorize accepts only HTTP loopback IP redirects, not `hermesmobile://`. | Provider-verified bearer credentials after sign-in; no invented universal static token or Operator ID/password API. | Connection/installation; profile scope is separate. | none; select the supported login flow from actual server advertisement. | URL/TLS/DNS/redirect failure; 401 invalid/expired; 503 provider outage; reject unexpected installation identity. | Existing server primitives; Extend/decision: Android login/refresh/return must be proved before UI implementation. | `dashboard_auth/routes.py` and `middleware.py`; Android E2E gap, owned by HM-038. |
| `UR-01`, `UR-02`, `SC-01`, `SC-02` / `CON-002` WebSocket authentication | `apps/desktop/electron/connection-config.ts`, `apps/desktop/src/lib/gateway-ws-url.test.ts` | Authenticated `POST /api/auth/ws-ticket` returns `{ticket, ttl_seconds}`; ticket is single-use and passed as `?ticket=` to `GET /api/ws`. The socket speaks JSON-RPC 2.0. | Bearer/session-authenticated ticket mint; ticket itself is short-lived and user-bound. | Connection-global socket; every session RPC must carry/resolve its `session_id`. | `gateway.ready`, `error`, `status.update`. | Ticket mint `401/503`; expired/replayed ticket rejects WS upgrade; JSON-RPC `-32600` invalid request or `-32601` unknown method; socket close triggers reconnect. | `Existing` ticket and WS route; `Extend` native mobile reconnect/replay policy. | `hermes_cli/dashboard_auth/routes.py`, `ws_tickets.py`, `hermes_cli/web_server.py`, `tui_gateway/ws.py`, `apps/shared/src/json-rpc-gateway.ts`; mobile ticket/reconnect test gap. |
| `UR-02`, `SC-01`, `SC-02` / `CON-003` compatibility handshake | `apps/desktop/src/app/gateway/hooks/use-gateway-boot.ts`, `apps/desktop/src/lib/version-status.ts` | Current probes expose `version`, `auth_required`, and liveness. Proposed `GET /api/mobile/capabilities` must return `mobile_contract_version`, Hermes version, authentication mode, and named Stage 1 capability flags. | `GET /api/mobile/capabilities` must require authenticated bearer/session access. | Connection-global; capability snapshot is timestamped and not profile data. | `none`; capability changes are observed on refresh/reconnect. | `404` means unsupported mobile contract; `401/403` auth; `5xx/timeout` unavailable; version/capability mismatch leaves mutations disabled. | `Existing` health/version probes; `Extend` mobile capability endpoint. | `hermes_cli/web_server.py` health/status handlers; `/api/mobile/capabilities` route and `tests/dashboard/test_mobile_api.py` are explicit gaps. |
| `UR-01`, `UR-02` / `CON-004` disconnect and replace saved connection | `apps/desktop/src/store/connections.ts`, `apps/desktop/electron/connection-registry.ts` | Client-only record for normalized URL, label, server identity, compatibility result, and timestamps; disconnect clears the active transport; forget removes credential/cache records. | SecureStore only; no credential field in the connection record. | One configured connection in Stage 1; no server profile scope. | `none`; app lifecycle and network events drive local state. | Dirty form warning before discard; transport close is not a successful mutation; forget is local destructive confirmation. | `New (client)`. | Desktop connection store tests; mobile SecureStore/forget test gap. |
| `SC-03` / `CON-005` local unlock | `apps/desktop/electron/secret-storage-policy.ts`, `apps/desktop/src/app/settings/notifications-settings.tsx` | No server contract; local biometric gate protects SecureStore reads and cached management screens. | Android Keystore and optional biometric prompt. | Connection-local; applies before any profile/session access. | `none`. | Unavailable hardware, unenrolled biometric, changed enrollment, or cancel keeps the app locked; user may disconnect and forget. | `New (client)`. | Desktop storage-policy tests; Android API 31/API 37 integration gap. |

## Agent administration

| Requirement ID | Desktop source | REST or JSON-RPC contract | Authentication | Profile/session scope | Events | Errors | Capability status | Test evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `UR-03`, `SC-04` / `ADM-001` list and inspect profiles | `apps/desktop/src/api/profiles.ts`, `apps/desktop/src/app/profiles/index.tsx` | `GET /api/profiles` returns profile summaries. JSON-RPC `profiles.list` returns name, model/provider, description, skill count, canonical session summary, UI metadata, and `has_avatar`; `profiles.describe` returns full profile editor data. | Authenticated bearer/session. | Connection-global list; each returned row is profile-scoped. | `none`; explicit list/describe refresh after writes. | `401/403`; server read failure; malformed profile data; unavailable profile row is an error, not a client-created substitute. | `Existing`. | `hermes_cli/web_routers/profiles.py`, `tui_gateway/methods_profiles.py`, `tests/tui_gateway/test_profiles_list_canonical_session.py`, `apps/desktop/src/app/profiles/index.test.tsx`. |
| `UR-03`, `SC-05`, `SC-06` / `ADM-002` create and clone | `apps/desktop/src/api/profiles.ts`, `apps/desktop/src/app/profiles/create-profile-dialog.tsx` | `POST /api/profiles` accepts `name`, `clone_from`/`clone_all`, description, optional provider/model, MCP, and skill selection. JSON-RPC `profiles.create` is the headless twin. | Authenticated bearer/session; server validates profile name. | Target profile is created once; clone source and target are explicit profile names. | `none`; re-read `GET /api/profiles` or `profiles.list` and open the server-returned name. | `400` validation/name collision/source missing; `500` server failure; lost response is ambiguous and triggers refresh without retry. | `Existing`; mobile needs a single-submit mutation controller. | `hermes_cli/web_routers/profiles.py`, `tui_gateway/methods_profiles.py`, `tests/test_session_delete_profile_isolation.py`; mobile mutation/idempotency test gap. |
| `UR-03`, `SC-06`, `SC-07` / `ADM-003` rename and delete | `apps/desktop/src/api/profiles.ts`, `apps/desktop/src/app/profiles/rename-profile-dialog.tsx`, `delete-profile-dialog.tsx` | `PATCH /api/profiles/{name}` with `{new_name}`; `DELETE /api/profiles/{name}`. No equivalent profile rename/delete RPC is registered in `tui_gateway/methods_profiles.py`; mobile uses REST. | Authenticated bearer/session and explicit client delete confirmation. | Named profile; default-profile presentation/rename semantics are server-owned. | `none`; refresh list and selected target after either operation. | `400/404` invalid or missing target; `409` collision; unknown result is ambiguous; stale selection cannot be applied. | `Existing`; mobile confirmation and ambiguity policy required. | `hermes_cli/web_routers/profiles.py`, `apps/desktop/electron/profile-rename-routing.test.ts`, `profile-delete-routing.test.ts`; mobile destructive-flow gap. |
| `UR-04`, `SC-08` / `ADM-004` identity, description, avatar, SOUL, and model | `apps/desktop/src/api/profiles.ts`, `apps/desktop/src/plugins/hermes-bots/plugin.js`, `apps/desktop/src/types/hermes.ts` | `profiles.describe`/`profiles.configure` cover description, SOUL, model/provider, and `ui_meta`; `profiles.set_asset`/`profiles.get_asset` cover avatar bytes (max 2 MiB). REST equivalents: `PUT /api/profiles/{name}/soul`, `/description`, `/model`; avatar is RPC-only. | Authenticated bearer/session; avatar payload is validated MIME/size; no secret fields in response. | Profile-scoped; mutations require selected profile name and re-read on success. | `none`; config refresh is authoritative. | `400/404`; `409` UI metadata revision conflict; size/type rejection; ambiguous response refreshes `profiles.describe`. | `Existing`; mobile form dirty-state and CAS handling required. | `tui_gateway/methods_profiles.py`, `hermes_cli/web_routers/profiles.py`, `apps/desktop/src/plugins/hermes-bots/tests/group-chat-identity-edit.test.mjs`; mobile component/contract gap. |

## Capabilities and routines

| Requirement ID | Desktop source | REST or JSON-RPC contract | Authentication | Profile/session scope | Events | Errors | Capability status | Test evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `UR-04`, `SC-08` / `CAP-001` skills | `apps/desktop/src/api/skills.ts`, `apps/desktop/src/app/skills/index.tsx` | `GET /api/skills`, `PUT /api/skills/toggle`, `GET/PUT /api/skills/content`; hub routes are separate. JSON-RPC `skills.manage` and `skills.reload` support profile-scoped management. | Authenticated bearer/session; skill content is untrusted text and must not be executed by the mobile client. | Profile-scoped via `profile` body/query or RPC params. | `none`; `skills.reload`/fresh list after mutation. | `400/404` validation/missing skill; hub/network failure; ambiguous write refreshes list/content. | `Existing`; mobile must not expose raw secret-bearing skill/config fields. | `hermes_cli/web_routers/skills.py`, `tui_gateway/methods_tools.py`, `apps/desktop/src/api/skills.ts`; mobile redaction test gap. |
| `UR-04`, `SC-08` / `CAP-002` tools and toolsets | `apps/desktop/src/api/toolsets.ts`, `apps/desktop/src/lib/desktop-toolsets.ts` | `GET /api/tools/toolsets`, `PUT /api/tools/toolsets/{name}`, model/provider/config routes; JSON-RPC `tools.list`, `tools.show`, `tools.configure`, `toolsets.list`. | Authenticated bearer/session; env writes are sensitive and must be write-only or excluded from Stage 1 until redaction is specified. | Profile-scoped where route/RPC accepts `profile`; toolset names are validated server-side. | `none`; authoritative toolset read after setup/toggle. | `400` unknown toolset/model/provider; `401/403`; setup failure; ambiguous write refreshes. | `Existing`; `Extend` least-privilege mobile field projection for env/config. | `hermes_cli/web_routers/tools.py`, `tui_gateway/methods_tools.py`, `apps/desktop/src/api/toolsets.ts`; mobile security/contract gap. |
| `UR-04`, `SC-08` / `CAP-003` MCP | `apps/desktop/src/api/mcp.ts`, `apps/desktop/src/lib/mcp-servers.ts`, `apps/desktop/src/app/skills/mcp-tab.tsx` | REST `GET/POST/PUT/DELETE /api/mcp/servers`, `/enabled`, `/test`, `/auth`, `/api/mcp/catalog`; JSON-RPC `mcp.catalog`, `mcp.servers.list/add/set_api_key/test/remove`, `mcp.servers.oauth.start/poll/cancel/callback`. | Authenticated bearer/session; API keys/OAuth material write-only, masked, never returned or cached. | Profile-scoped through `profile` params/body; server name is the target key. | `none`; probe result and list refresh. | `400/404`; OAuth expiry/replay; test timeout; duplicate name; ambiguous mutation refreshes list. | `Existing`; mobile must use a redacted server summary; Android OAuth return and cancellation require proof. Support HTTP/SSE or stdio, with only the auth modes the server accepts. | `hermes_cli/web_routers/mcp.py`, `tui_gateway/methods_tools.py`, `tests/tui_gateway/test_mcp_profile_rpcs.py`, `apps/desktop/src/lib/mcp-dashboard-oauth.test.ts`; mobile secret/redaction gap. |
| `UR-04`, `SC-13` / `CAP-004` routines | `apps/desktop/src/api/cron.ts`, `apps/desktop/src/app/cron/cron-actions.ts`, `apps/desktop/src/app/cron/cron-job-model.ts` | `GET/POST /api/cron/jobs`, `GET/PUT/DELETE /api/cron/jobs/{job_id}`, `/pause`, `/resume`, `/trigger`, `/runs`, `/delivery-targets`, and `/blueprints`; JSON-RPC `cron.manage`. | Authenticated bearer/session; routine scripts/payloads are server-owned and not echoed into push. | Profile-scoped via `profile`; job ID is the stable server target. | `none` for REST; routine outcome can produce normal gateway/background events. | `400/404/409`; schedule validation; trigger unavailable; delete requires confirmation; ambiguous mutation refreshes job list. | `Existing`; mobile needs single-submit/destructive controller, task/prompt and delivery fields, timezone explanation, and partial updates preserving advanced settings. Do not invent confirmation/silent-mode options. | `hermes_cli/web_routers/cron.py`, `tui_gateway/methods_tools.py`, `tests/test_cron_manage_profile_scope.py`, `apps/desktop/src/app/cron/cron-actions.test.ts`; mobile routine contract gap. |

## Agent interaction

| Requirement ID | Desktop source | REST or JSON-RPC contract | Authentication | Profile/session scope | Events | Errors | Capability status | Test evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `UR-05`, `SC-10` / `INT-001` canonical Bot Chat resolution | Desktop Bot Mode canonical registry/creation paths | `profiles.list` reports `canonical_session`; exact `(profile, Bot Chat)` registry lookup with hidden rows/live compression tip resolves existing chats. `session.list`/`session.resume` open the returned row. Explicitly trace absent-row create/adopt; the roster summary is not a get-or-create endpoint. | Authenticated WS; session surface is bound before creating an agent. | Profile + exact canonical title; returned ID is a target, never a stored identity pin. | `session.info`, `status.update`, `message.*` | Absent/archived/stale row; concurrent creation; late responses after profile switch. Never choose newest/visible session or use a pointer fallback. | Existing lookup/resume; Extend candidate only if a complete headless create/adopt path is missing. Mobile renderer-tool gating needs separate proof. | `methods_profiles.py`, `methods_session.py`, canonical registry/creation tests; HM-038/HM-039 own mobile and missing-row proof. |
| `UR-05`, `SC-10`, `SC-11` / `INT-002` history and resume | `apps/desktop/src/api/sessions.ts`, `apps/desktop/src/app/session/hooks/use-session-actions/index.ts` | REST `GET /api/sessions`, `/api/sessions/{id}`, `/messages`, `/search`; JSON-RPC `session.list`, `session.history`, `session.status`, `session.resume`. REST uses bounded `limit`/`offset`; RPC history returns ordered messages and durable row IDs. | Authenticated bearer/session and ticketed WS. | Session ID plus owning profile; client must discard results for a no-longer-selected owner. | `session.info`, `message.start`, `message.complete`. | `400/404` invalid/stale session; session owner mismatch; response arriving after switch is ignored; reconnect re-reads authoritative history. | `Existing`; mobile paging/reconnect state machine required. | `hermes_cli/web_routers/sessions.py`, `tui_gateway/methods_session.py`, `tests/hermes_state/test_resolve_resume_session_id.py`, `apps/desktop/src/store/session-states-reconnect.test.ts`. |
| `UR-05`, `SC-11` / `INT-003` prompt streaming and tool progress | `apps/desktop/src/lib/gateway-events.ts`, `apps/desktop/src/lib/chat-runtime.ts`, `apps/desktop/src/store/session-states.ts` | JSON-RPC `prompt.submit` returns an acknowledgement; live events carry cumulative/final state. Shared event names include `message.start`, `message.delta`, `message.interim`, `message.complete`, `thinking.delta`, `reasoning.delta`, `reasoning.available`, `status.update`, `tool.start`, `tool.progress`, `tool.complete`, `tool.generating`, and `error`. | Ticketed authenticated WS; prompt method must be routed to the owning session/profile socket. | Session-scoped; one active turn at a time with server queue semantics. | Same event list; event ordering/sequence is authoritative. | JSON-RPC validation/auth/session errors; busy turn is queued or rejected per gateway state; disconnect requires replay/reconciliation, not duplicate submit. | `Existing`; mobile stream reducer and replay watermark required. | `apps/shared/src/json-rpc-gateway.ts`, `tui_gateway/methods_prompt.py`, `gateway/stream_events.py`, `apps/desktop/src/lib/gateway-events.test.ts`, `tests/test_tui_gateway_event_replay.py`. |
| `UR-05`, `SC-11` / `INT-004` interrupt, steer, and queue | `apps/desktop/src/app/contrib/hooks/use-session-tile-delegate.ts`, `apps/desktop/src/store/session-request-router.ts` | JSON-RPC `session.interrupt`, `session.steer`, and `prompt.submit` with queue/busy parameters; the server owns turn lease and queue drain. | Ticketed authenticated WS; target session owner is resolved before dispatch. | Session-scoped; stale profile/session target must not reach ambient socket. | `status.update`, `message.*`, `error`. | `4000/4002/4009` invalid text, missing ID, or busy/stale state; steer may return rejected/missed; interrupt is one explicit control. | `Existing`; mobile control affordances and stale-target guard required. | `tui_gateway/methods_session.py`, `tui_gateway/methods_prompt.py`, `apps/desktop/src/store/session-request-router.test.ts`, `tests/tools/test_approval_interrupt.py`; mobile control/reconnect gap. |
| `UR-05`, `SC-11` / `INT-005` attachments | `apps/desktop/src/app/chat/composer/attachments.tsx`, `apps/desktop/src/api/client.ts` | JSON-RPC `file.attach`, `image.attach`, `pdf.attach` (and image detach variants); REST media/file upload routes exist but mobile chat attachment contract is WS-owned. Image uploads cap at 25 MiB; PDFs cap at 50 MiB and 25 pages; generic `file.attach` has no explicit byte cap in the current handler and needs a mobile/server decision. Attachment bytes are validated before prompt submission. | Ticketed authenticated WS; picker URI is local-only until uploaded. | Session-scoped; attachment is associated with one pending prompt. | `message.start`, `message.complete`, `error`. | Unsupported type/size, missing session, upload failure, expired pending attachment; no automatic retry of ambiguous mutation. | `Existing` protocol handlers; `Extend` mobile picker/size contract and generic-file cap. | `tui_gateway/methods_prompt.py`, `tui_gateway/server.py`, `hermes_cli/web_server.py`, `apps/desktop/src/api/client.ts`; mobile attachment validation gap. |
| `UR-06`, `SC-12` / `INT-006` approval, clarification, sudo, and secret requests | Desktop interactive cards and pending-request restoration | `approval.respond` uses choice/request_id; `sudo.respond` uses password; `secret.respond` uses value. `clarify.request` can carry question/choices/multi_select or questions with qid; `clarify.respond` carries answer and optional question_id. Batch replies report remaining questions. An RPC result may be `{status: expired}`. | Authenticated WS; passwords and secret values are write-only and cleared from local fields. Server secret capture may persist the value to profile configuration. | Live request ID plus owning session/profile; one pending submission per explicit answer. | `approval.request`, `clarify.request`, `sudo.request`, `secret.request`; `clarify.expire`, `sudo.expire`, `secret.expire`; refresh pending status after reconnect. | Expired is not accepted even inside an OK RPC envelope; stale/already answered requests disable controls. No automatic answer retry. | Existing protocol; New client secure input, batch clarification, expiry and authoritative request restoration. | v0.21.1 `methods_prompt.py`, `server.py::_respond/_clarify_block`, `agent_callbacks.py`; mobile contract/UI tests remain planned. |

## Operations and notifications

| Requirement ID | Desktop source | REST or JSON-RPC contract | Authentication | Profile/session scope | Events | Errors | Capability status | Test evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `UR-08`, `SC-16`, `SC-17` / `OPS-001` health, status, and logs | Desktop system/status/log reads | `GET /api/health` and `/api/status`; authenticated `GET /api/logs` takes file/lines/level/component/search and returns `{file, lines}`. It exposes a bounded tail, not offsets, total counts or an archive. Use real status fields including gateway_running/state/busy/drainable and available identity. | Public liveness by design; logs require server auth. | Status profile scope where supported; log route currently reads its bound HERMES_HOME and has no profile parameter. | none; explicit refresh/poll. | Offline/timeout; 401/403 logs; invalid selectors/filters 400. Never show another profile's logs under the selected agent's label. | Existing status/tail; verify redaction and log ownership. Add a narrow scoped read only if Stage 1 requires data the safe existing route cannot supply. | v0.21.1 `web_routers/status.py`; planned profile-scope/redaction integration tests. |
| `UR-08`, `SC-16` / `OPS-002` graceful gateway restart | Desktop gateway restart action | Authenticated `POST /api/gateway/restart` requests a server-owned lifecycle action. Poll actual gateway state/action result; control serve and messaging gateway can have separate lifecycles. Reconnect WS if it closes. | Authenticated owner request; named-target confirmation. | Connection/default or explicit profile scope supported by the route; identify the affected target before submission. | Gateway status; optional socket close/reconnect. | 401/403; spawn failure; ambiguous acknowledgement; recovery timeout. Do not repeat restart automatically or equate HTTP liveness/helper exit to gateway recovery. | Existing; New client honest progress/recovery without fixed duration or mandatory disconnection. | `web_server.py::_spawn_gateway_restart`, gateway lifecycle/status; mobile recovery integration gap. |
| `UR-07`, `SC-14` / `OPS-003` background completion/error/approval notifications | `apps/desktop/src/store/notifications.ts`, `apps/desktop/src/store/native-notifications.ts` | Proposed authenticated `POST /api/mobile/devices` registers an opaque push token and returns a revocable ID; `DELETE /api/mobile/devices/{registration_id}` revokes it; `GET /api/mobile/inbox` returns redacted completion/error/approval summaries after unlock. No such mobile routes exist in baseline. | Bearer/session for registration and inbox; provider token remains secret/local. | Device registration is connection/user-owned; inbox is owner-scoped and deduplicated by event reference. | Push categories are generic; foreground WS events may update inbox. | Permission denied/revoked; expired registration; duplicate/late event; `401/404`; payload must not contain prompt, response, secret, agent name, or message content. | `Extend` server mobile notification contract plus `New (client)` notification routing. Define stable registration identity and a redacted status lookup for lost-response reconciliation; the read route is not yet selected. | Desktop notification stores; explicit server route gap and planned `tests/dashboard/test_mobile_api.py`. |
| `UR-09`, `SC-15` / `OPS-004` offline snapshot and reconnect | `apps/desktop/src/app/session/session-state-cache.ts`, `apps/desktop/src/store/gateway-reconnect.ts`, `apps/desktop/src/lib/json-rpc-gateway-recovery.test.ts` | Client stores timestamped redacted confirmed reads in SQLite; REST/WS reconnect uses bounded backoff, fresh health/status, fresh capability check, then list/history reconciliation. No offline write queue. | SecureStore credentials; cache contains no tokens/secrets. | Cache rows carry profile/session scope and server revision when available. | `gateway.ready`, replayed session events, `error`, local stale/online state. | Tailscale/DNS/TLS loss; auth expiry; replay gap; migration failure discards cache safely; all mutations disabled while stale. | `New (client)` around existing server contracts. | Shared replay tests, Desktop reconnect tests, `apps/shared/src/json-rpc-gateway-replay.test.ts`; mobile SQLite/reconnect gap. |

## Coverage index

The following index closes the Stage 1 contract coverage requirement. Every
user-facing requirement in `SPECIFICATION.md` and every scenario in
`specs/stage-1-agent-control.md` maps to at least one matrix row.

### User-facing requirements from `SPECIFICATION.md`

| Requirement | Matrix rows |
| --- | --- |
| `UR-01` Enter/validate URL, authenticate, disconnect, replace connection | `CON-001`, `CON-002`, `CON-004` |
| `UR-02` Show connection/auth/compatibility/reconnect state | `CON-001`, `CON-002`, `CON-003`, `OPS-004` |
| `UR-03` List/create/clone/rename/inspect/delete profiles | `ADM-001`, `ADM-002`, `ADM-003`, `ADM-004` |
| `UR-04` Edit identity/description/avatar/SOUL/model/provider/skills/tools/toolsets/MCP/routines | `ADM-004`, `CAP-001`, `CAP-002`, `CAP-003`, `CAP-004` |
| `UR-05` Canonical Bot Chat, history/resume, streaming, attachments, interrupt/steer/queue | `INT-001`, `INT-002`, `INT-003`, `INT-004`, `INT-005` |
| `UR-06` Approval/clarification/sudo/secret actions | `INT-006` |
| `UR-07` Background completion/error/approval notifications | `OPS-003` |
| `UR-08` Health/status/logs and graceful restart | `OPS-001`, `OPS-002` |
| `UR-09` Timestamped read-only offline snapshot and disabled mutations | `OPS-004`, `CON-004` |

### Scenarios from `specs/stage-1-agent-control.md`

| Scenario | Matrix rows |
| --- | --- |
| `SC-01` Connect to a compatible Hermes server | `CON-001`, `CON-002`, `CON-003` |
| `SC-02` Reject unsafe or incompatible connection | `CON-001`, `CON-002`, `CON-003` |
| `SC-03` Unlock protected local access | `CON-005` |
| `SC-04` Browse agents | `ADM-001` |
| `SC-05` Create or clone an agent | `ADM-002` |
| `SC-06` Handle ambiguous profile mutation | `ADM-002`, `ADM-003` |
| `SC-07` Protect destructive profile operations | `ADM-003` |
| `SC-08` Edit an agent | `ADM-004`, `CAP-001`, `CAP-002`, `CAP-003` |
| `SC-09` Prevent accidental loss of edits | `ADM-004`, `CON-004` |
| `SC-10` Use canonical Bot Chat | `INT-001`, `INT-002` |
| `SC-11` Run and control an agent turn | `INT-002`, `INT-003`, `INT-004`, `INT-005` |
| `SC-12` Resolve an interactive request | `INT-006` |
| `SC-13` Manage a routine | `CAP-004` |
| `SC-14` Receive a background event | `OPS-003` |
| `SC-15` Continue after network loss | `OPS-004` |
| `SC-16` Inspect and restart the server | `OPS-001`, `OPS-002` |
| `SC-17` Hermes is fully stopped | `OPS-002`, `OPS-004` |

## Classified gaps and decisions

The merged baseline has stable existing contracts for health/status, dashboard
authentication, WS tickets, profiles, sessions, routines, chat, interactive
requests, logs, and restart. The following are explicit gaps rather than
assumptions:

1. `/api/mobile/capabilities`, `/api/mobile/devices`, and `/api/mobile/inbox`
   require a server-owned extension after the contract matrix and scaffold
   establish their implementation paths.
2. A least-privilege mobile projection for logs/status must be confirmed before
   exposing administrative data; the current routes are not silently treated as
   sufficient.
3. Mobile client work remains required for SecureStore/biometric lock, redacted
   SQLite snapshots, reconnect/replay state, native attachment picking, push
   routing, and all mobile UI states.
4. `tests/dashboard/test_mobile_api.py` is the planned server-contract test
   file and does not exist yet. Existing Desktop and gateway tests are evidence
   of current behavior, not substitutes for mobile contract coverage.

### September 8 closure checklist

HM-038 resolves mobile topology/contract choices; HM-039 revalidates the full
matrix after synchronization. Until then, historical Existing labels do not
close these integration gaps:

- Android native login/refresh and MCP OAuth return on separate phone/server
  machines; no assumption that registering an app scheme changes a loopback-only
  server contract.
- Mobile session source/tool availability without a Desktop renderer and without
  mid-conversation prompt/schema rebuilding.
- Missing canonical Bot Chat create/adopt, concurrent creation and compression
  resume, in addition to the already existing registry lookup.
- Device registration identity and redacted read/status reconciliation; online
  revocation versus honest offline local forget. Do not invent an unimplemented
  GET route while implementing the client.
- Generic attachment size contract, non-secret cache projections, bounded log
  redaction/ownership and safe profile/config revisions.
- Actual process topology for restart and Android app background/kill/reconnect.

Current source ownership at the reviewed tag: health/logs in
`hermes_cli/web_routers/status.py`, WS mount in `chat_ws.py`, attachment
helpers in `tui_gateway/prompt_attachments.py`. Other source/test pointers above
remain baseline inventory until verified on the synchronized revision. The new
`session.control.*` surface is recorded for later parity, not a Stage 1 requirement.
