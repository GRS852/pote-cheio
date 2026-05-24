import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface MockChat {
  id: string;
  user: string;
  lastMessage: string;
  time: string;
  isMyDonation: boolean; 
}

// Propriedades forceOpen e onClose
interface ChatWidgetProps {
  specificDonor?: {
    name: string;
    avatarLetter: string;
  };
  forceOpen?: boolean;
  onClose?: () => void;
}

interface ActiveChatState {
  name: string;
  avatarLetter: string;
  isMyDonation: boolean;
}

export default function ChatWidget({ specificDonor, forceOpen, onClose }: ChatWidgetProps) {
  const [localIsOpen, setLocalIsOpen] = useState<boolean>(false);
  
  // O chat fica aberto se o usuário clicar no balão (localIsOpen) OU se clicar no botão Eu Quero (forceOpen)
  const isOpen = forceOpen || localIsOpen;
  
  const [activeChat, setActiveChat] = useState<ActiveChatState | null>(
    specificDonor ? { name: specificDonor.name, avatarLetter: specificDonor.avatarLetter, isMyDonation: false } : null
  );

  const mockChatList: MockChat[] = [
    { id: '1', user: 'Maria Santos', lastMessage: 'A coleira ainda está disponível?', time: '10:30', isMyDonation: true },
    { id: '2', user: 'João Silva', lastMessage: 'Posso buscar amanhã à tarde!', time: 'Ontem', isMyDonation: false },
  ];

  // Função que lida com o fechamento tanto manual quanto forçado
  const handleClose = () => {
    setLocalIsOpen(false);
    if (onClose) onClose(); // Avisa a tela de Produto que fechou
    if (!specificDonor) setActiveChat(null);
  };

  const handleToggleOpen = () => {
    if (isOpen) handleClose();
    else setLocalIsOpen(true);
  };

  const renderHeaderTitle = () => {
    if (activeChat) {
      return (
        <View style={styles.headerLeftSpecific}>
          {!specificDonor && (
            <TouchableOpacity onPress={() => setActiveChat(null)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
          )}
          
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>{activeChat.avatarLetter}</Text>
          </View>
          <View>
            <Text style={styles.chatTitleSpecific}>{activeChat.name}</Text>
            <Text style={styles.chatSubSpecific}>Visto por último 1 min</Text>
          </View>
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
            {renderHeaderTitle()}
            <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          {activeChat ? (
            <>
              <ScrollView style={styles.messagesArea}>
                <View style={styles.bubbleLeft}><Text style={styles.bubbleText}>Oi tudo bem?</Text></View>
                <View style={styles.bubbleRight}><Text style={styles.bubbleTextWhite}>Tudo e você?</Text></View>
                <View style={styles.bubbleLeft}><Text style={styles.bubbleText}>Como podemos combinar a entrega?</Text></View>
                
                {activeChat.isMyDonation && (
                  <View style={styles.systemMessageBadge}>
                    <Text style={styles.systemMessageText}>Consegui Doar</Text>
                    <Text style={styles.systemMessageSub}>Clique somente se conseguiu doar</Text>
                  </View>
                )}
              </ScrollView>
              
            <View style={styles.inputArea}>
            <TextInput style={styles.input} placeholder="Mensagem" placeholderTextColor={COLORS.textLight} />
            <TouchableOpacity style={styles.sendButton}>
                <Ionicons name="send" size={16} color="#FFF" style={{ marginLeft: 2 }} /> 
            </TouchableOpacity>
            </View>
            </>
          ) : (
            <ScrollView style={styles.chatList}>
              {mockChatList.map(chat => (
                <TouchableOpacity 
                  key={chat.id} 
                  style={styles.chatItem} 
                  onPress={() => setActiveChat({ name: chat.user, avatarLetter: chat.user.charAt(0), isMyDonation: chat.isMyDonation })}
                >
                  <View style={styles.avatar}><Text style={styles.avatarText}>{chat.user.charAt(0)}</Text></View>
                  <View style={styles.chatInfo}>
                    <View style={styles.chatInfoHeader}>
                      <Text style={styles.chatUserName}>{chat.user}</Text>
                      <Text style={styles.chatTime}>{chat.time}</Text>
                    </View>
                    <Text style={styles.chatMessage} numberOfLines={1}>{chat.lastMessage}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={handleToggleOpen} activeOpacity={0.8}>
        <MaterialCommunityIcons name={isOpen ? "chat-processing" : "chat-processing-outline"} size={32} color="#FFF" />
        {!isOpen && <View style={styles.badge} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'flex-end', padding: 20, zIndex: 9999 },
  fab: { backgroundColor: COLORS.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  badge: { position: 'absolute', top: 10, right: 10, width: 14, height: 14, backgroundColor: COLORS.secondary, borderRadius: 7, borderWidth: 2, borderColor: '#FFF' },
  iconButton: { padding: 4 },
  backButton: { marginRight: 12 },
  chatWindow: { backgroundColor: '#F5F5F5', width: 320, height: 400, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8, overflow: 'hidden' },
  chatHeader: { backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  chatTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  headerLeftSpecific: { flexDirection: 'row', alignItems: 'center' },
  avatarMini: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarMiniText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 },
  chatTitleSpecific: { color: '#FFF', fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  chatSubSpecific: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  messagesArea: { flex: 1, padding: 16 },
  bubbleLeft: { backgroundColor: '#FFF', padding: 12, borderRadius: 16, borderTopLeftRadius: 4, alignSelf: 'flex-start', marginBottom: 12, maxWidth: '80%' },
  bubbleRight: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 16, borderTopRightRadius: 4, alignSelf: 'flex-end', marginBottom: 12, maxWidth: '80%' },
  bubbleText: { color: COLORS.textDark, fontSize: 14 },
  bubbleTextWhite: { color: '#FFF', fontSize: 14 },
  systemMessageBadge: { backgroundColor: '#FFF', borderColor: COLORS.primary, borderWidth: 1, borderRadius: 20, padding: 10, alignSelf: 'center', alignItems: 'center', marginTop: 20 },
  systemMessageText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
  systemMessageSub: { color: COLORS.textLight, fontSize: 10, marginTop: 2 },
  inputArea: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 16, height: 40, marginRight: 10, color: '#000', outlineStyle: 'none' as any },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  chatList: { flex: 1, backgroundColor: '#FFF' },
  chatItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: '#FFF' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EAEAEA', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatInfoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chatUserName: { fontWeight: 'bold', color: '#000' },
  chatTime: { fontSize: 12, color: COLORS.textLight },
  chatMessage: { fontSize: 14, color: COLORS.textDark },
});