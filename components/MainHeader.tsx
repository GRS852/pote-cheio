import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'react-native';
import { COLORS } from '../constants/theme';
import { useAuth } from '../services/AuthContext';

import {
  AppNotification,
  getNotificationsRequest,
  markAllReadRequest,
} from '../services/notificationService';

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function notifIconInfo(type: string): { name: string; color: string; bg: string } {
  switch (type) {
    case 'wishlist':
    case 'interest':
      return { name: 'heart', color: '#FE6C00', bg: 'rgba(254,108,0,0.12)' };
    case 'message':
      return { name: 'comment', color: COLORS.primary, bg: 'rgba(18,128,42,0.12)' };
    case 'donation':
      return { name: 'gift', color: '#8E44AD', bg: 'rgba(142,68,173,0.12)' };
    default:
      return { name: 'bell', color: COLORS.textLight, bg: 'rgba(0,0,0,0.06)' };
  }
}

interface MainHeaderProps {
  searchValue?: string;
  onSearchChange?: (text: string) => void;
}

export default function MainHeader({ searchValue, onSearchChange }: MainHeaderProps = {}) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { user, token, signOut } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : '?';

  useEffect(() => {
    if (!token) return;
    getNotificationsRequest(token)
      .then(res => setUnreadCount(res.unread))
      .catch(() => {});
  }, [token]);

  function handleBellPress() {
    if (!token) return;
    setShowNotifPanel(true);
    setNotifLoading(true);
    getNotificationsRequest(token)
      .then(res => { setNotifications(res.notifications); setUnreadCount(res.unread); })
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  }

  async function handleMarkAllRead() {
    if (!token) return;
    try {
      await markAllReadRequest(token);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  }

  return (
    <View style={styles.container}>
      <Modal
        visible={showNotifPanel}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifPanel(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNotifPanel(false)}
        >
          <TouchableOpacity
            style={[styles.notifPanel, { width: Math.min(360, width - 32) }]}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.notifPanelHeader}>
              <Text style={styles.notifPanelTitle}>Notificações</Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllRead} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.markAllReadText}>Marcar todas como lidas</Text>
                </TouchableOpacity>
              )}
            </View>

            {notifLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{ padding: 32 }} />
            ) : notifications.length === 0 ? (
              <View style={styles.notifEmpty}>
                <FontAwesome name="bell-o" size={36} color={COLORS.textLight} />
                <Text style={styles.notifEmptyText}>Nenhuma notificação</Text>
              </View>
            ) : (
              <ScrollView style={styles.notifList} showsVerticalScrollIndicator={false}>
                {notifications.map(n => {
                  const icon = notifIconInfo(n.type);
                  return (
                    <View key={n.id} style={[styles.notifItem, !n.read && styles.notifItemUnread]}>
                      <View style={[styles.notifIconBox, { backgroundColor: icon.bg }]}>
                        <FontAwesome name={icon.name as any} size={16} color={icon.color} />
                      </View>
                      <View style={styles.notifContent}>
                        <Text style={styles.notifItemTitle} numberOfLines={1}>{n.title}</Text>
                        <Text style={styles.notifItemMsg} numberOfLines={2}>{n.message}</Text>
                        <Text style={styles.notifItemTime}>{timeAgo(n.created_at)}</Text>
                      </View>
                      {!n.read && <View style={styles.unreadDot} />}
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <TouchableOpacity style={styles.leftSection} onPress={() => router.push('/home')} activeOpacity={0.7}>
        <Image source={require('../assets/images/logo.png')} style={styles.logoIcon} resizeMode="contain" />
      </TouchableOpacity>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Procure itens"
          placeholderTextColor={COLORS.textDark}
          value={searchValue}
          onChangeText={onSearchChange}
        />
        <FontAwesome name="search" size={16} color={COLORS.textDark} style={styles.searchIcon} />
      </View>

      <View style={[styles.rightSection, { gap: isMobile ? 12 : 20 }]}>
        {!isMobile && (
          <>
            <TouchableOpacity onPress={() => router.push('/home')}>
              <Text style={styles.linkVerde}>Doações</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(app)/donate')}>
              <Text style={styles.linkVerde}>Quero doar</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.iconButton} onPress={handleBellPress}>
          <FontAwesome name="bell-o" size={20} color={COLORS.secondary} />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => setShowUserMenu(true)}
          activeOpacity={0.8}
        >
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Text style={styles.avatarText}>{userInitial}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Side menu do usuário */}
      <Modal
        visible={showUserMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUserMenu(false)}
      >
        <TouchableOpacity
          style={styles.userMenuOverlay}
          activeOpacity={1}
          onPress={() => setShowUserMenu(false)}
        >
          <TouchableOpacity style={styles.userMenuPanel} activeOpacity={1} onPress={() => {}}>
            <View style={styles.userMenuTop}>
              <View style={styles.userMenuAvatarCircle}>
                {user?.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.userMenuAvatarImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.userMenuAvatarLetter}>{userInitial}</Text>
                )}
              </View>
              <Text style={styles.userMenuName} numberOfLines={1}>{user?.full_name ?? 'Usuário'}</Text>
            </View>

            <View style={styles.userMenuDivider} />

            <TouchableOpacity
              style={styles.userMenuItem}
              onPress={() => { setShowUserMenu(false); router.push('/(app)/donate'); }}
            >
              <FontAwesome name="gift" size={18} color={COLORS.primary} style={styles.userMenuIcon} />
              <Text style={styles.userMenuItemText}>Doar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.userMenuItem}
              onPress={() => { setShowUserMenu(false); router.push('/(app)/profile'); }}
            >
              <FontAwesome name="heart" size={18} color={COLORS.primary} style={styles.userMenuIcon} />
              <Text style={styles.userMenuItemText}>Minhas Doações</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.userMenuItem}
              onPress={() => { setShowUserMenu(false); router.push('/(app)/messages'); }}
            >
              <FontAwesome name="comment" size={18} color={COLORS.primary} style={styles.userMenuIcon} />
              <Text style={styles.userMenuItemText}>Minhas Mensagens</Text>
            </TouchableOpacity>

            <View style={styles.userMenuDivider} />

            <TouchableOpacity
              style={styles.userMenuItem}
              onPress={async () => { setShowUserMenu(false); await signOut(); }}
            >
              <FontAwesome name="sign-out" size={18} color="#C0392B" style={styles.userMenuIcon} />
              <Text style={[styles.userMenuItemText, { color: '#C0392B' }]}>Sair</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  leftSection: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { height: 40, width: 40 },
  searchContainer: {
    flex: 1,
    maxWidth: 400,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 14, color: '#000', outlineStyle: 'none' as any },
  searchIcon: { marginLeft: 8 },
  rightSection: { flexDirection: 'row', alignItems: 'center' },
  linkVerde: { color: COLORS.primary, fontSize: 16, fontWeight: '500' },
  iconButton: { padding: 4, position: 'relative' },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#C0392B',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  avatarContainer: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  avatarImage: { width: 35, height: 35, borderRadius: 17.5 },

  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 62,
    paddingRight: 16,
  },

  // Notification panel
  notifPanel: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    maxHeight: 480,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 16,
    overflow: 'hidden',
  },
  notifPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  notifPanelTitle: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  markAllReadText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  notifList: { maxHeight: 400 },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  notifItemUnread: { backgroundColor: 'rgba(18,128,42,0.04)' },
  notifIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  notifContent: { flex: 1 },
  notifItemTitle: { fontSize: 14, fontWeight: '700', color: '#000', marginBottom: 2 },
  notifItemMsg: { fontSize: 13, color: COLORS.textDark, lineHeight: 18 },
  notifItemTime: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 5,
    flexShrink: 0,
  },
  notifEmpty: { padding: 40, alignItems: 'center', gap: 12 },
  notifEmptyText: { fontSize: 14, color: COLORS.textLight },

  // User side menu
  userMenuOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  userMenuPanel: {
    width: 270,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 24,
  },
  userMenuTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
    gap: 12,
  },
  userMenuAvatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMenuAvatarLetter: { color: '#FFF', fontWeight: 'bold', fontSize: 20 },
  userMenuAvatarImage: { width: 46, height: 46, borderRadius: 23 },
  userMenuName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#000' },
  userMenuDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 6 },
  userMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  userMenuIcon: { width: 26, marginRight: 12 },
  userMenuItemText: { fontSize: 15, color: '#000' },
});
