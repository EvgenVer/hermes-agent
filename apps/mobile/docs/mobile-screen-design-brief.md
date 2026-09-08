# Hermes Mobile — Screen Design Input Brief

**Audience:** Codex editing the supplied HTML, Google Stitch, Claude Design, or
another UI-generation tool.

**Revision:** 2026-09-08, following review of Hermes v0.21.1 (`v2026.9.7`),
the current mobile scaffold, and all 36 supplied PNG/HTML pairs. This release
was source-reviewed, not merged or device-tested. This file is the canonical
brief; `docs/design/mobile_screen_design_brief.md` is its identical handoff copy.
Screen IDs remain stable. Section 13 scopes the corrections to existing designs.

**Purpose:** generate a coherent Android-first product UI for Hermes Mobile
before implementation begins. This document is a design input and visual UX
contract; it does not replace the approved product requirements or invent new
server behavior.

**Source of truth:** `SPECIFICATION.md`, `specs/stage-1-agent-control.md`,
`PLAN.md`, and `docs/stage-1-api-matrix.md` in this repository. When a visual
idea conflicts with those documents, preserve the product contract and omit the
idea.

## 1. Master instruction for the design tool

Design one native-feeling Android application called **Hermes Mobile**. It is
a secure control surface for one self-hosted Hermes Agent server, normally
reached over a private Tailscale network. The user must be able to connect,
unlock, manage agent profiles, configure capabilities and routines, use the
canonical Bot Chat, respond to interactive requests, inspect server operations,
and understand connection/offline state.

Generate screens as a reusable design system, not as unrelated illustrations.
Use the same navigation, components, spacing, status vocabulary, form patterns,
and button hierarchy across every screen. Generate high-fidelity mobile frames
and a clickable prototype for the P0 flow; generate P1 screens as additional
frames or component variants when the tool supports them.

Do not generate a website, desktop dashboard, Electron UI, terminal emulator,
or a second chat product. Do not add features from later Hermes stages. Do not
invent API responses, agent data, credentials, notification content, server
capabilities, or settings that are not described here.

The interface language is English. Use realistic but clearly non-sensitive
placeholder data such as `Research Assistant`, `Local Hermes`, and
`anthropic/claude-sonnet`; never use real names, tokens, URLs, prompts, or
secrets. Use neutral avatar placeholders rather than generated portraits.

## 2. Product context

- Platform: Android first, minimum Android 12 / API 31.
- Initial build target: Android API 36; the UI must also remain usable on a
  future API 37 validation device.
- Orientation: portrait first; support common widths around 360 dp and 412 dp.
- Connectivity: one user-configured current Hermes server over HTTPS/Tailscale.
- Authentication: supported Hermes authentication plus a short-lived WebSocket
  ticket; credentials and tokens are never ordinary UI state. Native Android
  sign-in/return must be proven before finalizing F04. Desktop loopback OAuth
  and the configured `hermesmobile://` scheme do not establish that contract.
- Local protection: optional biometric app lock backed by Android Keystore.
- Server authority: Hermes is the source of truth. The app displays confirmed
  data and reconciles after reconnect; it is not an offline write queue.
- First release scope: Stage 1 Agent Control — profiles, configuration, chat,
  interactive requests, notifications, status, logs, and graceful restart.
- Out of scope: multiple servers, public Internet exposure, full Bot Mode,
  global Hermes administration, terminal/files, memory administration, and
  complete Desktop parity.

## 3. UX principles and non-negotiable behavior

1. **Connection state is always visible.** Every authenticated screen has a
   compact connection indicator with states `Connected`, `Reconnecting`,
   `Offline`, `Authentication expired`, and `Incompatible server`.
2. **Security is understandable, not mysterious.** Explain why unlock,
   confirmation, or re-authentication is needed in plain language. Never show
   bearer tokens, WebSocket tickets, API keys, passwords, secret values, or raw
   authorization headers.
3. **Server state wins.** A save is successful only after the server confirms
   it and the app re-reads the affected resource. Show refresh/reconciliation
   states explicitly.
4. **Never retry an ambiguous mutation automatically.** If a create, clone,
   rename, delete, save, routine action, or chat submission has an unknown
   result, show an `Outcome unknown` state, refresh authoritative data, and let
   the user decide.
5. **Offline means read-only.** Cached content is visibly stale, timestamped,
   and all mutations are disabled. Do not make stale data look current.
6. **Destructive actions are deliberate.** Name the target, describe impact,
   require an explicit confirmation, and show progress/result.
7. **Forms protect work without delaying lock.** Warn before voluntary navigation
   or disconnect. Network loss disables saving and marks ordinary local drafts
   unsaved. Biometric/background lock is immediate; redact the screen and clear
   sudo/secret input rather than waiting for a dirty-form dialog. Ordinary
   drafts may remain in protected process memory, never an offline write queue.
