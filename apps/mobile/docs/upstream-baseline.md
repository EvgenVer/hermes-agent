# Upstream baseline

## Current review status — 2026-09-08

- Reviewed upstream release: [Hermes v0.21.1, tag v2026.9.7](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.9.7),
  published 2026-09-07; release commit is `2237be355906fbe6065ce1815711eee52b2d646e`.
- The reviewed later target is `upstream/main` at
  `22488b8c62d3c92f25149053ae8df68fb0afcb35`, 247 commits after the release
  tag, so it includes v0.21.1 and the subsequent upstream fixes.
- The pre-merge local feature HEAD was
  `2ae275d65bfeb837332d082f8799fb783e668b04`. A normal merge produced
  `ddde04baf8da57b20fd184eda8e29d5424f0fd0a` with first parent
  `2ae275d65bfeb837332d082f8799fb783e668b04`, second parent equal to the
  target above, and merge-base
  `03c97d984b7259154545314d04d1c6093b6fcbe4`.
- The pre-merge worktree was not clean. Seven tracked HM-036 planning files
  were preserved, as were the pre-existing untracked `android/` (1,128 files,
  1,103,902,680 bytes) and `docs/design/` (74 files, 5,478,260 bytes).
  Upstream contributed no `apps/mobile` paths, so these local changes were not
  overwritten and remain outside the synchronization commit.
- The merge used neither reset nor rebase and was not pushed. The incoming
  target side changed 5,760 paths (796,605 insertions, 768,902 deletions) and
  contained zero `apps/mobile` paths. The only merge conflict was the root
  `package-lock.json`; two upstream nested `nanoid`/`postcss` entries were
  retained and the resulting lockfile parses as JSON.
- Post-merge validation passed: Python bytecode compilation for
  `agent`, `gateway`, `hermes_cli`, `tui_gateway`, and `tools`; root manifest
  JSON parsing; `git diff --check`; mobile TypeScript `tsc --noEmit`; mobile
  Jest (2 suites, 2 tests); and mobile ESLint. The npm/Expo wrapper could not
  run because this environment has `node` but no `npm` or `corepack`; the
  direct TypeScript, Jest, and ESLint checks ran successfully.
- Historical checks below remain evidence for their original code state only.

### Verified release implications

