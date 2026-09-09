# Mobile scaffold validation

Checked on 2026-08-26 from the repository root with npm 11.17.0 and from
`apps/mobile` for Expo commands. The historical validation below covers the
deterministic JavaScript scaffold. The merged dependency/security revalidation
is recorded separately below and uses revision
`ddde04baf8da57b20fd184eda8e29d5424f0fd0a`.

## HM-033 quality gate

| Check | Command | Result |
| --- | --- | --- |
| TypeScript | `npm run typecheck --workspace apps/mobile` | Pass; `tsc --noEmit` completed with exit 0. |
| Expo lint | `npm run lint --workspace apps/mobile` | Pass; Expo flat lint completed with exit 0. |
| Jest/RNTL | `npm run test --workspace apps/mobile -- --runInBand` | Pass; 1 suite and 1 test passed. |
| Dependency tree | `npm ls --workspace apps/mobile react react-native expo-constants expo-linking react-native-safe-area-context --depth=0` | Pass; one React 19.2.7 and one React Native 0.86.2 runtime, with Router peers installed directly. |
| Metro resolver | Load `metro.config.js` and resolve `react`, `react-native`, and `@hermes/shared` | Pass; shared resolves from `apps/shared`, runtime packages resolve from the repository workspace, and the configured watch scope is `apps/shared`. |
| Expo Doctor | `npx expo-doctor@1.20.1` | Pass; 20/20 checks passed. The version is an official Expo MIT diagnostic package and was selected because it is admitted by the repository's npm release-age gate. |
| Public config | `npx expo config --type public` | Pass; Android-only config reports `com.evgenver.hermesmobile`, min SDK 31, compile/target SDK 36, and typed routes. |
| Diff hygiene | `git diff --check` | Pass after the validation changes. |

The mobile manifest uses `expo.install.exclude` for the intentionally
age-safe SDK 57/React patch pins. Expo Doctor therefore validates the project
without suggesting releases that the repository's 14-day npm age gate refuses.
The Metro config keeps an explicit mobile/root module search order and a
narrow shared-package watch folder while leaving hierarchical lookup at Expo's
default (`false`).

## HM-040 merged dependency/security revalidation — 2026-09-08

The current npm v3 lockfile was parsed on merge
`ddde04baf8da57b20fd184eda8e29d5424f0fd0a`. The npm CLI is unavailable, so no
install or `audit fix` was attempted. A read-only npm bulk advisory query using
locked package names and versions found 9 advisory/path matches in the mobile
production graph: 6 high, 3 moderate, and 0 critical. The affected chains are:

- `nanoid@3.3.17` through `expo-router@57.0.12` and `postcss@8.5.23`;
- `@xmldom/xmldom@0.8.13` through `@expo/plist` / `@expo/cli` / Expo;
- `image-size@1.2.1` through Metro / `@expo/metro` / Expo;
- `decode-uri-component@0.2.2` through `query-string` / Expo Router; and
- `uuid@7.0.3` through `xcode` / Expo config plugins.

The mobile lock graph resolves 17 production and 10 development direct entries,
with one React `19.2.7`, one React Native `0.86.2`, one Expo `57.0.12`, and one
Expo Router `57.0.12`. Installed metadata matches the checked mobile runtime
versions; the sole detected installed-vs-lock mismatch is unrelated
`apps/desktop` (`0.17.0` installed versus `0.17.2` locked). The available
remediation is an official compatible Expo/Router/Metro/config-plugin chain
update; direct overrides were not applied. The high findings remain a release
blocker and are delegated to HM-B009 for separately authorized remediation.

## HM-042 native configuration revalidation — 2026-09-09

The pre-existing `apps/mobile/android/` directory was inventoried before
classification. `git ls-files` reports no tracked files under that directory;
it is generated local state and remains uncommitted. A disposable copy of the
mobile config passed clean CNG with `--no-install --clean --platform android`.
The existing tree was refreshed separately with `--no-install --no-clean`, so
no generated source or local signing material was deleted or committed.

The clean CNG result reproduces Android min SDK 31, compile SDK 36, target SDK
36, and build tools 36.0.0. It emits removal markers for the unused camera,
microphone, and overlay permissions. The expected active permission families
are network access; pre-API-33 external-storage compatibility for the picker;
biometric access for LocalAuthentication; and vibration/FCM/notification
permissions from the notification stack. `expo-secure-store` emits both
Android backup attributes, and its rules exclude the SecureStore shared
preferences file from cloud backup and device transfer.

The missing release artifacts were provisioned only inside the disposable
Docker test environment `hermes-mobile-android-test`; the host SDK, JDK, npm,
and Gradle installation were not changed. A tracked `HEAD` snapshot was copied
into the container workspace, and the package resolver was reconciled there
because the checked `package.json` and lockfile currently disagree on several
runtime entries. The host lockfile and generated `android/` directory were not
modified by that container-only install.

The container installed the Android command-line toolchain, platforms 36 and
37.0, build tools 36.0.0 and 37.0.0, platform-tools, the emulator, and a
Google APIs API 37.0 x86_64 system image. Clean CNG and both release manifest
tasks then passed:

```text
node ../../node_modules/expo/bin/cli prebuild --no-install --clean --platform android
bash ./gradlew :app:processReleaseMainManifest --no-daemon --console=plain
bash ./gradlew :app:processReleaseManifest --no-daemon --console=plain
```

