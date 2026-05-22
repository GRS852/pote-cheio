import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

//O que o banco deve enviar para cada item da lista
export interface ProfileImpactMetricsProps {
  totalDonatedValue: string;
  itemsDonatedCount: number;
  animalsHelpedCount: number;
}

export default function ProfileImpactMetrics({ 
  totalDonatedValue, 
  itemsDonatedCount, 
  animalsHelpedCount 
}: ProfileImpactMetricsProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <View style={[styles.card, { flexDirection: isDesktop ? 'row' : 'column' }]}>
      
      <View style={styles.column}>
        <MaterialCommunityIcons name="hand-heart-outline" size={48} color={COLORS.primary} style={styles.icon} />
        <View>
          <Text style={styles.title}>Total doado</Text>
          <Text style={[styles.value, { color: COLORS.primary }]}>{totalDonatedValue}</Text>
          <Text style={styles.subtitle}>valor aproximado</Text>
        </View>
      </View>

      <View style={styles.column}>
        <MaterialCommunityIcons name="package-variant-closed" size={48} color={COLORS.secondary} style={styles.icon} />
        <View>
          <Text style={styles.title}>Itens doados</Text>
          <Text style={[styles.value, { color: COLORS.secondary }]}>{itemsDonatedCount}</Text>
          <Text style={styles.subtitle}>Itens entregues</Text>
        </View>
      </View>

      <View style={styles.column}>
        <MaterialCommunityIcons name="dog" size={48} color={COLORS.primary} style={styles.icon} />
        <View>
          <Text style={styles.title}>Animais ajudados</Text>
          <Text style={[styles.valueSmall, { color: COLORS.primary }]}>{animalsHelpedCount}</Text>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 30, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'space-between', gap: 30 },
  column: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  icon: { marginRight: 16 },
  title: { fontSize: 16, color: '#000' },
  subtitle: { fontSize: 14, color: '#000' },
  value: { fontSize: 28, fontWeight: 'bold' },
  valueSmall: { fontSize: 24, fontWeight: 'bold' }
});