8. **Canonical Bot Chat is name-based.** Opening an agent's chat always opens
   the server-resolved `(profile, "Bot Chat")` session. The client must not
   choose a chat by recency, visibility, or a stored session pointer.
9. **Progressive disclosure.** Keep the default view calm and scannable; put
   advanced capability details behind clear sections, sheets, or detail pages.
10. **Accessible status.** Never communicate state by color alone. Pair color
    with text, icon, shape, and a meaningful accessibility label.
11. **Saved is not necessarily active in this conversation.** Capability and
    prompt-affecting settings normally apply to the next session or supported
    cache-safe boundary. Do not promise immediate activation or add an automatic
    prompt/toolset reload to a live conversation.

## 4. Information architecture and navigation

### 4.1 Unauthenticated flow

```text
Launch / restore
  → Welcome / Connect
  → Server URL
  → Authenticate
  → Validate Hermes compatibility
  → Optional biometric setup
  → Agents
```

If validation fails, remain in the connection flow with a recoverable error.
If local biometric lock is enabled, every cold start or protected resume goes to
`Unlock` before exposing server data.

### 4.2 Authenticated shell

Use a four-destination bottom navigation bar with labels and icons:

1. **Agents** — profile roster, create/clone, profile administration.
2. **Chat** — canonical Bot Chat for the selected agent; show a selector when
   no agent is selected.
3. **Operations** — event inbox, server status, logs, and restart.
4. **Settings** — connection, security, notifications, compatibility/about.

The shell has:

- a top app bar with current destination title;
- a compact server connection chip;
- a visible selected-agent name on every profile setting, chat, and interactive
  request; late results from a previously selected profile never replace it;
- a global stale/offline banner below the app bar when needed;
- a consistent back affordance for detail screens;
- a floating or top-level primary action only when it is unambiguous.

### 4.3 Agent detail navigation

The agent detail view uses a profile header and a vertically scrolling section
list or segmented sub-navigation. Required sections are:

- Overview;
- Identity and SOUL;
- Model and provider;
- Capabilities: skills, tools/toolsets, MCP;
- Routines.

The profile header always offers `Open Bot Chat`. It shows the profile name,
avatar, description, model/provider summary, capability counts, and current
server-confirmed status.

## 5. Visual direction and design system

### 5.1 Tone

Create a calm, professional operator console: trustworthy, focused, slightly
technical, and comfortable for repeated daily use. Use restrained Hermes warmth
for the primary accent, clear status colors, generous whitespace, and compact
information cards. Avoid cyberpunk neon, excessive gradients, decorative 3D art,
gamification, glassmorphism, and visually noisy dashboards.

Generate a dark-first theme and provide light-theme variants for the shared
components. If only one theme can be generated, use the dark theme. The design
must remain high contrast in both themes.

Suggested tokens (tune for accessibility, but preserve their semantic roles):

| Role | Dark-theme direction |
| --- | --- |
| Background | deep graphite/navy, not pure black |
| Surface | slightly lighter graphite with clear elevation |
| Primary | restrained Hermes amber/gold |
| Information/connection | accessible blue |
| Success/connected | accessible green |
| Warning/reconnecting | amber/orange distinct from primary |
| Error/destructive | accessible red |
| Primary text | near-white |
| Secondary text | cool gray with sufficient contrast |
| Divider | subtle but visible |

Do not rely on the exact colors above as a backend contract. Every semantic
state must also have a text label and icon.

### 5.2 Layout and typography

- Material 3-compatible Android patterns, adapted for React Native.
- Use the system sans-serif font unless the design tool can provide a stable,
  license-safe font without adding a dependency.
- Minimum touch target: 48 dp; prefer 52–56 dp for primary actions.
- Content horizontal padding: approximately 16–20 dp.
- Use an 8 dp spacing rhythm with deliberate 4 dp exceptions for dense rows.
- Body text: comfortable 16 sp; supporting text: never below 13–14 sp.
- Screen titles: approximately 24–28 sp; section titles: 18–20 sp.
- Keep primary action labels as verbs: `Connect`, `Save`, `Create agent`,
  `Open Bot Chat`, `Restart gateway`, `Delete agent`.
- Respect Android safe areas, keyboard insets, status bar, and bottom gesture
  navigation. Forms must remain usable when the keyboard is open.

### 5.3 Reusable components to design as variants

Create a component library with documented default, loading, disabled, error,
stale, and dark/light variants where applicable:

- app bar and back button;
- connection chip and connection banner;
- bottom navigation;
- profile/avatar card using real Hermes fields, without fictional operator
  departments, clearance levels, cluster locations, or security scores;
