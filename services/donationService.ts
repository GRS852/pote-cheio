const API_URL = 'https://api.potecheio.site';

export type Category = 'Coleiras' | 'Rações' | 'Higiene';
export type DonationStatus = 'available' | 'reserved' | 'completed';

export interface Donation {
  id: number;
  title: string;
  description: string;
  category: string;
  photo_url: string | null;
  quantity: number | null;
  status: DonationStatus;
  in_wishlist: boolean;
  donor_id: number;
  created_at: string;
  donor?: {
    id: number;
    full_name: string;
    created_at: string;
  };
}

export interface CreateDonationPayload {
  title: string;
  category: Category;
  description: string;
  photo_url?: string | null;
  quantity?: number | null;
}

export async function createDonationRequest(
  token: string,
  payload: CreateDonationPayload
): Promise<Donation> {
  let body: BodyInit;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

  if (payload.photo_url) {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('category', payload.category);
    formData.append('description', payload.description);
    if (payload.quantity != null) formData.append('quantity', String(payload.quantity));

    const filename = payload.photo_url.split('/').pop() ?? 'foto.jpg';
    formData.append('photo', { uri: payload.photo_url, name: filename, type: 'image/jpeg' } as any);
    body = formData;
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({
      title: payload.title,
      category: payload.category,
      description: payload.description,
      quantity: payload.quantity,
    });
  }

  const response = await fetch(`${API_URL}/donations`, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message ?? `Erro ao publicar doação (${response.status})`);
  }

  const data = await response.json();
  return data.donation;
}

export async function getDonationRequest(token: string, id: number): Promise<Donation> {
  const response = await fetch(`${API_URL}/donations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
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
