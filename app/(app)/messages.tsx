import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
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
import ClearConversationModal from '../../components/ClearConversationModal';
import ReportModal from '../../components/ReportModal';
import { TopicDivider, TopicFilterBar, filterByTopic, getTopics } from '../../components/ChatTopics';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../services/AuthContext';
import {
  Conversation,
  Message,
  getConversationsRequest,
  getMessagesRequest,
  getOtherUser,
  hideConversationRequest,
  lastServerMessageId,
  mergeMessages,
  newClientId,
  sendMessageRequest,
} from '../../services/conversationService';
import { onNewMessage, onReconnect } from '../../services/socketService';
import { usePolling } from '../../services/usePolling';

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
  const { conversationId } = useLocalSearchParams<{ conversationId?: string }>();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const [convLoading, setConvLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('Todas');
  const [searchText, setSearchText] = useState('');
  // Assunto (doação) filtrado na conversa aberta; null = todos
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [clearConvId, setClearConvId] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  const activeConvRef = useRef(activeConvId);
  useEffect(() => { activeConvRef.current = activeConvId; }, [activeConvId]);
  const conversationsRef = useRef(conversations);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  function addMessages(convId: number, incoming: Message[]) {
    if (incoming.length === 0) return;
    setMessages(prev => {
      // Conversa ainda não carregada: ao abrir ela busca tudo do servidor
      if (!prev[convId]) return prev;
      return { ...prev, [convId]: mergeMessages(prev[convId], incoming) };
    });
    if (convId === activeConvRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  function loadConversations() {
    if (!token) return;
    getConversationsRequest(token, user?.id)
      .then(setConversations)
      .catch(() => {});
  }

  // Busca só o que chegou depois da última mensagem conhecida da conversa aberta
  async function fetchNewMessages() {
    const convId = activeConvRef.current;
    if (!token || convId == null || !messagesRef.current[convId]) return;
    try {
      const after = lastServerMessageId(messagesRef.current[convId]);
      const msgs = await getMessagesRequest(token, convId, after);
      addMessages(convId, msgs);
    } catch {}
  }

  // Tempo real: o socket (conectado no login) entrega as mensagens das
  // duas pontas; a confirmação da minha própria troca a mensagem otimista.
  useEffect(() => {
    const offMessage = onNewMessage(msg => {
      if (msg.type === 'topic' || !conversationsRef.current.some(c => c.id === msg.conversation_id)) {
        // Novo assunto ou conversa que não estava na lista (nova ou limpa):
        // recarrega a lista lateral pra trazer assunto e ordem atualizados
        loadConversations();
      } else {
        // Sobe a conversa pro topo com a última mensagem
        setConversations(prev => {
          const conv = prev.find(c => c.id === msg.conversation_id);
          if (!conv) return prev;
          const updated = { ...conv, last_message: msg.content, last_message_type: msg.type ?? 'text', last_message_at: msg.sent_at };
          return [updated, ...prev.filter(c => c.id !== msg.conversation_id)];
        });
      }
      addMessages(msg.conversation_id, [msg]);
    });
    const offReconnect = onReconnect(() => { fetchNewMessages(); });
    return () => { offMessage(); offReconnect(); };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rede de segurança caso algum evento do socket se perca
  usePolling(fetchNewMessages, 5000, !!token && activeConvId != null);

  useEffect(() => {
    if (!token) return;
    setConvLoading(true);
    getConversationsRequest(token, user?.id)
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setConvLoading(false));
  }, [token]);

  // Vindo de uma notificação de mensagem (?conversationId=), abre direto nela.
  useEffect(() => {
    if (!conversationId) return;
    openConversation(Number(conversationId));
  }, [conversationId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function openConversation(convId: number) {
    if (convId !== activeConvRef.current) setSelectedTopic(null);
    setActiveConvId(convId);
    activeConvRef.current = convId;
    if (messagesRef.current[convId]) {
      fetchNewMessages();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
      return;
    }
    if (!token) return;
    setMsgLoading(true);
    try {
      const msgs = await getMessagesRequest(token, convId);
      setMessages(prev => ({ ...prev, [convId]: msgs }));
    } finally {
      setMsgLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }

  // "Limpar conversa": some só para mim (erros aparecem no modal)
  async function handleClearConversation() {
    if (!token || clearConvId == null) return;
    const convId = clearConvId;
    await hideConversationRequest(token, convId);
    setConversations(prev => prev.filter(c => c.id !== convId));
    setMessages(prev => {
      const next = { ...prev };
      delete next[convId];
      return next;
    });
    if (activeConvRef.current === convId) setActiveConvId(null);
  }

  function handleSend() {
    const text = inputText.trim();
    if (!text || activeConvId == null || !user) return;
    const clientId = newClientId();
    const optimistic: Message = {
      id: -Date.now(),
      conversation_id: activeConvId,
      author_id: user.id,
      content: text,
      sent_at: new Date().toISOString(),
      client_id: clientId,
      type: 'text',
      donation_id: selectedTopic,
    };
    setMessages(prev => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] ?? []), optimistic],
    }));
    const convId = activeConvId;
    if (token) {
      sendMessageRequest(token, convId, text, clientId, selectedTopic)
        .then(msg => addMessages(convId, [msg]))
        .catch(() => {
          // Não foi enviada: tira a mensagem provisória e devolve o texto
          setMessages(prev => ({ ...prev, [convId]: (prev[convId] ?? []).filter(m => m.client_id !== clientId) }));
          setInputText(current => current || text);
        });
    }
    setInputText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }

  const activeConv = conversations.find(c => c.id === activeConvId);
  const allMessages = activeConvId != null ? (messages[activeConvId] ?? []) : [];
  const topics = getTopics(allMessages);
  const currentMessages = filterByTopic(allMessages, selectedTopic);
  // Assunto do cabeçalho: o filtrado ou, sem filtro, o mais recente
  const headerTopic = topics.find(t => t.donation_id === selectedTopic) ?? topics[topics.length - 1]
    ?? (activeConv?.topic_donation_id ? { donation_id: activeConv.topic_donation_id, title: activeConv.topic_title ?? '' } : undefined);

  // Doando = há assunto sobre uma doação minha; Recebendo = sobre uma da outra pessoa
  const filteredConversations = conversations.filter(conv => {
    if (activeTab === 'Doando' && !conv.has_donating) return false;
    if (activeTab === 'Recebendo' && !conv.has_receiving) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      const other = user ? getOtherUser(conv, user.id) : undefined;
      const name = (other?.full_name ?? '').toLowerCase();
      const title = (conv.topic_title ?? '').toLowerCase();
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
                  {conv.topic_title ? (
                    <Text style={styles.convSub} numberOfLines={1}>
                      {conv.topic_title}
                      {(conv.topic_count ?? 0) > 1
                        ? ` · +${(conv.topic_count ?? 1) - 1} assunto${(conv.topic_count ?? 1) - 1 === 1 ? '' : 's'}`
                        : ''}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.convMeta}>
                  <Text style={styles.convTime}>{timeAgo(conv.last_message_at ?? conv.created_at)}</Text>
                  <TouchableOpacity
                    onPress={() => setClearConvId(conv.id)}
                    accessibilityLabel="Limpar conversa"
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
              {activeOtherUser && (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/donor-profile',
                      params: {
                        id: String(activeOtherUser.id),
                        name: activeOtherUser.full_name,
                        avatar: activeOtherUser.avatar_url ?? '',
                      },
                    })
                  }
                >
                  <Text style={styles.chatAreaUserSub}>Ver perfil</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {headerTopic && (
            <TouchableOpacity
              style={styles.chatAreaProduct}
              onPress={() =>
                router.push({ pathname: '/(app)/product', params: { id: String(headerTopic.donation_id) } })
              }
            >
              <Text style={styles.chatAreaProductTitle} numberOfLines={2}>
                {headerTopic.title}
              </Text>
              <FontAwesome name="chevron-right" size={12} color={COLORS.textLight} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.reportIconBtn}
            onPress={() => setShowReportModal(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FontAwesome name="flag-o" size={16} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Banner de segurança */}
        <View style={styles.securityBanner}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#555" style={{ marginRight: 8, flexShrink: 0 }} />
          <Text style={styles.securityText}>
            Pote Cheio não solicita seus dados por este chat. Ao suspeitar de algo, denuncie.
          </Text>
        </View>

        <TopicFilterBar topics={topics} selected={selectedTopic} onSelect={setSelectedTopic} />

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
              if (msg.type === 'topic') {
                return (
                  <TopicDivider
                    key={msg.id}
                    message={msg}
                    isMine={fromMe}
                    onPress={() => router.push({ pathname: '/(app)/product', params: { id: String(msg.donation_id) } })}
                  />
                );
              }
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
          {headerTopic && (
            <TouchableOpacity
              style={styles.detailsBtn}
              onPress={() =>
                router.push({ pathname: '/(app)/product', params: { id: String(headerTopic.donation_id) } })
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

        <ReportModal
          visible={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetType="conversation"
          targetId={activeConvId}
        />
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <Head><title>Mensagens | Pote Cheio</title></Head>
      <MainHeader />
      <View style={styles.body}>
        {showSidebar && renderSidebar()}
        {showChatArea && renderChatArea()}
      </View>

      <ClearConversationModal
        visible={clearConvId != null}
        otherUserName={(() => {
          const conv = conversations.find(c => c.id === clearConvId);
          return conv && user ? getOtherUser(conv, user.id)?.full_name : undefined;
        })()}
        onClose={() => setClearConvId(null)}
        onConfirm={handleClearConversation}
      />
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
  reportIconBtn: { paddingLeft: 14, paddingVertical: 4 },

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