| Area | Reviewed v0.21.1 source / implication |
| --- | --- |
| Module ownership | Health/logs move to `web_routers/status.py`, WS route to `web_routers/chat_ws.py`, attachment helpers to `tui_gateway/prompt_attachments.py`. Update source pointers without inventing a second API. |
| Native auth | [routes.py](https://github.com/NousResearch/hermes-agent/blob/v2026.9.7/hermes_cli/dashboard_auth/routes.py#L215) permits HTTP loopback redirects only. Android return/refresh and home-deployment provider support need proof; this restriction also existed locally. |
| Interactive replies | [methods_prompt.py](https://github.com/NousResearch/hermes-agent/blob/v2026.9.7/tui_gateway/methods_prompt.py#L1081) maps sudo to password and secret to value; [server.py](https://github.com/NousResearch/hermes-agent/blob/v2026.9.7/tui_gateway/server.py#L3013) returns status expired and supports per-question replies. These are corrections to the matrix, not all newly introduced behavior. |
| MCP | [methods_tools.py](https://github.com/NousResearch/hermes-agent/blob/v2026.9.7/tui_gateway/methods_tools.py#L1279) includes OAuth start/poll/cancel/callback; transport and remote return must be verified on Android. |
| Canonical chat | [methods_profiles.py](https://github.com/NousResearch/hermes-agent/blob/v2026.9.7/tui_gateway/methods_profiles.py#L138) preserves exact-title identity. A roster summary is not proof of a complete create/adopt operation for a missing row. |
| Logs | [status.py](https://github.com/NousResearch/hermes-agent/blob/v2026.9.7/hermes_cli/web_routers/status.py#L701) returns bounded tail lines and filters, not page totals. Redaction still needs integration evidence. |
| Routines | [web_models.py](https://github.com/NousResearch/hermes-agent/blob/v2026.9.7/hermes_cli/web_models.py#L280) exposes task/prompt, schedule and delivery. Preserve advanced fields rather than implementing every new cron option. |
| New session controls | [methods_session_control.py](https://github.com/NousResearch/hermes-agent/blob/v2026.9.7/tui_gateway/methods_session_control.py) offers goals/loops/heartbeat controls; dedicated mobile panels remain outside Stage 1. |
| Mobile gaps | No ready mobile capability/device/inbox routes were found in the reviewed core REST/RPC surfaces. Keep these classified as gaps; confirm after merge before designing an extension. |

## Historical synchronization — 2026-08-26

Checked from the then-clean `feat/mobile-app` worktree.

## Reference state

| Reference | Commit |
| --- | --- |
| `origin/main` | `6994851694a98c9078bd90f7bc562f7b33f9bb51` |
| `upstream/main` | `03c97d984b7259154545314d04d1c6093b6fcbe4` |
| local `main` | `03c97d984b7259154545314d04d1c6093b6fcbe4` |
| `feat/mobile-app` merged HEAD | `1c77f75207fce13cb27699ecf5440ea1d351329f` |
| merge-base(`main`, `upstream/main`) | `03c97d984b7259154545314d04d1c6093b6fcbe4` |

Both `git fetch --prune origin` and the targeted upstream main fetch succeeded.
All required references resolve to commits.

## Ahead/behind and decision

- Before synchronization, `main` was 0 commits ahead and 785 commits behind
  `upstream/main`; the pre-sync feature branch was 3 commits ahead and 785
  commits behind.
- After HM-003/HM-004, local `main` equals `upstream/main`, and the feature
  branch contains the upstream baseline plus the mobile planning commits.
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

## Planning-reference reconciliation

| Reference in the mobile plan | Current upstream state | Classification |
| --- | --- | --- |
| `GET /api/status`, `GET /api/health` | Routes exist in `hermes_cli/web_server.py`. | Existing; response fields still need matrix-level validation. |
| `POST /api/auth/ws-ticket` and ticketed `/api/ws` | Auth route/ticket store exist in `hermes_cli/dashboard_auth/routes.py` and `ws_tickets.py`; WebSocket route exists in `hermes_cli/web_server.py` and `tui_gateway/ws.py`. | Existing; native-client auth semantics need contract tests. |
| Profile CRUD/clone/SOUL/description/model | Routes exist in `hermes_cli/web_routers/profiles.py`; clone is a `POST /api/profiles` request variant. | Existing. |
| Session history/search/resume | Routes exist in `hermes_cli/web_routers/sessions.py`; gateway methods are registered in `tui_gateway/methods_session.py`. | Existing; exact pagination/replay behavior needs matrix coverage. |
| Skills, toolsets, MCP, and routines | Routes exist in `skills.py`, `tools.py`, `mcp.py`, and `cron.py`; related RPC handlers exist in `tui_gateway/methods_tools.py`. | Existing; profile scope and secret redaction need matrix coverage. |
| Streaming, turn control, attachments, and interactive requests | `/api/ws` exists; methods include `prompt.submit`, `session.interrupt`, `session.steer`, `file.attach`, `image.attach`, `pdf.attach`, `clarify.respond`, `approval.respond`, `sudo.respond`, and `secret.respond`. | Existing; reconnect/replay and single-submission behavior need matrix coverage. |
| Shared JSON-RPC transport | `apps/shared/src/json-rpc-gateway.ts` is exported by `apps/shared/src/index.ts`; there is no separate `json-rpc-gateway-client.ts`. | Existing reusable module; mobile portability audit is HM-014. |
| `POST /api/gateway/restart`, status, and logs | Restart, status/health, and `GET /api/logs` routes exist in `hermes_cli/web_server.py`. | Existing; least-privilege mobile response is not yet a dedicated contract. |
| `/api/mobile/capabilities`, `/api/mobile/devices`, `/api/mobile/inbox` | No matching routes exist in the merged baseline. | Explicit server-contract gap; deferred to the approved post-matrix expansion. |
| `tests/dashboard/test_mobile_api.py` | No such test file exists; current `tests/dashboard` contains only `test_ws_client_host.py`. | Explicit test gap; create with the mobile server-contract implementation. |
