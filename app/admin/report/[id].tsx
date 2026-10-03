import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AdminDisableModal from '../../../components/AdminDisableModal';
import AdminResolveModal from '../../../components/AdminResolveModal';
import AdminTransferModal from '../../../components/AdminTransferModal';
import AdminWarnModal from '../../../components/AdminWarnModal';
import { COLORS, SIZES } from '../../../constants/theme';
import { useAdminAuth } from '../../../services/AdminAuthContext';
import {
  AdminReportDetail,
  AdminSummary,
  disableUserRequest,
  getAdminReportRequest,
  getAdminsRequest,
  removeDonationRequest,
  transferReportRequest,
  updateReportStatusRequest,
  warnUserRequest,
} from '../../../services/adminService';
import { REPORT_REASONS, REPORT_TARGET_ICONS, REPORT_TARGET_LABELS } from '../../../services/reportService';

function reasonLabel(reason: string): string {
  return REPORT_REASONS.find(r => r.value === reason)?.label ?? reason;
}

function resolutionActionLabel(type?: string | null, banDays?: number | null): string | null {
  if (type === 'disable_account') return 'Exclusão de conta';
  if (type === 'warning') return banDays && banDays > 0 ? `Suspensão (${banDays} dia${banDays === 1 ? '' : 's'})` : 'Advertência';
  if (type === 'reactivate_account') return 'Reativação de conta';
  if (type === 'remove_post') return 'Publicação removida';
  return null;
}

