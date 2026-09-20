import { FontAwesome } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { COLORS, SIZES } from '../constants/theme';
import { InterestedUser } from '../services/donationService';

interface InterestedUsersModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  users: InterestedUser[];
  loading: boolean;
  onSelect: (userId: number) => void;
  selectingUserId?: number | null;
}

export default function InterestedUsersModal({
  visible,
  onClose,
  title,
  subtitle,
  users,
  loading,
  onSelect,
  selectingUserId,
}: InterestedUsersModalProps) {
  const [search, setSearch] = useState('');

  function handleClose() {
    setSearch('');
    onClose();
  }

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(u => u.full_name.toLowerCase().includes(term));
  }, [users, search]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity style={styles.box} activeOpacity={1} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <FontAwesome name="close" size={20} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {users.length > 0 && (
            <View style={styles.searchBox}>
              <FontAwesome name="search" size={14} color={COLORS.textLight} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar pelo nome..."
                placeholderTextColor={COLORS.textLight}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          )}

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ padding: 20 }} />
          ) : users.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum usuário demonstrou interesse ainda.</Text>
          ) : filteredUsers.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum interessado encontrado com esse nome.</Text>
          ) : (
            <View style={{ maxHeight: 300 }}>
              {filteredUsers.map(u => (
                <TouchableOpacity
                  key={u.user_id}
                  style={styles.userItem}
                  onPress={() => onSelect(u.user_id)}
                  activeOpacity={0.7}
                  disabled={selectingUserId != null}
                >
                  {u.avatar_url ? (
                    <Image source={{ uri: u.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarPlaceholderText}>{u.full_name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={styles.userName} numberOfLines={1}>{u.full_name}</Text>
                  {selectingUserId === u.user_id ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <FontAwesome name="chevron-right" size={14} color={COLORS.textLight} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Text style={styles.closeBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  box: { width: '100%', maxWidth: 420, backgroundColor: '#FFF', borderRadius: SIZES.radius, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 13, color: COLORS.textDark, marginTop: 6, marginBottom: 14 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.inputBackground,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius, paddingHorizontal: 12, marginBottom: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#000' },
  emptyText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', paddingVertical: 20 },
  userItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.border },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarPlaceholderText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  userName: { flex: 1, fontSize: 15, color: '#000', fontWeight: '600' },
  closeBtn: { marginTop: 16, paddingVertical: 12, alignItems: 'center' },
  closeBtnText: { color: COLORS.textLight, fontWeight: '600' },
});
