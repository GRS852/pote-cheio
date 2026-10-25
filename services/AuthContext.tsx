import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/theme';
import { AccountBannedError, AccountDisabledError, NetworkError, facebookSignInRequest, getMeRequest, googleSignInRequest, signInRequest, signUpRequest, Usuario } from './authService';
import { connectSocket, disconnectSocket, onServerDisconnect } from './socketService';
import { usePolling } from './usePolling';

async function saveToken(value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem('token', value);
  } else {
    await SecureStore.setItemAsync('token', value);
  }
}

async function loadStoredToken(): Promise<string | null> {
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
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, birthDate: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signInWithFacebook: (accessToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserLocally: (partial: Partial<Usuario>) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Motivo para mostrar quando a sessão é encerrada porque a conta foi
// desativada ou banida depois do login (antes o site só deslogava)
function sessionEndedMessage(err: unknown): string | null {
  if (err instanceof AccountDisabledError) {
    return 'Esta conta foi desativada. Entre em contato com o suporte se acredita que isso é um engano.';
  }
  if (err instanceof AccountBannedError) {
    const until = err.bannedUntil ? new Date(err.bannedUntil).toLocaleString('pt-BR') : null;
    return until ? `Sua conta está temporariamente banida até ${until}.` : 'Sua conta está temporariamente banida.';
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  // Token guardado que não pôde ser conferido porque a API estava fora do ar
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  useEffect(() => { tokenRef.current = token; }, [token]);

  // Restaura a sessão do token guardado. Só apaga o token se a API disser que
  // ele é inválido ou que a conta está bloqueada; em erro de rede (API fora
  // do ar) mantém o token e tenta de novo depois, sem deslogar a pessoa.
  async function restoreSession(stored: string) {
    try {
      const usuario = await getMeRequest(stored);
      setPendingToken(null);
      setToken(stored);
      setUser(usuario);
      setIsAuthenticated(true);
    } catch (err) {
      if (err instanceof NetworkError) {
        setPendingToken(stored);
        return;
      }
      setPendingToken(null);
      await removeToken();
      setSessionNotice(sessionEndedMessage(err));
    }
  }

  useEffect(() => {
    async function init() {
      const stored = await loadStoredToken();
      if (stored) await restoreSession(stored);
      setIsLoading(false);
    }
    init();
  }, []);

  // API voltou? Tenta restaurar a sessão guardada a cada 10s
  usePolling(() => { if (pendingToken) restoreSession(pendingToken); }, 10000, !!pendingToken);

  // Conta banida/desativada durante o uso: confere a cada 60s e, na hora,
  // quando o servidor derruba a conexão em tempo real (ação do admin)
  usePolling(() => { refreshUser(); }, 60000, !!token);
  useEffect(() => onServerDisconnect(() => { refreshUser(); }), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Uma única conexão de tempo real enquanto o usuário estiver logado
  // (mensagens e notificações chegam em qualquer tela, sem F5).
  useEffect(() => {
    if (!token) return;
    connectSocket(token);
    return () => { disconnectSocket(); };
  }, [token]);

  async function signUp(name: string, email: string, password: string, birthDate: string) {
    const data = await signUpRequest(name, email, password, birthDate);

    const received: string | undefined = data.token ?? data.access_token ?? data.jwt ?? data.authToken;

    if (!received) {
      throw new Error(
        `Token não encontrado na resposta. Campos disponíveis: ${Object.keys(data ?? {}).join(', ')}`
      );
    }

    await saveToken(received);
    const usuario = await getMeRequest(received);
    setToken(received);
    setUser(usuario);
    setIsAuthenticated(true);
  }

  async function signIn(email: string, password: string) {
    const data = await signInRequest(email, password);

    const received: string | undefined = data.token ?? data.access_token ?? data.jwt ?? data.authToken;

    if (!received) {
      throw new Error(
        `Token não encontrado na resposta. Campos disponíveis: ${Object.keys(data ?? {}).join(', ')}`
      );
    }

    await saveToken(received);
    const usuario = await getMeRequest(received);
    setToken(received);
    setUser(usuario);
    setIsAuthenticated(true);
  }

  async function signInWithGoogle(idToken: string) {
    const data = await googleSignInRequest(idToken);

    const received: string | undefined = data.token ?? data.access_token ?? data.jwt ?? data.authToken;

    if (!received) {
      throw new Error(
        `Token não encontrado na resposta. Campos disponíveis: ${Object.keys(data ?? {}).join(', ')}`
      );
    }

    await saveToken(received);
    const usuario = await getMeRequest(received);
    setToken(received);
    setUser(usuario);
    setIsAuthenticated(true);
  }

  async function signInWithFacebook(accessToken: string) {
    const data = await facebookSignInRequest(accessToken);

    const received: string | undefined = data.token ?? data.access_token ?? data.jwt ?? data.authToken;

    if (!received) {
      throw new Error(
        `Token não encontrado na resposta. Campos disponíveis: ${Object.keys(data ?? {}).join(', ')}`
      );
    }

    await saveToken(received);
    const usuario = await getMeRequest(received);
    setToken(received);
    setUser(usuario);
    setIsAuthenticated(true);
  }

  async function signOut() {
    await removeToken();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }

  async function refreshUser() {
    const current = tokenRef.current;
    if (!current) return;
    try {
      const updated = await getMeRequest(current);
      setUser(updated);
    } catch (err) {
      const notice = sessionEndedMessage(err);
      if (notice) {
        await signOut();
        setSessionNotice(notice);
      }
    }
  }

  function updateUserLocally(partial: Partial<Usuario>) {
    setUser(prev => prev ? { ...prev, ...partial } : prev);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, token, signIn, signUp, signInWithGoogle, signInWithFacebook, signOut, refreshUser, updateUserLocally }}>
      {children}
      <Modal visible={sessionNotice != null} transparent animationType="fade" onRequestClose={() => setSessionNotice(null)}>
        <View style={styles.overlay}>
          <View style={styles.box}>
            <Text style={styles.title}>Sessão encerrada</Text>
            <Text style={styles.message}>{sessionNotice}</Text>
            <TouchableOpacity style={styles.button} onPress={() => setSessionNotice(null)} activeOpacity={0.8}>
              <Text style={styles.buttonText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AuthContext.Provider>
  );
}
// export function

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  box: { width: '100%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 12, padding: 22 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 10 },
  message: { fontSize: 15, color: COLORS.textDark, lineHeight: 21 },
  button: { marginTop: 18, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});
