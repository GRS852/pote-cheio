import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { AdminSession, adminLoginRequest } from './adminService';

const STORAGE_KEY = 'admin_token';

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
    loadStoredAdminToken().then(stored => {
      if (stored) {
        setAdminToken(stored);
        setIsAdminAuthenticated(true);
      }
      setIsAdminLoading(false);
    });
  }, []);

  async function adminSignIn(email: string, password: string) {
    const { token, admin: adminData } = await adminLoginRequest(email, password);
    await saveAdminToken(token);
    setAdminToken(token);
    setAdmin(adminData);
    setIsAdminAuthenticated(true);
  }

  async function adminSignOut() {
    await removeAdminToken();
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
