# Upstream baseline

Checked on 2026-08-26 from the clean `feat/mobile-app` worktree.

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
