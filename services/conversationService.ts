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
  // Campos reais retornados pela API
  sender_id: number;
  recipient_id: number;
  sender_name?: string;
  recipient_name?: string;
  created_at: string;
  donation?: { id: number; title: string };
  // Campo enriquecido pelo frontend após fetch
  other_user?: ConversationUser;
}

/**
 * Retorna o outro participante da conversa.
 * Usa os campos planos sender_name/recipient_name que a API realmente devolve.
 * Se já houver other_user enriquecido (com avatar), usa ele.
 */
export function getOtherUser(
  conv: Conversation,
  currentUserId: number
): ConversationUser | undefined {
  const isSender = currentUserId === conv.sender_id;

  // Usar campos planos da API real
  if (isSender && conv.recipient_name) {
    return {
      id: conv.recipient_id,
      full_name: conv.recipient_name,
      avatar_url: conv.other_user?.avatar_url ?? null,
    };
  }
  if (!isSender && conv.sender_name) {
    return {
      id: conv.sender_id,
      full_name: conv.sender_name,
      avatar_url: conv.other_user?.avatar_url ?? null,
    };
  }

  // Fallback: objeto enriquecido (caso o backend mude no futuro)
  if (conv.other_user?.full_name) return conv.other_user;

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

  // Tentar enriquecer avatar (sender_name/recipient_name já resolvem o nome)
  if (currentUserId != null) {
    await Promise.all(
      convs.map(async conv => {
        // otherId = ID do outro participante
        const otherId =
          currentUserId === conv.sender_id ? conv.recipient_id : conv.sender_id;
        if (!otherId) return;
        const userInfo = await getUserByIdRequest(token, otherId);
        if (userInfo) {
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
