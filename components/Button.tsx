import React, { ReactNode } from 'react';
import { ActivityIndicator, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

export default function Button({ title, onPress, variant = 'primary', icon, loading = false, disabled = false }: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.button, isPrimary ? styles.primaryBg : styles.outlineBg, isDisabled && styles.disabledBg]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDisabled}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={isPrimary ? '#FFF' : COLORS.textDark} />
        ) : (
          <>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={isPrimary ? styles.primaryText : styles.outlineText}>
              {title}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { width: '100%', paddingVertical: 14, borderRadius: SIZES.radius, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  iconContainer: { marginRight: 10 },
  primaryBg: { backgroundColor: COLORS.primary },
  outlineBg: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
  disabledBg: { opacity: 0.6 },
  primaryText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  outlineText: { color: COLORS.textDark, fontSize: 16, fontWeight: '500' },
});