import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { signInRequest } from './authService';

// Funções de armazenamento multiplataforma
async function saveToken(token: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem('token', token);
  } else {
    await SecureStore.setItemAsync('token', token);
  }
}

async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem('token');
  } else {
    return await SecureStore.getItemAsync('token');
  }
}

async function removeToken() {
  if (Platform.OS === 'web') {
    localStorage.removeItem('token');
  } else {
    await SecureStore.deleteItemAsync('token');
  }
}

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadToken() {
      const token = await getToken();
      setIsAuthenticated(!!token);
      setIsLoading(false);
    }
    loadToken();
  }, []);

  async function signIn(email: string, password: string) {
    const data = await signInRequest(email, password);
    await saveToken(data.token);
    setIsAuthenticated(true);
  }

  async function signOut() {
    await removeToken();
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}