export default function AdminReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { adminToken, admin } = useAdminAuth();
  const [report, setReport] = useState<AdminReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showRemovePostModal, setShowRemovePostModal] = useState(false);
  const [resolveAction, setResolveAction] = useState<'resolved' | 'dismissed' | null>(null);
  const [admins, setAdmins] = useState<AdminSummary[]>([]);

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

  useEffect(() => {
    if (!adminToken) return;
    getAdminsRequest(adminToken).then(setAdmins).catch(() => setAdmins([]));
  }, [adminToken]);

  const lockedByOther = !!report?.assigned_admin_id && report.assigned_admin_id !== admin?.id;
  const isMine = !!report?.assigned_admin_id && report.assigned_admin_id === admin?.id;

  async function handleStatusChange(status: string) {
    if (!adminToken || !report) return;
    setUpdating(true);
    try {
      await updateReportStatusRequest(adminToken, report.id, status);
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Não foi possível atualizar. Tente novamente.');
    } finally {
      setUpdating(false);
    }
  }

  async function handleResolve(comment: string) {
    if (!adminToken || !report || !resolveAction) return;
    await updateReportStatusRequest(adminToken, report.id, resolveAction, comment);
    await load();
  }

  async function handleTransfer(toAdminId: number, reason: string) {
    if (!adminToken || !report) return;
    await transferReportRequest(adminToken, report.id, toAdminId, reason);
    await load();
  }

  async function handleWarn(banDays: number, reason: string) {
    if (!adminToken || !report?.reported_user_id) return;
    await warnUserRequest(adminToken, report.reported_user_id, { ban_days: banDays, reason, report_id: report.id });
    await load();
  }

  async function handleRemovePost(reason: string) {
    if (!adminToken || !report?.donation_id) return;
    await removeDonationRequest(adminToken, report.donation_id, { reason, report_id: report.id });
    await load();
    window.alert('Publicação removida. Ela saiu do catálogo e o doador foi avisado do motivo.');
  }

  async function handleDisableAccount(reason: string) {
    if (!adminToken || !report?.reported_user_id) return;
    await disableUserRequest(adminToken, report.reported_user_id, { report_id: report.id, reason });
    await load();
    window.alert('Conta excluída. Ela será removida definitivamente em 30 dias, a menos que seja reativada antes disso.');
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
      <Head><title>{`Denúncia #${report.id} | Pote Cheio`}</title></Head>
      <TouchableOpacity
        style={styles.backLink}
        onPress={() => (router.canGoBack() ? router.back() : router.push('/admin/dashboard'))}
      >
        <FontAwesome name="chevron-left" size={12} color={COLORS.primary} />
        <Text style={styles.backLinkText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.typeTag}>
          <FontAwesome name={REPORT_TARGET_ICONS[report.target_type] as any} size={12} color="#FFF" />
          <Text style={styles.typeTagText}>{REPORT_TARGET_LABELS[report.target_type]}</Text>
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

        {report.target_type === 'donation' && (
          <>
            <Text style={styles.sectionLabel}>IMAGEM DA PUBLICAÇÃO</Text>
            {report.donation?.photo_url ? (
              <Image source={{ uri: String(report.donation.photo_url) }} style={styles.donationImage} resizeMode="cover" />
            ) : (
              <View style={[styles.donationImage, styles.donationImagePlaceholder]}>
                <FontAwesome name="image" size={28} color={COLORS.textLight} />
                <Text style={styles.donationImagePlaceholderText}>
                  {report.donation ? 'Esta publicação não tem imagem cadastrada' : 'Publicação removida — imagem não disponível'}
                </Text>
              </View>
            )}
          </>
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
            <Text style={styles.personText}>{String(report.donation.title)}</Text>
            {report.donation.status === 'removed' && (
              <Text style={styles.warningTextDanger}>
                Publicação removida pela moderação{report.donation.removed_reason ? ` — ${String(report.donation.removed_reason)}` : ''}
              </Text>
            )}
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

        {report.comment && (
          <>
            <Text style={styles.sectionLabel}>COMENTÁRIO DENUNCIADO</Text>
            <Text style={styles.descriptionMuted}>sobre &quot;{report.comment.donation_title}&quot;</Text>
            <Text style={styles.personText}>{report.comment.comment}</Text>
          </>
        )}

        <Text style={styles.sectionLabel}>STATUS DA DENÚNCIA</Text>

        {(report.status === 'resolved' || report.status === 'dismissed') && (
          <View style={styles.resolvedBanner}>
            <FontAwesome name="check-circle" size={14} color="#1E7E34" />
            <View style={{ flex: 1 }}>
              <Text style={styles.resolvedBannerTitle}>
                {report.status === 'dismissed' ? 'Descartada' : 'Análise concluída'} por: {report.resolved_by_name ?? 'administrador'}
              </Text>
              {resolutionActionLabel(report.resolution_action_type, report.resolution_ban_days) && (
                <Text style={styles.resolvedBannerText}>
                  Ação: {resolutionActionLabel(report.resolution_action_type, report.resolution_ban_days)}
                </Text>
              )}
              {report.resolution_comment && (
                <Text style={styles.resolvedBannerText}>Comentário: {report.resolution_comment}</Text>
              )}
            </View>
          </View>
        )}

        {!isMine ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: '#0B5DBB' }, lockedByOther && styles.actionBtnDisabled]}
              onPress={() => handleStatusChange('reviewing')}
              disabled={updating || lockedByOther}
            >
              <Text style={[styles.actionBtnText, { color: '#0B5DBB' }]}>Assumir / marcar em análise</Text>
            </TouchableOpacity>
          </View>
        ) : report.status === 'reviewing' ? (
          <>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.textLight }]} onPress={() => handleStatusChange('pending')} disabled={updating}>
                <Text style={[styles.actionBtnText, { color: COLORS.textLight }]}>Devolver (destravar)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.primary }]} onPress={() => setResolveAction('resolved')} disabled={updating}>
                <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Marcar resolvida</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.textDark }]} onPress={() => setResolveAction('dismissed')} disabled={updating}>
                <Text style={[styles.actionBtnText, { color: COLORS.textDark }]}>Descartar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: '#6C4AB6' }]} onPress={() => setShowTransferModal(true)} disabled={updating}>
                <Text style={[styles.actionBtnText, { color: '#6C4AB6' }]}>Passar para outro administrador</Text>
              </TouchableOpacity>
            </View>

            {report.reported_user_id && (
              <>
                <Text style={styles.sectionLabel}>PUNIÇÕES AO USUÁRIO DENUNCIADO</Text>
                <View style={styles.actionsRow}>
                  {report.target_type === 'donation' && report.donation && report.donation.status !== 'removed' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: '#8E44AD' }]}
                      onPress={() => setShowRemovePostModal(true)}
                    >
                      <Text style={[styles.actionBtnText, { color: '#8E44AD' }]}>Remover apenas a publicação</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#B35A00' }]}
                    onPress={() => setShowWarnModal(true)}
                  >
                    <Text style={[styles.actionBtnText, { color: '#B35A00' }]}>Advertência / banir temporariamente</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#C0392B' }]}
                    onPress={() => setShowDisableModal(true)}
                    disabled={report.reported_user_status === 'disabled'}
                  >
                    <Text style={[styles.actionBtnText, { color: '#C0392B' }]}>Excluir conta do usuário</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        ) : (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.textLight }]} onPress={() => handleStatusChange('pending')} disabled={updating}>
              <Text style={[styles.actionBtnText, { color: COLORS.textLight }]}>Reabrir (voltar para pendente)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <AdminWarnModal visible={showWarnModal} onClose={() => setShowWarnModal(false)} onConfirm={handleWarn} />
      <AdminDisableModal visible={showDisableModal} onClose={() => setShowDisableModal(false)} onConfirm={handleDisableAccount} />
      <AdminResolveModal
        visible={resolveAction != null}
        title={resolveAction === 'dismissed' ? 'Descartar denúncia' : 'Marcar denúncia como resolvida'}
        onClose={() => setResolveAction(null)}
        onConfirm={handleResolve}
      />
      <AdminResolveModal
        visible={showRemovePostModal}
        title="Remover apenas a publicação"
        subtitle="A publicação sai do catálogo e qualquer negociação em andamento é cancelada. A conta do usuário não é punida."
        label="Motivo da remoção (obrigatório)"
        placeholder="O doador verá esse motivo na notificação"
        confirmLabel="Remover publicação"
        onClose={() => setShowRemovePostModal(false)}
        onConfirm={handleRemovePost}
      />
      <AdminTransferModal
        visible={showTransferModal}
        admins={admins}
        currentAdminId={admin?.id}
        onClose={() => setShowTransferModal(false)}
        onConfirm={handleTransfer}
      />
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
  resolvedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#E3F5E8',
    borderRadius: SIZES.radius,
    padding: 12,
    marginBottom: 12,
  },
  resolvedBannerTitle: { color: '#1E7E34', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  resolvedBannerText: { color: '#245C36', fontSize: 13, marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.secondary, textTransform: 'uppercase', marginTop: 18, marginBottom: 6 },
  description: { fontSize: 14, color: '#000', lineHeight: 20 },
  descriptionMuted: { fontSize: 13, color: COLORS.textDark, marginTop: 2 },
  personText: { fontSize: 14, color: '#000' },
  personLink: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  warningText: { fontSize: 13, color: COLORS.textDark, marginTop: 6 },
  warningTextDanger: { fontSize: 13, color: '#C0392B', fontWeight: '700', marginTop: 6 },
  donationImage: { width: '100%', height: 220, borderRadius: SIZES.radius, marginBottom: 10, backgroundColor: COLORS.border },
  donationImagePlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  donationImagePlaceholderText: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', paddingHorizontal: 20 },
  messageRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  messageAuthor: { fontSize: 11, color: COLORS.textLight, marginBottom: 2 },
  messageContent: { fontSize: 14, color: '#000' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: SIZES.radius, borderWidth: 1.5 },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnText: { fontWeight: 'bold', fontSize: 14 },
});
