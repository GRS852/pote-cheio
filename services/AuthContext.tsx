import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getMeRequest, signInRequest, signUpRequest, Usuario } from './authService';

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
  user: Usuario | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, birthDate: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<Usuario | null>(null);

  useEffect(() => {
    async function loadToken() {
      const token = await getToken();
      if (token) {
        try {
          const usuario = await getMeRequest(token);
          setUser(usuario);
          setIsAuthenticated(true);
        } catch {
          await removeToken();
        }
      }
      setIsLoading(false);
    }
    loadToken();
  }, []);

  async function signUp(name: string, email: string, password: string, birthDate: string) {
    const data = await signUpRequest(name, email, password, birthDate);

    const token: string | undefined = data.token ?? data.access_token ?? data.jwt ?? data.authToken;

    if (!token) {
      throw new Error(
        `Token não encontrado na resposta. Campos disponíveis: ${Object.keys(data ?? {}).join(', ')}`
      );
    }

    await saveToken(token);
    const usuario = await getMeRequest(token);
    setUser(usuario);
    setIsAuthenticated(true);
  }

  async function signIn(email: string, password: string) {
    const data = await signInRequest(email, password);

    const token: string | undefined = data.token ?? data.access_token ?? data.jwt ?? data.authToken;

    if (!token) {
      throw new Error(
        `Token não encontrado na resposta. Campos disponíveis: ${Object.keys(data ?? {}).join(', ')}`
      );
    }

    await saveToken(token);
    const usuario = await getMeRequest(token);
    setUser(usuario);
    setIsAuthenticated(true);
  }

  async function signOut() {
    await removeToken();
    setUser(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}