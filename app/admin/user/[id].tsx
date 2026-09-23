import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, SIZES } from '../../../constants/theme';
import { useAdminAuth } from '../../../services/AdminAuthContext';
import { AdminUserActivity, getAdminConversationMessagesRequest, getAdminUserActivityRequest, reactivateUserRequest } from '../../../services/adminService';

const ACTION_LABELS: Record<string, string> = {
  warning: 'Advertência',
  disable_account: 'Conta desativada',
  reactivate_account: 'Conta reativada',
};

interface AdminMessage {
  id: number;
  author_id: number;
  content: string;
  sent_at: string;
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <FontAwesome name={icon as any} size={14} color={COLORS.secondary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function AdminUserActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { adminToken } = useAdminAuth();
  const [data, setData] = useState<AdminUserActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [openConvId, setOpenConvId] = useState<number | null>(null);
  const [convMessages, setConvMessages] = useState<Record<number, AdminMessage[]>>({});

  const load = useCallback(async () => {
    if (!adminToken || !id) return;
    setLoading(true);
    try {
      const result = await getAdminUserActivityRequest(adminToken, Number(id));
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [adminToken, id]);

  useEffect(() => { load(); }, [load]);

  async function toggleConversation(convId: number) {
    if (openConvId === convId) {
      setOpenConvId(null);
      return;
    }
    setOpenConvId(convId);
    if (!adminToken || convMessages[convId]) return;
    const result = await getAdminConversationMessagesRequest(adminToken, convId);
    setConvMessages(prev => ({ ...prev, [convId]: result.messages }));
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Usuário não encontrado.</Text>
      </View>
    );
  }

  const { user, donations, wishlist, donation_history, conversations, reports_made, reports_against, moderation_history, warning_count } = data;

  async function handleReactivate() {
    if (!adminToken) return;
    Alert.alert('Reativar conta', `Reativar a conta de ${user.full_name ?? user.email}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Reativar', onPress: async () => { await reactivateUserRequest(adminToken, user.id); load(); } },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Head><title>{user.full_name ?? user.email} | Pote Cheio</title></Head>
      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <FontAwesome name="chevron-left" size={12} color={COLORS.primary} />
        <Text style={styles.backLinkText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarLetter}>{(user.full_name ?? user.email)[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.profileNameRow}>
            <Text style={styles.profileName}>{user.full_name ?? 'Sem nome'}</Text>
            {user.status === 'disabled' && (
              <View style={styles.statusBadgeDisabled}>
                <Text style={styles.statusBadgeText}>DESATIVADA</Text>
              </View>
            )}
          </View>
          <Text style={styles.profileEmail}>{user.email}</Text>
          <Text style={styles.profileMeta}>
            Membro desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
            {user.phone ? ` · ${user.phone}` : ''}
          </Text>
        </View>
        {user.status === 'disabled' && (
          <TouchableOpacity style={styles.reactivateBtn} onPress={handleReactivate}>
            <Text style={styles.reactivateBtnText}>Reativar</Text>
          </TouchableOpacity>
        )}
      </View>

      {(warning_count > 0 || reports_against.length > 0 || (user.banned_until && new Date(user.banned_until) > new Date())) && (
        <View style={styles.warningBanner}>
          <FontAwesome name="exclamation-triangle" size={14} color="#B35A00" />
          <View style={{ flex: 1 }}>
            {reports_against.length > 0 && (
              <Text style={styles.warningText}>Este usuário já foi denunciado {reports_against.length}x.</Text>
            )}
            <Text style={[styles.warningText, warning_count >= 3 && styles.warningTextDanger]}>
              {warning_count} advertência{warning_count === 1 ? '' : 's'}
              {warning_count >= 3 ? ' — no limite recomendado para exclusão de conta' : ''}
            </Text>
            {user.banned_until && new Date(user.banned_until) > new Date() && (
              <Text style={styles.warningTextDanger}>
                Banido até {new Date(user.banned_until).toLocaleString('pt-BR')}
              </Text>
            )}
          </View>
        </View>
      )}

      <SectionCard title={`Publicações (${donations.length})`} icon="file-text-o">
        {donations.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma publicação.</Text>
        ) : (
          donations.map((d: any) => (
            <View key={d.id} style={styles.row}>
              <Text style={styles.rowTitle}>{d.title}</Text>
              <Text style={styles.rowMeta}>{d.category} · {d.status}</Text>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard title={`Interesses/Recebimentos (${wishlist.length})`} icon="heart-o">
        {wishlist.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum interesse registrado.</Text>
        ) : (
          wishlist.map((w: any) => (
            <View key={w.id} style={styles.row}>
              <Text style={styles.rowTitle}>{w.title}</Text>
              <Text style={styles.rowMeta}>{w.donation_status}</Text>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard title={`Histórico de doações concluídas (${donation_history.length})`} icon="check-circle-o">
        {donation_history.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma doação concluída ainda.</Text>
        ) : (
          donation_history.map((h: any) => (
            <View key={h.id} style={styles.row}>
              <Text style={styles.rowTitle}>{h.title}</Text>
              <Text style={styles.rowMeta}>
                {h.donor_id === user.id ? 'Como doador' : 'Como recebedor'} · {new Date(h.donated_at).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard title={`Conversas (${conversations.length})`} icon="comment-o">
        {conversations.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma conversa.</Text>
        ) : (
          conversations.map((c: any) => (
            <View key={c.id}>
              <TouchableOpacity style={styles.row} onPress={() => toggleConversation(c.id)}>
                <Text style={styles.rowTitle}>{c.sender_name} → {c.recipient_name}</Text>
                <Text style={styles.rowMeta}>{c.donation_title ?? 'Doação removida'}</Text>
              </TouchableOpacity>
              {openConvId === c.id && (
                <View style={styles.messagesBox}>
                  {!convMessages[c.id] ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : convMessages[c.id].length === 0 ? (
                    <Text style={styles.emptyText}>Sem mensagens.</Text>
                  ) : (
                    convMessages[c.id].map(m => (
                      <View key={m.id} style={styles.messageRow}>
                        <Text style={styles.messageAuthor}>Usuário #{m.author_id}</Text>
                        <Text style={styles.messageContent}>{m.content}</Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard title={`Histórico de moderação (${moderation_history.length})`} icon="gavel">
        {moderation_history.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma ação de moderação registrada.</Text>
        ) : (
          moderation_history.map(a => (
            <View key={a.id} style={styles.row}>
              <Text style={styles.rowTitle}>
                {ACTION_LABELS[a.action_type] ?? a.action_type}
                {a.ban_days ? ` — banimento de ${a.ban_days} dia${a.ban_days === 1 ? '' : 's'}` : ''}
              </Text>
              <Text style={styles.rowMeta}>
                Por {a.admin_name} em {new Date(a.created_at).toLocaleString('pt-BR')}
                {a.reason ? ` — ${a.reason}` : ''}
              </Text>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard title={`Denúncias feitas por ele (${reports_made.length})`} icon="flag-o">
        {reports_made.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma.</Text>
        ) : (
          reports_made.map(r => (
            <TouchableOpacity
              key={r.id}
              style={styles.row}
              onPress={() => router.push({ pathname: '/admin/report/[id]', params: { id: String(r.id) } })}
            >
              <Text style={styles.rowTitle}>{r.reason}</Text>
              <Text style={styles.rowMeta}>{r.status}</Text>
            </TouchableOpacity>
          ))
        )}
      </SectionCard>

      <SectionCard title={`Denúncias contra ele (${reports_against.length})`} icon="warning">
        {reports_against.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma.</Text>
        ) : (
          reports_against.map(r => (
            <TouchableOpacity
              key={r.id}
              style={styles.row}
              onPress={() => router.push({ pathname: '/admin/report/[id]', params: { id: String(r.id) } })}
            >
              <Text style={styles.rowTitle}>{r.reason}</Text>
              <Text style={styles.rowMeta}>{r.status}</Text>
            </TouchableOpacity>
          ))
        )}
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundGray },
  content: { padding: 20, maxWidth: 700, width: '100%', alignSelf: 'center', gap: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.backgroundGray },
  errorText: { fontSize: 15, color: COLORS.textDark },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backLinkText: { color: COLORS.primary, fontWeight: '600' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFF',
    borderRadius: SIZES.radius,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  profileAvatarLetter: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  statusBadgeDisabled: { backgroundColor: '#C0392B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  profileEmail: { fontSize: 13, color: COLORS.textDark },
  profileMeta: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  reactivateBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: SIZES.radius, borderWidth: 1.5, borderColor: COLORS.primary, alignSelf: 'flex-start' },
  reactivateBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13 },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFE5CC',
    borderRadius: SIZES.radius,
    padding: 12,
  },
  warningText: { color: '#B35A00', fontWeight: '600', fontSize: 13 },
  warningTextDanger: { color: '#C0392B', fontWeight: '700', fontSize: 13, marginTop: 4 },
  section: { backgroundColor: '#FFF', borderRadius: SIZES.radius, padding: 18, borderWidth: 1, borderColor: COLORS.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#000' },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowTitle: { fontSize: 14, color: '#000', fontWeight: '600' },
  rowMeta: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  emptyText: { fontSize: 13, color: COLORS.textLight },
  messagesBox: { paddingLeft: 12, paddingVertical: 8, gap: 6 },
  messageRow: { paddingVertical: 4 },
  messageAuthor: { fontSize: 11, color: COLORS.textLight },
  messageContent: { fontSize: 13, color: '#000' },
});
