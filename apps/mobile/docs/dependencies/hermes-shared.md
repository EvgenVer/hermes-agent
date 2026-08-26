# `@hermes/shared` transport dependency

Checked on 2026-08-26 against the merged Hermes baseline
`1c77f75207fce13cb27699ecf5440ea1d351329f`. This review covers reuse of the
existing JSON-RPC/WebSocket transport; it does not add a second mobile network
client or change the shared package in this wave.

## Identity and current surface

| Item | Evidence |
| --- | --- |
| Package | In-repository private workspace package `@hermes/shared`, declared in `apps/shared/package.json`. |
| Export | `apps/shared/src/index.ts` exports `JsonRpcGatewayClient` from `json-rpc-gateway.ts`; the package exports `.` to `./src/index.ts`. |
| Transport | `apps/shared/src/json-rpc-gateway.ts` implements JSON-RPC request correlation, reconnect, event replay through `session.events.since`, heartbeat, and injected socket creation. |
| Desktop consumers | `apps/desktop/src/api/client.ts`, `apps/desktop/src/lib/json-rpc-gateway-heartbeat.test.ts`, `json-rpc-gateway-recovery.test.ts`, and `json-rpc-gateway-url-guard.test.ts`. |
| Test coverage | `apps/shared/src/json-rpc-gateway-replay.test.ts` exercises replay ordering with a fake event-target WebSocket. Desktop tests cover heartbeat, recovery, and URL guards. |
| License/type | First-party Hermes source; no third-party runtime package or license decision is introduced. TypeScript source is compiled/consumed by workspace tooling. |

The module has no browser or Node import. It relies on standard globals and
platform primitives: `WebSocket`, `WebSocket.OPEN`, `CloseEvent`,
`DOMException`, `URL`, timers, `Map`, `Promise`, and JSON. The constructor also
accepts `socketFactory?: (url: string) => WebSocketLike`, which is the explicit
platform injection point.

## React Native portability audit

React Native provides a global WebSocket implementation and the timer/URL
primitives used by this client. The reconnect and replay state machine is
therefore the right behavior to share with mobile. The current TypeScript
aliases are more browser-shaped than necessary: `WebSocketLike = WebSocket`
and the close/error annotations mention DOM types directly. That can make
mobile type-checking depend on the chosen Expo TypeScript library set even
though the runtime only needs a small WebSocket-shaped contract.

Required compatibility edit before the mobile client imports the package:

1. Extract structural `WebSocketLike`, close-event, and error-event types into
   the shared module, keeping the existing browser WebSocket assignable.
2. Keep `socketFactory` injectable and make the default factory the only place
   that refers to the global browser/React Native `WebSocket` constructor.
3. Replace `WebSocket.OPEN` with a contract constant or an injected ready-state
   value so a test double and a native implementation do not need the browser
   constructor as a type dependency.
4. Preserve the existing public client behavior and Desktop tests; no mobile
   adapter should fork request IDs, replay epochs, heartbeat, or event ordering.

This is a small portability extraction, not a second transport. It belongs in
the shared package after the Expo workspace exists, with a shared test covering
the structural fake and the existing Desktop test suite unchanged.

## Decision

**Accept and reuse `@hermes/shared`, with the compatibility edit above.** The
package is first-party, already consumed by Desktop, has an injectable socket,
and contains the reconnect/replay behavior that mobile must match. Do not add a
mobile-only WebSocket client or a second JSON-RPC implementation. The package
must remain dependency-light and must not import Expo modules.

The mobile Metro configuration must explicitly allow the workspace source and
verify one resolved copy of the shared package. HM-028/HM-032 own that check;
HM-014 records the portability boundary and does not claim the edit is already
implemented.
