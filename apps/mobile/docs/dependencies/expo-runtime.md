# Expo, React Native, and React runtime

Checked on 2026-08-26. This evidence covers the coupled runtime versions for
the first mobile scaffold. It selects the stable Expo SDK line and does not
authorize installing packages before the scaffold and workspace tasks.

## Registry and compatibility evidence

| Package | Registry identity and health | License/type | Decision |
| --- | --- | --- | --- |
| [`expo`](https://www.npmjs.com/package/expo) | Official Expo package; registry latest is `57.0.16`; the package publishes the Expo CLI/runtime integration and is actively maintained by the Expo project. | MIT; runtime/build package. | Accept `~57.0.16`. |
| [`react-native`](https://www.npmjs.com/package/react-native) | Official React Native package; the current registry latest is `0.87.0`, but Expo SDK 57 targets the 0.86 line. | MIT; native runtime. | Accept `0.86.2`, the Expo SDK 57-compatible patch selected for the scaffold. Reject latest `0.87.0` for this SDK line. |
| [`react`](https://www.npmjs.com/package/react) | Official React package; current registry latest is `19.2.8`. The repository already uses `19.2.7` in the Desktop workspace. | MIT; JavaScript runtime. | Accept exact `19.2.7` to reuse the repository's existing React version and avoid an unnecessary workspace graph split. |

Expo's [SDK compatibility table](https://docs.expo.dev/versions/latest/)
maps SDK 57 to React Native 0.86, React 19.2.3, Android 7+, compile SDK 36,
target SDK 36, and Node 22.13.x. The selected React `19.2.7` is a patch-level
update in the SDK table's React 19.2 line; the scaffold must run Expo's
compatibility check and `npm ls` to prove the resolved peer graph. The selected
React Native patch stays on 0.86 rather than following the registry's newer
0.87 release.

## Scripts and workspace impact

- Expo's CLI is invoked through `npx expo`; the reference generator is
  `npx create-expo-app@latest --template default@sdk-57`.
- Expo SDK packages are installed with `npx expo install` in the mobile
  workspace so the resolver selects the SDK-compatible patch line.
- The repository root requires Node `>=22.22.0` and has npm workspace support;
  the SDK's documented Node floor is compatible with that repository engine.
- `apps/mobile` must be private and must not define a competing React or React
  Native version. The root Desktop package's React `19.2.7` is reused; the
  mobile build must resolve one React Native `0.86.x` line.
- `@hermes/shared` remains a local workspace dependency and is not replaced by
  a registry package.

The current host has neither `node` nor `npm`, so installation, lockfile
materialization, `npm ls`, and Expo doctor checks are deferred to HM-024 and
HM-032/HM-033. No lockfile claim is made here.

## Rejected alternatives and risks

- React Native `0.87.x` is rejected until an Expo SDK explicitly targets it;
  independently upgrading React Native would break the coupled Expo support
  contract.
- React `19.2.8` is not selected despite being current because matching the
  existing workspace patch reduces duplicate runtime resolution. If Expo's
  installer rejects `19.2.7`, the compatibility failure must be resolved in a
  new dependency-vetting update rather than by silently widening the range.
- Canary/beta Expo packages are rejected for the baseline scaffold. Expo
  documents those channels as pre-release and potentially incompatible with
  stable packages.

## Decision

**Accept the stable SDK 57 runtime set:** `expo~57.0.16`,
`react-native@0.86.2`, and `react@19.2.7`. The versions are exact in the
planned manifest for React/React Native and tilde-pinned to the SDK patch line
for Expo. Validate the final peer graph with the Expo installer, `npm ls`, and
the Android smoke harness before treating the set as materialized.
