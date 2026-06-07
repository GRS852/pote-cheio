import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import MainHeader from '../../components/MainHeader';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../services/AuthContext';
import {
  Conversation,
  Message,
  getConversationsRequest,
  getMessagesRequest,
  getOtherUser,
  hideConversationRequest,
} from '../../services/conversationService';
import {
  connectSocket,
  joinRoom,
  offNewMessage,
  onNewMessage,
  sendSocketMessage,
} from '../../services/socketService';

type FilterTab = 'Todas' | 'Recebendo' | 'Doando';

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function ContactAvatar({
  name,
  avatarUrl,
  size,
}: {
  name: string;
  avatarUrl?: string | null;
  size: number;
}) {
  const radius = size / 2;
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: '#EAEAEA',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#888', fontWeight: 'bold', fontSize: size * 0.42 }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

export default function MessagesScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const [convLoading, setConvLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('Todas');
  const [searchText, setSearchText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    if (!token) return;
    connectSocket(token);
    onNewMessage(msg => {
      if (activeConvId == null) return;
      if (msg.author_id === userRef.current?.id) return;
      const newMsg: Message = {
        id: msg.id,
        conversation_id: activeConvId,
        author_id: msg.author_id,
        content: msg.content,
        sent_at: msg.sent_at,
      };
      setMessages(prev => ({
        ...prev,
        [activeConvId]: [...(prev[activeConvId] ?? []), newMsg],
      }));
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    });
    return () => { offNewMessage(); };
  }, [token, activeConvId]);

  useEffect(() => {
    if (!token) return;
    setConvLoading(true);
    getConversationsRequest(token)
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setConvLoading(false));
  }, [token]);

  async function openConversation(convId: number) {
    setActiveConvId(convId);
    if (messages[convId]) return;
    if (!token) return;
    setMsgLoading(true);
    try {
      const msgs = await getMessagesRequest(token, convId);
      setMessages(prev => ({ ...prev, [convId]: msgs }));
      joinRoom(convId);
    } finally {
      setMsgLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }

  async function handleHideConversation(convId: number) {
    if (!token) return;
    try {
      await hideConversationRequest(token, convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConvId === convId) setActiveConvId(null);
    } catch {}
  }

  function handleSend() {
    const text = inputText.trim();
    if (!text || activeConvId == null || !user) return;
    const optimistic: Message = {
      id: Date.now(),
      conversation_id: activeConvId,
      author_id: user.id,
      content: text,
      sent_at: new Date().toISOString(),
    };
    setMessages(prev => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] ?? []), optimistic],
    }));
    sendSocketMessage(activeConvId, text);
    setInputText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }

  const activeConv = conversations.find(c => c.id === activeConvId);
  const currentMessages = activeConvId != null ? (messages[activeConvId] ?? []) : [];

  const filteredConversations = conversations.filter(conv => {
    if (activeTab === 'Doando' && conv.donor_id !== user?.id) return false;
    if (activeTab === 'Recebendo' && conv.recipient_id !== user?.id) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      const other = user ? getOtherUser(conv, user.id) : undefined;
      const name = (other?.full_name ?? '').toLowerCase();
      const title = (conv.donation?.title ?? '').toLowerCase();
      if (!name.includes(q) && !title.includes(q)) return false;
    }
    return true;
  });

  // Mobile: show sidebar OR chat (not both)
  const showSidebar = isWide || activeConvId == null;
  const showChatArea = isWide || activeConvId != null;

  const renderSidebar = () => (
    <View style={[styles.sidebar, !isWide && styles.sidebarFull]}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>Chat</Text>
      </View>

      <View style={styles.searchBox}>
        <FontAwesome name="search" size={14} color={COLORS.textLight} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Busque por produto ou usuário..."
          placeholderTextColor={COLORS.textLight}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.tabRow}>
        {(['Todas', 'Recebendo', 'Doando'] as FilterTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.convList} showsVerticalScrollIndicator={false}>
        {convLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : filteredConversations.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="chat-outline" size={40} color={COLORS.textLight} />
            <Text style={styles.emptyText}>Nenhuma conversa encontrada</Text>
          </View>
        ) : (
          filteredConversations.map(conv => {
            const otherUser = user ? getOtherUser(conv, user.id) : undefined;
            const name = otherUser?.full_name ?? 'Usuário';
            const isActive = conv.id === activeConvId;
            return (
              <TouchableOpacity
                key={conv.id}
                style={[styles.convItem, isActive && styles.convItemActive]}
                onPress={() => openConversation(conv.id)}
                activeOpacity={0.7}
              >
                <View style={styles.convAvatar}>
                  <ContactAvatar name={name} avatarUrl={otherUser?.avatar_url} size={42} />
                </View>
                <View style={styles.convInfo}>
                  <Text style={styles.convName} numberOfLines={1}>{name}</Text>
                  {conv.donation && (
                    <Text style={styles.convSub} numberOfLines={1}>{conv.donation.title}</Text>
                  )}
                </View>
                <View style={styles.convMeta}>
                  <Text style={styles.convTime}>{timeAgo(conv.created_at)}</Text>
                  <TouchableOpacity
                    onPress={() => handleHideConversation(conv.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ marginTop: 6 }}
                  >
                    <Ionicons name="trash-outline" size={14} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );

  const renderChatArea = () => {
    if (activeConvId == null) {
      return (
        <View style={styles.chatAreaEmpty}>
          <MaterialCommunityIcons name="chat-processing-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyAreaTitle}>Selecione uma conversa</Text>
          <Text style={styles.emptyAreaSub}>
            Escolha uma conversa à esquerda para começar a trocar mensagens.
          </Text>
        </View>
      );
    }

    const activeOtherUser = activeConv && user ? getOtherUser(activeConv, user.id) : undefined;
    const otherName = activeOtherUser?.full_name ?? 'Usuário';

    return (
      <View style={styles.chatArea}>
        {/* Header estilo OLX */}
        <View style={styles.chatAreaHeader}>
          <View style={styles.chatAreaHeaderLeft}>
            {!isWide && (
              <TouchableOpacity onPress={() => setActiveConvId(null)} style={{ marginRight: 12 }}>
                <Ionicons name="arrow-back" size={22} color="#000" />
              </TouchableOpacity>
            )}
            <View style={styles.chatAreaAvatar}>
              <ContactAvatar
                name={otherName}
                avatarUrl={activeOtherUser?.avatar_url}
                size={42}
              />
            </View>
            <View>
              <Text style={styles.chatAreaUserName}>{otherName}</Text>
              <Text style={styles.chatAreaUserSub}>Ver perfil</Text>
            </View>
          </View>

          {activeConv?.donation && (
            <TouchableOpacity
              style={styles.chatAreaProduct}
              onPress={() =>
                router.push({ pathname: '/(app)/product', params: { id: String(activeConv.donation!.id) } })
              }
            >
              <Text style={styles.chatAreaProductTitle} numberOfLines={2}>
                {activeConv.donation.title}
              </Text>
              <FontAwesome name="chevron-right" size={12} color={COLORS.textLight} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}
        </View>

        {/* Banner de segurança */}
        <View style={styles.securityBanner}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#555" style={{ marginRight: 8, flexShrink: 0 }} />
          <Text style={styles.securityText}>
            PetsBrasil não solicita seus dados por este chat. Ao suspeitar de algo, denuncie.
          </Text>
        </View>

        {/* Mensagens */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesScroll}
          contentContainerStyle={{ padding: 16, paddingBottom: 12 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {msgLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            currentMessages.map(msg => {
              const fromMe = msg.author_id === user?.id;
              return (
                <View
                  key={msg.id}
                  style={fromMe ? styles.bubbleRowRight : styles.bubbleRowLeft}
                >
                  <View style={fromMe ? styles.bubbleRight : styles.bubbleLeft}>
                    <Text style={fromMe ? styles.bubbleTextWhite : styles.bubbleTextDark}>
                      {msg.content}
                    </Text>
                    <Text style={fromMe ? styles.timeRight : styles.timeLeft}>
                      {new Date(msg.sent_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputArea}>
          {activeConv?.donation && (
            <TouchableOpacity
              style={styles.detailsBtn}
              onPress={() =>
                router.push({ pathname: '/(app)/product', params: { id: String(activeConv.donation!.id) } })
              }
            >
              <FontAwesome name="file-text-o" size={13} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.detailsBtnText}>Detalhes da Doação</Text>
            </TouchableOpacity>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.msgInput}
              placeholder={`Responder ${otherName}`}
              placeholderTextColor={COLORS.textLight}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Ionicons name="send" size={16} color="#FFF" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <MainHeader />
      <View style={styles.body}>
        {showSidebar && renderSidebar()}
        {showChatArea && renderChatArea()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  body: { flex: 1, flexDirection: 'row' },

  // Sidebar
  sidebar: {
    width: 300,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    backgroundColor: '#FFF',
  },
  sidebarFull: { flex: 1, width: undefined },
  sidebarHeader: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sidebarTitle: { fontSize: 22, fontWeight: 'bold', color: '#000' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#000',
    outlineStyle: 'none' as any,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: { fontSize: 14, color: COLORS.textDark, fontWeight: '500' },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  convList: { flex: 1 },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  convItemActive: { backgroundColor: 'rgba(18,128,42,0.06)' },
  convAvatar: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden', flexShrink: 0 },
  convInfo: { flex: 1, marginLeft: 12 },
  convName: { fontWeight: '600', color: '#000', fontSize: 14, marginBottom: 3 },
  convSub: { fontSize: 12, color: COLORS.textDark },
  convMeta: { alignItems: 'flex-end', marginLeft: 8 },
  convTime: { fontSize: 11, color: COLORS.textLight },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textLight },

  // Chat area
  chatArea: { flex: 1, flexDirection: 'column', backgroundColor: '#F5F5F5' },
  chatAreaEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 40,
  },
  emptyAreaTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textDark },
  emptyAreaSub: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', maxWidth: 280 },

  chatAreaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chatAreaHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  chatAreaAvatar: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden', marginRight: 12 },
  chatAreaUserName: { fontSize: 15, fontWeight: '700', color: '#000' },
  chatAreaUserSub: { fontSize: 12, color: COLORS.primary, marginTop: 1 },
  chatAreaProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 200,
    paddingLeft: 12,
  },
  chatAreaProductTitle: { fontSize: 13, color: COLORS.textDark, fontWeight: '500', flex: 1, textAlign: 'right' },

  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  securityText: { fontSize: 12, color: '#FFF', flex: 1 },

  messagesScroll: { flex: 1 },
  bubbleRowLeft: { alignItems: 'flex-start', marginBottom: 10 },
  bubbleRowRight: { alignItems: 'flex-end', marginBottom: 10 },
  bubbleLeft: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleRight: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 16,
    borderTopRightRadius: 4,
    maxWidth: '75%',
  },
  bubbleTextDark: { color: '#000', fontSize: 14, lineHeight: 20 },
  bubbleTextWhite: { color: '#FFF', fontSize: 14, lineHeight: 20 },
  timeLeft: { fontSize: 10, color: COLORS.textLight, marginTop: 4 },
  timeRight: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4, textAlign: 'right' },

  inputArea: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(18,128,42,0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 10,
  },
  detailsBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  msgInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    outlineStyle: 'none' as any,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
