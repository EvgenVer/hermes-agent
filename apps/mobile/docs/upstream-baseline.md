# Upstream baseline

Checked on 2026-08-26 from the clean `feat/mobile-app` worktree.

## Reference state

| Reference | Commit |
| --- | --- |
| `origin/main` | `6994851694a98c9078bd90f7bc562f7b33f9bb51` |
| `upstream/main` | `03c97d984b7259154545314d04d1c6093b6fcbe4` |
| local `main` | `6994851694a98c9078bd90f7bc562f7b33f9bb51` |
| `feat/mobile-app` | `23d01abbf04be9b0b532a32e955ba75df8757c7d` |
| merge-base(`main`, `upstream/main`) | `6994851694a98c9078bd90f7bc562f7b33f9bb51` |

Both `git fetch --prune origin` and the targeted upstream main fetch succeeded.
All required references resolve to commits.

## Ahead/behind and decision

- `main` is 0 commits ahead and 785 commits behind `upstream/main`.
- `feat/mobile-app` is 3 commits ahead and 785 commits behind `upstream/main`.
- The worktree was clean before the check (`git status --porcelain` was empty).
- `main` is an ancestor of `upstream/main`; fast-forwarding local `main` is safe.

Decision: **fast-forward-safe**. HM-003 fast-forwarded local `main` to
`03c97d984b7259154545314d04d1c6093b6fcbe4`. HM-004 then merged that commit
into `feat/mobile-app` as `1c77f75207` without rebasing or rewriting shared
history. `upstream/main` is an ancestor of the merged feature branch.

The merge was conflict-free. `git diff --check` and Python bytecode compilation
for the upstream-touched runtime packages (`agent`, `gateway`, `hermes_cli`,
`tui_gateway`, and `tools`) passed. JavaScript package checks were not available
in this environment because `node` and `npm` are not installed; the mobile
workspace has not yet been created at this point in the rolling wave.
