# Credential storage and local authentication

Checked on 2026-08-26. This bundle covers the local boundary around server
credentials and the optional biometric app lock. It does not change Hermes
server authentication or put secrets into the mobile SQLite cache.

## Registry and platform evidence

| Package | Identity and compatibility | License/type | Decision |
| --- | --- | --- | --- |
| [`expo-secure-store`](https://www.npmjs.com/package/expo-secure-store) | Official Expo module; Expo SDK 57 documentation recommends `~57.0.1`. Android stores values in encrypted SharedPreferences backed by Android Keystore. | MIT; native runtime/config-plugin package. | Accept `~57.0.1`. |
| [`expo-local-authentication`](https://www.npmjs.com/package/expo-local-authentication) | Official Expo module; Expo SDK 57 documentation recommends `~57.0.2`; supports Android and iOS biometric availability/enrollment checks. | MIT; native runtime package. | Accept `~57.0.2`. |

The relevant official references are [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
and [LocalAuthentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/).
Both are Expo-maintained modules whose native behavior is selected by the SDK
57 line and must be tested in a development/release build, not only Expo Go.

## Storage contract

SecureStore is limited to small local values such as the bearer refresh record,
connection identity key, and a local unlock preference. It is not a general
database: Expo documents historical platform payload-size limits, so the client
must never store profiles, transcripts, attachments, logs, or push payloads in
it. Those larger records remain redacted or server-fetched.

`requireAuthentication` is an opt-in protection for a SecureStore item. Expo
documents that it is not supported in Expo Go and that biometric enrollment
changes can invalidate an item, yielding a null value or an error. The mobile
state machine must treat both outcomes as “credentials unavailable”, clear the
active session locally, and require an explicit re-authentication or forget
flow. It must not retry a failed biometric read indefinitely.

On Android, the SecureStore config plugin and automatic backup handling are
important. Expo's documentation says the generated backup rules exclude the
SecureStore shared-preferences path; any custom backup configuration must
preserve that exclusion. HM-027/HM-033 must inspect the generated config if a
custom backup rule is introduced.

## Failure and privacy rules

- `isAvailableAsync`, `isEnrolledAsync`, and authentication errors are local
  capability signals, not proof that a server credential is valid.
- `not_enrolled`, `not_available`, `user_cancel`, and `lockout` keep the app
  locked and expose a recoverable explanation; they do not log biometric or
  token contents.
- A changed biometric set invalidating a protected key is handled like a
  revoked local credential. The user can reconnect or forget the connection.
- SecureStore keys and values are never sent to logs, push notifications,
  React Query persistence, SQLite, analytics, or error telemetry.
- The app must not use AsyncStorage or plain SQLite as a fallback for bearer
  credentials. A missing/failed SecureStore read is a hard boundary.

## Decision

**Accept SecureStore and LocalAuthentication** at the exact Expo SDK 57 ranges
above. Use SecureStore for small credential material and LocalAuthentication as
an optional local gate. Test enrollment changes, cancellation, lockout, backup
rules, and re-authentication on native Android API 31 and API 37 builds. No
additional encryption or keychain package is selected in Stage 1.
