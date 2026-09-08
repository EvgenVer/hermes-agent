# PLAN — Hermes Mobile
<!-- Approved technical architecture and rolling-wave execution policy.
     Dependency installation still requires vetting; high-risk operations
     retain separate approval gates. -->

## Architecture

Use a React Native application managed with Expo and written in TypeScript. It
lives in the existing npm workspace at apps/mobile and is built with Expo
development/release builds rather than depending on Expo Go.

Module boundaries:

- app/: Expo Router route composition and screen-level navigation.
- src/features/: vertical feature slices for connection, profiles, configuration,
  routines, chat, notifications, and server operations.
- src/domain/: platform-neutral entities, capability rules, state machines, error
  categories, and runtime response parsers.
- src/api/: Hermes REST adapter, JSON-RPC adapter, authentication/ticket flow, and
  typed contract mapping.
- src/storage/: SecureStore credential vault and SQLite read-only snapshot cache.
- src/platform/: biometric lock, push registration, notification routing,
  attachment pickers, app lifecycle, and network state.
- src/ui/: mobile design primitives, accessibility conventions, loading/error/stale
  patterns, and destructive confirmation.

Hermes remains the source of truth. React Query coordinates server reads and
explicit invalidation; SQLite provides a redacted last-confirmed snapshot, not an
offline write queue. Feature state machines own ambiguous mutations and WebSocket
reconnect/replay behavior.

The mobile package may consume platform-neutral exports from @hermes/shared,
especially WebSocket URL handling and JsonRpcGatewayClient. If a shared module
assumes browser globals, refactor it behind injected fetch/socket/clock interfaces
with tests used by both Desktop and Mobile. Mobile never imports apps/desktop.

Server changes are limited to proven gaps in mobile authentication/return handling,
session-surface negotiation, canonical chat creation/adoption, safe administrative
reads, attachment limits, and push registration/event inbox behavior. These are
candidate gaps, not authorization to build a replacement API. Reuse existing
contracts first and extend their owning modules only after evidence of a gap.
General agent behavior remains server-owned.

## Stack & package managers

- Language: TypeScript with strict mode.
- Client runtime: React Native with the current vetted Expo SDK at implementation
  time.
- Android platform policy: minSdk 31 (Android 12), initial compileSdk/targetSdk 36
  with the stable Expo toolchain, and compatibility testing on API 37 (Android
  17). Advance compile/target when a stable vetted Expo release supports API 37.
- Navigation/build configuration: Expo Router and Expo config/CNG.
- Workspace/package manager: repository-standard npm workspaces and root lockfile.
- Android tooling: Expo local Android build plus Gradle/Android SDK; signed APK
  artifacts produced without committing signing material.
- Server extensions: existing Python/FastAPI Hermes modules and existing Python
  package management.
- CI: existing repository checks plus mobile-specific npm scripts and targeted
  pytest contract tests.

Before scaffolding, dependency vetting must confirm Expo/React/React Native version
compatibility with the monorepo. The install must use Expo-compatible versions and
verify that only one React Native version is linked into the mobile build.

## Selected dependencies

Dependency vetting completed on 2026-08-26. The accepted versions and rejected
alternatives are consolidated in [docs/dependencies/README.md](docs/dependencies/README.md);
each evidence file records registry identity, compatibility, license/type,
maintenance, risks, and the installation gate.

- [Expo/React runtime](docs/dependencies/expo-runtime.md): `expo~57.0.12`,
  `react@19.2.7`, `react-native@0.86.2`, `typescript@6.0.3`, and
  `@types/react@19.2.17`.
- [Expo Router and Android build](docs/dependencies/expo-router-build.md):
  `expo-router~57.0.12`, `expo-build-properties~57.0.10`,
  `expo-constants~57.0.10`, `expo-linking~57.0.5`,
  and `react-native-safe-area-context~5.6.2`; Android minimum API 31, initial compile/target API
  36, and API 37 forward-compatibility validation.
- The root npm workspace also declares `expo-router@57.0.12` as a dev-only
  peer-resolution dependency because Expo CLI is hoisted there while the app
  keeps its direct runtime dependency.
