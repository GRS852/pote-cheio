import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MainHeader from '../../components/MainHeader';
import { COLORS, SIZES } from '../../constants/theme';
import { useAuth } from '../../services/AuthContext';
import { DeliveryItem, getDeliveriesRequest } from '../../services/donationService';

type DeliveryTab = 'donor' | 'recipient';

const TABS: { key: DeliveryTab; label: string }[] = [
  { key: 'donor', label: 'Enviando' },
  { key: 'recipient', label: 'Recebendo' },
];

const EMPTY_TEXT: Record<DeliveryTab, string> = {
  donor: 'Você não está enviando nenhuma doação no momento.',
  recipient: 'Você não está recebendo nenhuma doação no momento.',
};

function describe(item: DeliveryItem): string {
  const other = item.other_user_name ?? 'a outra pessoa';

  if (item.stage === 'accepted') {
    return item.role === 'donor'
      ? `Aceita — combine a entrega com ${other} pelo chat`
      : `${other} aceitou seu pedido — combine a entrega pelo chat`;
  }

  return item.role === 'donor'
    ? `Enviado — aguardando ${other} confirmar o recebimento`
    : `${other} enviou — confirme quando receber`;
}

export default function DeliveriesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<DeliveryTab>('donor');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError('');
    getDeliveriesRequest(token)
      .then(setItems)
      .catch(err => setError(err instanceof Error ? err.message : 'Não foi possível carregar as entregas.'))
      .finally(() => setLoading(false));
  }, [token]);

  function handleOpen(item: DeliveryItem) {
    router.push({ pathname: '/(app)/transaction', params: { id: String(item.donation_id) } });
  }

  const visible = items.filter(i => i.role === activeTab);

  return (
    <View style={styles.mainContainer}>
      <Head><title>Entregas | Pote Cheio</title></Head>
      <MainHeader showSearch={false} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentWrapper}>
          <Text style={styles.pageTitle}>
            Minhas <Text style={{ color: COLORS.secondary }}>entregas</Text>
          </Text>
          <Text style={styles.pageSubtitle}>
            Acompanhe a entrega das doações que você está enviando e das que está recebendo.
          </Text>

          <View style={styles.tabsContainer}>
            {TABS.map(tab => {
              const count = items.filter(i => i.role === tab.key).length;
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
            visible.map(item => (
              <TouchableOpacity
                key={`${item.role}-${item.donation_id}`}
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
                  <View style={[styles.roleBadge, item.stage === 'shipped' ? styles.roleRecipient : styles.roleDonor]}>
                    <Text style={[styles.roleText, item.stage === 'shipped' ? styles.roleRecipientText : styles.roleDonorText]}>
                      {item.stage === 'shipped' ? 'A caminho' : 'Aguardando envio'}
                    </Text>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.cardDescription}>{describe(item)}</Text>
                  <Text style={styles.cardDate}>Atualizado em {new Date(item.updated_at).toLocaleDateString('pt-BR')}</Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color={COLORS.textLight} />
              </TouchableOpacity>
            ))
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
});
