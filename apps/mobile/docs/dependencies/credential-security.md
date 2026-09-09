# Credential storage and local authentication

Checked on 2026-09-08. This bundle covers the local boundary around server
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
preserve that exclusion. HM-042 inspected the generated release configuration
and recorded the result below.

## HM-042 native CNG revalidation — 2026-09-09

The mobile config now explicitly applies `expo-secure-store`, disables the
unused image-picker camera and microphone permission prompts, blocks
`RECORD_AUDIO` and `SYSTEM_ALERT_WINDOW`, and keeps the accepted Android
31/36 min/compile/target SDK settings in `expo-build-properties`. A clean
`expo prebuild --no-install --clean --platform android` in a disposable copy
reproduced those settings without changing the repository's existing
generated `android/` tree. The existing tree was then refreshed with
`--no-install --no-clean`; it remains local generated state and is not a
committed source of native behavior.

The generated main manifest contains explicit removal markers for camera,
microphone, and overlay access, plus the expected network, pre-API-33 storage,
biometric, and notification-related declarations. The SecureStore plugin also
generates `android:fullBackupContent` and `android:dataExtractionRules`; both
rule sets include ordinary shared preferences while excluding the
`SecureStore` shared-preferences file. This is the required backup boundary:
credentials remain Keystore/SecureStore-owned and are not restored through
cloud backup or device transfer.

The complete release-variant manifest merge was rerun in the disposable Docker
test environment `hermes-mobile-android-test`, which has its own Android SDK,
JDK, npm packages, Gradle cache, and workspace volumes. The host environment
and repository-generated `android/` tree were not changed. Clean CNG and
`:app:processReleaseMainManifest` plus `:app:processReleaseManifest` completed
successfully. The final release manifest contains no `CAMERA`, `RECORD_AUDIO`,
or `SYSTEM_ALERT_WINDOW` permission; the only external-storage entries are
the picker compatibility declarations capped at API 32.

The final application attributes point to both SecureStore backup rule files.
Each rule set includes ordinary shared preferences and excludes the
`SecureStore` shared-preferences file for both cloud backup and device
transfer. This validates the credential backup boundary for the release
variant, but it is not a signed APK or a runtime device result.

The container also has an API 37.0 Google APIs x86_64 AVD for the next smoke
task. Docker Desktop reports no `/dev/kvm`, so hardware-accelerated emulator
execution was not available and no API 37 emulator or physical-device smoke
result is claimed.

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
additional encryption or keychain package is selected in Stage 1. Remote push
still requires a native Android build with the Android application registered
in the chosen Expo/Firebase/FCM project; provider credentials and service
configuration files stay outside the repository and are never bundled by the
client.