- status badge with icon and text;
- primary, secondary, tertiary, and destructive buttons;
- text field, secure field, multiline editor, select field, search field;
- segmented control or profile section tabs;
- skeleton rows and inline progress;
- empty state with one primary next step;
- inline error with safe retry for reads;
- stale/read-only banner;
- confirmation dialog;
- outcome-unknown reconciliation card;
- bottom sheet for approvals, clarification, sudo, and secret entry;
- chat message, tool-progress row, reasoning/status row, and typing/streaming
  indicator;
- attachment chip and attachment picker sheet;
- notification/event row;
- vertically stacked log row with level filter and readable message wrapping;
- toast/snackbar for non-sensitive confirmation;
- modal/sheet for dirty-form warning;
- switch, checkbox, radio row, and disclosure row.

### 5.4 Interaction and motion

- Use short, purposeful transitions for navigation and sheets.
- Use skeletons for initial reads and a compact spinner/progress label for
  mutations; never block the entire shell unnecessarily.
- Keep destructive confirmation visually serious and reversible until the last
  action.
- Disable a submit control after the single request is sent; show the request
  state until authoritative refresh completes.
- Do not animate or stream secret values, tokens, or sensitive notification
  content.

## 6. Global state matrix

The design tool must create state variants, not just happy-path screens.

| State | Required visual treatment | Allowed actions |
| --- | --- | --- |
| Initial loading | Skeletons that preserve final layout | Back where safe |
| Connected | Normal content; green/blue status chip with text | Contract-allowed actions |
| Reconnecting | Persistent banner, progress, no false success | Read; retry connection |
| Offline | Strong stale banner with last-confirmed timestamp | Read cached data; no mutations |
| Auth expired | Re-auth card/sheet; protect cached management content | Re-authenticate or disconnect |
| Incompatible server | Explanation with detected category and safe next step | Replace connection or retry |
| Empty | Explain what is empty and provide one clear next action | Create/connect/etc. |
| Read failure | Localized error and safe read retry | Retry read, back |
| Field validation | Inline field-level error and summary if needed | Correct and resubmit |
| Submitting | Button disabled, explicit progress label | Cancel only if contract allows |
| Confirmed mutation | Refreshing/confirmed state before success message | Continue after refresh |
| Outcome unknown | Do not say success/failure; explain no retry and refresh | Inspect refreshed state; decide |
| Dirty form | Warning before voluntary navigation; immediate redaction on lock | Stay, discard, or save when online |
| Locked | No server data or sensitive cache visible | Unlock or disconnect/forget |

## 7. Screen inventory

The IDs below are stable design references. Each row should become a frame,
variant, or clearly annotated state in Stitch/Claude Design.

### 7.1 Connection and local security — P0

#### F01 — Launch and restore

- Minimal branded launch state with `Hermes Mobile`.
- Restore progress may show `Checking connection` or `Unlock required`.
- Never show a server URL, profile name, message, token, or cached secret.
- Variants: first launch, restoring connected session, locked resume, offline
  restore.

#### F02 — Welcome / Connect to Hermes

- Header: `Connect to Hermes`.
- Short explanation: `Control your self-hosted Hermes server from your phone.`
- Primary action: `Add server` or `Connect`.
- Secondary help text: private HTTPS/Tailscale access is expected; no public
  Internet exposure is required.
- No fake dashboard preview and no agent list before authentication.

#### F03 — Server URL entry

- Field label: `Server URL`.
- Placeholder: `https://hermes.example.ts.net`.
- Supporting text: `Use HTTPS for remote connections. Local development URLs
  may be used only where explicitly permitted.`
- Actions: `Continue`, back.
- States: empty, editing, syntactically invalid, disallowed clear-text remote,
  validating, DNS/TLS failure.
- Do not display or persist credentials in this screen.

#### F04 — Authenticate with Hermes

- Explain the current Hermes sign-in step without asking for raw API keys or
  exposing tokens.
- Primary action should be the supported Hermes sign-in/continue action.
- Show server label/URL in a non-sensitive, user-confirmed form.
- States: waiting for provider, browser/native handoff and app return where
  supported, success, invalid credentials, expired/failed return, provider
  unavailable, cancelled.
- Do not invent `Operator ID`, `Passkey`, a universal token-entry form, or a
  mobile OAuth redirect accepted by the server. Annotate the unresolved return
  contract until HM-038 closes it.
- Include `Use a different server` as a safe escape path.

#### F05 — Compatibility and connection check

- A calm vertical checklist/stepper:
  `Server reachable` → `Hermes identity` → `Authentication` → `Mobile
  capabilities` → `WebSocket ready`.
- Show one current step at a time, then a concise result summary.
- Success action: `Open agents`.
- Failure action: `Try again` or `Change connection`.
- Incompatible state must identify the category, not dump raw server errors.

#### F06 — Local biometric lock

- Explain: `Protect Hermes Mobile when it returns from the background.`
- Offer `Enable biometric lock` and `Not now`.
- Show unavailable/not enrolled/cancelled variants without blocking the user
  from choosing disconnect/forget.

