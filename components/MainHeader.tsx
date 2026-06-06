import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { COLORS } from '../constants/theme';
import { useAuth } from '../services/AuthContext';
import { getNotificationsRequest } from '../services/notificationService';

export default function MainHeader() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { user, token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : '?';

  useEffect(() => {
    if (!token) return;
    getNotificationsRequest(token)
      .then(res => setUnreadCount(res.unread))
      .catch(() => {});
  }, [token]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.leftSection} onPress={() => router.push('/home')} activeOpacity={0.7}>
        <Image source={require('../assets/images/logo.png')} style={styles.logoIcon} resizeMode="contain" />
      </TouchableOpacity>

      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} placeholder="Procure itens" placeholderTextColor={COLORS.textDark} />
        <FontAwesome name="search" size={16} color={COLORS.textDark} style={styles.searchIcon} />
      </View>

      <View style={[styles.rightSection, { gap: isMobile ? 12 : 20 }]}>
        {!isMobile && (
          <>
            <TouchableOpacity><Text style={styles.linkVerde}>Doações</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/donate')}><Text style={styles.linkVerde}>Quero doar</Text></TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
          <FontAwesome name="bell-o" size={20} color={COLORS.secondary} />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.avatarContainer} onPress={() => router.push('/profile')} activeOpacity={0.8}>
          <Text style={styles.avatarText}>{userInitial}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  leftSection: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { height: 40, width: 40 },
  searchContainer: { flex: 1, maxWidth: 400, marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBackground, borderRadius: 8, paddingHorizontal: 12, overflow: 'hidden' },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 14, color: '#000', outlineStyle: 'none' as any },
  searchIcon: { marginLeft: 8 },
  rightSection: { flexDirection: 'row', alignItems: 'center' },
  linkVerde: { color: COLORS.primary, fontSize: 16, fontWeight: '500' },
  iconButton: { padding: 4, position: 'relative' },
  notifBadge: { position: 'absolute', top: 0, right: 0, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#C0392B', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  notifBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  avatarContainer: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
