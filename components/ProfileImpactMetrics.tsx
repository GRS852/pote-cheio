import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { COLORS } from '../constants/theme';

export interface ProfileImpactMetricsProps {
  totalDonatedValue: string;
  itemsDonatedCount: number;
  animalsHelpedCount: number;
}

function ComingSoonOverlay() {
  return (
    <View style={styles.comingSoonOverlay} pointerEvents="none">
      <View style={styles.comingSoonBadge}>
        <Text style={styles.comingSoonText}>EM BREVE</Text>
      </View>
    </View>
  );
}

export default function ProfileImpactMetrics({
  totalDonatedValue,
  itemsDonatedCount,
  animalsHelpedCount,
}: ProfileImpactMetricsProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <View style={[styles.card, { flexDirection: isDesktop ? 'row' : 'column' }]}>

      {/* Total doado — EM BREVE */}
      <View style={styles.column}>
        <MaterialCommunityIcons name="hand-heart-outline" size={48} color={COLORS.primary} style={styles.icon} />
        <View>
          <Text style={styles.title}>Total doado</Text>
          <Text style={[styles.value, { color: COLORS.primary }]}>{totalDonatedValue}</Text>
          <Text style={styles.subtitle}>valor aproximado</Text>
        </View>
        <ComingSoonOverlay />
      </View>

      {/* Itens doados — dado real */}
      <View style={styles.column}>
        <MaterialCommunityIcons name="package-variant-closed" size={48} color={COLORS.secondary} style={styles.icon} />
        <View>
          <Text style={styles.title}>Itens doados</Text>
          <Text style={[styles.value, { color: COLORS.secondary }]}>{itemsDonatedCount}</Text>
          <Text style={styles.subtitle}>itens concluídos</Text>
        </View>
      </View>

      {/* Animais ajudados — EM BREVE */}
      <View style={styles.column}>
        <MaterialCommunityIcons name="dog" size={48} color={COLORS.primary} style={styles.icon} />
        <View>
          <Text style={styles.title}>Animais ajudados</Text>
          <Text style={[styles.valueSmall, { color: COLORS.primary }]}>{animalsHelpedCount}</Text>
        </View>
        <ComingSoonOverlay />
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
    position: 'relative',
  },
  icon: { marginRight: 16 },
  title: { fontSize: 16, color: '#000' },
  subtitle: { fontSize: 14, color: '#000' },
  value: { fontSize: 28, fontWeight: 'bold' },
  valueSmall: { fontSize: 24, fontWeight: 'bold' },

  comingSoonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  comingSoonBadge: {
    backgroundColor: '#EAEAEA',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textDark,
    letterSpacing: 1,
  },
});
