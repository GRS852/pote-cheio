import { io, Socket } from 'socket.io-client';

const API_URL = 'https://api.potecheio.site';

let socket: Socket | null = null;
let socketToken: string | null = null;

export interface SocketMessage {
  id: number;
  conversation_id: number;
  author_id: number;
  content: string;
  sent_at: string;
  client_id?: string | null;
  type?: 'text' | 'topic';
  donation_id?: number | null;
  donation_title?: string | null;
  donation_photo_url?: string | null;
  donation_status?: string | null;
}

export interface SocketNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  reference_id: number | null;
  reference_type: string | null;
  created_at: string;
}

// Cada tela registra o próprio listener aqui; o socket repassa o evento pra
// todos. Assim uma tela não apaga o listener da outra (header, chat, mensagens)
// e quem se registra antes da conexão também recebe.
const messageListeners = new Set<(msg: SocketMessage) => void>();
const notificationListeners = new Set<(notif: SocketNotification) => void>();
const reconnectListeners = new Set<() => void>();

// Conectado uma única vez no login (AuthContext). Tenta websocket e cai pra
// long-polling quando a rede/proxy bloqueia websocket.
export function connectSocket(token: string): Socket {
  if (socket && socketToken === token) return socket;
  socket?.disconnect();

  socketToken = token;
  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    // Sem isto o cliente não troca para long-polling quando a rede bloqueia WebSocket
    tryAllTransports: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('new_message', (msg: SocketMessage) => messageListeners.forEach(cb => cb(msg)));
  socket.on('new_notification', (notif: SocketNotification) => notificationListeners.forEach(cb => cb(notif)));
  // Ao reconectar, as telas buscam o que chegou enquanto a conexão estava caída
  socket.io.on('reconnect', () => reconnectListeners.forEach(cb => cb()));

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}

export function getSocket(): Socket | null {
  return socket;
}

export function joinRoom(conversationId: number): void {
  socket?.emit('join_room', { conversation_id: conversationId });
}

// Os "on" devolvem a função que remove o listener (usar no cleanup do useEffect)
export function onNewMessage(cb: (msg: SocketMessage) => void): () => void {
  messageListeners.add(cb);
  return () => { messageListeners.delete(cb); };
}

export function onNewNotification(cb: (notif: SocketNotification) => void): () => void {
  notificationListeners.add(cb);
  return () => { notificationListeners.delete(cb); };
}

export function onReconnect(cb: () => void): () => void {
  reconnectListeners.add(cb);
  return () => { reconnectListeners.delete(cb); };
}