- [Hermes shared transport](docs/dependencies/hermes-shared.md): local
  `@hermes/shared`; reuse its reconnect/replay client after the recorded
  structural WebSocket portability edit.
- [Connectivity/state](docs/dependencies/connectivity-state.md):
  `@tanstack/react-query@5.101.2` and
  `@react-native-community/netinfo@12.0.1`.
- [Credential security](docs/dependencies/credential-security.md):
  `expo-secure-store~57.0.1` and
  `expo-local-authentication~57.0.2`.
- [SQLite](docs/dependencies/sqlite.md): `expo-sqlite~57.0.1` for bounded,
  redacted snapshots only.
- [Notifications and push](docs/dependencies/notifications-push.md):
  `expo-notifications~57.0.10`, Expo Push HTTPS, and existing Hermes
  `httpx[socks]==0.28.1`; no new Python provider SDK.
- [Attachments](docs/dependencies/attachments.md):
  `expo-document-picker~57.0.1` and `expo-image-picker~57.0.9`.
- [Testing](docs/dependencies/testing.md): `jest-expo~57.0.4`,
  `@testing-library/react-native@14.0.1`, `@types/jest@29.5.14`,
  `eslint@9.39.5`, `eslint-config-expo~57.0.1`,
  `test-renderer@1.2.0`,
  `jest@29.7.0`, and `@react-native/jest-preset@0.86.2`; Android
  SDK/emulator/`adb` smoke harness, not Detox. `jest-expo`'s transitive
  `react-test-renderer@19.2.3` is not a direct dependency.

The screen-level design input is maintained in
[`docs/mobile-screen-design-brief.md`](docs/mobile-screen-design-brief.md).
It derives from the approved Stage 1 requirements and API matrix, and must be
reviewed before connection/security UI implementation begins. It is not a new
runtime dependency and does not change the server contract.

No additional global-state or query-persistence package is selected initially.
React Query owns remote data and feature-local reducers own narrow workflows.
Avoid distant state prop chains; if shared UI state actually appears, follow the
repository's small feature-owned nanostore convention after dependency vetting.
Do not create a parallel state framework for the placeholder shell.

## Data / API / integrations

- REST handles connection validation, profiles/configuration, routines, health,
  logs, and restart operations through `hermes_cli/web_server.py` and the
  extracted routers under `hermes_cli/web_routers/`.
- Native sign-in uses the existing RFC8252 flow in
  `hermes_cli/dashboard_auth/routes.py`: the mobile client generates S256 PKCE
  state, listens on an ephemeral phone-local `127.0.0.1` callback, opens the
  returned system-browser URL, exchanges the one-time code at
  `POST /auth/native/token`, and rotates credentials at
  `POST /auth/native/refresh`. The server allowlist is loopback HTTP only;
  Expo app-link configuration is not a substitute for this contract.
- `POST /api/auth/ws-ticket` (from `hermes_cli/dashboard_auth/routes.py`) mints
  the existing short-lived ticket; `/api/ws` is mounted by
  `hermes_cli/web_routers/chat_ws.py` and handled by `tui_gateway/ws.py`.
  Ticket support is separate from the native sign-in flow and does not remove
  the Android proof requirement.
- `/api/ws` JSON-RPC handles session lifecycle, streaming, turn control, and
  interactive requests. The reusable platform-neutral client is exported from
  `apps/shared/src/json-rpc-gateway.ts` via `apps/shared/src/index.ts`.
- MCP OAuth for a remote home server reuses `mcp.servers.oauth.start` with a
  phone-local loopback `client_redirect_uri`, then relays the callback through
  `mcp.servers.oauth.callback` and waits on `mcp.servers.oauth.poll`. The server
  stores the MCP tokens; the phone does not receive or persist them. This flow
  applies to URL-based OAuth MCP servers, not stdio or API-key-only servers.
- `session.create` and every `session.resume` from Mobile must send
  `source: "mobile"`; create persists it and resume must reassert it rather
  than relying on the backend environment fallback. Session source, not the
  backend process environment, gates the tool surface: Mobile receives the
  project surface but not Desktop renderer tools. Resume/reconnect must not
  rebuild the existing conversation's cached prompt or tool schema.
