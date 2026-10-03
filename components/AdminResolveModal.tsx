import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

interface AdminResolveModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  label?: string;
  placeholder?: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (comment: string) => Promise<void>;
}

export default function AdminResolveModal({
  visible,
  title,
  subtitle,
  label = 'Comentário (obrigatório)',
  placeholder = 'Descreva a conclusão da análise',
  confirmLabel = 'Confirmar',
  onClose,
  onConfirm,
}: AdminResolveModalProps) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleClose() {
    setComment('');
    setError('');
    onClose();
  }

  async function handleSubmit() {
    if (!comment.trim()) {
      setError('Preencha o campo obrigatório antes de confirmar.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onConfirm(comment.trim());
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir a análise.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity style={styles.box} activeOpacity={1} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <FontAwesome name="close" size={20} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.textArea}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textLight}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>{confirmLabel}</Text>}
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
  subtitle: { fontSize: 13, color: COLORS.textDark, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginBottom: 8 },
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
