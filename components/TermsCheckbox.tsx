import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MIN_AGE } from '../constants/legal';
import { COLORS } from '../constants/theme';

// No navegador abre em outra aba, para não perder o que já foi preenchido
export function useOpenLegalPage() {
  const router = useRouter();
  return (path: '/terms' | '/privacy') => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(path, '_blank', 'noopener');
    else router.push(path as any);
  };
}

// Caixa de aceite obrigatória (aceite ativo: nada vem marcado)
export default function TermsCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const openLegalPage = useOpenLegalPage();
  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={() => onChange(!checked)}
        style={[styles.box, checked && styles.boxChecked]}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        aria-checked={checked}
        accessibilityLabel="Aceito os Termos de Uso e a Política de Privacidade"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {checked ? <FontAwesome name="check" size={13} color="#FFF" /> : null}
      </TouchableOpacity>
      <Text style={styles.text}>
        {/* Só o trecho sem link marca/desmarca (o clique no link não pode marcar a caixa) */}
        <Text onPress={() => onChange(!checked)}>Tenho {MIN_AGE} anos ou mais e li e aceito os</Text>{' '}
        <Text style={styles.link} onPress={() => openLegalPage('/terms')}>Termos de Uso</Text>
        {' '}e a{' '}
        <Text style={styles.link} onPress={() => openLegalPage('/privacy')}>Política de Privacidade</Text>
        {' '}do Pote Cheio.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4, marginBottom: 16 },
  box: { width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: COLORS.border, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  boxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  text: { flex: 1, fontSize: 14, color: '#000', lineHeight: 20 },
  link: { color: COLORS.secondary, fontWeight: '600', textDecorationLine: 'underline' },
});
