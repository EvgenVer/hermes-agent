# Mobile test and Android E2E dependencies

Checked on 2026-08-26. This review defines the deterministic unit/component
test layer and the Android smoke harness needed for the Expo SDK 57 scaffold.
It does not claim that the current host can run these commands: Node, npm, and
an Android SDK are absent from this host.

## Registry and compatibility

| Item | Identity and health | License/type | Decision |
| --- | --- | --- | --- |
| [`jest-expo`](https://www.npmjs.com/package/jest-expo) | Official Expo Jest preset; current SDK 57-compatible release is `57.0.4`; maintained with the Expo SDK line and supports platform presets. | MIT; test preset. | Accept `~57.0.4`. |
| [`@testing-library/react-native`](https://www.npmjs.com/package/@testing-library/react-native) | Maintained React Native Testing Library; current release is `14.0.1`; provides user-facing component queries and interaction helpers. | MIT; test library. | Accept exact `14.0.1`. |
| [`react-test-renderer`](https://www.npmjs.com/package/react-test-renderer) | Official React package, current stable `19.2.8`, but React marks the renderer deprecated. RNTL's current native test stack still requires a matching renderer peer. | MIT; test-only compatibility peer. | Accept exact `19.2.3` as a direct dev peer matching the selected Expo template React, never call its low-level API directly, and track replacement with RNTL/React upgrades. |
| Detox | [`Detox 20.51.3`](https://github.com/wix/Detox) is an active MIT project, but its official support matrix fully covers React Native only through 0.84.x; RN 0.86 is outside the validated range. | MIT; native E2E package. | Reject for the SDK 57/RN 0.86 baseline. |

Expo's [Jest documentation](https://docs.expo.dev/develop/unit-testing/)
and [SDK 57 reference](https://docs.expo.dev/versions/latest/) are the
compatibility authorities. RNTL tests should assert accessible user-visible
behavior rather than component implementation details. The deprecated renderer
is an implementation peer of the test stack, not an application API.

## Deterministic scripts and emulator coverage

The scaffold should expose scripts equivalent to:

```text
npx jest --config jest.config.js --runInBand
npx expo start --no-dev --minify
npx expo run:android --device <API-31-device>
npx expo run:android --device <API-37-device>
adb shell am force-stop com.evgenver.hermesmobile
adb shell monkey -p com.evgenver.hermesmobile 1
```

The exact npm script names are HM-026/HM-030 work. The native smoke harness
uses the existing Android SDK, Gradle, emulator, and `adb` tools instead of a
new npm E2E dependency. It must exercise install, launch, restart, and the
placeholder shell on API 31 and API 37; API 31 is the minimum baseline and API
37 is forward compatibility. Test runs must use a dedicated emulator, bounded
timeouts, captured logs, and no signing secrets.

CI impact is limited to a JavaScript job for Jest/typecheck and an on-demand or
appropriately provisioned Android job for native smoke. A missing emulator is a
clear infrastructure result, not a silently skipped product assertion. HM-033
and HM-034 record the actual commands and evidence.

## Test boundaries

- Jest/RNTL cover route rendering, accessibility, state machines, redaction,
  picker metadata validation, request single-submit behavior, replay ordering,
  and error presentation with deterministic mocks.
- Real Android tests cover native module linking, SecureStore/biometric
  behavior, SQLite migrations, notification permission/token plumbing, and
  API 31/API 37 launch.
- No live Hermes server, Expo Push request, or production credential is used in
  unit tests. Contract tests use local fixtures and the real server code only
  in the repository's approved hermetic test environment.

## Decision

**Accept `jest-expo~57.0.4`, `@testing-library/react-native@14.0.1`, and the
matching `react-test-renderer@19.2.3` dev peer with the stated deprecation
boundary.** Use Android SDK/emulator/`adb` smoke scripts instead of Detox for
RN 0.86 until an E2E framework publishes a validated compatibility matrix. Do
not add Detox or another native test dependency in the baseline.
