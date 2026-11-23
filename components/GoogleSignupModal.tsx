import React, { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, SIZES } from '../constants/theme';
import { BirthDateParts, birthDateError, buildBirthDate } from '../services/age';
import BirthDateFields from './BirthDateFields';
import TermsCheckbox from './TermsCheckbox';

// Primeiro login com Google (conta nova): pede a data de nascimento e o
// aceite dos termos antes de a conta ser criada
export default function GoogleSignupModal({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (birthDate: string) => Promise<void>;
}) {
  const [birth, setBirth] = useState<BirthDateParts>({ dia: '', mes: '', ano: '' });
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    const ageError = birthDateError(birth);
    if (ageError) return setError(ageError);
    setLoading(true);
    setError('');
    try {
      await onConfirm(buildBirthDate(birth) as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Criar conta com Google</Text>
            <Text style={styles.text}>
              É o seu primeiro acesso. Para criar a conta, informe a sua data de nascimento e aceite os termos.
            </Text>

            <BirthDateFields value={birth} onChange={b => { setBirth(b); if (error) setError(''); }} />
            <TermsCheckbox checked={checked} onChange={setChecked} />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onCancel} disabled={loading}>
                <Text style={styles.secondaryBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, (!checked || loading) && styles.disabled]}
                onPress={handleConfirm}
                disabled={!checked || loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Criar conta</Text>}
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
  title: { fontSize: 19, fontWeight: 'bold', color: '#000', marginBottom: 10 },
  text: { fontSize: 14, color: COLORS.textDark, lineHeight: 21, marginBottom: 16 },
  error: { color: '#D32F2F', fontSize: 13, marginBottom: 8 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius, paddingVertical: 13, alignItems: 'center' },
  secondaryBtnText: { color: COLORS.textDark, fontWeight: 'bold', fontSize: 15 },
  primaryBtn: { flex: 1.4, backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 13, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  disabled: { opacity: 0.5 },
});
