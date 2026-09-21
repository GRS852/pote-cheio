const API_URL = 'https://api.potecheio.site';

export type Category = 'Coleiras' | 'Rações' | 'Higiene';
export type DonationStatus = 'available' | 'reserved' | 'completed';

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
  created_at: string;
  reserved_for_user_id?: number | null;
  reserved_for_name?: string | null;
  reserved_until?: string | null;
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
  if (!response.ok) throw new Error('Erro ao carregar suas doações');
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

export async function deleteDonationRequest(token: string, donationId: number): Promise<void> {
  const response = await fetch(`${API_URL}/donations/${donationId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Erro ao excluir doação');
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
