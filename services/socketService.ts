import { io, Socket } from 'socket.io-client';

const API_URL = 'https://api.potecheio.site';

let socket: Socket | null = null;

export interface SocketMessage {
  id: number;
  author_id: number;
  content: string;
  sent_at: string;
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

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}

export function joinRoom(conversationId: number): void {
  socket?.emit('join_room', { conversation_id: conversationId });
}

export function sendSocketMessage(conversationId: number, content: string): void {
  socket?.emit('send_message', { conversation_id: conversationId, content });
}

export function onNewMessage(cb: (msg: SocketMessage) => void): void {
  socket?.on('new_message', cb);
}

export function offNewMessage(): void {
  socket?.off('new_message');
}

export function onNewNotification(cb: (notif: SocketNotification) => void): void {
  socket?.on('new_notification', cb);
}

export function offNewNotification(): void {
  socket?.off('new_notification');
}
