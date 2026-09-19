import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AdminWarnModal from '../../../components/AdminWarnModal';
import { COLORS, SIZES } from '../../../constants/theme';
import { useAdminAuth } from '../../../services/AdminAuthContext';
import {
  AdminReportDetail,
  disableUserRequest,
  getAdminReportRequest,
  updateReportStatusRequest,
  warnUserRequest,
} from '../../../services/adminService';
import { REPORT_REASONS } from '../../../services/reportService';

function reasonLabel(reason: string): string {
  return REPORT_REASONS.find(r => r.value === reason)?.label ?? reason;
}

const STATUS_ACTIONS: { value: string; label: string; color: string }[] = [
  { value: 'reviewing', label: 'Assumir / marcar em análise', color: '#0B5DBB' },
  { value: 'resolved', label: 'Marcar resolvida', color: COLORS.primary },
  { value: 'dismissed', label: 'Descartar', color: COLORS.textDark },
  { value: 'pending', label: 'Devolver (destravar)', color: COLORS.textLight },
];

export default function AdminReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { adminToken, admin } = useAdminAuth();
  const [report, setReport] = useState<AdminReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showWarnModal, setShowWarnModal] = useState(false);

  const load = useCallback(async () => {
    if (!adminToken || !id) return;
    setLoading(true);
    try {
      const data = await getAdminReportRequest(adminToken, Number(id));
      setReport(data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [adminToken, id]);

  useEffect(() => { load(); }, [load]);

  const lockedByOther = !!report?.assigned_admin_id && report.assigned_admin_id !== admin?.id;

  async function handleStatusChange(status: string) {
    if (!adminToken || !report) return;
    setUpdating(true);
    try {
      const updated = await updateReportStatusRequest(adminToken, report.id, status);
      setReport({ ...report, ...updated });
    } catch (err) {
      Alert.alert('Não foi possível atualizar', err instanceof Error ? err.message : 'Tente novamente.');
    } finally {
      setUpdating(false);
    }
  }

  async function handleWarn(banDays: number, reason: string) {
    if (!adminToken || !report?.reported_user_id) return;
    await warnUserRequest(adminToken, report.reported_user_id, { ban_days: banDays, reason, report_id: report.id });
    await load();
  }

  function handleDisableAccount() {
    if (!adminToken || !report?.reported_user_id) return;
    Alert.alert(
      'Excluir conta do usuário',
      'A conta será desativada imediatamente e removida em definitivo em 30 dias. Confirma?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await disableUserRequest(adminToken, report.reported_user_id as number, { report_id: report.id });
              await load();
            } catch (err) {
              Alert.alert('Não foi possível excluir', err instanceof Error ? err.message : 'Tente novamente.');
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Denúncia não encontrada.</Text>
      </View>
    );
  }

  const warningCount = report.reported_user_warning_count ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <FontAwesome name="chevron-left" size={12} color={COLORS.primary} />
        <Text style={styles.backLinkText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.typeTag}>
          <FontAwesome name={report.target_type === 'donation' ? 'file-text-o' : 'comment-o'} size={12} color="#FFF" />
          <Text style={styles.typeTagText}>
            {report.target_type === 'donation' ? 'Denúncia de Post' : 'Denúncia de Chat'}
          </Text>
        </View>

        <Text style={styles.title}>{reasonLabel(report.reason)}</Text>
        <Text style={styles.status}>Status atual: <Text style={styles.bold}>{report.status}</Text></Text>

        {report.assigned_admin_name && (
          <View style={styles.lockBanner}>
            <FontAwesome name="lock" size={12} color="#0B5DBB" />
            <Text style={styles.lockBannerText}>
              Em análise — Administrador {report.assigned_admin_name}
              {lockedByOther ? ' (você não pode agir aqui até ser liberado)' : ' (você)'}
            </Text>
          </View>
        )}

        {report.description ? (
          <>
            <Text style={styles.sectionLabel}>DESCRIÇÃO DO DENUNCIANTE</Text>
            <Text style={styles.description}>{report.description}</Text>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>DENUNCIANTE</Text>
        <Text style={styles.personText}>{report.reporter_name ?? 'Usuário'} · {report.reporter_email}</Text>

        {report.reported_user_id && (
          <>
            <Text style={styles.sectionLabel}>USUÁRIO DENUNCIADO</Text>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/admin/user/[id]', params: { id: String(report.reported_user_id) } })}
            >
              <Text style={styles.personLink}>
                {report.reported_user_name ?? 'Usuário'} · {report.reported_user_email} — ver perfil completo
              </Text>
            </TouchableOpacity>
            <Text style={[styles.warningText, warningCount >= 3 && styles.warningTextDanger]}>
              {warningCount} advertência{warningCount === 1 ? '' : 's'}
              {warningCount >= 3 ? ' — já atingiu o limite recomendado para exclusão' : ''}
            </Text>
            {report.reported_user_status === 'disabled' && (
              <Text style={styles.warningTextDanger}>Conta já está desativada</Text>
            )}
            {report.banned_until && new Date(report.banned_until) > new Date() && (
              <Text style={styles.warningTextDanger}>
                Banido até {new Date(report.banned_until).toLocaleString('pt-BR')}
              </Text>
            )}
          </>
        )}

        {report.donation && (
          <>
            <Text style={styles.sectionLabel}>PUBLICAÇÃO DENUNCIADA</Text>
            {!!report.donation.photo_url && (
              <Image source={{ uri: String(report.donation.photo_url) }} style={styles.donationImage} resizeMode="cover" />
            )}
            <Text style={styles.personText}>{String(report.donation.title)}</Text>
            <Text style={styles.descriptionMuted}>{String(report.donation.description ?? '')}</Text>
          </>
        )}

        {report.messages && (
          <>
            <Text style={styles.sectionLabel}>CONVERSA DENUNCIADA ({report.messages.length} mensagens)</Text>
            {report.messages.map(m => (
              <View key={m.id} style={styles.messageRow}>
                <Text style={styles.messageAuthor}>Usuário #{m.author_id}</Text>
                <Text style={styles.messageContent}>{m.content}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.sectionLabel}>STATUS DA DENÚNCIA</Text>
        <View style={styles.actionsRow}>
          {STATUS_ACTIONS.filter(a => a.value !== report.status).map(action => (
            <TouchableOpacity
              key={action.value}
              style={[styles.actionBtn, { borderColor: action.color }, lockedByOther && styles.actionBtnDisabled]}
              onPress={() => handleStatusChange(action.value)}
              disabled={updating || lockedByOther}
            >
              <Text style={[styles.actionBtnText, { color: action.color }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {report.reported_user_id && (
          <>
            <Text style={styles.sectionLabel}>PUNIÇÕES AO USUÁRIO DENUNCIADO</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: '#B35A00' }, lockedByOther && styles.actionBtnDisabled]}
                onPress={() => setShowWarnModal(true)}
                disabled={lockedByOther}
              >
                <Text style={[styles.actionBtnText, { color: '#B35A00' }]}>Advertência / banir temporariamente</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: '#C0392B' }, lockedByOther && styles.actionBtnDisabled]}
                onPress={handleDisableAccount}
                disabled={lockedByOther || report.reported_user_status === 'disabled'}
              >
                <Text style={[styles.actionBtnText, { color: '#C0392B' }]}>Excluir conta do usuário</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <AdminWarnModal visible={showWarnModal} onClose={() => setShowWarnModal(false)} onConfirm={handleWarn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundGray },
  content: { padding: 20, maxWidth: 700, width: '100%', alignSelf: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.backgroundGray },
  errorText: { fontSize: 15, color: COLORS.textDark },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backLinkText: { color: COLORS.primary, fontWeight: '600' },
  card: { backgroundColor: '#FFF', borderRadius: SIZES.radius, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  typeTagText: { color: '#FFF', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  status: { fontSize: 14, color: COLORS.textDark, marginBottom: 10 },
  bold: { fontWeight: '700', color: '#000' },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D6E9FF',
    borderRadius: SIZES.radius,
    padding: 10,
    marginBottom: 10,
  },
  lockBannerText: { color: '#0B5DBB', fontSize: 13, fontWeight: '600', flex: 1 },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.secondary, textTransform: 'uppercase', marginTop: 18, marginBottom: 6 },
  description: { fontSize: 14, color: '#000', lineHeight: 20 },
  descriptionMuted: { fontSize: 13, color: COLORS.textDark, marginTop: 2 },
  personText: { fontSize: 14, color: '#000' },
  personLink: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  warningText: { fontSize: 13, color: COLORS.textDark, marginTop: 6 },
  warningTextDanger: { fontSize: 13, color: '#C0392B', fontWeight: '700', marginTop: 6 },
  donationImage: { width: '100%', height: 220, borderRadius: SIZES.radius, marginBottom: 10, backgroundColor: COLORS.border },
  messageRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  messageAuthor: { fontSize: 11, color: COLORS.textLight, marginBottom: 2 },
  messageContent: { fontSize: 14, color: '#000' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: SIZES.radius, borderWidth: 1.5 },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnText: { fontWeight: 'bold', fontSize: 14 },
});
