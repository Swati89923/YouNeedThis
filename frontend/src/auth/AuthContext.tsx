import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "../api/endpoints";
import {
  clearSession,
  loadSession,
  saveSession,
  setUnauthorizedHandler,
} from "../api/client";
import type { Role, Session } from "../api/types";

interface AuthValue {
  session: Session | null;
  /** Set when a request failed with 401, so the login page can explain why. */
  expired: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: Role,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [expired, setExpired] = useState(false);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      setSession(null);
      setExpired(true);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email.trim(), password);
    const next: Session = {
      token: result.token,
      email: result.email,
      name: result.name,
      role: result.role,
    };
    saveSession(next);
    setExpired(false);
    setSession(next);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, role: Role) => {
      await api.register(name.trim(), email.trim(), password, role);
      await login(email, password);
    },
    [login],
  );

  const value = useMemo(
    () => ({ session, expired, login, register, logout }),
    [session, expired, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** For screens that only render for a signed-in user. */
export function useSession(): Session {
  const { session } = useAuth();
  if (!session) throw new Error("No active session");
  return session;
}
