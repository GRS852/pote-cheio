import { getUserByIdRequest } from './authService';

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
  // possíveis nomes de campo retornados pela API
  other_user?: ConversationUser;
  donor_user?: ConversationUser;
  recipient_user?: ConversationUser;
  donor?: ConversationUser;
  recipient?: ConversationUser;
  participants?: ConversationUser[];
}

/**
 * Resolve o outro participante independente de qual nome de campo a API usa.
 * Testa: other_user, donor_user/recipient_user, donor/recipient, participants[].
 */
export function getOtherUser(
  conv: Conversation,
  currentUserId: number
): ConversationUser | undefined {
  // campo direto
  if (conv.other_user?.full_name) return conv.other_user;

  // array de participantes (alguns backends retornam assim)
  if (Array.isArray(conv.participants)) {
    const other = conv.participants.find(p => p.id !== currentUserId);
    if (other?.full_name) return other;
  }

  // campos separados por papel
  const isDonor = currentUserId === conv.donor_id;
  const byRole = isDonor
    ? (conv.recipient_user ?? conv.recipient)
    : (conv.donor_user ?? conv.donor);
  if (byRole?.full_name) return byRole;

  return undefined;
}

export interface Message {
  id: number;
  conversation_id: number;
  author_id: number;
  content: string;
  sent_at: string;
}

export async function getConversationsRequest(
  token: string,
  currentUserId?: number
): Promise<Conversation[]> {
  const response = await fetch(`${API_URL}/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Erro ao carregar conversas');
  const data = await response.json();
  const convs: Conversation[] = data.conversations ?? [];

  // Enriquecer conversas que não têm info do outro usuário
  if (currentUserId != null) {
    await Promise.all(
      convs.map(async conv => {
        if (getOtherUser(conv, currentUserId)?.full_name) return;
        const otherId =
          currentUserId === conv.donor_id ? conv.recipient_id : conv.donor_id;
        if (!otherId) return;
        const userInfo = await getUserByIdRequest(token, otherId);
        if (userInfo?.full_name) {
          conv.other_user = {
            id: userInfo.id,
            full_name: userInfo.full_name,
            avatar_url: userInfo.avatar_url ?? null,
          };
        }
      })
    );
  }

  return convs;
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