#### F07 — Locked / reconnecting / offline gate

- Locked title: `Unlock Hermes Mobile`.
- Primary action: `Unlock with biometrics`.
- Secondary action: `Disconnect and forget local data` with destructive
  confirmation. Distinguish confirmed online device revocation from offline
  local removal; do not claim remote revocation while the server is unreachable.
- Reconnect variant: `Reconnecting to Hermes…` with safe retry.
- Offline variant: `Offline — showing last confirmed data from [time].` Do not
  reveal protected management data before unlock.

### 7.2 Agent roster and profile lifecycle — P0

#### A01 — Agents roster

- Default authenticated destination.
- App bar title `Agents`, connection chip, optional refresh action.
- Profile cards show avatar, name, short description, model/provider, capability
  counts, and a small activity/canonical-chat hint.
- Primary action: `Create agent`; secondary overflow/action: `Clone agent`.
- States: loading skeleton, connected list, refreshing, read failure, offline
  stale list, profile selected.

#### A02 — Empty agents state

- Title: `No agents yet`.
- Explain that profiles are created on the Hermes server.
- Primary action: `Create agent`.
- Secondary action only if a clone source exists: `Clone an agent`.
- Keep the connection chip visible.

#### A03 — Create agent

- Prefer a focused modal or full-screen form with fields: `Name`, `Description`,
  optional initial `Model`, `Provider`, and clearly grouped initial capability
  choices only if the server contract supports them.
- Primary action: `Create agent`.
- States: validation, name collision, submitting, confirmed-and-opening,
  outcome unknown.
- After success, show the server-returned profile and open its detail view.
- Use only supported fields; no department, clearance, agent-version, or
  resource-allocation controls. Reuse this form for the A04 clone variant.

#### A04 — Clone agent

- Show explicit source selector: `Clone from`.
- Explain whether capabilities/configuration are included; do not imply a
  clone if the server has not confirmed it.
- Primary action: `Clone agent`.
- States: missing source, validation, submitting, outcome unknown, refreshed
  target profile.

#### A05 — Agent overview

- Profile header: avatar, name, description, server-confirmed status.
- Primary CTA: `Open Bot Chat`.
- Summary cards/rows: identity, model/provider, skills/tools/MCP counts,
  routines, last confirmed update.
- Actions: `Edit`, `Rename`, `Clone`, `Delete agent`.
- Variants: loading detail, offline read-only, stale detail, missing/stale
  selected profile. Do not add `Restart agent`; the scoped restart operation
  belongs to the messaging gateway in O04.

#### A06 — Delete agent confirmation

- Dialog names the exact profile: `Delete “Research Assistant”?`.
- State impact in plain language: server-side profile and associated data may
  be removed according to Hermes rules.
- Actions: `Cancel` and destructive `Delete agent`.
- Variants: delete disabled by server rules, submitting, confirmed return to
  refreshed roster, outcome unknown.

#### A07 — Mutation outcome unknown

- Reusable reconciliation card/dialog for create, clone, rename, delete, and
  save operations.
- Title: `Outcome unknown`.
- Copy: `The connection ended before Hermes confirmed the result. We did not
  retry the request. Refresh the server state to see what changed.`
- Actions: `Refresh server state`, `Back`, and only after refresh a contextual
  next action.

### 7.3 Agent administration — P0/P1

#### E01 — Identity and description editor (P0)

- Fields: display/name identity as supported, description, avatar row.
- Avatar actions: choose image, remove, preview; show size/type validation.
  Reviewed server formats are PNG/JPEG/WebP with a 2 MiB cap; do not offer GIF
  or invent a 1 MiB restriction or a description character limit.
- Sticky or bottom `Save changes` action with dirty indicator.
- States: clean, dirty, field errors, saving, confirmed refresh, outcome
  unknown, offline disabled.

#### E02 — SOUL editor (P0)

- Full-screen plain-text/Markdown SOUL editor with readable line height and
  character/size guidance only if the server contract provides a limit. This is
  agent identity/instruction text, not a JSON engine/configuration editor.
- Header shows profile name and unsaved indicator.
- Actions: `Save changes`, `Cancel`/back with dirty warning.
- Do not render SOUL content in notifications, logs, analytics, or screenshots
  used as sample data.

#### E03 — Model and provider (P0)

- Clear two-step selection: `Provider` then compatible `Model`.
- Show current confirmed selection and a short explanation of change impact.
  Choices come from the server's current provider/model catalog, not a frozen
  shortlist. This editor must be reachable for an existing agent, not only
  during creation; do not add speculative tuning or engine presets.
- States: loading choices, incompatible selection, saving, offline read-only,
  outcome unknown.

#### E04 — Capabilities hub (P0)

