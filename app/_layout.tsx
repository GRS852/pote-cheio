// app/_layout.tsx

import { Slot, useGlobalSearchParams, usePathname, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AdminAuthProvider } from '../services/AdminAuthContext';
import { AuthProvider, useAuth } from '../services/AuthContext';
import TermsAcceptanceModal from '../components/TermsAcceptanceModal';

// Dentro de (app), só essas telas exigem login: doar, ver o próprio perfil
// e mensagens. Catálogo, produto e perfil do doador ficam públicos.
const PROTECTED_APP_ROUTES = ['donate', 'profile', 'messages', 'deliveries', 'donation-history'];

// Páginas do grupo (auth) que quem está logado também pode abrir
const PUBLIC_AUTH_PAGES = ['terms', 'privacy', 'help'];

function buildRedirectTarget(pathname: string, params: Record<string, unknown>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === 'redirect' || typeof value !== 'string' || value.length === 0) continue;
    query.set(key, value);
  }
  const qs = query.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function RouteGuard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ redirect?: string }>();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // espera carregar o token

    const segmentList = segments as readonly string[];
    // O painel de administrador tem seu próprio login/guarda, totalmente
    // separado do login de usuário comum — não entra nas regras abaixo.
    if (segmentList[0] === 'admin') return;

    const inAuthGroup = segmentList[0] === '(auth)';
    const inAppGroup = segmentList[0] === '(app)';
    const needsAuth = inAppGroup && PROTECTED_APP_ROUTES.includes(segmentList[1] ?? '');

    if (!isAuthenticated && needsAuth) {
      const redirect = buildRedirectTarget(pathname, params);
      router.replace({ pathname: '/(auth)/login', params: { redirect } });
      return;
    }

    if (isAuthenticated && inAuthGroup && !PUBLIC_AUTH_PAGES.includes(segmentList[1] ?? '')) {
      router.replace((params.redirect as string) || '/(app)/home');
    }
  }, [isAuthenticated, isLoading, segments, pathname]);

  // LGPD: quem ainda não aceitou a versão atual dos termos aceita antes de
  // continuar (menos nas próprias páginas dos termos, para conseguir lê-las)
  const segmentList = segments as readonly string[];
  const onLegalPage = segmentList[1] === 'terms' || segmentList[1] === 'privacy';
  const termsPending = isAuthenticated && !!user?.terms_pending && segmentList[0] !== 'admin' && !onLegalPage;

  return (
    <>
      <Slot />
      <TermsAcceptanceModal visible={termsPending} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <RouteGuard />
      </AdminAuthProvider>
    </AuthProvider>
  );
}