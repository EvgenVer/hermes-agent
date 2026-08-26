# Connectivity and server-state dependencies

Checked on 2026-08-26. This bundle covers request caching, invalidation, and
connectivity hints. It does not make the mobile cache authoritative or add a
second global state system.

## Registry and compatibility

| Package | Identity and health | License/type | Decision |
| --- | --- | --- | --- |
| [`@tanstack/react-query`](https://www.npmjs.com/package/@tanstack/react-query) | Maintained TanStack package; current registry latest is `5.102.2`. The repository's Desktop workspace already uses `5.101.2`. | MIT; JavaScript server-state runtime. | Accept exact `5.101.2` to reuse the existing workspace version and avoid an unnecessary graph split. |
| [`@react-native-community/netinfo`](https://www.npmjs.com/package/@react-native-community/netinfo) | Maintained React Native Community package; current registry release is `12.0.1`, with Android/iOS/Web support and no runtime dependencies. Expo's SDK 57 third-party overview includes it in the tested community set. | MIT; native connectivity API. | Accept exact `12.0.1`. |

The relevant compatibility references are [Expo's SDK 57 third-party overview](https://docs.expo.dev/versions/v57.0.0/sdk/third-party-overview/)
and the [NetInfo documentation](https://github.com/react-native-netinfo/react-native-netinfo).
The packages are compatible with the selected React Native 0.86 line, subject
to the scaffold's Expo install and native build checks.

## Responsibilities and limits

TanStack Query owns in-memory server state, query keys, cancellation,
invalidation, and bounded retry policy. Its cache is not a credential store and
must not be persisted wholesale. If a bounded read snapshot is persisted, the
approved adapter is an explicit redacted projection into `expo-sqlite`; no
additional persistence package is selected.

NetInfo supplies a fast local hint for `online`/`offline` transitions and
transport choice. It cannot prove that the configured Hermes URL is reachable,
authenticated, compatible, or authorized. A Hermes health/status probe remains
the authority for connection state and mutations.

The mutation policy is deliberately asymmetric:

- idempotent reads may retry with bounded exponential backoff when the query is
  stale and the server is reachable;
- profile/configuration writes, attachment submits, interactive responses, and
  routine controls are submitted once and must not be retried after an
  ambiguous result;
- invalidation follows a confirmed write and authoritative reads reconcile
  stale local snapshots;
- no network hint or query error may synthesize a successful server mutation.

## Workspace and operational impact

The root Desktop package already pins React Query `5.101.2`; using that exact
version in mobile minimizes duplicate resolution. NetInfo is a native module,
so it is installed through `npx expo install` and verified in the generated
Android project. No store package is introduced until a concrete cross-feature
state need survives the Stage 1 implementation.

## Decision

**Accept exact `@tanstack/react-query@5.101.2` and
`@react-native-community/netinfo@12.0.1`.** Use Query for server-state
orchestration, NetInfo only as a connectivity hint, and the existing SQLite
redaction boundary for any bounded persistence. Do not add a global store or a
query-persistence package in Stage 1.
