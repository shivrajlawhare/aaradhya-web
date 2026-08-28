import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { z } from 'zod';
import { Role } from '../contract';

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'aaradhya.session';

const storedSessionSchema = z.object({
  token: z.string(),
  user: z.object({ id: z.string(), name: z.string(), role: z.nativeEnum(Role) }),
});

const readStoredSession = (): AuthState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { token: null, user: null };
    }
    return storedSessionSchema.parse(JSON.parse(raw));
  } catch {
    return { token: null, user: null };
  }
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = useState<AuthState>(readStoredSession);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login: (token: string, user: AuthUser) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
        setState({ token, user });
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        setState({ token: null, user: null });
      },
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
