import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAdminAuth } from '../../services/AdminAuthContext';

function AdminRouteGuard() {
  const { isAdminAuthenticated, isAdminLoading } = useAdminAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isAdminLoading) return;

    const segmentList = segments as readonly string[];
    const onLoginScreen = segmentList[1] === 'login';

    if (!isAdminAuthenticated && !onLoginScreen) {
      router.replace('/(admin)/login');
    }

    if (isAdminAuthenticated && onLoginScreen) {
      router.replace('/(admin)/dashboard');
    }
  }, [isAdminAuthenticated, isAdminLoading, segments]);

  return <Slot />;
}

export default function AdminLayout() {
  return <AdminRouteGuard />;
}
