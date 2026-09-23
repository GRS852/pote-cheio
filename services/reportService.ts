const API_URL = 'https://api.potecheio.site';

export type ReportReason = 'scam' | 'inappropriate_content' | 'harassment' | 'spam';
export type ReportTargetType = 'donation' | 'conversation' | 'comment';

export const REPORT_TARGET_LABELS: Record<ReportTargetType, string> = {
  donation: 'Denúncia de Post',
  conversation: 'Denúncia de Chat',
  comment: 'Denúncia de Comentário',
};

export const REPORT_TARGET_ICONS: Record<ReportTargetType, string> = {
  donation: 'file-text-o',
  conversation: 'comment-o',
  comment: 'commenting-o',
};

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'scam', label: 'Golpe/fraude' },
  { value: 'inappropriate_content', label: 'Conteúdo impróprio' },
  { value: 'harassment', label: 'Assédio ou comportamento abusivo' },
  { value: 'spam', label: 'Spam/publicidade' },
];

export interface CreateReportPayload {
  target_type: ReportTargetType;
  donation_id?: number;
  conversation_id?: number;
  comment_id?: number;
  reason: ReportReason;
  description?: string;
}

export async function createReportRequest(token: string, payload: CreateReportPayload): Promise<void> {
  const response = await fetch(`${API_URL}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error ?? `Erro ao enviar denúncia (${response.status})`);
  }
}
