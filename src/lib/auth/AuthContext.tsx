"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { api, setApiToken } from "@/lib/api/client";

interface AuthUser {
  id: string;
  email: string;
  role: string | null;
  school_id: string | null;
  school_name: string | null;
  is_super_admin: boolean;
  // ─── Multi-service fields ───
  facility_id: string | null;
  facility_name: string | null;
  service_type: "school" | "sports_hall" | string | null;
  facility_user_id?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_DURATION_MS = 50 * 60 * 1000;

async function fetchSessionToken(): Promise<{
  access_token: string;
  user: AuthUser;
} | null> {
  try {
    const res = await fetch("/api/auth/session", {
      credentials: "include",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

let inFlightSession: Promise<{
  access_token: string;
  user: AuthUser;
} | null> | null = null;

function getSessionToken(): Promise<{
  access_token: string;
  user: AuthUser;
} | null> {
  if (!inFlightSession) {
    inFlightSession = fetchSessionToken().finally(() => {
      inFlightSession = null;
    });
  }
  return inFlightSession;
}

async function logoutOnServer(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "include",
    });
  } catch {
    // Best-effort
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentTokenRef = useRef<string | null>(null);
  const logoutInProgress = useRef(false);

  const doLogout = useCallback(() => {
    currentTokenRef.current = null;
    setApiToken(null);
    setToken(null);
    setUser(null);
    if (refreshTimer.current) {
      clearInterval(refreshTimer.current);
      refreshTimer.current = null;
    }
  }, []);

  const startRefreshTimer = useCallback(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);

    refreshTimer.current = setInterval(async () => {
      try {
        const session = await getSessionToken();
        if (session) {
          currentTokenRef.current = session.access_token;
          setApiToken(session.access_token);
          setToken(session.access_token);
          if (session.user) setUser(session.user);
        } else {
          doLogout();
        }
      } catch {
        doLogout();
      }
    }, SESSION_DURATION_MS);
  }, [doLogout]);

  useEffect(() => {
    getSessionToken().then((session) => {
      if (session) {
        currentTokenRef.current = session.access_token;
        setApiToken(session.access_token);
        setToken(session.access_token);
        setUser(session.user);
        startRefreshTimer();
      }
      setIsLoading(false);
    });

    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [startRefreshTimer]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<{
        access_token: string;
        user: AuthUser;
      }>("auth/login", { email, password });

      currentTokenRef.current = res.access_token;
      setApiToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      startRefreshTimer();
      return res.user;
    },
    [startRefreshTimer],
  );

  const logout = useCallback(async () => {
    if (logoutInProgress.current) return;
    logoutInProgress.current = true;
    try {
      await logoutOnServer();
    } catch {
      // Best-effort
    }
    doLogout();
    logoutInProgress.current = false;
  }, [doLogout]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