- Profile-scoped page with three clear sections: `Skills`, `Tools & toolsets`,
  `MCP servers`.
- Show counts and high-level enabled/disabled summaries.
- Never show secret-bearing environment values.
- Distinguish a confirmed saved setting from activation in an existing chat.
  Preserve prompt caching: no promise that saving immediately changes the
  active conversation's tools, skills, or system prompt.

#### E05 — Skills management (P1)

- Search/filterable list of server-confirmed skills with enabled state and
  profile scope.
- Skill detail may show safe descriptive/content text, but mark it as server
  content and never execute it in the client.
- Toggle/save states: pending, confirmed, error, outcome unknown, offline.

#### E06 — Tools and toolsets (P1)

- Toolset rows with enabled/disabled state, purpose, and safe summary.
- Advanced configuration is progressively disclosed.
- API keys, env values, and credential fields are masked or omitted entirely.
- Show current saved configuration and, when relevant, `Applies to the next
  session`. Reflect the real server activation boundary; do not show
  `Changes apply immediately` or a speculative `Restart agent` action.

#### E07 — MCP servers (P1)

- MCP means **Model Context Protocol**. Show a redacted server list with name,
  transport, enabled state, and real connection or last-test status.
- Actions: `Add server`, `Edit`, `Test connection`, `Enable`, `Remove`.
- Add/edit form: name plus supported HTTP/SSE URL or stdio command/arguments,
  with advanced options collapsed. Do not invent raw TCP or WebSocket transport
  presets, mission-control terminology, or fictional ping/health measurements.
- API key/OAuth screens use secure write-only fields; never show stored values.
  Include sign-in start, waiting, cancelled, expired and return-failed states;
  the Android/server return path needs HM-038 proof.
- Test timeout, auth expiry, duplicate name, and outcome unknown variants.

#### E08 — Routines list (P0)

- Profile-scoped list with routine name, schedule, enabled state, next run,
  last run/result.
- Actions: `Create routine`, per-row edit, enable/disable, run now, delete.
- Use readable schedule summaries and a clear server/profile scope label.
- States: loading, empty, read-only stale, run pending, error.

#### E09 — Routine editor (P0)

- Fields: name, task/prompt, schedule, enabled state, and supported delivery
  destination. The routine must say what Hermes will do and where its result
  goes. Display the authoritative schedule timezone; do not silently convert
  server-local scheduling into the phone's timezone.
- Explicit preview of `Next run` only when provided or reliably derived from
  the server contract. Existing model/provider/skills/script and other advanced
  fields survive a partial edit even when this simple form does not expose them.
- Omit invented `Requires confirmation` / `Silent mode` flags and workflow,
  goals, loop, or heartbeat builders.
- Actions: `Save routine`, `Run now`, `Delete routine` with confirmation.
- Dirty, validation, saving, confirmed refresh, and outcome-unknown variants.

#### E10 — Unsaved changes warning (P0)

- Modal title: `Discard unsaved changes?`.
- Copy explains that local edits have not been confirmed by Hermes.
- Actions: `Keep editing`, `Save changes`, `Discard`.
- Trigger before voluntary back, tab switch, or disconnect. On connection loss,
  retain ordinary local edits and disable save. On background/biometric lock,
  redact immediately and clear sensitive input; never delay lock for this dialog.

### 7.4 Canonical Bot Chat and interactive requests — P0

#### C01 — Bot Chat empty/ready

- Header shows profile avatar/name and `Bot Chat` identity.
- Explain that this is the profile’s canonical conversation.
- Scroll area empty state with one concise prompt suggestion, not fabricated
  agent content.
- Composer with text field, attachment button, send button, and safe disabled
  states.
- Show selected profile and connection state at all times.

#### C02 — Bot Chat streaming

- Render user message, cumulative assistant response, reasoning/status indicator
  where allowed, tool-progress rows, and final assistant response.
- Keep streaming visually stable; do not duplicate final content.
- Composer states: sending, turn active, queue/steer/interrupt controls as
  permitted by server state.
- Never expose secret request values or internal authorization details.

#### C03 — Tool progress and turn controls

- Compact expandable tool row with tool name, safe progress summary, and
  `Running`, `Completed`, or `Failed` state.
- Clear actions: `Interrupt`, `Steer`, `Queue` only when valid for the current
  session state.
- Show rejected/stale/busy control results inline without losing chat context.

#### C04 — Composer and attachments

- Multiline composer with send, attachment, and optional queue affordances.
- Attachment sheet offers supported image, PDF, and generic file choices only
  where contract/capability allows.
- Show only a safe filename/type/size and upload state in the chip; keep local
  content URIs and device paths internal. The attachment remains local until
  a supported upload/submission path accepts it.
- Enforce and display limits: images up to 25 MiB, PDFs up to 50 MiB/25 pages;
  generic-file limit must be presented only when server/mobile contract defines
  it.
