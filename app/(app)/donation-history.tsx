import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MainHeader from '../../components/MainHeader';
import { COLORS, SIZES } from '../../constants/theme';
import { useAuth } from '../../services/AuthContext';
import { HistoryItem, HistoryStage, getDonationHistoryRequest } from '../../services/donationService';

type HistoryTab = 'all' | 'donated' | 'received' | 'ongoing' | 'ended';

const TABS: { key: HistoryTab; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'donated', label: 'Doadas' },
  { key: 'received', label: 'Recebidas' },
  { key: 'ongoing', label: 'Em andamento' },
  { key: 'ended', label: 'Canceladas / encerradas' },
];

const EMPTY_TEXT: Record<HistoryTab, string> = {
  all: 'Você ainda não tem nenhuma doação no histórico.',
  donated: 'Você ainda não concluiu nenhuma doação.',
  received: 'Você ainda não recebeu nenhuma doação.',
  ongoing: 'Nenhuma doação em andamento.',
  ended: 'Nenhuma doação cancelada ou encerrada.',
};

function matchesTab(item: HistoryItem, tab: HistoryTab): boolean {
  switch (tab) {
    case 'donated': return item.role === 'donor' && item.stage === 'completed';
    case 'received': return item.role === 'recipient' && item.stage === 'completed';
    case 'ongoing': return ['pending', 'accepted', 'shipped'].includes(item.stage);
    case 'ended': return ['cancelled', 'closed', 'removed'].includes(item.stage);
    default: return true;
  }
}

const STAGE_BADGE: Record<HistoryStage, { label: string; color: string; bg: string }> = {
  pending: { label: 'Aguardando', color: '#8A6D00', bg: 'rgba(241,196,15,0.18)' },
  accepted: { label: 'Aceita', color: COLORS.primary, bg: 'rgba(18,128,42,0.12)' },
  shipped: { label: 'A caminho', color: COLORS.secondary, bg: 'rgba(254,108,0,0.12)' },
  completed: { label: 'Concluída', color: '#1E7E34', bg: 'rgba(39,174,96,0.12)' },
  cancelled: { label: 'Cancelada', color: '#C0392B', bg: 'rgba(192,57,43,0.10)' },
  closed: { label: 'Encerrada', color: '#555', bg: 'rgba(0,0,0,0.07)' },
  removed: { label: 'Removida pela moderação', color: '#C0392B', bg: 'rgba(192,57,43,0.10)' },
};

