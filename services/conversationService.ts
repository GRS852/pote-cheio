const API_URL = 'https://api.potecheio.site';

export interface ConversationUser {
  id: number;
  full_name: string;
  avatar_url?: string | null;
}

export interface Conversation {
  id: number;
  donation_id: number;
  donor_id: number;
  recipient_id: number;
  created_at: string;
  donation?: { id: number; title: string };
  other_user?: ConversationUser;
}

export interface Message {
  id: number;
  conversation_id: number;
  author_id: number;
  content: string;
  sent_at: string;
}

export async function getConversationsRequest(token: string): Promise<Conversation[]> {
  const response = await fetch(`${API_URL}/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Erro ao carregar conversas');
  const data = await response.json();
  return data.conversations;
}

export async function getMessagesRequest(token: string, conversationId: number): Promise<Message[]> {
  const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Erro ao carregar mensagens');
  const data = await response.json();
  return data.messages;
}

export async function hideConversationRequest(token: string, conversationId: number): Promise<void> {
  const response = await fetch(`${API_URL}/conversations/${conversationId}/hide`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Erro ao remover conversa');
}
