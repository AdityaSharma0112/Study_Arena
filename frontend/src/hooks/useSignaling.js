import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { apiService } from '../services/api';

export function useSignaling(roomCode) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const wsRef = useRef(null);
  const eventListenersRef = useRef(new Map());
  const heartbeatIntervalRef = useRef(null);

  // Send message helper
  const sendMessage = useCallback((type, payload = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...payload }));
      return true;
    }
    console.warn('[Signaling] Socket not open, message queued or dropped:', type);
    return false;
  }, []);

  // Register event listener callback
  const on = useCallback((eventType, callback) => {
    if (!eventListenersRef.current.has(eventType)) {
      eventListenersRef.current.set(eventType, new Set());
    }
    eventListenersRef.current.get(eventType).add(callback);

    return () => {
      if (eventListenersRef.current.has(eventType)) {
        eventListenersRef.current.get(eventType).delete(callback);
      }
    };
  }, []);

  // Connect WebSocket
  useEffect(() => {
    if (!roomCode) return;

    let isMounted = true;
    const wsUrl = apiService.getWebSocketUrl(roomCode);

    console.log('[Signaling] Connecting to:', wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMounted) return;
      console.log('[Signaling] Connected to room:', roomCode);
      setIsConnected(true);
      setConnectionError(null);

      // Start ping heartbeat
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 15000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type } = data;

        if (type === 'pong') return;

        // Dispatch to all registered listeners
        if (eventListenersRef.current.has(type)) {
          eventListenersRef.current.get(type).forEach((cb) => {
            try {
              cb(data);
            } catch (err) {
              console.error(`[Signaling] Listener error on ${type}:`, err);
            }
          });
        }
      } catch (err) {
        console.error('[Signaling] Failed to parse message:', err, event.data);
      }
    };

    ws.onerror = (err) => {
      console.error('[Signaling] WebSocket error:', err);
      if (isMounted) setConnectionError('Signaling connection error');
    };

    ws.onclose = (event) => {
      if (!isMounted) return;
      console.log('[Signaling] WebSocket closed:', event.code, event.reason);
      setIsConnected(false);
      clearInterval(heartbeatIntervalRef.current);
    };

    return () => {
      isMounted = false;
      clearInterval(heartbeatIntervalRef.current);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [roomCode]);

  return useMemo(() => ({
    isConnected,
    connectionError,
    sendMessage,
    on,
  }), [isConnected, connectionError, sendMessage, on]);
}
