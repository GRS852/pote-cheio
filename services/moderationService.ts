const API_URL = 'https://api.potecheio.site';

export interface ModerationNotice {
  id: number;
  action_type: 'warning' | 'remove_post';
  ban_days: number | null;
  reason: string | null;
  created_at: string;
  donation_title: string | null;
}

export async function getMyModerationNoticesRequest(token: string): Promise<ModerationNotice[]> {
  const response = await fetch(`${API_URL}/auth/me/moderation`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Erro ao carregar avisos (${response.status})`);
  const data = await response.json();
  return data.notices;
}
