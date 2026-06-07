import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Image } from 'react-native';
import { COLORS } from '../constants/theme';

interface StatProps {
  count: number;
  label: string;
}

export interface ProfileUserInfoProps {
  name: string;
  avatarUrl?: string | null;
  memberSince: string;
  location: string;
  stats: StatProps[];
  onAvatarPress?: () => void;
  avatarLoading?: boolean;
}

export default function ProfileUserInfo({
  name,
  avatarUrl,
  memberSince,
  location,
  stats,
  onAvatarPress,
  avatarLoading,
}: ProfileUserInfoProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const initialLetter = name ? name.charAt(0).toUpperCase() : '?';

  const avatarContent = avatarUrl ? (
    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
  ) : (
    <View style={styles.avatarCircle}>
      <Text style={styles.avatarLetter}>{initialLetter}</Text>
    </View>
  );

  return (
    <View style={[styles.card, { flexDirection: isDesktop ? 'row' : 'column' }]}>
      <View style={[styles.leftSection, { marginBottom: isDesktop ? 0 : 24 }]}>
        <TouchableOpacity
          onPress={onAvatarPress}
          disabled={!onAvatarPress}
          activeOpacity={0.8}
          style={styles.avatarWrapper}
        >
          {avatarContent}
          {onAvatarPress && (
            <View style={styles.avatarOverlay}>
              {avatarLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <FontAwesome name="camera" size={16} color="#FFF" />
              )}
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.details}>
          <Text style={styles.nameText}>{name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Doador ativo</Text>
          </View>
          <Text style={styles.memberSinceText}>Membro desde {memberSince}</Text>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="shield-check-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.locationText}>{location}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.rightSection, { flexDirection: isDesktop ? 'row' : 'column' }]}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statBox}>
            <Text style={styles.statNumber}>{stat.count}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
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
    alignItems: 'center',
  },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1, width: '100%' },
  avatarWrapper: { position: 'relative', marginRight: 20 },
  avatarImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.border },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: { color: '#FFF', fontSize: 40, fontWeight: 'bold' },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  details: { justifyContent: 'center', flex: 1 },
  nameText: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  badge: {
    backgroundColor: '#D1F0D9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 12 },
  memberSinceText: { fontSize: 14, color: '#000', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 14, color: COLORS.textLight, marginLeft: 6 },
  rightSection: { alignItems: 'center', justifyContent: 'center', gap: 30 },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
  statLabel: { fontSize: 16, color: '#000' },
});