- Canonical Bot Chat reuses exact `(profile, title: "Bot Chat")` lookup,
  including hidden rows and the resolved compression tip. Existing rows resume
  normally; an absent row still needs a server-owned atomic create/adopt path
  that rechecks the registry before minting. No stored pointer, recency or
  visibility fallback, or per-bot session browser is permitted.
- Current profile/capability REST sources are
  `hermes_cli/web_routers/profiles.py`, `sessions.py`, `skills.py`, `mcp.py`,
  `cron.py`, and `tools.py`; current profile/session RPC handlers are in
  `tui_gateway/methods_profiles.py`, `methods_session.py`,
  `methods_prompt.py`, and `methods_tools.py`.
- GET /api/mobile/capabilities is the proposed version/capability handshake.
- /api/mobile/devices and /api/mobile/inbox are the proposed authenticated push
  registration and post-unlock event refresh surfaces.
- Push payloads are generic and opaque. Sensitive data is fetched directly from
  Hermes over the authenticated Tailscale path after unlock.
- Tailscale is external network infrastructure, not an SDK dependency. The app
  diagnoses reachability but does not manage the user's tailnet.
- SecureStore holds credentials and push delivery tokens. SQLite holds only
  redacted confirmed reads and schema metadata.
- Every mutation uses a single explicit submission. An ambiguous response triggers
  authoritative refresh rather than automatic retry.
- Server compatibility uses Hermes identity, current version, mobile contract
  version, and named capabilities rather than user-agent guessing.

## Validation strategy

Existing scaffold checks (previous results are historical, not a fresh run):

- npm run typecheck --workspace apps/mobile
- npm run lint --workspace apps/mobile
- npm run test --workspace apps/mobile
- npm run check --workspace apps/shared

Planned checks that are not implemented yet:

- `scripts/run_tests.sh tests/dashboard/test_mobile_api.py` — server test file absent.
- `npm run build:android --workspace apps/mobile` — script absent; HM-043 owns it.
- `npm run test:e2e:android --workspace apps/mobile` — script absent; HM-043 owns it.

Select targeted existing Python files from the synchronized API matrix and run
only through `scripts/run_tests.sh`. Use real imports with temporary HERMES_HOME
(and HOME for profile paths). Never validate against the owner's live state.

Validation layers:

- Design review against the screen inventory, global state matrix, cross-screen
  flows, accessibility requirements, and API-matrix mapping before UI coding.
- Pure unit tests for URL/auth redaction, parsers, reducers, reconnect, cache
  policy, and ambiguous mutations.
- REST/JSON-RPC contract tests against Hermes fixtures.
- React Native component tests for user-visible states and destructive gates.
- Android 12 and Android 17 emulator/device integration for Keystore, biometrics,
  lifecycle, notifications, attachments, and SQLite migrations.
- One physical-device Stage 1 acceptance run over Tailscale outside the home LAN.
- Secret scan and security review before release because the feature touches
  authentication, local storage, push registration, and administrative data.

No AI eval is planned because the mobile project must not alter prompts, routing,
or agent reasoning. If implementation reveals a required agent-behavior change,
stop and run the AI eval-design gate.

## Implementation phases

Execution uses rolling-wave decomposition. TASKS.md exposes only the nearest
work whose contracts, files, checks, dependencies, and parallel eligibility are
known. Later milestones remain blocked decomposition gates. After the contract
matrix or scaffold resolves their exact interfaces and paths, expand one wave,
run a cross-document consistency check, and stop for explicit approval before
executing it. The milestones below describe sequencing; they are not executable
tasks by themselves.

1. **Contract inventory and decisions** — map every Stage 1 Desktop action to a
   canonical REST/JSON-RPC contract; approve application ID and push provider;
   identify only genuine server gaps — verified by a checked
   endpoint/capability matrix.
2. **Dependency and workspace foundation** — vet the proposed packages, scaffold
   Expo in apps/mobile without overwriting toolkit/docs, integrate npm workspace
   scripts, and prove an Android development build — verified by clean install,
   typecheck, lint, unit smoke test, and emulator launch.

Before phase 3, the mobile screen design brief is the required UX gate: the
connection/security, agent administration, chat, operations, and settings
states must have reviewed layouts and navigation before implementation tasks
are expanded.

