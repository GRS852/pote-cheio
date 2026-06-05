import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { signInRequest, signUpRequest } from './authService';

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
  signUp: (name: string, email: string, password: string) => Promise<void>;
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

  async function signUp(name:string, email: string, password: string) {
    const data = await signUpRequest(name, email, password);

    // Suporte a diferentes nomes de campo que a API pode usar para o token
    const token: string | undefined = data.token ?? data.access_token ?? data.jwt ?? data.authToken;

    if (!token) {
      throw new Error(
        `Token não encontrado na resposta. Campos disponíveis: ${Object.keys(data ?? {}).join(', ')}`
      );
    }

    await saveToken(token);
    setIsAuthenticated(true);
  }


  async function signIn(email: string, password: string) {
    const data = await signInRequest(email, password);

    // Suporte a diferentes nomes de campo que a API pode usar para o token
    const token: string | undefined = data.token ?? data.access_token ?? data.jwt ?? data.authToken;

    if (!token) {
      throw new Error(
        `Token não encontrado na resposta. Campos disponíveis: ${Object.keys(data ?? {}).join(', ')}`
      );
    }

    await saveToken(token);
    setIsAuthenticated(true);
  }

  async function signOut() {
    await removeToken();
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}