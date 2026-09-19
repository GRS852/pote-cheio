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
  donation_photo_url: string | null;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  assigned_admin_id: number | null;
  assigned_admin_name: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface AdminReportDetail extends AdminReport {
  reporter_email: string;
  reported_user_email: string | null;
  reported_user_status?: 'active' | 'disabled';
  banned_until?: string | null;
  reported_user_warning_count?: number;
  donation?: Record<string, unknown> | null;
  messages?: { id: number; author_id: number; content: string; sent_at: string }[];
}

export interface AdminModerationAction {
  id: number;
  admin_id: number;
  admin_name: string;
  report_id: number | null;
  action_type: 'warning' | 'disable_account' | 'reactivate_account';
  ban_days: number | null;
  reason: string | null;
  created_at: string;
}

export interface AdminUserActivity {
  user: {
    id: number;
    email: string;
    avatar_url: string | null;
    created_at: string;
    status: 'active' | 'disabled';
    disabled_at: string | null;
    banned_until: string | null;
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
  moderation_history: AdminModerationAction[];
  warning_count: number;
}

export interface AdminStats {
  active_accounts: number;
  recent_accounts: number;
  disabled_accounts: number;
  reports: { pending: number; reviewing: number; resolved: number; dismissed: number };
}

export interface AdminDisabledAccount {
  id: number;
  email: string;
  full_name: string | null;
  disabled_at: string;
  days_remaining: number;
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

export async function getAdminStatsRequest(token: string): Promise<AdminStats> {
  return adminFetch(token, '/admin/stats');
}

export async function getDisabledAccountsRequest(token: string): Promise<AdminDisabledAccount[]> {
  const data = await adminFetch(token, '/admin/accounts/disabled');
  return data.accounts;
}

export async function warnUserRequest(
  token: string,
  userId: number,
  payload: { ban_days: number; reason?: string; report_id?: number }
): Promise<{ warning_count: number }> {
  return adminFetch(token, `/admin/users/${userId}/warn`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function disableUserRequest(
  token: string,
  userId: number,
  payload: { reason?: string; report_id?: number }
): Promise<void> {
  await adminFetch(token, `/admin/users/${userId}/disable`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function reactivateUserRequest(token: string, userId: number): Promise<void> {
  await adminFetch(token, `/admin/users/${userId}/reactivate`, { method: 'POST' });
}
