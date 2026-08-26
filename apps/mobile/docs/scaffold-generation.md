# Expo reference scaffold generation

HM-024 was executed on 2026-08-26 in a temporary directory outside the
repository. The generation command was pinned and used no installation step,
so the generated files could be inspected before any workspace dependency
changes.

## Reproduction

Environment used:

| Item | Value |
| --- | --- |
| Node | `v24.14.0` from `C:\Program Files\nodejs` |
| npm/npx | `11.13.0` |
| Generator | `create-expo-app@4.0.0` |
| Template | `default@sdk-57` |
| Output | a unique directory under `%TEMP%`, not `apps/mobile` |
| Install mode | `--no-install --no-agents-md` |

The reproducible command is:

```text
npx --yes create-expo-app@4.0.0 %TEMP%\hermes-mobile-reference-<unique> --template default@sdk-57 --no-install --no-agents-md
```

On PowerShell, prepend `C:\Program Files\nodejs` to the process-local `PATH`
when Node is not already on `PATH`. The command completed with “Your project is
ready” and produced 51 files. The generated directory contained no installed
`node_modules`; no package lock was materialized.

## Runtime result

The generated `package.json` contains these approved core values:

| Field | Generated value | HM-023 result |
| --- | --- | --- |
| `main` | `expo-router/entry` | matches the approved Router entry |
| `expo` | `~57.0.16` | SDK 57 family; final manifest uses age-safe `~57.0.12` |
| `expo-router` | `~57.0.16` | SDK 57 family; final manifest uses age-safe `~57.0.12` |
| `react` | `19.2.3` | matches |
| `react-native` | `0.86.2` | matches |

The template also contains Expo demo dependencies and routes. Those are
classified in `scaffold-inventory.md`; they are not automatically selected
for the product manifest. The generated `app.json` includes Expo's placeholder
identity, `expo-router`/splash config plugins, typed routes, and demo assets.
HM-025 marks identity, API properties, permissions, and product assets for
adaptation rather than copying them unchanged.

The generated reference used the then-current `57.0.16` patch releases.
During HM-032, npm's repository-level 14-day release-age gate correctly
rejected those August 24 patches. The materialized product manifest therefore
uses the newest eligible SDK 57 patches (`expo~57.0.12` and
`expo-router~57.0.12`) while retaining the generated React `19.2.3` and
React Native `0.86.2` runtime pair. This is a patch-level age-gate adjustment,
not a change of Expo SDK, React, or React Native family.

## Repository safety check

`git status --porcelain` was clean before generation and remained clean after
generation. No repository source, toolkit file, planning document, lockfile, or
secret was read or changed by the generator. The temporary output is evidence
only; HM-026 through HM-031 decide what is adopted.

The host's npm `11.13.0` is outside the repository root engine expression's
accepted npm bands. Because this run used `--no-install`, that did not affect
HM-024. HM-032 must use a supported npm version or an explicitly local npm
runner; it must not weaken the repository engine declaration.