3. **Connection contracts and prerequisites** — resolve Android login/refresh and
   MCP return paths, mobile session surface, and the capability handshake. Implement
   only the server pieces that block a real client connection, with contract tests.
   Do not finish a mock-only client while its mandatory handshake route is missing.
4. **Connection and security foundation** — implement the shared transport
   portability edit, URL/ticket flow, SecureStore, biometric gate, lifecycle,
   reconnect, and redacted snapshots. Complete remaining minimal server gaps,
   including device registration/inbox and opaque push delivery, alongside the
   client feature that consumes them.
5. **Agent administration** — implement profile CRUD/clone, identity/avatar/SOUL,
   model/provider, skills, tools/toolsets, MCP, and routines — verified by
   component tests and an end-to-end create/configure/delete flow.
6. **Agent interaction** — implement canonical Bot Chat, history/resume,
   streaming/tool progress, attachments, approvals/clarifications/sudo/secrets,
   interrupt/steer/queue, and reconnect replay — verified against gateway fixtures
   and a real profile.
7. **Operations and background delivery** — implement status/logs/restart,
   notification permissions/registration, generic notifications, post-unlock
   refresh, and recovery UI — verified with background/killed-app and gateway
   restart scenarios.
8. **Release hardening** — accessibility, performance, cache migrations,
   observability redaction, security review, physical-device acceptance, signing,
   APK build, and GitHub Release documentation — verified by the full mobile check
   suite and signed APK installation.
9. **Later parity stages** — plan and deliver full Bot Mode, global Hermes
   administration, and remaining Desktop parity through separate approved feature
   specifications.

## September 8 review and next work

The owner approved the release/design corrections on 2026-09-08. The current
checkout is the normal merge `ddde04baf8da57b20fd184eda8e29d5424f0fd0a` on
`feat/mobile-app`, whose second parent is the reviewed upstream target
`22488b8c62d3c92f25149053ae8df68fb0afcb35` (247 commits after release tag
`v2026.9.7`). No Android device run is claimed.
[Baseline evidence](docs/upstream-baseline.md) separates those states.

Retain Expo, one server, Tailscale, canonical Bot Chat, and Stage 1 scope.
Do not add goals/loops/heartbeat panels, browser annotations, full orchestration,
an offline write queue, or a generic compatibility framework for old releases.

Integration decisions to close before the affected UI ships:

- Prove the phone-local loopback/PKCE native flow, single-flight refresh,
  cancellation, auth expiry, and the phone/server MCP OAuth callback relay.
  The existing Desktop loopback callback is not an app-link contract;
  `hermesmobile://` in Expo config does not change the server allowlist.
- Bind the session source before agent creation by sending `source: "mobile"`
  on create and resume. A connection-level compatibility manifest alone does
  not gate Desktop renderer tools; prove that reconnect/resume preserves the
  cached prompt/tool schema.
- Test existing and absent canonical Bot Chat cases. Resolve by exact name and
  compression tip; implement or contract-test a server-owned atomic
  create/adopt operation before accepting the absent-row path. Do not add a
  stored pointer, recency fallback, or per-bot session browser.
- Respect batch clarification replies and `*.expire`; `status: expired` is not
  success. Sudo submits a password, secret capture may store a server credential.
- Every React Query/cache key includes installation and profile/session identity.
  Cancel or ignore late reads after a switch. Refresh tokens through one in-flight
  refresh; obtain a fresh single-use WS ticket for each connection. Refreshing
  credentials must not replay an ambiguous write.
- Preserve unrelated profile metadata and advanced routine fields on edits.
  Distinguish saved settings from their activation in a live conversation.
- A restarted messaging gateway and its serving/control process are different
  health targets. Follow actual gateway state; do not require a socket drop or
  promise a fixed 30–60 second recovery.
- Start log viewing with the existing bounded tail and filters after a redaction
  check. Do not build pagination, exports, live-tail infrastructure, or a new
  status service merely to match invented mockup content.
- Device registration needs idempotent identity plus safe status reconciliation.
  Online forget attempts revocation; offline forget clears local access without
  claiming remote revocation. Push provider failure must not break the gateway.
  Confirm the Expo project identity/native push credentials in setup without
  requiring an EAS Build migration; no credentials belong in the repository.

