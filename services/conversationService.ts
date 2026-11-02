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
  // Assunto (doação) mais recente e resumo da conversa, vindos da API
  topic_donation_id?: number | null;
  topic_title?: string | null;
  topic_count?: number;
  has_donating?: boolean;
  has_receiving?: boolean;
  last_message?: string | null;
  last_message_type?: 'text' | 'topic' | null;
  last_message_at?: string | null;
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
  // Id temporário da mensagem otimista (antes do servidor confirmar)
  client_id?: string | null;
  // 'topic' = marcador de assunto (nova doação na conversa)
  type?: 'text' | 'topic';
  donation_id?: number | null;
  donation_title?: string | null;
  donation_photo_url?: string | null;
  donation_status?: string | null;
}

/**
 * Junta mensagens novas (socket ou atualização periódica) na lista atual
 * sem duplicar: troca a mensagem otimista pela real (mesmo client_id) e
 * ignora as que já estão na lista (mesmo id).
 */
export function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  let result = current;
  for (const msg of incoming) {
    // A atualização periódica pode trazer a mensagem antes do socket (e sem
    // client_id): nesse caso reconhece a otimista pelo autor + texto.
    const optimisticIdx = result.findIndex(m =>
      m.id < 0 &&
      (msg.client_id ? m.client_id === msg.client_id : m.author_id === msg.author_id && m.content === msg.content)
    );
    if (result.some(m => m.id === msg.id)) {
      if (optimisticIdx >= 0) result = result.filter((_, i) => i !== optimisticIdx);
    } else if (optimisticIdx >= 0) {
      result = result.map((m, i) => (i === optimisticIdx ? msg : m));
    } else {
      result = [...result, msg];
    }
  }
  return result;
}

/** Maior id já confirmado pelo servidor (as otimistas têm id negativo). */
export function lastServerMessageId(list: Message[]): number {
  return list.reduce((max, m) => (m.id > max ? m.id : max), 0);
}

export function newClientId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

export async function getMessagesRequest(token: string, conversationId: number, afterId?: number): Promise<Message[]> {
  const query = afterId ? `?after=${afterId}` : '';
  const response = await fetch(`${API_URL}/conversations/${conversationId}/messages${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Erro ao carregar mensagens');
  const data = await response.json();
  return data.messages;
}

/**
 * Envia uma mensagem por HTTP (não depende do socket). A API grava e entrega
 * em tempo real para os dois; a resposta já traz a mensagem confirmada.
 * donationId = assunto da conversa (sem ele, a API usa o mais recente).
 */
export async function sendMessageRequest(
  token: string,
  conversationId: number,
  content: string,
  clientId: string,
  donationId: number | null
): Promise<Message> {
  const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content, client_id: clientId, donation_id: donationId }),
  });
  if (!response.ok) throw new Error('Erro ao enviar mensagem');
  const data = await response.json();
  return data.message;
}

export async function hideConversationRequest(token: string, conversationId: number): Promise<void> {
  const response = await fetch(`${API_URL}/conversations/${conversationId}/hide`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Erro ao remover conversa');
}
