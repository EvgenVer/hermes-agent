import { JsonRpcGatewayClient, type WebSocketLike } from '../../../shared/src/json-rpc-gateway'

type Listener = (event: unknown) => void

class StructuralSocket {
  readyState = 0
  sent: string[] = []
  private listeners = new Map<string, Set<Listener>>()

  addEventListener(type: string, listener: Listener): void {
    const listeners = this.listeners.get(type) ?? new Set<Listener>()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }

  removeEventListener(type: string, listener: Listener): void {
    this.listeners.get(type)?.delete(listener)
  }

  send(data: string): void {
    this.sent.push(data)
  }

  close(): void {
    this.readyState = 3
    this.emit('close', { code: 1000, reason: 'closed', wasClean: true })
  }

  open(): void {
    this.readyState = 1
    this.emit('open', {})
  }

  frame(frame: unknown): void {
    this.emit('message', { data: JSON.stringify(frame) })
  }

  lastRequest(): { id: string | number; method: string } {
    return JSON.parse(this.sent[this.sent.length - 1] ?? '{}') as { id: string | number; method: string }
  }

  private emit(type: string, event: unknown): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event)
    }
  }
}

describe('mobile shared gateway transport', () => {
  it('works with a structural native socket when the browser WebSocket global is absent', async () => {
    const originalWebSocket = (globalThis as { WebSocket?: unknown }).WebSocket
    Object.defineProperty(globalThis, 'WebSocket', { configurable: true, value: undefined, writable: true })

    try {
      const socket = new StructuralSocket()
      const client = new JsonRpcGatewayClient({
        heartbeatIntervalMs: 0,
        heartbeatDeadlineMs: 0,
        socketFactory: () => socket as unknown as WebSocketLike
      })
      const events: number[] = []
      client.on('message.delta', event => events.push((event as unknown as { seq: number }).seq))

      const connecting = client.connect('ws://home-server.example/api/ws')
      socket.open()
      await connecting

      socket.frame({
        jsonrpc: '2.0',
        method: 'event',
        params: { type: 'message.delta', session_id: 'session-1', seq: 2 }
      })
      socket.frame({
        jsonrpc: '2.0',
        method: 'event',
        params: { type: 'message.delta', session_id: 'session-1', seq: 1 }
      })

      const response = client.request<{ ok: boolean }>('session.info', { session_id: 'session-1' })
      const request = socket.lastRequest()
      socket.frame({ jsonrpc: '2.0', id: request.id, result: { ok: true } })

      await expect(response).resolves.toEqual({ ok: true })
      expect(events).toEqual([2, 1])
      expect(client.getSeqWatermarks()).toEqual({ 'session-1': 2 })

      client.close()
      expect(client.connectionState).toBe('closed')
    } finally {
      if (originalWebSocket === undefined) {
        delete (globalThis as { WebSocket?: unknown }).WebSocket
      } else {
        Object.defineProperty(globalThis, 'WebSocket', {
          configurable: true,
          value: originalWebSocket,
          writable: true
        })
      }
    }
  })
})