- Variants: keyboard open, multiline text, remove before send, unsupported type,
  too large, upload failure, pending attachment, ambiguous submission, and send
  disabled while invalid. Keep composer, send, and bottom navigation clear of
  the keyboard and each other.

#### C05 — History and resume

- History is older messages in the selected agent's canonical `Bot Chat`.
  Show ordered message rows, an older-message paging affordance, and loading.
- Do not add a per-bot session browser or select the canonical chat from a
  session list. Opening the agent always resolves the exact name registry.
- States: no history, loading older messages, stale session, reconnect reload;
  preserve the reader's position while loading older messages.

#### C06 — Approval request

- High-priority modal/bottom sheet over the active chat.
- Show safe action summary, target session context, and explicit choices such as
  `Approve` / `Deny` when provided by the request.
- Disable response controls immediately after one submission.
- Variants: pending, submitting, answered, expired, stale, invalid response.

#### C07 — Clarification request

- Clearly distinguish the question from ordinary chat messages.
- Show available choices or a text response field, required/optional status,
  and `Submit answer`.
- Support both one question and a batch, including multiple selection only
  when requested. Track each question's ID and pending/answered state; an answer
  must not dismiss still-unanswered questions.
- Correlate to the owning profile/session/request; disable each submitted answer
  while its result is pending. Do not automatically resend on reconnect or
  promise network-level exactly-once delivery.

#### C08 — Sudo request

- Show the server's safe explanation and a **masked password field**: the
  reviewed `sudo.respond` contract submits `password`, not an allow/deny choice.
- Actions: `Submit password` and only a supported cancellation path. A shared
  secure-input component with C09 is sufficient; no extra product destination.
- Clear input after submit/background/expiry, disable duplicate submission,
  and use the same stale/submitted/outcome-unknown variants as other requests.

#### C09 — Secret request

- Secure masked input with no reveal by default, no copy-to-clipboard action,
  and no value in navigation previews or screenshots.
- Clear copy: `Sent securely to your Hermes server. Hermes may save it in the
  selected profile's configuration.` Never promise temporary-only storage,
  end-to-end encryption beyond the actual transport, or a fictional Target Node.
- Actions: `Submit securely`, `Cancel` if the server contract allows.
- After submit, background, expiry, or context change, clear the field and
  disable duplicate submission. Input must not appear in logs, snapshots,
  notification previews, or navigation state.

#### C10 — Chat reconnect and replay

- Banner/card: `Connection lost. Reconnecting…` followed by
  `Reconnected. Checking for missed events…`.
- Show replay/reconciliation progress without duplicating messages or tool
  rows.
- If replay gap or session mismatch occurs, show `Refresh conversation`.
- While disconnected, block new mutations and make the stale boundary obvious.
- On a replay gap or stale scope, reconcile with server snapshots instead of
  rendering missing events as success. Expiry can arrive as `*.expire` or as a
  successful RPC envelope carrying `status: expired`; both close/disable the
  request honestly. Late replies from another profile never affect this chat.

### 7.5 Operations, notifications, and recovery — P0/P1

#### O01 — Activity inbox

- Group generic completion, error, and approval events by time/category.
- Notification rows must not reveal prompt text, response text, secret values,
  agent names, or sensitive payloads by default.
- Unread/read state and `Refresh`/`Mark read` may be shown only if contract
  supports them.
- Tapping an event opens the relevant safe destination after unlock and
  authoritative refresh. Handle expired requests, deleted profiles, stale
  sessions and duplicates; a push never directly authorizes an action.
- No fictional deployment/activity feed, `Restart agent`, or sensitive payload
  toggle. Device/inbox registration is a server gap until implemented.

#### O02 — Server status

- Cards for reachability, Hermes identity/version, selected profile status,
  WebSocket state, and last checked time.
- Separate public liveness from authenticated administrative details.
- State badges: connected, degraded, reconnecting, offline, incompatible.
- Provide `Refresh status` and link to `Logs`. Omit invented region/cluster,
  CPU/memory gauges or capability health unless the actual projection supplies
  them. Label server-wide and selected-profile information accurately.

#### O03 — Logs

- Authenticated **bounded recent-log tail**, with file/level/component/search
  filters supported by the server. The reviewed API returns `{file, lines}`
  without an offset or total; do not design page totals, a full archive, live
  tail, or export unless separately required.
- Use vertical rows with timestamp/level and a wrapped message; a wide table
  must not clip the useful message on a phone. Keep filters in a compact sheet.
- The existing route is bound to the serving HERMES_HOME and has no profile
  selector parameter. Label that scope honestly; redaction and least-privilege
  projection need verification before release.
- Redact credentials, authorization headers, secret values, and sensitive
  payloads. Do not design a raw unrestricted file browser.
- States: loading, empty filter result, access denied, timeout, stale/offline.