The code inspection found a working placeholder shell, not unfinished feature
implementations. No general refactor is justified. The remaining concrete gaps are:

- `@hermes/shared` still aliases browser WebSocket types and uses
  `WebSocket.OPEN`; the accepted portability edit has no implementation yet.
- `app.config.ts` currently configures only Router/build properties. Configure
  existing SecureStore/notification/picker native options and verify the merged
  release manifest. The generated main manifest currently includes RECORD_AUDIO,
  broad legacy storage permissions, and allowBackup=true; this is an audit lead,
  not a claim about the final merged release manifest or leaked credentials.
  Prove backup exclusions and request only attachment/notification permissions
  required by Stage 1. No recording feature is planned.
- CNG remains the source-of-truth strategy. Inventory the untracked `android/`
  before classifying generated output; never delete it or hide manual edits as
  part of a routine sync. Put reproducible configuration in Expo config/plugins.
- The shell's static colors and plain View are acceptable scaffold placeholders;
  shared UI work must add theme tokens, safe areas, keyboard handling, Android
  back behavior, and accessible controls before real forms replace the shell.
- The scaffold audit records unresolved high findings, and some summaries disagree
  on their historical count. Run one fresh scoped audit after synchronization;
  classify runtime/build impact and vet a bounded remediation. Do not use
  `audit fix --force`, blanket upgrades, or an undocumented release waiver.
- Existing lint resolver exceptions and Metro overrides must be rechecked during
  integration, not copied into new features by default. Restore only the rules
  whose original false positives are demonstrably resolved.
- Native release/E2E scripts and mobile CI selection still need implementation.
  Prove a production bundle launches without Metro; inspect final permissions,
  package/version, API 31/37 behavior, and externally supplied release signing.
  CI must react to mobile/shared and relevant server changes; unit tests alone
  are not Android acceptance.

Design corrections and exact file groups are maintained in
[the canonical screen brief](docs/mobile-screen-design-brief.md).
The copy under `docs/design/` is a synchronized export for design tools, not an
independent specification. Repair in batches of at most five files. HTML is a
reviewable mockup; native screens remain React Native. Use system fonts/local
assets and a small clickable prototype, without new runtime UI dependencies.

## Keeping Hermes current

At the start of an integration wave after upstream changes, on each upstream
release review, and before publishing a mobile APK:

1. Identify the latest relevant upstream release and immutable target commit;
   compare with the last merged/tested baseline, including intervening changes.
2. Record affected Stage 1 contracts and local changes before any merge. Preserve
   local work; normal merge only, never an implicit reset/rebase/update command.
3. Synchronize under the existing repository-scope/risk authorization, then
   refresh affected API rows and run the affected mobile/shared/server checks.
4. Recheck the merged dependency graph only when manifests/locks changed or an
   unresolved advisory requires it; vet actual changes before installing them.
5. Record merged SHA, tested SHA, Android proof, and unresolved limitations.
   Re-negotiate capabilities on client reconnect after a server update.

HM-036–HM-039 establish this cycle; HM-M001 repeats the same bounded review.
This is a development/release practice, not a new scheduled bot, automatic merge,
in-app updater, or promise to track every upstream commit.

## Risks & tradeoffs

- React Native/Expo aligns with the repository's TypeScript code and future iOS
  goal, but adds native workspace/version-resolution complexity compared with a
  Kotlin-only app.
- Sharing only transport/contracts avoids Desktop coupling, but some existing
  utilities may need platform-neutral refactoring.
- Expo Push Service provides the shortest Android/iOS path for reliable background
  delivery, but introduces an external service. Opaque payloads and a provider
  boundary limit privacy and lock-in.
- A large Stage 1 is intentionally useful but carries schedule risk. Internal
  phases remain independently testable, while no partial phase is labelled the
  operational first release.
- Latest-Hermes-only support reduces compatibility burden but makes upstream sync,
  capability tests, and coordinated release discipline mandatory.
- A read-only cache improves resilience without conflict resolution, at the cost
  of intentionally disabling work during disconnection.
