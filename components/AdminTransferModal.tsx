import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { AdminSummary } from '../services/adminService';

interface AdminTransferModalProps {
  visible: boolean;
  admins: AdminSummary[];
  currentAdminId?: number;
  onClose: () => void;
  onConfirm: (toAdminId: number, reason: string) => Promise<void>;
}

export default function AdminTransferModal({ visible, admins, currentAdminId, onClose, onConfirm }: AdminTransferModalProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleClose() {
    setSelectedId(null);
    setReason('');
    setError('');
    onClose();
  }

  async function handleSubmit() {
    if (!selectedId) {
      setError('Escolha para qual administrador transferir a denúncia.');
      return;
    }
    if (!reason.trim()) {
      setError('Descreva o motivo da transferência antes de confirmar.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onConfirm(selectedId, reason.trim());
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível transferir a denúncia.');
    } finally {
      setLoading(false);
    }
  }

  const options = admins.filter(a => a.id !== currentAdminId);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity style={styles.box} activeOpacity={1} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Passar para outro administrador</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <FontAwesome name="close" size={20} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Escolha o administrador</Text>
          {options.length === 0 ? (
            <Text style={styles.emptyText}>Não há outros administradores cadastrados.</Text>
          ) : (
            <View style={styles.adminList}>
              {options.map(admin => (
                <TouchableOpacity
                  key={admin.id}
                  style={[styles.adminOption, selectedId === admin.id && styles.adminOptionSelected]}
                  onPress={() => setSelectedId(admin.id)}
                >
                  <FontAwesome
                    name={selectedId === admin.id ? 'dot-circle-o' : 'circle-o'}
                    size={16}
                    color={selectedId === admin.id ? COLORS.primary : COLORS.textLight}
                  />
                  <View>
                    <Text style={styles.adminOptionName}>{admin.full_name}</Text>
                    <Text style={styles.adminOptionEmail}>{admin.email}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Motivo da transferência (obrigatório)</Text>
          <TextInput
            style={styles.textArea}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            placeholder="Descreva o motivo de passar esta denúncia adiante"
            placeholderTextColor={COLORS.textLight}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Confirmar transferência</Text>}
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  box: { width: '100%', maxWidth: 420, maxHeight: '85%', backgroundColor: '#FFF', borderRadius: SIZES.radius, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginBottom: 8, marginTop: 6 },
  emptyText: { fontSize: 13, color: COLORS.textLight, marginBottom: 10 },
  adminList: { gap: 8, marginBottom: 10 },
  adminOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adminOptionSelected: { borderColor: COLORS.primary, backgroundColor: 'rgba(254,108,0,0.06)' },
  adminOptionName: { fontSize: 14, fontWeight: '600', color: '#000' },
  adminOptionEmail: { fontSize: 12, color: COLORS.textLight },
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
  submitBtn: { marginTop: 18, backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
