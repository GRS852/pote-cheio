import React from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';


interface StatProps {
  count: number;
  label: string;
}

//O que o banco deve enviar para o perfil do usuário

export interface ProfileUserInfoProps {
  name: string;
  avatarUrl?: any; // Quando plugar o back-end, mude para 'string' (URL)
  memberSince: string;
  location: string;
  stats: StatProps[];
}

export default function ProfileUserInfo({ 
  name, 
  avatarUrl, 
  memberSince, 
  location, 
  stats 
}: ProfileUserInfoProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const initialLetter = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <View style={[styles.card, { flexDirection: isDesktop ? 'row' : 'column' }]}>
      
      <View style={[styles.leftSection, { marginBottom: isDesktop ? 0 : 24 }]}>
        {avatarUrl ? (
          <Image source={avatarUrl} style={styles.avatarImage} resizeMode="cover" />
        ) : (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{initialLetter}</Text>
          </View>
        )}
        
        <View style={styles.details}>
          <Text style={styles.nameText}>{name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Doadora ativa</Text>
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
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 30, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'space-between', alignItems: 'center' },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1, width: '100%' },
  avatarImage: { width: 100, height: 100, borderRadius: 50, marginRight: 20, backgroundColor: COLORS.border },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  avatarLetter: { color: '#FFF', fontSize: 40, fontWeight: 'bold' },
  details: { justifyContent: 'center' },
  nameText: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  badge: { backgroundColor: '#D1F0D9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 12 },
  memberSinceText: { fontSize: 14, color: '#000', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 14, color: COLORS.textLight, marginLeft: 6 },
  rightSection: { alignItems: 'center', justifyContent: 'center', gap: 30 },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
  statLabel: { fontSize: 16, color: '#000' }
});