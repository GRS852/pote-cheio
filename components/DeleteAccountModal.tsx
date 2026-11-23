import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { COLORS, SIZES } from '../constants/theme';
import { AuthError, ValidationError } from '../services/authService';

// Exclusão da própria conta (LGPD, art. 18, VI). Explica o que acontece e
// pede confirmação: a senha, ou digitar EXCLUIR em contas criadas pelo Google.
export default function DeleteAccountModal({
  visible,
  hasPassword,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  hasPassword: boolean;
  onClose: () => void;
  onConfirm: (confirmation: { password?: string; confirmation?: string }) => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ready = hasPassword ? value.length > 0 : value.trim().toUpperCase() === 'EXCLUIR';

  function handleClose() {
    if (loading) return;
    setValue('');
    setError('');
    onClose();
  }

  async function handleDelete() {
    setLoading(true);
    setError('');
    try {
      await onConfirm(hasPassword ? { password: value } : { confirmation: value });
    } catch (err) {
      if (err instanceof AuthError || err instanceof ValidationError) setError(err.message);
      else setError('Não foi possível excluir a conta. Tente novamente.');
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.title}>Excluir minha conta</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <FontAwesome name="close" size={20} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.warning}>Esta ação é definitiva e não pode ser desfeita.</Text>
            <Text style={styles.text}>Ao excluir a conta:</Text>
            {[
              'Seus dados pessoais são apagados: nome, e-mail, data de nascimento e foto de perfil.',
              'Suas doações, fotos, favoritos, notificações, avaliações e conversas são apagados.',
              'Doações e entregas em andamento são canceladas e as outras pessoas são avisadas.',
              'No histórico de quem doou ou recebeu de você, você aparecerá como "Usuário excluído".',
            ].map(item => (
              <View key={item} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={[styles.text, styles.bulletText]}>{item}</Text>
              </View>
            ))}

            <Text style={styles.label}>
              {hasPassword ? 'Digite sua senha para confirmar' : 'Digite EXCLUIR para confirmar'}
            </Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={t => { setValue(t); if (error) setError(''); }}
              secureTextEntry={hasPassword}
              autoCapitalize={hasPassword ? 'none' : 'characters'}
              placeholder={hasPassword ? 'Sua senha' : 'EXCLUIR'}
              placeholderTextColor={COLORS.textLight}
              editable={!loading}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleClose} disabled={loading}>
                <Text style={styles.secondaryBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dangerBtn, (!ready || loading) && styles.disabled]}
                onPress={handleDelete}
                disabled={!ready || loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.dangerBtnText}>Excluir conta</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  box: { width: '100%', maxWidth: 460, maxHeight: '90%', backgroundColor: '#FFF', borderRadius: SIZES.radius, padding: 22 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 19, fontWeight: 'bold', color: '#000' },
  warning: { fontSize: 14, fontWeight: 'bold', color: '#C0392B', marginBottom: 10 },
  text: { fontSize: 14, color: COLORS.textDark, lineHeight: 21 },
  bulletRow: { flexDirection: 'row', marginTop: 4 },
  bulletDot: { width: 16, fontSize: 14, lineHeight: 21, color: '#C0392B', fontWeight: 'bold' },
  bulletText: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#000', marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#000', backgroundColor: '#FFF' },
  error: { color: '#D32F2F', fontSize: 13, marginTop: 8 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius, paddingVertical: 13, alignItems: 'center' },
  secondaryBtnText: { color: COLORS.textDark, fontWeight: 'bold', fontSize: 15 },
  dangerBtn: { flex: 1.3, backgroundColor: '#C0392B', borderRadius: SIZES.radius, paddingVertical: 13, alignItems: 'center' },
  dangerBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  disabled: { opacity: 0.5 },
});
