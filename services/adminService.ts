const API_URL = 'https://api.potecheio.site';

export interface AdminSession {
  id: number;
  email: string;
  full_name: string;
}

export interface AdminReport {
  id: number;
  reporter_id: number;
  reporter_name: string | null;
  target_type: 'donation' | 'conversation';
  donation_id: number | null;
  conversation_id: number | null;
  reported_user_id: number | null;
  reported_user_name: string | null;
  donation_title: string | null;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at: string | null;
}

export interface AdminReportDetail extends AdminReport {
  reporter_email: string;
  reported_user_email: string | null;
  donation?: Record<string, unknown> | null;
  messages?: { id: number; author_id: number; content: string; sent_at: string }[];
}

export interface AdminUserActivity {
  user: {
    id: number;
    email: string;
    avatar_url: string | null;
    created_at: string;
    full_name: string | null;
    birth_date: string | null;
    phone: string | null;
    cpf: string | null;
  };
  donations: Record<string, unknown>[];
  wishlist: Record<string, unknown>[];
  donation_history: Record<string, unknown>[];
  conversations: Record<string, unknown>[];
  reports_made: AdminReport[];
  reports_against: AdminReport[];
}

async function adminFetch(token: string, path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error ?? `Erro (${response.status})`);
  }
  return response.json();
}

export async function adminLoginRequest(email: string, password: string): Promise<{ token: string; admin: AdminSession }> {
  const response = await fetch(`${API_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error ?? 'E-mail ou senha inválidos.');
  }
  return response.json();
}

export async function getAdminReportsRequest(token: string, status?: string): Promise<AdminReport[]> {
  const qs = status ? `?status=${status}` : '';
  const data = await adminFetch(token, `/admin/reports${qs}`);
  return data.reports;
}

export async function getAdminReportRequest(token: string, id: number): Promise<AdminReportDetail> {
  const data = await adminFetch(token, `/admin/reports/${id}`);
  return data.report;
}

export async function updateReportStatusRequest(token: string, id: number, status: string): Promise<AdminReport> {
  const data = await adminFetch(token, `/admin/reports/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return data.report;
}

export async function getAdminUserActivityRequest(token: string, id: number): Promise<AdminUserActivity> {
  return adminFetch(token, `/admin/users/${id}`);
}

export async function getAdminConversationMessagesRequest(token: string, id: number) {
  return adminFetch(token, `/admin/conversations/${id}/messages`);
}
