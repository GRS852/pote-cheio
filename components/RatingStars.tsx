import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { COLORS } from '../constants/theme';

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  color?: string;
}

export default function RatingStars({ value, onChange, size = 20, color = COLORS.secondary }: RatingStarsProps) {
  const interactive = !!onChange;

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map(i => {
        const iconName = value >= i ? 'star' : value >= i - 0.5 ? 'star-half-o' : 'star-o';

        if (!interactive) {
          return <FontAwesome key={i} name={iconName} size={size} color={color} style={styles.icon} />;
        }

        return (
          <View key={i} style={[styles.starWrapper, { width: size, height: size }]}>
            <FontAwesome name={iconName} size={size} color={color} style={StyleSheet.absoluteFill} />
            <View style={styles.tapZones}>
              <TouchableOpacity style={{ width: size / 2, height: size }} onPress={() => onChange!(i - 0.5)} />
              <TouchableOpacity style={{ width: size / 2, height: size }} onPress={() => onChange!(i)} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 2 },
  starWrapper: { marginRight: 2 },
  tapZones: { flexDirection: 'row' },
});
