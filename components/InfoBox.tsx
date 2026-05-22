import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

interface InfoBoxProps {
  label: string;
  value: string;
  highlightValue?: boolean; // Para o caso do "Tamanho 12" que tem fundo verde
}

export default function InfoBox({ label, value, highlightValue }: InfoBoxProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {highlightValue ? (
        <View style={styles.highlightBadge}>
          <Text style={styles.highlightText}>{value}</Text>
        </View>
      ) : (
        <Text style={styles.value}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Faz as caixas dividirem o espaço igualmente
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 100,
  },
  label: {
    fontSize: 14,
    color: COLORS.textDark,
    marginBottom: 6,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  highlightBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
  },
  highlightText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  }
});