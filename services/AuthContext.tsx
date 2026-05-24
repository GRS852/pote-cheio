// context/AuthContext.tsx

import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';
import { signInRequest } from './authService';

// 1. Tipagem do contexto
type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

// 2. Criação do contexto
const AuthContext = createContext<AuthContextType | null>(null);

// 3. Provider — envolve o app inteiro
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // evita flash de tela errada

  // Ao abrir o app, verifica se já tem token salvo
  useEffect(() => {
    async function loadToken() {
      const token = await SecureStore.getItemAsync('token');
      setIsAuthenticated(!!token); // !! converte para boolean
      setIsLoading(false);
    }
    loadToken();
  }, []);

  async function signIn(email: string, password: string) {
    const data = await signInRequest(email, password);
    await SecureStore.setItemAsync('token', data.token);
    setIsAuthenticated(true);
  }

  async function signOut() {
    await SecureStore.deleteItemAsync('token');
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. Hook customizado para usar o contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}