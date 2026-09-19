import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, SIZES } from '../../../constants/theme';
import { useAdminAuth } from '../../../services/AdminAuthContext';
import { AdminReportDetail, getAdminReportRequest, updateReportStatusRequest } from '../../../services/adminService';
import { REPORT_REASONS } from '../../../services/reportService';

function reasonLabel(reason: string): string {
  return REPORT_REASONS.find(r => r.value === reason)?.label ?? reason;
}

const STATUS_ACTIONS: { value: string; label: string; color: string }[] = [
  { value: 'reviewing', label: 'Marcar em análise', color: '#0B5DBB' },
  { value: 'resolved', label: 'Marcar resolvida', color: COLORS.primary },
  { value: 'dismissed', label: 'Descartar', color: COLORS.textDark },
];

export default function AdminReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { adminToken } = useAdminAuth();
  const [report, setReport] = useState<AdminReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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

  async function handleStatusChange(status: string) {
    if (!adminToken || !report) return;
    setUpdating(true);
    try {
      const updated = await updateReportStatusRequest(adminToken, report.id, status);
      setReport({ ...report, ...updated });
    } finally {
      setUpdating(false);
    }
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <FontAwesome name="chevron-left" size={12} color={COLORS.primary} />
        <Text style={styles.backLinkText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.title}>{reasonLabel(report.reason)}</Text>
        <Text style={styles.status}>Status atual: <Text style={styles.bold}>{report.status}</Text></Text>

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
              onPress={() => router.push({ pathname: '/(admin)/user/[id]', params: { id: String(report.reported_user_id) } })}
            >
              <Text style={styles.personLink}>
                {report.reported_user_name ?? 'Usuário'} · {report.reported_user_email} — ver perfil completo
              </Text>
            </TouchableOpacity>
          </>
        )}

        {report.donation && (
          <>
            <Text style={styles.sectionLabel}>PUBLICAÇÃO DENUNCIADA</Text>
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

        <Text style={styles.sectionLabel}>AÇÕES</Text>
        <View style={styles.actionsRow}>
          {STATUS_ACTIONS.filter(a => a.value !== report.status).map(action => (
            <TouchableOpacity
              key={action.value}
              style={[styles.actionBtn, { borderColor: action.color }]}
              onPress={() => handleStatusChange(action.value)}
              disabled={updating}
            >
              <Text style={[styles.actionBtnText, { color: action.color }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
  title: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  status: { fontSize: 14, color: COLORS.textDark, marginBottom: 10 },
  bold: { fontWeight: '700', color: '#000' },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.secondary, textTransform: 'uppercase', marginTop: 18, marginBottom: 6 },
  description: { fontSize: 14, color: '#000', lineHeight: 20 },
  descriptionMuted: { fontSize: 13, color: COLORS.textDark, marginTop: 2 },
  personText: { fontSize: 14, color: '#000' },
  personLink: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  messageRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  messageAuthor: { fontSize: 11, color: COLORS.textLight, marginBottom: 2 },
  messageContent: { fontSize: 14, color: '#000' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: SIZES.radius, borderWidth: 1.5 },
  actionBtnText: { fontWeight: 'bold', fontSize: 14 },
});
