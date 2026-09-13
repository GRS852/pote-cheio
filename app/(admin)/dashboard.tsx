import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, SIZES } from '../../constants/theme';
import { useAdminAuth } from '../../services/AdminAuthContext';
import { AdminReport, getAdminReportsRequest } from '../../services/adminService';
import { REPORT_REASONS } from '../../services/reportService';

type StatusFilter = 'pending' | 'reviewing' | 'resolved' | 'dismissed' | 'all';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'pending', label: 'Pendentes' },
  { value: 'reviewing', label: 'Em análise' },
  { value: 'resolved', label: 'Resolvidas' },
  { value: 'dismissed', label: 'Descartadas' },
  { value: 'all', label: 'Todas' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FFE5CC', text: '#B35A00' },
  reviewing: { bg: '#D6E9FF', text: '#0B5DBB' },
  resolved: { bg: '#D1F0D9', text: COLORS.primary },
  dismissed: { bg: '#EAEAEA', text: COLORS.textDark },
};

function reasonLabel(reason: string): string {
  return REPORT_REASONS.find(r => r.value === reason)?.label ?? reason;
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { admin, adminToken, adminSignOut } = useAdminAuth();
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const data = await getAdminReportsRequest(adminToken, filter === 'all' ? undefined : filter);
      setReports(data);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [adminToken, filter]);

  useEffect(() => { loadReports(); }, [loadReports]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FontAwesome name="shield" size={18} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Painel do Administrador</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.adminName}>{admin?.full_name ?? admin?.email}</Text>
          <TouchableOpacity onPress={adminSignOut} style={styles.logoutBtn}>
            <FontAwesome name="sign-out" size={16} color="#C0392B" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {STATUS_TABS.map(tab => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, filter === tab.value && styles.tabActive]}
            onPress={() => setFilter(tab.value)}
          >
            <Text style={[styles.tabText, filter === tab.value && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="check-circle-o" size={40} color={COLORS.textLight} />
          <Text style={styles.emptyText}>Nenhuma denúncia por aqui.</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const statusStyle = STATUS_COLORS[item.status] ?? STATUS_COLORS.pending;
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/(admin)/report/[id]', params: { id: String(item.id) } })}
              >
                <View style={styles.cardTop}>
                  <FontAwesome
                    name={item.target_type === 'donation' ? 'file-text-o' : 'comment-o'}
                    size={14}
                    color={COLORS.textLight}
                  />
                  <Text style={styles.cardReason}>{reasonLabel(item.reason)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.cardDetail}>
                  {item.target_type === 'donation' ? item.donation_title ?? 'Publicação' : 'Conversa'} · denunciado por{' '}
                  <Text style={styles.bold}>{item.reporter_name ?? 'Usuário'}</Text>
                  {item.reported_user_name ? (
                    <>
                      {' '}contra <Text style={styles.bold}>{item.reported_user_name}</Text>
                    </>
                  ) : null}
                </Text>
                <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundGray },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#000' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  adminName: { fontSize: 13, color: COLORS.textDark },
  logoutBtn: { padding: 6 },
  tabsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingVertical: 14 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.textDark, fontWeight: '600' },
  tabTextActive: { color: '#FFF' },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  card: { backgroundColor: '#FFF', borderRadius: SIZES.radius, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardReason: { fontSize: 15, fontWeight: 'bold', color: '#000', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  cardDetail: { fontSize: 13, color: COLORS.textDark },
  bold: { fontWeight: '700', color: '#000' },
  cardTime: { fontSize: 12, color: COLORS.textLight },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textLight },
});