function daysUntil(dateStr: string): number {
  const diffMs = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

function describe(item: HistoryItem): string {
  const other = item.other_user_name ?? 'a outra pessoa';
  const isDonor = item.role === 'donor';
  const expires = item.reserved_until ? ` · expira em ${daysUntil(item.reserved_until)} dia(s)` : '';

  switch (item.stage) {
    case 'pending':
      if (isDonor) {
        if (item.other_user_id) return `Reservado para ${other}${expires}`;
        const count = item.interested_count ?? 0;
        return `${count} pessoa${count === 1 ? '' : 's'} interessada${count === 1 ? '' : 's'} aguardando sua escolha`;
      }
      return item.reserved_for_me
        ? `${other} reservou para você${expires}`
        : `Você demonstrou interesse — aguardando ${other} escolher`;
    case 'accepted':
      return isDonor ? `Você aceitou doar para ${other}` : `${other} aceitou doar para você`;
    case 'shipped':
      return isDonor ? `Você enviou para ${other}` : `${other} enviou para você`;
    case 'completed':
      return isDonor ? `Doada para ${other}` : `Recebida de ${other}`;
    case 'cancelled':
      return `Negociação com ${other} cancelada`;
    case 'closed':
      return 'Você encerrou esta publicação';
    case 'removed':
      return 'Publicação removida por violar as diretrizes do site';
  }
}

export default function DonationHistoryScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<HistoryTab>('all');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError('');
    getDonationHistoryRequest(token)
      .then(setItems)
      .catch(err => setError(err instanceof Error ? err.message : 'Não foi possível carregar o histórico.'))
      .finally(() => setLoading(false));
  }, [token]);

  function handleOpen(item: HistoryItem) {
    if (['accepted', 'shipped', 'completed'].includes(item.stage)) {
      router.push({ pathname: '/(app)/transaction', params: { id: String(item.donation_id) } });
    } else if (item.stage === 'pending' && item.role === 'donor') {
      router.push('/(app)/profile');
    } else {
      router.push({ pathname: '/(app)/product', params: { id: String(item.donation_id) } });
    }
  }

  const visible = items.filter(i => matchesTab(i, activeTab));

  return (
    <View style={styles.mainContainer}>
      <Head><title>Minhas doações | Pote Cheio</title></Head>
      <MainHeader showSearch={false} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentWrapper}>
          <Text style={styles.pageTitle}>
            Histórico de <Text style={{ color: COLORS.secondary }}>doações</Text>
          </Text>
          <Text style={styles.pageSubtitle}>
            Tudo o que você doou, recebeu e o que ainda está em andamento.
          </Text>

          <View style={styles.tabsContainer}>
            {TABS.map(tab => {
              const count = items.filter(i => matchesTab(i, tab.key)).length;
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {tab.label}{count > 0 ? ` (${count})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ padding: 30 }} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : visible.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome name="inbox" size={32} color={COLORS.textLight} />
              <Text style={styles.emptyText}>{EMPTY_TEXT[activeTab]}</Text>
            </View>
          ) : (
            visible.map(item => {
              const badge = STAGE_BADGE[item.stage];
              return (
                <TouchableOpacity
                  key={item.key}
                  style={styles.card}
                  onPress={() => handleOpen(item)}
                  activeOpacity={0.75}
                >
                  {item.photo_url ? (
                    <Image source={{ uri: item.photo_url }} style={styles.cardImage} />
                  ) : (
                    <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                      <FontAwesome name="image" size={20} color={COLORS.textLight} />
                    </View>
                  )}
                  <View style={styles.cardInfo}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.roleBadge, item.role === 'donor' ? styles.roleDonor : styles.roleRecipient]}>
                        <Text style={[styles.roleText, item.role === 'donor' ? styles.roleDonorText : styles.roleRecipientText]}>
                          {item.role === 'donor' ? 'Doando' : 'Recebendo'}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.cardDescription}>{describe(item)}</Text>
                    <Text style={styles.cardDate}>Atualizado em {new Date(item.updated_at).toLocaleDateString('pt-BR')}</Text>
                  </View>
                  <FontAwesome name="chevron-right" size={14} color={COLORS.textLight} />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.backgroundGray },
  scrollContainer: { flexGrow: 1, paddingBottom: 60 },
  contentWrapper: { width: '100%', maxWidth: 700, alignSelf: 'center', padding: 20 },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: COLORS.textDark, marginBottom: 20 },
  tabsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFF',
  },
  tabButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  tabTextActive: { color: '#FFF' },
  errorText: { color: '#C0392B', fontSize: 14, textAlign: 'center', padding: 20 },
  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFF',
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
  },
  cardImage: { width: 64, height: 64, borderRadius: SIZES.radius, backgroundColor: COLORS.border },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, gap: 3 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  roleDonor: { backgroundColor: 'rgba(39,174,96,0.12)' },
  roleRecipient: { backgroundColor: 'rgba(254,108,0,0.12)' },
  roleText: { fontSize: 11, fontWeight: '700' },
  roleDonorText: { color: '#1E7E34' },
  roleRecipientText: { color: COLORS.secondary },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#000' },
  cardDescription: { fontSize: 13, color: COLORS.textDark, lineHeight: 18 },
  cardDate: { fontSize: 11, color: COLORS.textLight },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
});
