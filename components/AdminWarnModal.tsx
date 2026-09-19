import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

interface AdminWarnModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (banDays: number, reason: string) => Promise<void>;
}

export default function AdminWarnModal({ visible, onClose, onConfirm }: AdminWarnModalProps) {
  const [banDays, setBanDays] = useState('3');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleClose() {
    setBanDays('3');
    setReason('');
    setError('');
    onClose();
  }

  async function handleSubmit() {
    const days = Number(banDays);
    if (!Number.isFinite(days) || days < 0) {
      setError('Informe um número de dias válido (0 para não banir, só registrar a advertência).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onConfirm(days, reason.trim());
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível aplicar a advertência.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity style={styles.box} activeOpacity={1} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Aplicar advertência</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <FontAwesome name="close" size={20} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Duração do banimento temporário (em dias)</Text>
          <TextInput
            style={styles.input}
            value={banDays}
            onChangeText={setBanDays}
            keyboardType="number-pad"
            placeholder="Ex: 3"
          />

          <Text style={styles.label}>Motivo (opcional, fica no histórico)</Text>
          <TextInput
            style={styles.textArea}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            placeholder="Descreva o motivo da advertência"
            placeholderTextColor={COLORS.textLight}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Confirmar advertência</Text>}
          </TouchableOpacity>
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
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginBottom: 8, marginTop: 6 },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000',
  },
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
  submitBtn: { marginTop: 18, backgroundColor: '#B35A00', borderRadius: SIZES.radius, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
