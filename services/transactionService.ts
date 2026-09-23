const API_URL = 'https://api.potecheio.site';

export type TransactionStatus =
  | 'accepted_awaiting_shipment'
  | 'shipped'
  | 'finalized_manual'
  | 'finalized_automatic';

export type FinalizedBy = 'recipient' | 'donor' | 'automatic' | null;

export interface DonationTransaction {
  id: number;
  donation_id: number;
  donor_id: number;
  recipient_id: number;
  title: string;
  donation_photo_url: string | null;
  donor_name: string;
  recipient_name: string;
  status: TransactionStatus;
  donated_at: string;
  shipped_at: string | null;
  received_at: string | null;
  donor_marked_received_at: string | null;
  finalized_at: string | null;
  finalized_by: FinalizedBy;
  auto_finalize_at: string | null;
  has_rating: boolean;
  has_comment: boolean;
}

async function handleTransactionResponse(response: Response): Promise<DonationTransaction> {
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error ?? `Erro ao processar a transação (${response.status})`);
  }
  const data = await response.json();
  return data.transaction;
}

export async function getTransactionRequest(token: string, donationId: number): Promise<DonationTransaction> {
  const response = await fetch(`${API_URL}/donations/${donationId}/transaction`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleTransactionResponse(response);
}

export async function shipTransactionRequest(token: string, donationId: number): Promise<DonationTransaction> {
  const response = await fetch(`${API_URL}/donations/${donationId}/transaction/ship`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleTransactionResponse(response);
}

export async function receiveTransactionRequest(token: string, donationId: number): Promise<DonationTransaction> {
  const response = await fetch(`${API_URL}/donations/${donationId}/transaction/receive`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleTransactionResponse(response);
}

export async function donorConfirmReceivedRequest(token: string, donationId: number): Promise<DonationTransaction> {
  const response = await fetch(`${API_URL}/donations/${donationId}/transaction/donor-confirm-received`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleTransactionResponse(response);
}

export async function createRatingRequest(token: string, donationId: number, rating: number): Promise<void> {
  const response = await fetch(`${API_URL}/donations/${donationId}/rating`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error ?? `Erro ao enviar avaliação (${response.status})`);
  }
}

export async function createCommentRequest(
  token: string,
  donationId: number,
  comment: string,
  photoUrls: string[]
): Promise<void> {
  const response = await fetch(`${API_URL}/donations/${donationId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ comment, photo_urls: photoUrls }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error ?? `Erro ao enviar comentário (${response.status})`);
  }
}

export interface DonorFeedback {
  id: number;
  donation_id: number;
  donation_title: string;
  recipient_id: number;
  recipient_name: string;
  recipient_avatar_url: string | null;
  comment: string;
  photos: string[];
  created_at: string;
}

export interface DonorRatingSummary {
  average: number | null;
  count: number;
}

export interface DonorDonationStats {
  donated_count: number;
  reserved_count: number;
  received_count: number;
}

export async function getUserRatingSummaryRequest(userId: number): Promise<DonorRatingSummary> {
  const response = await fetch(`${API_URL}/users/${userId}/rating-summary`);
  if (!response.ok) throw new Error(`Erro ao carregar avaliação (${response.status})`);
  return response.json();
}

export async function getUserFeedbackRequest(userId: number): Promise<DonorFeedback[]> {
  const response = await fetch(`${API_URL}/users/${userId}/feedback`);
  if (!response.ok) throw new Error(`Erro ao carregar comentários (${response.status})`);
  const data = await response.json();
  return data.feedback;
}

export async function getUserDonationStatsRequest(userId: number): Promise<DonorDonationStats> {
  const response = await fetch(`${API_URL}/users/${userId}/donation-stats`);
  if (!response.ok) throw new Error(`Erro ao carregar estatísticas (${response.status})`);
  return response.json();
}
