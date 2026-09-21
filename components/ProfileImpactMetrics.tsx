import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { COLORS } from '../constants/theme';

export interface ProfileImpactMetricsProps {
  itemsDonatedCount: number;
  itemsReceivedCount: number;
  itemsReservedCount: number;
}

export default function ProfileImpactMetrics({
  itemsDonatedCount,
  itemsReceivedCount,
  itemsReservedCount,
}: ProfileImpactMetricsProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <View style={[styles.card, { flexDirection: isDesktop ? 'row' : 'column' }]}>

      <View style={styles.column}>
        <MaterialCommunityIcons name="package-variant-closed" size={48} color={COLORS.secondary} style={styles.icon} />
        <View>
          <Text style={styles.title}>Itens doados</Text>
          <Text style={[styles.value, { color: COLORS.secondary }]}>{itemsDonatedCount}</Text>
          <Text style={styles.subtitle}>doações concluídas</Text>
        </View>
      </View>

      <View style={styles.column}>
        <MaterialCommunityIcons name="gift-outline" size={48} color={COLORS.primary} style={styles.icon} />
        <View>
          <Text style={styles.title}>Recebidos</Text>
          <Text style={[styles.value, { color: COLORS.primary }]}>{itemsReceivedCount}</Text>
          <Text style={styles.subtitle}>itens recebidos</Text>
        </View>
      </View>

      <View style={styles.column}>
        <MaterialCommunityIcons name="clock-outline" size={48} color={COLORS.textDark} style={styles.icon} />
        <View>
          <Text style={styles.title}>Reservados</Text>
          <Text style={[styles.value, { color: COLORS.textDark }]}>{itemsReservedCount}</Text>
          <Text style={styles.subtitle}>itens que você reservou</Text>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 30,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
    gap: 30,
  },
  column: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: { marginRight: 16 },
  title: { fontSize: 16, color: '#000' },
  subtitle: { fontSize: 14, color: '#000' },
  value: { fontSize: 28, fontWeight: 'bold' },
});
