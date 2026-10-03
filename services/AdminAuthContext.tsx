import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { AdminSession, adminLoginRequest } from './adminService';

const STORAGE_KEY = 'admin_token';
const ADMIN_DATA_STORAGE_KEY = 'admin_data';

async function saveAdminToken(value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(STORAGE_KEY, value);
  } else {
    await SecureStore.setItemAsync(STORAGE_KEY, value);
  }
}

async function loadStoredAdminToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(STORAGE_KEY);
  } else {
    return await SecureStore.getItemAsync(STORAGE_KEY);
  }
}

async function removeAdminToken() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  }
}

async function saveAdminData(value: AdminSession) {
  const serialized = JSON.stringify(value);
  if (Platform.OS === 'web') {
    localStorage.setItem(ADMIN_DATA_STORAGE_KEY, serialized);
  } else {
    await SecureStore.setItemAsync(ADMIN_DATA_STORAGE_KEY, serialized);
  }
}

async function loadStoredAdminData(): Promise<AdminSession | null> {
  const stored = Platform.OS === 'web'
    ? localStorage.getItem(ADMIN_DATA_STORAGE_KEY)
    : await SecureStore.getItemAsync(ADMIN_DATA_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AdminSession;
  } catch {
    return null;
  }
}

async function removeAdminData() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(ADMIN_DATA_STORAGE_KEY);
  } else {
    await SecureStore.deleteItemAsync(ADMIN_DATA_STORAGE_KEY);
  }
}

type AdminAuthContextType = {
  isAdminAuthenticated: boolean;
  isAdminLoading: boolean;
  admin: AdminSession | null;
  adminToken: string | null;
  adminSignIn: (email: string, password: string) => Promise<void>;
  adminSignOut: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadStoredAdminToken(), loadStoredAdminData()]).then(([storedToken, storedAdmin]) => {
      if (storedToken) {
        setAdminToken(storedToken);
        setAdmin(storedAdmin);
        setIsAdminAuthenticated(true);
      }
      setIsAdminLoading(false);
    });
  }, []);

  async function adminSignIn(email: string, password: string) {
    const { token, admin: adminData } = await adminLoginRequest(email, password);
    await saveAdminToken(token);
    await saveAdminData(adminData);
    setAdminToken(token);
    setAdmin(adminData);
    setIsAdminAuthenticated(true);
  }

  async function adminSignOut() {
    await removeAdminToken();
    await removeAdminData();
    setAdminToken(null);
    setAdmin(null);
    setIsAdminAuthenticated(false);
  }

  return (
    <AdminAuthContext.Provider
      value={{ isAdminAuthenticated, isAdminLoading, admin, adminToken, adminSignIn, adminSignOut }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth deve ser usado dentro de AdminAuthProvider');
  return context;
}
