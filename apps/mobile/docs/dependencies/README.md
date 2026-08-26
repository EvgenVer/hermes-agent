# Mobile dependency decisions

Vetted on 2026-08-26 for the Expo SDK 57 Stage 1 scaffold. These decisions
record registry identity, official compatibility, maintenance/license review,
and the accepted version policy. The initial HM-032 install attempt confirmed
that the repository's npm `min-release-age=14` gate rejects the newest SDK 57
patches published on 2026-08-24. The final pins below use the newest eligible
patch on the same stable SDK line; the gate was not bypassed.

## Accepted set

| Dependency | Role | Version policy | Evidence |
| --- | --- | --- | --- |
| `expo` | Expo runtime and build integration | `~57.0.12` | [Expo/React runtime](expo-runtime.md) |
| `react` | JavaScript runtime | `19.2.7` exact; deduplicate with the existing repository workspace runtime while remaining compatible with RN 0.86.2 | [Expo/React runtime](expo-runtime.md) |
| `react-native` | Native runtime | `0.86.2` exact; one RN 0.86 line | [Expo/React runtime](expo-runtime.md) |
| `typescript` | TypeScript compiler | `6.0.3` exact; reuse existing workspace pin | [Expo/React runtime](expo-runtime.md) |
| `@types/react` | React type declarations | `19.2.17` exact; reuse existing workspace pin | [Expo/React runtime](expo-runtime.md) |
| `expo-router` | File-based native navigation | `~57.0.12` | [Router/build](expo-router-build.md) |
| `expo-constants` | Router app metadata peer | `~57.0.10`; age-safe SDK 57 peer | [Router/build](expo-router-build.md) |
| `expo-linking` | Router deep-linking peer | `~57.0.5`; age-safe SDK 57 peer | [Router/build](expo-router-build.md) |
| `react-native-safe-area-context` | Router inset/layout peer | `~5.6.2`; age-safe version satisfying the router peer contract | [Router/build](expo-router-build.md) |
| `@hermes/shared` | First-party JSON-RPC/WebSocket transport | local workspace package; no registry version | [Hermes shared](hermes-shared.md) |
| `@tanstack/react-query` | Server-state cache and invalidation | `5.101.2` exact; reuse existing Desktop pin | [Connectivity/state](connectivity-state.md) |
| `@react-native-community/netinfo` | Connectivity hint | `12.0.1` exact | [Connectivity/state](connectivity-state.md) |
| `expo-secure-store` | Small credential/token storage | `~57.0.1` | [Credential security](credential-security.md) |
| `expo-local-authentication` | Optional biometric app lock | `~57.0.2` | [Credential security](credential-security.md) |
| `expo-sqlite` | Redacted local snapshots and migrations | `~57.0.1` | [SQLite](sqlite.md) |
| `expo-notifications` | Local/remote notification client | `~57.0.10` | [Notifications/push](notifications-push.md) |
| `expo-document-picker` | System document selection | `~57.0.1` | [Attachments](attachments.md) |
| `expo-image-picker` | Image library selection | `~57.0.9` | [Attachments](attachments.md) |
| `jest-expo` | Expo-compatible Jest preset | `~57.0.4` | [Testing](testing.md) |
| `@testing-library/react-native` | User-facing component tests | `14.0.1` exact | [Testing](testing.md) |
| `@types/jest` | TypeScript declarations for Jest globals | `29.5.14` exact; align with Jest 29 | [Testing](testing.md) |
| `eslint` | JavaScript/TypeScript lint runner | `9.39.5` exact; Expo-compatible ESLint 9 line | [Testing](testing.md) |
| `eslint-config-expo` | Expo SDK lint rules and flat config | `~57.0.1`; align with SDK 57 | [Testing](testing.md) |
| `test-renderer` | RNTL matching React 19 dev peer | `1.2.0` exact | [Testing](testing.md) |
| `jest` | Test runner | `29.7.0` exact | [Testing](testing.md) |
| `@react-native/jest-preset` | RN 0.86 Jest preset | `0.86.2` exact | [Testing](testing.md) |

The selected list deliberately contains no global state package, no query
persistence package, no native navigation alternative, and no provider SDK for
Expo Push. The server will reuse Hermes' existing pinned `httpx[socks]==0.28.1`
dependency rather than adding a Python package.

The root workspace keeps `brace-expansion@1.1.18` as a dev-only package and
uses major-specific `minimatch` overrides so Jest/ESLint consumers receive a
semver-compatible brace implementation while modern `minimatch@10` retains
`brace-expansion@5.0.9`. This avoids the invalid tree caused by a single global
override.

## Rejected or deferred alternatives

| Alternative | Decision and reason |
| --- | --- |
| React Native `0.87.x` | Rejected until an Expo SDK explicitly targets it; SDK 57 targets RN 0.86. |
| Expo canary/beta packages | Rejected for the stable baseline because they are pre-release and can diverge from the selected SDK patch set. |
| Detox `20.51.3` | Rejected for the baseline: its official support matrix is validated through RN 0.84.x, while this app uses RN 0.86. |
| `@config-plugins/detox` | Rejected with Detox; a config plugin does not remove the unsupported RN compatibility risk. |
| Expo Push Python SDK | Rejected; the existing Hermes `httpx` stack is sufficient for the documented HTTPS API, batching, backoff, and receipt workflow. |
| `react-test-renderer` direct dependency | Rejected; React deprecates direct use. It remains only as the implementation dependency of `jest-expo@57.0.4`. |
| SQLCipher | Deferred/rejected for Stage 1 because the SQLite cache excludes credentials and unredacted sensitive data; adding encryption later is a new security/dependency decision. |
| Additional store/persistence library | Deferred; feature-local state, React Query, and an explicit SQLite projection cover the approved Stage 1 needs. |

## Installation gate

HM-024/HM-032 must install through the repository's supported Node/npm
toolchain, run Expo compatibility checks, and materialize the lockfile. The
result must prove one React version, one React Native 0.86 version, and no
unlisted/rejected package. Any resolver conflict reopens dependency vetting;
it must not be hidden by widening ranges or adding an unreviewed replacement.

The first HM-032 attempt used npm 11.17.0, which satisfies the repository
engine range. It stopped at `expo-image-picker@~57.0.13` because that patch
was newer than the 14-day release-age cutoff; registry metadata showed the
same issue for the latest Expo, Router, and Notifications patches. The
age-safe replacements are `expo~57.0.12`, `expo-router~57.0.12`,
`expo-image-picker~57.0.9`, and `expo-notifications~57.0.10`.

The post-install security audit reports 17 transitive findings (9 moderate,
8 high, no critical). The high findings are in the Expo/Metro build chain:
`image-size`, `metro`, and their dependent config/transform packages. The
available Metro remediation (`@expo/metro~56.0.2` / Metro `0.84.5`) was
published after the current 14-day cutoff, so it was not installed or pulled
in with `audit fix`. The mobile scaffold is therefore not release-ready until
the age gate admits the fixed chain and a fresh audit is clean; this does not
affect the HM-032 lockfile or the shell validation result. The mobile manifest
also records the age-safe Expo/React patch pins in `expo.install.exclude`, so
Expo Doctor does not propose replacing a deliberate reproducible pin with a
too-new release.
