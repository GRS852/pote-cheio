import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/theme';
import { TopicDivider, TopicFilterBar, filterByTopic, getTopics } from './ChatTopics';
import ClearConversationModal from './ClearConversationModal';
import { useAuth } from '../services/AuthContext';
import { Conversation, Message, getConversationsRequest, getMessagesRequest, getOtherUser, hideConversationRequest, lastServerMessageId, mergeMessages, newClientId } from '../services/conversationService';
import { onNewMessage, onReconnect, sendSocketMessage } from '../services/socketService';
import { usePolling } from '../services/usePolling';

interface ChatWidgetProps {
  forceOpenConversationId?: number | null;
  forceOpen?: boolean;
  onClose?: () => void;
  fallbackUserName?: string;
  fallbackUserAvatar?: string | null;
}

function ContactAvatar({ name, avatarUrl, size, bg }: { name: string; avatarUrl?: string | null; size: number; bg?: string }) {
  const radius = size / 2;
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={{ width: size, height: size, borderRadius: radius }} resizeMode="cover" />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: bg ?? '#EAEAEA', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: bg ? COLORS.primary : '#888', fontWeight: 'bold', fontSize: size * 0.42 }}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export default function ChatWidget({ forceOpenConversationId, forceOpen, onClose, fallbackUserName, fallbackUserAvatar }: ChatWidgetProps) {
  const router = useRouter();
  const { token, user } = useAuth();
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const isOpen = forceOpen || localIsOpen;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const [convLoading, setConvLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [clearConvId, setClearConvId] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  const activeConvRef = useRef(activeConvId);
  useEffect(() => { activeConvRef.current = activeConvId; }, [activeConvId]);

  function addMessages(convId: number, incoming: Message[]) {
    if (incoming.length === 0) return;
    setMessages(prev => {
      if (!prev[convId]) return prev;
      return { ...prev, [convId]: mergeMessages(prev[convId], incoming) };
    });
    if (convId === activeConvRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  async function fetchNewMessages() {
    const convId = activeConvRef.current;
    if (!token || convId == null || !messagesRef.current[convId]) return;
    try {
      const msgs = await getMessagesRequest(token, convId, lastServerMessageId(messagesRef.current[convId]));
      addMessages(convId, msgs);
    } catch {}
  }

  // Tempo real pelo socket global (conectado no login) + reconexão
  useEffect(() => {
    const offMessage = onNewMessage(msg => {
      // Novo assunto: atualiza a lista (assunto mais recente e ordem)
      if (msg.type === 'topic' && token) {
        getConversationsRequest(token, user?.id).then(setConversations).catch(() => {});
      }
      addMessages(msg.conversation_id, [msg]);
    });
    const offReconnect = onReconnect(() => { fetchNewMessages(); });
    return () => { offMessage(); offReconnect(); };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rede de segurança enquanto o chat estiver aberto numa conversa
  usePolling(fetchNewMessages, 5000, !!token && isOpen && activeConvId != null);

  // Load conversations when widget opens
  useEffect(() => {
    if (!isOpen || !token) return;
    setConvLoading(true);
    getConversationsRequest(token, user?.id)
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setConvLoading(false));
  }, [isOpen, token, user?.id]);

  // Bug fix: also depends on isOpen so that reopening the widget with the same
  // forceOpenConversationId (same conversation_id returned by the backend) still
  // re-triggers the open. force=true bypasses the message cache so fresh messages
  // are always fetched when the chat is opened from a product page.
  useEffect(() => {
    if (forceOpenConversationId != null && isOpen) {
      openConversation(forceOpenConversationId, true);
    }
  }, [isOpen, forceOpenConversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function openConversation(convId: number, force = false) {
    if (convId !== activeConvRef.current) setSelectedTopic(null);
    setActiveConvId(convId);
    activeConvRef.current = convId;
    if (!force && messagesRef.current[convId]) { // use cache only when not forced
      fetchNewMessages();
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

  function handleClose() {
    setLocalIsOpen(false);
    if (onClose) onClose();
    if (!forceOpenConversationId) setActiveConvId(null);
  }

  function handleToggle() {
    if (isOpen) handleClose();
    else setLocalIsOpen(true);
  }

  function handleSend() {
    const text = inputText.trim();
    if (!text || activeConvId == null || !user) return;

    // Optimistic update
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
    setMessages(prev => ({ ...prev, [activeConvId]: [...(prev[activeConvId] ?? []), optimistic] }));
    sendSocketMessage(activeConvId, text, clientId, selectedTopic);
    setInputText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }

  const activeConv = conversations.find(c => c.id === activeConvId);
  const allMessages = activeConvId != null ? (messages[activeConvId] ?? []) : [];
  const topics = getTopics(allMessages);
  const currentMessages = filterByTopic(allMessages, selectedTopic);
  const headerTopicTitle = topics.find(t => t.donation_id === selectedTopic)?.title
    ?? topics[topics.length - 1]?.title ?? activeConv?.topic_title;

  const renderHeader = () => {
    if (activeConvId != null) {
      const otherUser = activeConv && user ? getOtherUser(activeConv, user.id) : undefined;
      // fallback to props passed from product page while conversations are still loading
      const name = otherUser?.full_name ?? fallbackUserName ?? 'Usuário';
      const avatar = otherUser?.avatar_url ?? fallbackUserAvatar;
      return (
        <View style={styles.headerLeft}>
          {!forceOpenConversationId && (
            <TouchableOpacity onPress={() => setActiveConvId(null)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerUserInfo}
            activeOpacity={otherUser?.id ? 0.7 : 1}
            disabled={!otherUser?.id}
            onPress={() => router.push({
              pathname: '/(app)/donor-profile',
              params: { id: String(otherUser!.id), name, avatar: avatar ?? '' },
            })}
          >
            <View style={[styles.avatarMini, { overflow: 'hidden' }]}>
              <ContactAvatar name={name} avatarUrl={avatar} size={35} bg="#FFF" />
            </View>
            <View>
              <Text style={styles.chatTitleSpecific}>{name}</Text>
              {headerTopicTitle ? (
                <Text style={styles.chatSubSpecific} numberOfLines={1}>{headerTopicTitle}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        </View>
      );
    }
    return <Text style={styles.chatTitle}>Suas Conversas</Text>;
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {isOpen && (
        <View style={styles.chatWindow}>
          <View style={styles.chatHeader}>
            {renderHeader()}
            <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {activeConvId != null ? (
            <>
              <TopicFilterBar topics={topics} selected={selectedTopic} onSelect={setSelectedTopic} />
              <ScrollView
                ref={scrollRef}
                style={styles.messagesArea}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
              >
                {msgLoading ? (
                  <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
                ) : (
                  currentMessages.map(msg => {
                    const fromMe = msg.author_id === user?.id;
                    if (msg.type === 'topic') {
                      return (
                        <TopicDivider
                          key={msg.id}
                          message={msg}
                          isMine={fromMe}
                          compact
                          onPress={() => router.push({ pathname: '/(app)/product', params: { id: String(msg.donation_id) } })}
                        />
                      );
                    }
                    return (
                      <View key={msg.id} style={fromMe ? styles.bubbleRight : styles.bubbleLeft}>
                        <Text style={fromMe ? styles.bubbleTextWhite : styles.bubbleText}>{msg.content}</Text>
                        <Text style={fromMe ? styles.timeRight : styles.timeLeft}>
                          {new Date(msg.sent_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              <View style={styles.inputArea}>
                <TextInput
                  style={styles.input}
                  placeholder="Mensagem"
                  placeholderTextColor={COLORS.textLight}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                  <Ionicons name="send" size={16} color="#FFF" style={{ marginLeft: 2 }} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <ScrollView style={styles.chatList}>
              {convLoading ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />
              ) : conversations.length === 0 ? (
                <View style={styles.emptyConv}>
                  <Text style={styles.emptyConvText}>Nenhuma conversa ainda.</Text>
                </View>
              ) : (
                conversations.map(conv => {
                  const otherUser = user ? getOtherUser(conv, user.id) : undefined;
                  const name = otherUser?.full_name ?? 'Usuário';
                  return (
                    <View key={conv.id} style={styles.chatItem}>
                      <TouchableOpacity style={styles.chatItemMain} onPress={() => openConversation(conv.id)} activeOpacity={0.7}>
                        <View style={[styles.avatar, { overflow: 'hidden' }]}>
                          <ContactAvatar name={name} avatarUrl={otherUser?.avatar_url} size={42} />
                        </View>
                        <View style={styles.chatInfo}>
                          <Text style={styles.chatUserName}>{name}</Text>
                          {conv.topic_title ? (
                            <Text style={styles.chatMessage} numberOfLines={1}>
                              {conv.topic_title}
                              {(conv.topic_count ?? 0) > 1 ? ` · +${(conv.topic_count ?? 1) - 1}` : ''}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.chatDeleteBtn} onPress={() => setClearConvId(conv.id)} accessibilityLabel="Limpar conversa" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="trash-outline" size={16} color={COLORS.textLight} />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      )}

      <ClearConversationModal
        visible={clearConvId != null}
        otherUserName={(() => {
          const conv = conversations.find(c => c.id === clearConvId);
          return conv && user ? getOtherUser(conv, user.id)?.full_name : undefined;
        })()}
        onClose={() => setClearConvId(null)}
        onConfirm={handleClearConversation}
      />

      <TouchableOpacity style={styles.fab} onPress={handleToggle} activeOpacity={0.8}>
        <MaterialCommunityIcons name={isOpen ? 'chat-processing' : 'chat-processing-outline'} size={32} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'flex-end', padding: 20, zIndex: 9999 },
  fab: { backgroundColor: COLORS.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  iconButton: { padding: 4 },
  backButton: { marginRight: 12 },
  chatWindow: { backgroundColor: '#F5F5F5', width: 320, height: 440, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8, overflow: 'hidden' },
  chatHeader: { backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerUserInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  chatTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  avatarMini: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarMiniText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 },
  chatTitleSpecific: { color: '#FFF', fontWeight: 'bold', fontSize: 14, marginBottom: 1 },
  chatSubSpecific: { color: 'rgba(255,255,255,0.7)', fontSize: 10, maxWidth: 160 },
  messagesArea: { flex: 1, padding: 12 },
  bubbleLeft: { backgroundColor: '#FFF', padding: 10, borderRadius: 16, borderTopLeftRadius: 4, alignSelf: 'flex-start', marginBottom: 10, maxWidth: '80%' },
  bubbleRight: { backgroundColor: COLORS.primary, padding: 10, borderRadius: 16, borderTopRightRadius: 4, alignSelf: 'flex-end', marginBottom: 10, maxWidth: '80%' },
  bubbleText: { color: COLORS.textDark, fontSize: 14 },
  bubbleTextWhite: { color: '#FFF', fontSize: 14 },
  timeLeft: { fontSize: 10, color: COLORS.textLight, marginTop: 4 },
  timeRight: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4, textAlign: 'right' },
  inputArea: { flexDirection: 'row', padding: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 14, height: 40, marginRight: 8, color: '#000', outlineStyle: 'none' as any },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  chatList: { flex: 1, backgroundColor: '#FFF' },
  chatItem: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chatItemMain: { flexDirection: 'row', flex: 1, padding: 14, alignItems: 'center' },
  chatDeleteBtn: { padding: 14 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EAEAEA', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatUserName: { fontWeight: 'bold', color: '#000', marginBottom: 2 },
  chatMessage: { fontSize: 13, color: COLORS.textDark },
  emptyConv: { padding: 40, alignItems: 'center' },
  emptyConvText: { color: COLORS.textLight, fontSize: 14 },
});