The final merged release manifest reports `minSdkVersion=31` and
`targetSdkVersion=36`. It contains no `CAMERA`, `RECORD_AUDIO`, or
`SYSTEM_ALERT_WINDOW` permission. The remaining storage declarations are
limited to `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` with
`maxSdkVersion=32`, for picker compatibility. The release application uses
both SecureStore backup attributes, and the generated cloud-backup and
device-transfer rules exclude the `SecureStore` shared-preferences file while
including ordinary shared preferences.

No signing key, keystore, or provider credential is tracked; mobile
`.gitignore` excludes local `*.keystore` and `*.jks` files. HM-042 is complete
for reproducible configuration and release-manifest validation. The API 37
AVD was created in the Docker volume, but Docker Desktop did not expose
`/dev/kvm`; therefore no emulator boot, physical-device, signed-release, or
remote-provider delivery result is claimed here.

Remote Android push additionally needs native project configuration: register
`com.evgenver.hermesmobile` in the selected Expo/Firebase/FCM project and
provide the build-time project linkage/credentials through the approved local
or EAS build secret store. Those files and credentials must stay out of git.
The client-only `expo-notifications` package does not prove remote delivery;
API 31/API 37 native and provider delivery checks remain acceptance work.

## HM-043 reproducible Android build and smoke helpers — 2026-09-09

The mobile package now exposes two no-install helpers from the repository root:

```text
npm run build:android --workspace apps/mobile -- --variant release
npm run test:e2e:android --workspace apps/mobile -- --device emulator-5554 --api 31
npm run test:e2e:android --workspace apps/mobile -- --device emulator-5556 --api 37
```

The build helper uses the existing Expo CLI, generated Android project, SDK,
and Gradle wrapper. It accepts `--prebuild` for a CNG prebuild with
`--no-install`, never runs npm or Expo package installation, and does not start
Metro. The smoke helper requires an explicit adb serial and expected API level,
checks the target before installing the release APK, launches the production
JS bundle, force-stops it, and verifies a second launch. `--apk` can be used to
reuse an already-built release artifact. Missing SDK/project/Expo/adb inputs
produce actionable errors instead of silently falling back to a development
server.

A Docker-only release build completed with `BUILD SUCCESSFUL` and produced a
128 MB `app-release.apk`. The disposable container had to reconcile the
existing npm resolver in `node_modules`; the checked package manifest and lock
file still disagree, so this does not yet prove a clean repository install.
The API 37 AVD could be created but did not complete a software-only boot
without `/dev/kvm`, and the API 31/API 37 no-Metro launch checks therefore
remain open. Release output is unsigned/debug-key based and is not signed
release or physical-device acceptance.

## Historical security and release status — 2026-08-26

`npm audit --workspace apps/mobile --json` reports 18 transitive findings:
9 moderate, 9 high, 0 critical. The high findings include `nanoid` through the
existing Expo Router path and the Expo/Metro build chain (`image-size`,
Metro/config/transform packages, and related dependencies).
The available fixed Metro chain is newer than the current release-age cutoff,
so it was not pulled in with `audit fix`. This scaffold passes development
quality checks but is not release-ready until the age gate admits the fixed
chain and a fresh audit is clean.

## HM-034 native smoke status

The host toolchain blocker is cleared. The following components are now
available in the user environment:

- Android SDK at `C:\Users\Evgen\AppData\Local\Android\Sdk`;
- SDK Platform 31, Build Tools 36.0.0, Platform-Tools, and Emulator;
- API 31 Google APIs x86_64 system image;
- JDK 17 and Android SDK Command-line Tools;
- clean AVD `hermes-api31`, visible as `emulator-5554` with Android 12 / SDK
  31 and WHPX acceleration.

The first native attempt reached `assembleDebug` successfully, but its JS
bundle startup failed before installation because the hoisted Expo CLI could
not resolve `expo-router/_ctx-shared` from the mobile workspace. The fix is
now applied and covered by
`src/__tests__/expo-workspace-resolution.test.ts`: the root workspace exposes
the existing Router package to the hoisted CLI, while the app keeps its direct
runtime dependency.

The same build exposed that the plain Android config field did not update the
generated Gradle minimum. `expo-build-properties~57.0.10` is now applied as a
CNG plugin, and a fresh prebuild records `android.minSdkVersion=31`,
`android.compileSdkVersion=36`, `android.targetSdkVersion=36`, and
`android.buildToolsVersion=36.0.0`.

The clean API 31 flow is now complete. The second
`npx expo run:android --device hermes-api31` run finished with `BUILD
SUCCESSFUL`, installed `android/app/build/outputs/apk/debug/app-debug.apk`,
and opened the app through the Metro development URL. The installed package
reports:

- package/activity: `com.evgenver.hermesmobile/.MainActivity`;
- version: `0.1.0` / versionCode `1`;
- `minSdk=31`, `targetSdk=36`;
- focused activity process present on `emulator-5554`.

The screen showed `Hermes Mobile` and `The mobile shell is ready.` before the
restart. The restart check force-stopped the exact package, confirmed its old
process was gone, relaunched it with the same `hermesmobile://` Metro deep
link, and confirmed a new process plus the same rendered shell. Visual adb
captures are retained outside the repository at
`%LOCALAPPDATA%\\HermesMobileToolchain\\evidence\\hm034-before-restart.png`
and `hm034-after-restart.png`; no signing material was created or committed.

HM-034 is complete. The remaining security-audit findings are documented
above and are not waived by this smoke-test result.
