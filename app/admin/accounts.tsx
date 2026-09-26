import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, SIZES } from '../../constants/theme';
import { useAdminAuth } from '../../services/AdminAuthContext';
import { AdminDisabledAccount, getDisabledAccountsRequest, reactivateUserRequest } from '../../services/adminService';

export default function AdminAccountsScreen() {
  const router = useRouter();
  const { adminToken } = useAdminAuth();
  const [accounts, setAccounts] = useState<AdminDisabledAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const data = await getDisabledAccountsRequest(adminToken);
      setAccounts(data);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => { load(); }, [load]);

  async function handleReactivate(id: number, name: string) {
    if (!adminToken) return;
    if (!window.confirm(`Reativar a conta de ${name}?`)) return;
    try {
      await reactivateUserRequest(adminToken, id);
      load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Não foi possível reativar a conta.');
    }
  }

  return (
    <View style={styles.container}>
      <Head><title>Contas desativadas | Pote Cheio</title></Head>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backLink} onPress={() => router.push('/admin/dashboard')}>
          <FontAwesome name="chevron-left" size={12} color={COLORS.primary} />
          <Text style={styles.backLinkText}>Voltar ao painel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contas desativadas</Text>
        <Text style={styles.headerSub}>
          Contas excluídas ficam desativadas por 30 dias antes de serem removidas em definitivo.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : accounts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="check-circle-o" size={40} color={COLORS.textLight} />
          <Text style={styles.emptyText}>Nenhuma conta desativada no momento.</Text>
        </View>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => router.push({ pathname: '/admin/user/[id]', params: { id: String(item.id) } })}
              >
                <Text style={styles.cardName}>{item.full_name ?? 'Usuário'}</Text>
                <Text style={styles.cardEmail}>{item.email}</Text>
                <Text style={styles.cardMeta}>
                  Desativada em {new Date(item.disabled_at).toLocaleDateString('pt-BR')} ·{' '}
                  <Text style={item.days_remaining <= 5 ? styles.daysDanger : styles.daysNormal}>
                    {item.days_remaining} dia{item.days_remaining === 1 ? '' : 's'} até a remoção definitiva
                  </Text>
                </Text>
                {item.disable_reason ? (
                  <Text style={styles.cardReason} numberOfLines={2}>Motivo: {item.disable_reason}</Text>
                ) : null}
                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {item.warning_count} advertência{item.warning_count === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <View style={[styles.badge, styles.badgeDanger]}>
                    <Text style={[styles.badgeText, styles.badgeTextDanger]}>
                      {item.suspension_count} suspensão{item.suspension_count === 1 ? '' : 'ões'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reactivateBtn}
                onPress={() => handleReactivate(item.id, item.full_name ?? item.email)}
              >
                <Text style={styles.reactivateBtnText}>Reverter (reativar)</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundGray },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  backLinkText: { color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  headerSub: { fontSize: 13, color: COLORS.textDark, marginTop: 4 },
  list: { padding: 20, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: SIZES.radius,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  cardName: { fontSize: 15, fontWeight: 'bold', color: '#000' },
  cardEmail: { fontSize: 13, color: COLORS.textDark, marginTop: 2 },
  cardMeta: { fontSize: 12, color: COLORS.textLight, marginTop: 6 },
  daysNormal: { color: COLORS.textDark, fontWeight: '600' },
  daysDanger: { color: '#C0392B', fontWeight: '700' },
  cardReason: { fontSize: 12, color: COLORS.textDark, marginTop: 6, fontStyle: 'italic' },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, backgroundColor: '#FFE5CC' },
  badgeDanger: { backgroundColor: '#FBD5D0' },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: '#B35A00' },
  badgeTextDanger: { color: '#C0392B' },
  reactivateBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: SIZES.radius, borderWidth: 1.5, borderColor: COLORS.primary },
  reactivateBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textLight },
});
