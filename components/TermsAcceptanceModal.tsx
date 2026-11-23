import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, SIZES } from '../constants/theme';
import { useAuth } from '../services/AuthContext';
import TermsCheckbox from './TermsCheckbox';

// Quem já tinha conta antes dos termos (ou quando a versão muda) aceita no
// próximo acesso. Não fecha sem escolher: aceitar ou sair da conta.
export default function TermsAcceptanceModal({ visible }: { visible: boolean }) {
  const { acceptTerms, signOut } = useAuth();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAccept() {
    setLoading(true);
    setError('');
    try {
      await acceptTerms();
    } catch {
      setError('Não foi possível registrar o aceite. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Atualizamos nossos termos</Text>
          <Text style={styles.text}>
            Para seguir a Lei Geral de Proteção de Dados (LGPD), publicamos os Termos de Uso e a Política de
            Privacidade do Pote Cheio. Eles explicam quais dados coletamos, para que usamos e quais são os seus direitos.
          </Text>
          <Text style={styles.text}>Para continuar usando a plataforma, leia e aceite:</Text>

          <TermsCheckbox checked={checked} onChange={setChecked} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={signOut} disabled={loading}>
              <Text style={styles.secondaryBtnText}>Sair da conta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, (!checked || loading) && styles.disabled]}
              onPress={handleAccept}
              disabled={!checked || loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Aceitar e continuar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  box: { width: '100%', maxWidth: 460, backgroundColor: '#FFF', borderRadius: SIZES.radius, padding: 22 },
  title: { fontSize: 19, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  text: { fontSize: 14, color: COLORS.textDark, lineHeight: 21, marginBottom: 10 },
  error: { color: '#D32F2F', fontSize: 13, marginBottom: 8 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius, paddingVertical: 13, alignItems: 'center' },
  secondaryBtnText: { color: COLORS.textDark, fontWeight: 'bold', fontSize: 15 },
  primaryBtn: { flex: 1.4, backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 13, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  disabled: { opacity: 0.5 },
});
