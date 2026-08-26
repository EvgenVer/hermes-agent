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

Server changes are limited to stable mobile capability negotiation, least-privilege
administrative reads, and reliable push registration/event inbox behavior that
cannot be expressed safely through current routes. General agent behavior remains
server-owned.

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
  `react@19.2.3`, `react-native@0.86.2`, `typescript@6.0.3`, and
  `@types/react@19.2.17`.
- [Expo Router and Android build](docs/dependencies/expo-router-build.md):
  `expo-router~57.0.12`; Android minimum API 31, initial compile/target API
  36, and API 37 forward-compatibility validation.
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
  `test-renderer@1.2.0`,
  `jest@29.7.0`, and `@react-native/jest-preset@0.86.2`; Android
  SDK/emulator/`adb` smoke harness, not Detox. `jest-expo`'s transitive
  `react-test-renderer@19.2.3` is not a direct dependency.

No additional global-state or query-persistence package is selected initially.
React Query, feature-local reducers/state machines, and small contexts should
cover Stage 1; add a store only after a concrete cross-feature state problem is
demonstrated and separately vetted.

## Data / API / integrations

- REST handles connection validation, profiles/configuration, routines, health,
  logs, and restart operations through `hermes_cli/web_server.py` and the
  extracted routers under `hermes_cli/web_routers/`.
- `POST /api/auth/ws-ticket` (from `hermes_cli/dashboard_auth/routes.py`) mints
  the existing short-lived ticket; `/api/ws` is mounted by
  `hermes_cli/web_server.py` and handled by `tui_gateway/ws.py`.
- `/api/ws` JSON-RPC handles session lifecycle, streaming, turn control, and
  interactive requests. The reusable platform-neutral client is exported from
  `apps/shared/src/json-rpc-gateway.ts` via `apps/shared/src/index.ts`.
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

Planned deterministic commands after scaffolding:

- npm run typecheck --workspace apps/mobile
- npm run lint --workspace apps/mobile
- npm run test --workspace apps/mobile
- npm run check --workspace apps/shared
- scripts/run_tests.sh tests/dashboard/test_mobile_api.py  # planned; current gap
- scripts/run_tests.sh tests/tui_gateway tests/dashboard -k "profile or session or mobile"
- npm run build:android --workspace apps/mobile
- npm run test:e2e:android --workspace apps/mobile

Validation layers:

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
3. **Connection and security foundation** — implement URL validation,
   authentication/ticket flow, capability handshake, SecureStore, biometric gate,
   REST/JSON-RPC adapters, lifecycle, reconnect, and redacted SQLite cache —
   verified by unit, contract, and Android integration tests.
4. **Server mobile contract gaps** — add capability negotiation, least-privilege
   log/status access where needed, device registration, event inbox, and pluggable
   opaque push delivery — verified by pytest auth/redaction/idempotency tests.
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
