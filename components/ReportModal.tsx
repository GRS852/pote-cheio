import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { useAuth } from '../services/AuthContext';
import { CreateReportPayload, REPORT_REASONS, ReportReason, ReportTargetType, createReportRequest } from '../services/reportService';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: number;
  photoUrl?: string | null;
  targetTitle?: string;
}

export default function ReportModal({ visible, onClose, targetType, targetId, photoUrl, targetTitle }: ReportModalProps) {
  const { token } = useAuth();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  function reset() {
    setReason(null);
    setDescription('');
    setError('');
    setSent(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!token || !reason) return;
    setLoading(true);
    setError('');
    try {
      const payload: CreateReportPayload = {
        target_type: targetType,
        reason,
        description: description.trim() || undefined,
        ...(targetType === 'donation'
          ? { donation_id: targetId }
          : targetType === 'comment'
          ? { comment_id: targetId }
          : { conversation_id: targetId }),
      };
      await createReportRequest(token, payload);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar a denúncia.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity style={styles.box} activeOpacity={1} onPress={() => {}}>
          {sent ? (
            <View style={styles.sentContainer}>
              <FontAwesome name="check-circle" size={40} color={COLORS.primary} />
              <Text style={styles.sentTitle}>Denúncia enviada</Text>
              <Text style={styles.sentText}>Nossa equipe vai analisar. Obrigado por ajudar a manter a comunidade segura.</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <Text style={styles.closeBtnText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>
                  Denunciar {targetType === 'donation' ? 'publicação' : targetType === 'comment' ? 'comentário' : 'conversa'}
                </Text>
                <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <FontAwesome name="close" size={20} color={COLORS.textDark} />
                </TouchableOpacity>
              </View>

              {targetType === 'donation' && (photoUrl || targetTitle) && (
                <View style={styles.targetPreview}>
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.targetImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.targetImage, styles.targetImagePlaceholder]}>
                      <FontAwesome name="image" size={20} color={COLORS.textLight} />
                    </View>
                  )}
                  {targetTitle && <Text style={styles.targetTitle} numberOfLines={2}>{targetTitle}</Text>}
                </View>
              )}

              <Text style={styles.label}>Motivo</Text>
              {REPORT_REASONS.map(r => (
                <TouchableOpacity
                  key={r.value}
                  style={styles.reasonRow}
                  onPress={() => setReason(r.value)}
                  activeOpacity={0.7}
                >
                  <FontAwesome
                    name={reason === r.value ? 'dot-circle-o' : 'circle-o'}
                    size={18}
                    color={reason === r.value ? COLORS.primary : COLORS.textLight}
                  />
                  <Text style={styles.reasonText}>{r.label}</Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.label}>Descrição (opcional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Conte mais sobre o que aconteceu"
                placeholderTextColor={COLORS.textLight}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.submitBtn, (!reason || loading) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!reason || loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Enviar denúncia</Text>}
              </TouchableOpacity>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  box: { width: '100%', maxWidth: 420, backgroundColor: '#FFF', borderRadius: SIZES.radius, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  targetPreview: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, backgroundColor: COLORS.backgroundGray, borderRadius: SIZES.radius, padding: 8 },
  targetImage: { width: 48, height: 48, borderRadius: 8, backgroundColor: COLORS.border },
  targetImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  targetTitle: { flex: 1, fontSize: 13, color: COLORS.textDark, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: 10, marginTop: 6 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  reasonText: { fontSize: 15, color: '#000' },
  textArea: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  errorText: { color: '#D32F2F', fontSize: 13, marginTop: 10 },
  submitBtn: {
    marginTop: 18,
    backgroundColor: '#C0392B',
    borderRadius: SIZES.radius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  sentContainer: { alignItems: 'center', paddingVertical: 12, gap: 10 },
  sentTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  sentText: { fontSize: 14, color: COLORS.textDark, textAlign: 'center' },
  closeBtn: { marginTop: 10, paddingVertical: 10, paddingHorizontal: 24, borderRadius: SIZES.radius, backgroundColor: COLORS.primary },
  closeBtnText: { color: '#FFF', fontWeight: 'bold' },
});
