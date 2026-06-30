"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebsocketProvider } from "y-websocket";

export type ConnectionStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "syncing";

interface DocumentContextType {
  ydoc: Y.Doc;
  provider: WebsocketProvider | null;
  indexeddbProvider: IndexeddbPersistence | null;
  connectionStatus: ConnectionStatus;
  isOnline: boolean;
  isSynced: boolean;
  connectedUsers: AwarenessUser[];
  pendingSyncCount: number;
  setLocalUser: (user: { name: string; color: string; id: string }) => void;
}

export interface AwarenessUser {
  clientId: number;
  user: {
    name: string;
    color: string;
    id: string;
  };
  cursor?: { anchor: number; head: number } | null;
}

const DocumentContext = createContext<DocumentContextType | null>(null);

export function useDocument() {
  const ctx = useContext(DocumentContext);
  if (!ctx) {
    throw new Error("useDocument must be used within a DocumentProvider");
  }
  return ctx;
}

interface DocumentProviderProps {
  documentId: string;
  children: React.ReactNode;
  userToken?: string;
}

export function DocumentProvider({
  documentId,
  children,
  userToken,
}: DocumentProviderProps) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSynced, setIsSynced] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<AwarenessUser[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const ydocRef = useRef<Y.Doc>(new Y.Doc());
  const wsProviderRef = useRef<WebsocketProvider | null>(null);
  const idbProviderRef = useRef<IndexeddbPersistence | null>(null);
  const updateCountRef = useRef(0);

  // Network status detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Reconnect WebSocket when back online
      if (wsProviderRef.current && !wsProviderRef.current.wsconnected) {
        wsProviderRef.current.connect();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionStatus("disconnected");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Initialize Yjs providers
  useEffect(() => {
    const ydoc = ydocRef.current;

    // 1. IndexedDB persistence (local-first — always available)
    const idbProvider = new IndexeddbPersistence(
      `collabdocs-${documentId}`,
      ydoc
    );
    idbProviderRef.current = idbProvider;

    idbProvider.on("synced", () => {
      setIsSynced(true);
    });

    // Track local updates for pending sync count
    const updateHandler = () => {
      updateCountRef.current++;
      setPendingSyncCount(updateCountRef.current);
    };

    ydoc.on("update", updateHandler);

    // 2. WebSocket provider (real-time collaboration)
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:1234";

    const wsProvider = new WebsocketProvider(wsUrl, documentId, ydoc, {
      connect: isOnline,
      params: userToken ? { token: userToken } : {},
    });
    wsProviderRef.current = wsProvider;

    // Connection status tracking
    wsProvider.on("status", ({ status }: { status: string }) => {
      if (status === "connected") {
        setConnectionStatus("connected");
        updateCountRef.current = 0;
        setPendingSyncCount(0);
      } else if (status === "connecting") {
        setConnectionStatus("connecting");
      } else {
        setConnectionStatus("disconnected");
      }
    });

    wsProvider.on("sync", (synced: boolean) => {
      if (synced) {
        setConnectionStatus("connected");
        updateCountRef.current = 0;
        setPendingSyncCount(0);
      } else {
        setConnectionStatus("syncing");
      }
    });

    // Awareness (user presence)
    const awarenessHandler = () => {
      const states = wsProvider.awareness.getStates();
      const users: AwarenessUser[] = [];

      states.forEach((state, clientId) => {
        if (state.user) {
          users.push({
            clientId,
            user: state.user,
            cursor: state.cursor || null,
          });
        }
      });

      setConnectedUsers(users);
    };

    wsProvider.awareness.on("change", awarenessHandler);

    return () => {
      ydoc.off("update", updateHandler);
      wsProvider.awareness.off("change", awarenessHandler);
      wsProvider.disconnect();
      wsProvider.destroy();
      idbProvider.destroy();
    };
  }, [documentId, userToken, isOnline]);

  const setLocalUser = useCallback(
    (user: { name: string; color: string; id: string }) => {
      if (wsProviderRef.current) {
        wsProviderRef.current.awareness.setLocalStateField("user", user);
      }
    },
    []
  );

  return (
    <DocumentContext.Provider
      value={{
        ydoc: ydocRef.current,
        provider: wsProviderRef.current,
        indexeddbProvider: idbProviderRef.current,
        connectionStatus,
        isOnline,
        isSynced,
        connectedUsers,
        pendingSyncCount,
        setLocalUser,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}
