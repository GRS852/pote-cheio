import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/theme';
import { Message } from '../services/conversationService';

// Um bate-papo por dupla de usuários: cada doação em que alguém demonstra
// interesse vira um "assunto", marcado na conversa por uma mensagem do tipo
// 'topic'. As mensagens de texto carregam o donation_id do assunto em que
// foram enviadas, o que permite filtrar a conversa por assunto.

export interface ChatTopic {
  donation_id: number;
  title: string;
}

const STATUS_LABEL: Record<string, string> = {
  available: 'Disponível',
  reserved: 'Reservado',
  completed: 'Doado',
  cancelled: 'Encerrada',
  closed: 'Encerrada',
  removed: 'Removida',
};

/** Assuntos da conversa, na ordem em que apareceram. */
export function getTopics(messages: Message[]): ChatTopic[] {
  const topics: ChatTopic[] = [];
  for (const m of messages) {
    if (m.type === 'topic' && m.donation_id != null && !topics.some(t => t.donation_id === m.donation_id)) {
      topics.push({ donation_id: m.donation_id, title: m.donation_title ?? m.content });
    }
  }
  return topics;
}

/** null = todos os assuntos. */
export function filterByTopic(messages: Message[], donationId: number | null): Message[] {
  if (donationId == null) return messages;
  return messages.filter(m => m.donation_id === donationId);
}

export function TopicFilterBar({
  topics,
  selected,
  onSelect,
}: {
  topics: ChatTopic[];
  selected: number | null;
  onSelect: (donationId: number | null) => void;
}) {
  // Com um assunto só não há o que filtrar
  if (topics.length < 2) return null;
  const chips: { id: number | null; label: string }[] = [
    { id: null, label: 'Todos' },
    ...topics.map(t => ({ id: t.donation_id, label: t.title })),
  ];
  return (
    <View style={styles.filterBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
        {chips.map(chip => {
          const active = chip.id === selected;
          return (
            <TouchableOpacity
              key={chip.id ?? 'all'}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onSelect(chip.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{chip.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function TopicDivider({
  message,
  isMine,
  onPress,
  compact = false,
}: {
  message: Message;
  isMine: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  const title = message.donation_title ?? message.content;
  const status = message.donation_status ? STATUS_LABEL[message.donation_status] : null;
  return (
    <TouchableOpacity style={[styles.topic, compact && styles.topicCompact]} onPress={onPress} activeOpacity={0.8}>
      {message.donation_photo_url ? (
        <Image source={{ uri: message.donation_photo_url }} style={[styles.topicImage, compact && styles.topicImageCompact]} />
      ) : (
        <View style={[styles.topicImage, compact && styles.topicImageCompact, styles.topicImagePlaceholder]}>
          <FontAwesome name="gift" size={compact ? 14 : 18} color={COLORS.secondary} />
        </View>
      )}
      <View style={styles.topicInfo}>
        <Text style={styles.topicLabel}>
          {isMine ? 'Você demonstrou interesse' : 'Novo assunto'}
          {status ? ` · ${status}` : ''}
        </Text>
        <Text style={[styles.topicTitle, compact && styles.topicTitleCompact]} numberOfLines={1}>{title}</Text>
      </View>
      <Text style={styles.topicLink}>Ver ›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  filterBar: { borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: '#FFF' },
  filterContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFF', maxWidth: 180 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textDark },
  chipTextActive: { color: '#FFF' },
  topic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    marginVertical: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(254,108,0,0.35)',
    backgroundColor: 'rgba(254,108,0,0.06)',
  },
  topicCompact: { padding: 8, marginVertical: 8 },
  topicImage: { width: 44, height: 44, borderRadius: 8, backgroundColor: COLORS.border },
  topicImageCompact: { width: 34, height: 34 },
  topicImagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(254,108,0,0.12)' },
  topicInfo: { flex: 1 },
  topicLabel: { fontSize: 11, fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase' },
  topicTitle: { fontSize: 14, fontWeight: 'bold', color: '#000', marginTop: 2 },
  topicTitleCompact: { fontSize: 13 },
  topicLink: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
});