#### O04 — Restart gateway

- Confirmation screen/dialog: `Restart Hermes gateway?`.
- Explain a possible interruption to messaging and that a fully stopped Hermes
  process cannot restart itself. The messaging gateway and the serving/control
  process are different; the app's socket may remain connected.
- Actions: `Cancel`, destructive/service action `Restart gateway`.
- Progress sequence: requested → checking gateway state → reconnecting if needed
  → confirmed gateway recovery and refreshed status. A helper exit, HTTP
  acknowledgement or public health response alone is not recovery proof.
- Include timeout/error/outcome-unknown states; do not promise a fixed recovery
  duration, that all agents halt, or that the socket must close.

### 7.6 Settings and persistent preferences — P1

#### S01 — Settings home

- Sections: connection, security, notifications, compatibility/about.
- Show current server label and connection status without credentials.
- Keep destructive `Disconnect and forget` visually separated. Use navigation
  rows for detailed settings rather than duplicating contradictory controls.

#### S02 — Connection settings

- Show normalized server URL/label, Hermes identity/version, compatibility
  result, last successful connection, and actions `Reconnect`, `Replace server`,
  `Disconnect`, `Forget local data`.
- Dirty replace flow uses the unsaved/confirm patterns.

#### S03 — Security settings

- Biometric lock toggle and state: enabled, disabled, unavailable, not enrolled.
- Explain local protection and Keystore-backed storage in user language.
- Never display credential contents; offer `Disconnect and forget local data`
  with explicit confirmation. This removes local access, not remote server data.
- Use Android biometric terminology, not Face ID/Touch ID. No key reveal, remote
  wipe or speculative security score. Backup exclusions are an implementation
  requirement, not a promise inferred from the presence of SecureStore.

#### S04 — Notification settings

- Permission state, generic notification categories (completion, error,
  approval), and registration/revocation status.
- Explain that push notifications contain only generic completion/error/approval
  information, without prompt/response text or agent names.
- Handle permission denied with an Android settings path, registration pending,
  provider unavailable, confirmed revocation, ambiguous revocation, and offline
  local forget. Never show `Registered` before authoritative confirmation.

#### S05 — Compatibility and about

- App version, mobile contract version, Hermes version, supported platform
  baseline, and links/help text only when supplied by the product.
- Display separate app version, Hermes release, and negotiated mobile contract;
  do not invent a protocol number or claim that a version string proves support.
  Missing negotiation means compatibility is unconfirmed, not successful.
- Show `Incompatible server` diagnostics as categories and next steps, never
  raw sensitive responses; block unsupported mutations.

## 8. Critical cross-screen flows to prototype

The clickable prototype must include these complete paths:

1. First launch → enter Server URL → authenticate → compatibility success →
   Agents empty state → create agent → Agent overview.
2. Agents roster → select profile → edit identity → dirty-form warning → save →
   server-confirmed refreshed overview.
3. Agent overview → Open Bot Chat → send text → streaming/tool progress → final
   response.
4. Active chat → approval request → approve once → request closes and stream
   continues.
5. Active chat → secret request → masked entry → submit once → field clears.
6. Any authenticated screen → network loss → stale/read-only state →
   reconnect/replay → authoritative refresh.
7. Operations → Server status → Logs → Restart gateway → actual gateway
   recovery (reconnect only if needed) → refreshed status.
8. Agent roster → Delete agent → explicit confirmation → refreshed roster.

## 9. Design-to-contract mapping

Use these mappings as annotations in the generated design file. They prevent a
screen from being designed without a behavior owner.

| Design area | Matrix contracts | Requirements/scenarios |
| --- | --- | --- |
| F01–F07 connection/security | `CON-001`–`CON-005` | `UR-01`, `UR-02`, `SC-01`–`SC-03` |
| A01–A07 profile lifecycle | `ADM-001`–`ADM-004` | `UR-03`, `SC-04`–`SC-07` |
| E01–E10 administration | `ADM-004`, `CAP-001`–`CAP-004` | `UR-04`, `SC-08`, `SC-09`, `SC-13` |
| C01–C10 chat and requests | `INT-001`–`INT-006` | `UR-05`, `UR-06`, `SC-10`–`SC-12` |
| O01–O04 operations/recovery | `OPS-001`–`OPS-004` | `UR-07`–`UR-09`, `SC-14`–`SC-17` |
| S01–S05 persistent settings | `CON-004`, `CON-005`, `OPS-003` | `UR-01`, `UR-02`, `UR-07`, `SC-03`, `SC-14` |

Known server/client gaps must appear as visibly safe UI states, not silently
designed away: mobile capability negotiation, push device registration/inbox,
least-privilege log/status projection, native Android auth/MCP return, mobile
session capability gating, canonical missing-chat create/adopt, reconnect/replay,
secure local cache, and generic-file attachment limits.

