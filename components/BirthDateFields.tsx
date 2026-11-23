import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { COLORS, SIZES } from '../constants/theme';
import { BirthDateParts } from '../services/age';

// Data de nascimento em três campos (dia, mês, ano), só números
export default function BirthDateFields({ value, onChange }: { value: BirthDateParts; onChange: (v: BirthDateParts) => void }) {
  const set = (field: keyof BirthDateParts, text: string) => onChange({ ...value, [field]: text.replace(/[^0-9]/g, '') });
  return (
    <View>
      <Text style={styles.label}>Data de nascimento</Text>
      <View style={styles.row}>
        <TextInput style={styles.input} placeholder="Dia" placeholderTextColor={COLORS.textDark} value={value.dia} onChangeText={t => set('dia', t)} keyboardType="numeric" maxLength={2} />
        <TextInput style={[styles.input, styles.middle]} placeholder="Mês" placeholderTextColor={COLORS.textDark} value={value.mes} onChangeText={t => set('mes', t)} keyboardType="numeric" maxLength={2} />
        <TextInput style={styles.input} placeholder="Ano" placeholderTextColor={COLORS.textDark} value={value.ano} onChangeText={t => set('ano', t)} keyboardType="numeric" maxLength={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  input: { flex: 1, minWidth: 0, backgroundColor: COLORS.inputBackground, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#000', textAlign: 'center' },
  middle: { marginHorizontal: 12 },
});
