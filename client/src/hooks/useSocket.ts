import { useEffect, useMemo, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { SocketService } from '../services/socket';

export const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export interface UseSocketResult {
  /** Raw socket.io-client instance once connected, else null. */
  socket: Socket | null;
  /** The SocketService wrapper (session persistence, connect/disconnect). */
  socketService: SocketService | null;
  isConnected: boolean;
  /**
   * Most recent `action_rejected` error message from the server (generic,
   * not tied to a specific room/game action). Call `clearActionError()`
   * after surfacing it (e.g. in a toast) — it is NOT auto-cleared.
   */
  actionError: string | null;
  clearActionError: () => void;
}

export interface UseSocketOptions {
  /**
   * Fired every time the transport establishes a connection (initial
   * connect AND any automatic reconnect after a drop) — mirrors the
   * original inline `onConnect` callback passed to `SocketService.connect`.
   * Receives the raw `Socket` synchronously (no need to wait for the
   * `socket` state value to commit), so it's safe to `emit('auth', ...)`
   * from here immediately. `useRoom` wires its session-resume handshake
   * through this hook.
   */
  onSocketConnect?: (socket: Socket) => void;
}

/**
 * Owns the SocketService lifecycle: creates one SocketService per
 * authenticated user, connects/disconnects it as `token`/`userId` change,
 * and exposes the live Socket instance plus connection status.
 *
 * Does NOT perform the "auth" reconnection-to-room handshake itself — that
 * is room/game state. Pass `onSocketConnect` (wired to
 * `useRoom(...).handleTransportConnect`) to replicate the original
 * behavior of attempting session resume on every connect.
 */
export function useSocket(token: string, userId: string | undefined, options: UseSocketOptions = {}): UseSocketResult {
  const { onSocketConnect } = options;
  const socketService = useMemo(() => (userId ? new SocketService(userId) : null), [userId]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const onSocketConnectRef = useRef(onSocketConnect);
  onSocketConnectRef.current = onSocketConnect;

  useEffect(() => {
    if (!token || !userId || !socketService) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const s = socketService.connect(
      SERVER_URL,
      () => {
        setIsConnected(true);
        onSocketConnectRef.current?.(s);
      },
      () => setIsConnected(false)
    );

    socketRef.current = s;
    setSocket(s);

    s.on('action_rejected', (data: { error: string }) => {
      setActionError(data.error);
    });

    return () => {
      s.off('action_rejected');
      socketService.disconnect();
      socketRef.current = null;
    };
  }, [token, userId, socketService]);

  return {
    socket,
    socketService,
    isConnected,
    actionError,
    clearActionError: () => setActionError(null)
  };
}
