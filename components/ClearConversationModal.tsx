import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

interface ClearConversationModalProps {
  visible: boolean;
  otherUserName?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function ClearConversationModal({ visible, otherUserName, onClose, onConfirm }: ClearConversationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleClose() {
    setError('');
    onClose();
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      await onConfirm();
      handleClose();
    } catch {
      setError('Não foi possível limpar a conversa.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity style={styles.box} activeOpacity={1} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Limpar conversa</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <FontAwesome name="close" size={20} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            As mensagens trocadas até agora deixam de aparecer <Text style={styles.bold}>só para você</Text>.
            {otherUserName ? ` ${otherUserName}` : ' A outra pessoa'} continua vendo o histórico.
          </Text>
          <Text style={styles.subtitle}>
            Se chegar uma mensagem nova ou um novo interesse, a conversa volta a aparecer com apenas o que vier depois.
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleClose} disabled={loading}>
              <Text style={styles.secondaryBtnText}>Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Limpar</Text>}
            </TouchableOpacity>
          </View>
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
  subtitle: { fontSize: 14, color: COLORS.textDark, lineHeight: 20, marginBottom: 8 },
  bold: { fontWeight: 'bold' },
  errorText: { color: '#D32F2F', fontSize: 13, marginTop: 6 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 14 },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius, paddingVertical: 14, alignItems: 'center' },
  secondaryBtnText: { color: COLORS.textDark, fontWeight: 'bold', fontSize: 16 },
  submitBtn: { flex: 1, backgroundColor: '#C0392B', borderRadius: SIZES.radius, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
