const API_URL = 'https://api.potecheio.site';

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  reference_id: number | null;
  reference_type: string | null;
  read: boolean;
  created_at: string;
}

export async function getNotificationsRequest(
  token: string
): Promise<{ notifications: AppNotification[]; unread: number }> {
  const response = await fetch(`${API_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Erro ao carregar notificações');
  return response.json();
}

export async function markNotificationReadRequest(token: string, id: number): Promise<void> {
  await fetch(`${API_URL}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function markAllReadRequest(token: string): Promise<void> {
  await fetch(`${API_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}
