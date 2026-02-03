import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setTokens, clearTokens, getToken } from '../services/api';

interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  aadhaar_verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const signup = async (email: string, name: string, password: string) => {
    const response = await api.post('/api/auth/signup', {
      email,
      name,
      password,
    });
    const { access_token, expires_at } = response.data;
    await setTokens(access_token, expires_at);
    await checkAuth();
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', {
      email,
      password,
    });
    const { access_token, expires_at } = response.data;
    await setTokens(access_token, expires_at);
    await checkAuth();
  };

  const logout = async () => {
    await clearTokens();
    setUser(null);
  };

  const checkAuth = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      if (!token) {
        setUser(null);
        return;
      }

      const response = await api.get('/api/auth/me');
      setUser(response.data);
    } catch {
      setUser(null);
      await clearTokens();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
