# Expo Router and Android build path

Checked on 2026-08-26. This review covers file-based navigation, Expo
Continuous Native Generation (CNG), and the Android API policy for the first
scaffold.

## Registry, compatibility, and maintenance

| Item | Evidence |
| --- | --- |
| Package | [`expo-router`](https://www.npmjs.com/package/expo-router), the official Expo file-based router. |
| Recommended version | Expo's [SDK 57 Router documentation](https://docs.expo.dev/versions/latest/sdk/router/) currently recommends `~57.0.16`; the repository selects `~57.0.12`, the newest patch eligible under its 14-day npm release-age gate. |
| License/type | MIT; application runtime/config-plugin package. |
| Maintenance | Official Expo package, released on the same SDK cadence as the selected stable runtime. The package must be installed through `npx expo install` so Expo checks the SDK-compatible patch. |
| Native integration | The `expo-router` config plugin supplies the native entry-point configuration during prebuild; the default Expo Router template includes the plugin/entry setup. |

Expo Router is the approved navigation surface. The mobile app should use
file-based routes and Expo Router entry points, not direct application imports
from `@react-navigation/*` packages. That keeps navigation aligned with the
SDK-supported router integration and avoids adding an unvetted navigation
stack.

## CNG and commands

The reproducible baseline commands are:

```text
npx create-expo-app@latest --template default@sdk-57
npx expo install expo-router
npx expo config --type public
npx expo prebuild
npx expo run:android
```

`prebuild`/CNG generates native Android project files from the app config and
config plugins. Generated native output is not a substitute for source/config
review: HM-025 classifies it and HM-031 ignores only local/generated artifacts.
HM-027 owns the application identity and API settings; HM-033 records the
public config and doctor output.

## Android API policy

The product contract is Android minimum API 31. Expo SDK 57 officially supports
Android 7+ and uses compile/target SDK 36. Therefore:

- API 31 is the minimum supported emulator and the Stage 1 baseline smoke test.
- Compile and target API 36 are the initial build values; they must not be
  raised merely because a newer SDK is installed locally.
- API 37 is an additional forward-compatibility emulator target. The app should
  install and launch there using target 36, but API 37 is not the minimum or
  initial compile target.
- HM-034 must run the API 31 baseline and the test harness in HM-022 should
  provide deterministic API 31/API 37 smoke commands when those SDK images are
  available.

## Risks and rejected choices

- A navigation package that bypasses Expo Router is rejected for Stage 1; it
  would duplicate the supported entry-point/config-plugin path.
- Dynamic native edits outside app config are rejected for the baseline because
  they are not reproducible through CNG.
- API 37 as the initial target is rejected: the approved initial target is 36,
  with API 37 reserved for forward-compatibility validation.
- EAS credentials, signing material, and tokens must remain outside source and
  config. Local `expo run:android` is the development path; cloud build is a
  later release concern.

## Decision

**Accept `expo-router~57.0.12` and the Expo Router config-plugin/CNG path.** Use
Android API 31 as the minimum test baseline, compile/target 36 for the initial
scaffold, and API 37 as an additional emulator check. No separate navigation
library or native build service dependency is selected.
