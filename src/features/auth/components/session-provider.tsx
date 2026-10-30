"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi } from "@/features/auth/api";
import type { CurrentUser } from "@/features/auth/types";

type SessionStatus = "loading" | "authenticated" | "anonymous";

interface SessionContextValue {
  status: SessionStatus;
  user: CurrentUser | null;
  /** Stores the user returned by login without another `/me` round trip. */
  setUser: (user: CurrentUser | null) => void;
  reload: () => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Holds the signed-in user from `GET /auth/me`. Tokens stay in HttpOnly cookies; the UI only uses
 * `roles` / `permissions` to show or hide things (the backend remains the source of truth).
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  const setUser = useCallback((next: CurrentUser | null) => {
    setUserState(next);
    setStatus(next ? "authenticated" : "anonymous");
  }, []);

  const reload = useCallback(async () => {
    try {
      setUser(await authApi.me());
    } catch {
      setUser(null);
    }
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, [setUser]);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((me) => !cancelled && setUser(me))
      .catch(() => !cancelled && setUser(null));
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  const value = useMemo(
    () => ({ status, user, setUser, reload, logout }),
    [status, user, setUser, reload, logout],
  );
  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside <SessionProvider>");
  return context;
}
