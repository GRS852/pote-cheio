const API_URL = 'https://api.potecheio.site';

export interface FeedDonation {
  id: number;
  title: string;
  description: string;
  category: string;
  photo_url: string | null;
  quantity: number | null;
  status: 'available' | 'reserved' | 'completed';
  in_wishlist: boolean;
  donor_id: number;
  donor_name: string;
  donor_avatar_url: string | null;
  created_at: string;
}

export interface FeedResponse {
  donations: FeedDonation[];
  page: number;
  total: number;
  pages: number;
}

export async function getFeedRequest(
  token: string | null,
  params: { category?: string; search?: string; page?: number; limit?: number } = {}
): Promise<FeedResponse> {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'Todos') query.set('category', params.category);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const response = await fetch(`${API_URL}/feed?${query.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) throw new Error(`Erro ao carregar feed (${response.status})`);
  return response.json();
}
