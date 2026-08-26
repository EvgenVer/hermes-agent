# Notifications, Expo Push Service, and Hermes HTTP

Checked on 2026-08-26. This review covers local notification behavior, Expo
push-token registration, and the server-side delivery protocol. It does not
put provider credentials or notification secrets in the mobile bundle.

## Package and service identity

| Item | Identity/health | License/type | Decision |
| --- | --- | --- | --- |
| [`expo-notifications`](https://www.npmjs.com/package/expo-notifications) | Official Expo package; SDK 57 documentation currently recommends `~57.0.14`; maintained as part of the Expo SDK release line. | MIT; native client/config-plugin package. | Accept `~57.0.10`, the newest patch eligible under the repository's 14-day npm release-age gate. |
| Expo Push Service | Expo-operated HTTPS API; client obtains an Expo push token/native token, while Hermes sends server-side HTTPS requests to the Push API. | Hosted service/protocol, not an npm runtime dependency. | Accept the protocol; no client-side provider secret. |
| Hermes outbound HTTP | Existing root dependency `httpx[socks]==0.28.1` in `pyproject.toml`; already used by Hermes authentication/network paths. | Existing Python dependency; no new package or lockfile change. | Reuse for the server extension after endpoint tests prove it is sufficient. |

The client API and SDK constraints are documented in [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/).
The provider workflow and limits are documented in [Expo's sending guide](https://docs.expo.dev/push-notifications/sending-notifications/).
Expo Go on Android cannot exercise remote push delivery for current SDK lines;
native development/release builds are required, while local notifications can
still be tested in Expo Go.

## Registration and delivery contract

The mobile client asks for notification permission only at a product-relevant
point, obtains the token, and registers it through the planned authenticated
`/api/mobile/devices` extension. The server owns the device record, profile/user
scope, timestamps, platform, app version, and revocation state. The mobile app
does not send an Expo access token or any server provider credential.

The server delivery implementation should use the existing Hermes HTTP stack to
POST bounded JSON to the Expo Push API. Payloads must be projection-based and
must never include bearer tokens, refresh tokens, raw secrets, authorization
headers, or unredacted agent output. Expo documents a 4096-byte notification
payload limit, batches of up to 100 messages, and asynchronous ticket/receipt
processing. A ticket means Expo accepted the request; it is not proof of device
delivery. Receipts must be polled and `DeviceNotRegistered` must disable further
sends until the device registers again.

Delivery needs bounded concurrency, exponential backoff for transient provider
responses, and idempotent device registration. A lost registration response is
ambiguous: the client re-reads the device list/status rather than blindly
creating duplicates. A lost send response is not retried without a delivery
deduplication key or server-owned retry record.

## Maintenance, rollback, and alternatives

- `expo-notifications` and the Expo Push protocol are accepted only on the SDK
  57 native-build path; Android remote push is an E2E concern, not a JS-only
  mock claim.
- Reuse of `httpx` avoids a new Python package, extra dependency maintenance,
  and a second HTTP policy. The server extension still needs focused route and
  receipt tests before activation.
- A hypothetical `expo-server-sdk-python` package is rejected: direct HTTP is
  already sufficient and the package would add dependency and provider-coupling
  surface without solving a stated requirement.
- Rollback is to disable mobile device registration/delivery routes and retain
  local notifications; existing Hermes gateway operation must not depend on the
  mobile provider.

## Decision

**Accept `expo-notifications~57.0.10`, the Expo Push HTTP protocol, and the
existing pinned Hermes `httpx` stack.** Add no provider SDK or new Python
dependency in Stage 1. Keep push credentials server-side, enforce payload and
batch limits, process receipts, and test remote delivery only in a native
Android build.
