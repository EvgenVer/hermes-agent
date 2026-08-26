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

Decision: **fast-forward-safe**. The next step is HM-003, followed by merging
the updated local `main` into `feat/mobile-app` without rebasing or rewriting
shared history.
