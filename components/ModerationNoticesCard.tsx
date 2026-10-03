import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SIZES } from '../constants/theme';
import { ModerationNotice } from '../services/moderationService';

const WARNING_LIMIT = 3;

function noticeTitle(notice: ModerationNotice): string {
  if (notice.action_type === 'remove_post') {
    return notice.donation_title ? `Publicação removida: "${notice.donation_title}"` : 'Publicação removida';
  }
  if (notice.ban_days && notice.ban_days > 0) {
    return `Suspensão de ${notice.ban_days} dia${notice.ban_days === 1 ? '' : 's'}`;
  }
  return 'Advertência';
}

function NoticeRow({ notice }: { notice: ModerationNotice }) {
  return (
    <View style={styles.noticeRow}>
      <View style={styles.noticeHeader}>
        <Text style={styles.noticeTitle}>{noticeTitle(notice)}</Text>
        <Text style={styles.noticeDate}>{new Date(notice.created_at).toLocaleDateString('pt-BR')}</Text>
      </View>
      {notice.reason ? <Text style={styles.noticeReason}>Motivo: {notice.reason}</Text> : null}
    </View>
  );
}

export default function ModerationNoticesCard({ notices }: { notices: ModerationNotice[] }) {
  const [expanded, setExpanded] = useState(false);

  if (notices.length === 0) return null;

  const [latest, ...older] = notices;
  const warningCount = notices.filter(n => n.action_type === 'warning').length;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <FontAwesome name="exclamation-triangle" size={16} color="#B35A00" />
        <Text style={styles.cardTitle}>Avisos da moderação</Text>
        <Text style={styles.privateTag}>só você vê</Text>
      </View>

      <NoticeRow notice={latest} />

      {older.length > 0 && (
        <>
          {expanded && older.map(n => <NoticeRow key={n.id} notice={n} />)}
          <TouchableOpacity onPress={() => setExpanded(e => !e)} style={styles.toggle}>
            <Text style={styles.toggleText}>
              {expanded ? 'Ocultar histórico' : `Ver histórico (${older.length} anterior${older.length === 1 ? '' : 'es'})`}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.footer}>
        Você tem {warningCount} advertência{warningCount === 1 ? '' : 's'}. Ao acumular {WARNING_LIMIT}, sua conta pode ser excluída.
        Siga as regras da comunidade para evitar novas penalidades.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF6E8',
    borderWidth: 1,
    borderColor: '#F5C27A',
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 20,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#7A3E00', flex: 1 },
  privateTag: { fontSize: 11, color: '#B35A00', fontStyle: 'italic' },
  noticeRow: { backgroundColor: '#FFF', borderRadius: 8, padding: 10, marginBottom: 8 },
  noticeHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  noticeTitle: { fontSize: 13, fontWeight: '700', color: '#7A3E00', flex: 1 },
  noticeDate: { fontSize: 12, color: '#B35A00' },
  noticeReason: { fontSize: 13, color: '#4A3A2A', marginTop: 4, lineHeight: 18 },
  toggle: { paddingVertical: 4 },
  toggleText: { fontSize: 13, color: '#B35A00', fontWeight: '600' },
  footer: { fontSize: 12, color: '#7A3E00', marginTop: 8, lineHeight: 17 },
});