## 10. Copy and content rules

- Use concise English copy and sentence case.
- Prefer direct labels: `Connected`, `Offline`, `Refresh`, `Save changes`,
  `Outcome unknown`, `Unlock Hermes Mobile`.
- Explain causes and next actions; do not display raw stack traces or JSON.
- Never put secrets or sensitive agent/session content in push notification
  previews, lock-screen text, logs, cache examples, screenshots, or sample
  data.
- Do not imply that a request succeeded before server confirmation.
- Do not say `Retry` for an ambiguous mutation; use `Refresh server state`.
- Destructive copy must identify the target and consequence.

## 11. Deliverables expected from the design work

1. A coherent Android mobile design system with color, typography, spacing,
   elevation, icons, buttons, fields, cards, banners, dialogs, sheets, and
   chat components.
2. High-fidelity P0 frames for F01–F07, A01–A07, E01–E04, E08–E10, C01–C10,
   and O01, O02, O04, plus P1 frames for the remaining inventory.
3. Light and dark variants for the shell, forms, banners, dialogs, chat, and
   status components.
4. Component/state variants for loading, empty, error, offline, stale, locked,
   submitting, confirmed, outcome unknown, dirty, and expired requests.
5. A clickable prototype covering all flows in section 8.
6. Developer annotations for screen ID, component names, state, navigation
   destination, and contract mapping.
7. Exportable assets only where necessary; use vector/icon primitives and
   avoid adding a font or image dependency without separate approval.

## 12. Acceptance checklist for the generated design

- [ ] The app is recognizably one product, not a collection of unrelated pages.
- [ ] The first authenticated destination is useful for an empty or populated
      profile roster.
- [ ] Connection state and stale/read-only mode are visible on every relevant
      screen.
- [ ] Every write has loading, confirmed, validation/error, and outcome-unknown
      treatment.
- [ ] Every destructive action has a named-target confirmation.
- [ ] Chat supports streaming, tools, attachments, history, controls, and all
      four interactive request types.
- [ ] Secrets are masked/omitted and never appear in examples or notifications.
- [ ] Canonical Bot Chat is shown as a server-resolved profile chat, without
      recency or stored-pointer UI.
- [ ] Forms handle keyboard, safe area, unsaved changes, and offline state.
- [ ] All status colors have text/icon equivalents and meet contrast needs.
- [ ] The design contains no Desktop-only, Stage 2, or Stage 3 feature work.
- [ ] The P0 prototype can be reviewed without any backend or credentials.
- [ ] Sudo accepts a masked password; clarification covers batch questions and
      expiry; successful RPC transport is not mistaken for an accepted answer.
- [ ] SOUL is text/Markdown, MCP uses supported transports, and routines include
      the task and delivery destination.
- [ ] The HTML and PNG exports agree; no screen is blank, clipped by its composer,
      or dependent on fonts/icons that fail to load.
- [ ] All 43 inventory IDs map to an existing frame or an explicit variant.

## 13. September 8 revision scope

The supplied set has 36 PNG/HTML pairs. Preserve its restrained navy/gold visual
direction and four main destinations. Corrections are mostly content, controls,
and states; a large new screen set or a change of design tool is unnecessary.

| Work | Existing designs to fix or complete | Minimal addition |
| --- | --- | --- |
| HM-044 connection/shared UI | Launch, connection, URL, authentication, compatibility, biometrics, lock; repair blank URL export | Error/offline/return variants and consistent navigation |
| HM-045 profile lifecycle | Roster, create, overview, identity | E03 model/provider form; A04 clone variant, A06 delete dialog, A07 shared outcome-unknown state |
| HM-046 administration | SOUL, capabilities, skills, tools, MCP list, routine list/editor | MCP add/edit form; saved-versus-active and OAuth states |
| HM-047 interaction | Chat, history, all four request types | C04 composer/attachment sheet; C03 controls and C10 reconnect/replay variants |
| HM-048 operations/settings | Inbox, status, logs, restart, settings, unsaved warning; repair blank restart export | Reuse confirmation/unknown/expiry variants |
| HM-049 handoff | All corrected frames and both copies of this brief | One local clickable index for the eight critical flows |

Only three new design directories are expected: `model_and_provider`,
`mcp_server_editor`, and `composer_and_attachments`. Reuse forms and shared
variants for the other missing inventory positions. Each variant must have a
clear screen ID and a visible path in the prototype; do not count an annotation
alone as a designed state.

HTML is an editable review artifact, not React Native production code. Codex can
correct it and capture matching PNGs; Stitch is optional for alternative visual
exploration. Render the actual HTML for exported PNGs instead of independently
generating bitmap approximations. Use local assets/system fonts, 360/412 dp
frames, and keyboard-open/large-text checks. Keep the brief and its design-tool
copy identical when requirements change.
