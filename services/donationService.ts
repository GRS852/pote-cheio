const API_URL = 'https://api.potecheio.site';

export type Category = 'Coleiras' | 'Rações' | 'Higiene' | 'Brinquedo' | 'Vestir' | 'Banho';
export type DonationStatus = 'available' | 'reserved' | 'completed' | 'cancelled' | 'removed' | 'closed';

export interface Donation {
  id: number;
  title: string;
  description: string;
  category: string;
  photo_url: string | null;
  photos: string[];
  quantity: number | null;
  status: DonationStatus;
  in_wishlist: boolean;
  donor_id: number;
  donor_name: string;
  donor_created_at: string;
  donor_avatar_url?: string | null;
  created_at: string;
  reserved_for_user_id?: number | null;
  reserved_for_name?: string | null;
  reserved_until?: string | null;
  interested_count?: number;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
  removed_reason?: string | null;
  // Só no detalhe (GET /donations/:id), em relação ao usuário logado
  received_by_me?: boolean;
  is_my_transaction?: boolean;
}

// "Ver entregas": negociações aceitas, nas duas pontas
export type DeliveryStage = 'accepted' | 'shipped';

export interface DeliveryItem {
  donation_id: number;
  title: string;
  photo_url: string | null;
  role: 'donor' | 'recipient';
  stage: DeliveryStage;
  other_user_id: number | null;
  other_user_name: string | null;
  updated_at: string;
}

export async function getDeliveriesRequest(token: string): Promise<DeliveryItem[]> {
  const response = await fetch(`${API_URL}/donations/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error ?? `Erro ao carregar as entregas (${response.status})`);
  }
  const data = await response.json();
  return data.items;
}

// "Ver doações": histórico completo, nas duas pontas
export type HistoryStage = 'pending' | 'accepted' | 'shipped' | 'completed' | 'cancelled' | 'closed' | 'removed';

export interface HistoryItem {
  key: string;
  donation_id: number;
  title: string;
  photo_url: string | null;
  role: 'donor' | 'recipient';
  stage: HistoryStage;
  other_user_id: number | null;
  other_user_name: string | null;
  updated_at: string;
  reserved_until?: string | null;
  interested_count?: number | null;
  reserved_for_me?: boolean;
}

export async function getDonationHistoryRequest(token: string): Promise<HistoryItem[]> {
  const response = await fetch(`${API_URL}/donations/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error ?? `Erro ao carregar o histórico de doações (${response.status})`);
  }
  const data = await response.json();
  return data.items;
}

export interface CreateDonationPayload {
  title: string;
  category: Category;
  description: string;
  photo_urls?: string[];
  quantity?: number | null;
}

export async function createDonationRequest(
  token: string,
  payload: CreateDonationPayload
): Promise<Donation> {
  const response = await fetch(`${API_URL}/donations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: payload.title,
      category: payload.category,
      description: payload.description,
      quantity: payload.quantity,
      photo_urls: payload.photo_urls ?? [],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message ?? `Erro ao publicar doação (${response.status})`);
  }

  const data = await response.json();
  return data.donation;
}

export async function getDonationRequest(token: string | null, id: number): Promise<Donation> {
  const response = await fetch(`${API_URL}/donations/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error(`Doação não encontrada (${response.status})`);
  const data = await response.json();
  return data.donation;
}

export async function getMyDonationsRequest(token: string): Promise<Donation[]> {
  const response = await fetch(`${API_URL}/donations/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error ?? err?.message ?? `Erro ao carregar suas doações (${response.status})`);
  }
  const data = await response.json();
  return data.donations;
}

export async function getWishlistRequest(token: string): Promise<Donation[]> {
  const response = await fetch(`${API_URL}/donations/wishlist`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Erro ao carregar wishlist');
  const data = await response.json();
  return data.donations;
}

export async function addToWishlistRequest(
  token: string,
  donationId: number
): Promise<{ conversation_id: number }> {
  const response = await fetch(`${API_URL}/donations/${donationId}/wishlist`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message ?? 'Erro ao registrar interesse');
  }
  return response.json();
}

export async function removeFromWishlistRequest(token: string, donationId: number): Promise<void> {
  const response = await fetch(`${API_URL}/donations/${donationId}/wishlist`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Erro ao remover interesse');
}

export async function updateDonationStatusRequest(
  token: string,
  donationId: number,
  status: DonationStatus
): Promise<Donation> {
  const response = await fetch(`${API_URL}/donations/${donationId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Erro ao atualizar status');
  const data = await response.json();
  return data.donation;
}

// Encerra a publicação (não apaga do banco): status passa a 'closed'
export async function closeDonationRequest(token: string, donationId: number): Promise<void> {
  const response = await fetch(`${API_URL}/donations/${donationId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error ?? 'Erro ao encerrar a publicação');
  }
}

export interface InterestedUser {
  user_id: number;
  full_name: string;
  avatar_url: string | null;
  conversation_id: number;
}

export async function getInterestedUsersRequest(token: string, donationId: number): Promise<InterestedUser[]> {
  const response = await fetch(`${API_URL}/donations/${donationId}/interested`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Erro ao carregar interessados');
  const data = await response.json();
  return data.interested;
}

export async function confirmDonationRequest(
  token: string,
  donationId: number,
  userId: number
): Promise<{ donation: Donation; transaction_id: number }> {
  const response = await fetch(`${API_URL}/donations/${donationId}/confirm`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!response.ok) throw new Error('Erro ao confirmar doação');
  return response.json();
}

export async function reserveDonationRequest(
  token: string,
  donationId: number,
  userId: number
): Promise<Donation> {
  const response = await fetch(`${API_URL}/donations/${donationId}/reserve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message ?? err?.error ?? 'Erro ao reservar doação');
  }
  const data = await response.json();
  return data.donation;
}

export async function unreserveDonationRequest(token: string, donationId: number): Promise<Donation> {
  const response = await fetch(`${API_URL}/donations/${donationId}/unreserve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Erro ao desreservar doação');
  const data = await response.json();
  return data.donation;
}

export async function cancelDonationRequest(token: string, donationId: number, reason: string): Promise<void> {
  const response = await fetch(`${API_URL}/donations/${donationId}/transaction/cancel`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error ?? err?.message ?? 'Erro ao cancelar doação');
  }
}
