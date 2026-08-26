# Expo, React Native, and React runtime

Checked on 2026-08-26. This evidence covers the coupled runtime versions for
the first mobile scaffold. It selects the stable Expo SDK line and does not
authorize installing packages before the scaffold and workspace tasks.

## Registry and compatibility evidence

| Package | Registry identity and health | License/type | Decision |
| --- | --- | --- | --- |
| [`expo`](https://www.npmjs.com/package/expo) | Official Expo package; registry latest is `57.0.16`; the package publishes the Expo CLI/runtime integration and is actively maintained by the Expo project. | MIT; runtime/build package. | Accept `~57.0.12`, the newest patch eligible under the repository's 14-day npm release-age gate. |
| [`react-native`](https://www.npmjs.com/package/react-native) | Official React Native package; the current registry latest is `0.87.0`, but Expo SDK 57 targets the 0.86 line. | MIT; native runtime. | Accept `0.86.2`, the Expo SDK 57-compatible patch selected for the scaffold. Reject latest `0.87.0` for this SDK line. |
| [`react`](https://www.npmjs.com/package/react) | Official React package; current registry latest is `19.2.8`. The SDK 57 reference template generates `19.2.3`; the repository workspace already pins `19.2.7` for Desktop. | MIT; JavaScript runtime. | Accept exact `19.2.7`, a compatible React 19.2 patch that lets the mobile workspace deduplicate with the existing root runtime. |
| [`typescript`](https://www.npmjs.com/package/typescript) | Official TypeScript package; the repository and SDK 57 reference template use the 6.0 line. | Apache-2.0; dev/build tool. | Accept exact `6.0.3` to reuse the existing workspace pin. |
| [`@types/react`](https://www.npmjs.com/package/@types/react) | DefinitelyTyped React declarations; the repository's Desktop/TUI workspaces use `19.2.17`. | MIT; dev type declarations. | Accept exact `19.2.17`; keep it aligned with the repository's existing type graph rather than the template's older `~19.2.2` suggestion. |

Expo's [SDK compatibility table](https://docs.expo.dev/versions/latest/)
maps SDK 57 to React Native 0.86, React 19.2.3, Android 7+, compile SDK 36,
target SDK 36, and Node 22.13.x. The generated SDK 57 template also uses exact
React `19.2.3`; the materialized workspace uses compatible React `19.2.7` so
Metro resolves the existing root runtime once instead of installing a second
React copy. The selected React Native patch stays on 0.86 rather than
following the registry's newer 0.87 release.

## Scripts and workspace impact

- Expo's CLI is invoked through `npx expo`; the reference generator is
  `npx create-expo-app@latest --template default@sdk-57`.
- Expo SDK packages are installed with `npx expo install` in the mobile
  workspace so the resolver selects the SDK-compatible patch line.
- The repository root requires Node `>=22.22.0` and has npm workspace support;
  the SDK's documented Node floor is compatible with that repository engine.
- `apps/mobile` must be private and must resolve one React `19.2.7` and one
  React Native `0.86.x` line across the workspace Metro graph. The mobile
  package intentionally reuses the root Desktop React runtime to avoid a
  duplicate native-module dependency.
- `@hermes/shared` remains a local workspace dependency and is not replaced by
  a registry package.

The current host provides Node `v24.14.0` and a supported npm runner
`11.17.0` through `npx`. HM-032 must materialize the lockfile with that
supported runner; no lockfile claim is made by this evidence document.

## Rejected alternatives and risks

- React Native `0.87.x` is rejected until an Expo SDK explicitly targets it;
  independently upgrading React Native would break the coupled Expo support
  contract.
- React `19.2.8` is not selected despite being current because the repository
  already has the compatible, deduplicating `19.2.7` workspace pin. If Expo's
  installer rejects that patch, the compatibility failure must be resolved in
  a new dependency-vetting update rather than by silently widening the range.
- Canary/beta Expo packages are rejected for the baseline scaffold. Expo
  documents those channels as pre-release and potentially incompatible with
  stable packages.

## Decision

**Accept the stable SDK 57 runtime set:** `expo~57.0.12`,
`react-native@0.86.2`, and `react@19.2.7`. The versions are exact in the
planned manifest for React/React Native and tilde-pinned to the SDK patch line
for Expo. The selected Expo patch is the newest registry version that passed
the repository's 14-day release-age gate during HM-032. Validate the final
peer graph with the Expo installer, `npm ls`, and the Android smoke harness
before treating the set as materialized.
