import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import MainHeader from '../../components/MainHeader';
import ProfileImpactMetrics from '../../components/ProfileImpactMetrics';
import ProfileUserInfo from '../../components/ProfileUserInfo';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../services/AuthContext';
import { updateProfileRequest } from '../../services/authService';
import {
  Donation,
  DonationStatus,
  InterestedUser,
  confirmDonationRequest,
  deleteDonationRequest,
  getInterestedUsersRequest,
  getMyDonationsRequest,
  getWishlistRequest,
  updateDonationStatusRequest,
} from '../../services/donationService';

type TabType = 'Minhas doações' | 'Historia' | 'Favoritos';
const TABS: TabType[] = ['Minhas doações', 'Historia', 'Favoritos'];

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('Minhas doações');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [myDonations, setMyDonations] = useState<Donation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const [wishlist, setWishlist] = useState<Donation[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [avatarLoading, setAvatarLoading] = useState(false);

  // Confirm donation modal
  const [confirmModalDonationId, setConfirmModalDonationId] = useState<number | null>(null);
  const [interestedUsers, setInterestedUsers] = useState<InterestedUser[]>([]);
  const [interestedLoading, setInterestedLoading] = useState(false);

  const { signOut, user, token, updateUserLocally } = useAuth();

  const memberSince = user?.created_at ? new Date(user.created_at).getFullYear().toString() : '';
  const completedCount = myDonations.filter(d => d.status === 'completed').length;

  // Load on mount — used in impact metrics, Minhas doações and História
  useEffect(() => {
    if (!token) return;
    setDonationsLoading(true);
    getMyDonationsRequest(token)
      .then(setMyDonations)
      .catch(() => setMyDonations([]))
      .finally(() => setDonationsLoading(false));
  }, [token]);

  // Load wishlist for Favoritos and História tabs
  useEffect(() => {
    if ((activeTab !== 'Favoritos' && activeTab !== 'Historia') || !token) return;
    if (wishlist.length > 0) return;
    setWishlistLoading(true);
    getWishlistRequest(token)
      .then(setWishlist)
      .catch(() => setWishlist([]))
      .finally(() => setWishlistLoading(false));
  }, [activeTab, token]);

  async function handleAvatarChange() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !token) return;

    setAvatarLoading(true);
    try {
      const uri = result.assets[0].uri;
      const fileName = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const blob = await fetch(uri).then(r => r.blob());

      const uploadResponse = await fetch(
        `${SUPABASE_URL}/storage/v1/object/imagens-potecheio/${fileName}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': blob.type || 'image/jpeg',
          },
          body: blob,
        }
      );
      if (!uploadResponse.ok) {
        const err = await uploadResponse.json();
        throw new Error(err.message);
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/imagens-potecheio/${fileName}`;
      await updateProfileRequest(token, { avatar_url: publicUrl });
      updateUserLocally({ avatar_url: publicUrl });
    } catch {
      setActionError('Não foi possível atualizar a foto.');
    } finally {
      setAvatarLoading(false);
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    await signOut();
  }

  async function handleStatusChange(donationId: number, status: DonationStatus) {
    if (!token) return;
    setActionError('');
    try {
      const updated = await updateDonationStatusRequest(token, donationId, status);
      setMyDonations(prev => prev.map(d => d.id === donationId ? { ...d, status: updated.status } : d));
    } catch {
      setActionError('Não foi possível atualizar o status.');
    }
  }

  async function handleDeleteDonation(donationId: number) {
    if (!token) return;
    setActionError('');
    try {
      await deleteDonationRequest(token, donationId);
      setMyDonations(prev => prev.filter(d => d.id !== donationId));
    } catch {
      setActionError('Não foi possível excluir a doação.');
    }
  }

  async function handleOpenConfirmModal(donationId: number) {
    if (!token) return;
    setConfirmModalDonationId(donationId);
    setInterestedLoading(true);
    try {
      const users = await getInterestedUsersRequest(token, donationId);
      setInterestedUsers(users);
    } catch {
      setInterestedUsers([]);
    } finally {
      setInterestedLoading(false);
    }
  }

  async function handleConfirmToUser(donationId: number, userId: number) {
    if (!token) return;
    try {
      const updated = await confirmDonationRequest(token, donationId, userId);
      setMyDonations(prev => prev.map(d => d.id === donationId ? { ...d, status: updated.status } : d));
      setConfirmModalDonationId(null);
    } catch {
      setActionError('Não foi possível confirmar a doação.');
    }
  }

  const statusLabel = (s: string) =>
    s === 'available' ? 'Disponível' : s === 'reserved' ? 'Reservado' : 'Concluído';
  const statusColor = (s: string) =>
    s === 'available' ? COLORS.primary : s === 'reserved' ? COLORS.secondary : COLORS.textLight;

  return (
    <View style={styles.mainContainer}>
      <MainHeader />

      {/* Modal: escolher usuário para confirmar doação */}
      <Modal
        visible={confirmModalDonationId != null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalDonationId(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setConfirmModalDonationId(null)}>
          <TouchableOpacity style={styles.confirmModalBox} activeOpacity={1} onPress={() => {}}>
            <Text style={styles.confirmModalTitle}>Concluir para quem?</Text>
            <Text style={styles.confirmModalSubtitle}>Selecione o usuário que receberá a doação</Text>

            {interestedLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{ padding: 20 }} />
            ) : interestedUsers.length === 0 ? (
              <Text style={styles.confirmModalEmpty}>Nenhum usuário demonstrou interesse ainda.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 280 }}>
                {interestedUsers.map(u => (
                  <TouchableOpacity
                    key={u.user_id}
                    style={styles.interestedUserItem}
                    onPress={() => handleConfirmToUser(confirmModalDonationId!, u.user_id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.interestedAvatar}>
                      <Text style={styles.interestedAvatarText}>{u.full_name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.interestedUserName}>{u.full_name}</Text>
                    <FontAwesome name="check-circle" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.confirmModalClose} onPress={() => setConfirmModalDonationId(null)}>
              <Text style={styles.confirmModalCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.contentWrapper}>

          <Text style={styles.pageTitle}>
            Meu <Text style={{ color: COLORS.secondary }}>Perfil</Text>
          </Text>

          <ProfileUserInfo
            name={user?.full_name ?? ''}
            avatarUrl={user?.avatar_url ?? null}
            memberSince={memberSince}
            location=""
            stats={[]}
            onAvatarPress={handleAvatarChange}
            avatarLoading={avatarLoading}
          />

          <ProfileImpactMetrics
            totalDonatedValue="R$0,00"
            itemsDonatedCount={completedCount}
            animalsHelpedCount={0}
          />

          <View style={styles.tabsContainer}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tabContentCard}>

            {activeTab === 'Minhas doações' && (
              donationsLoading ? (
                <ActivityIndicator color={COLORS.primary} style={{ padding: 30 }} />
              ) : myDonations.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Você ainda não publicou nenhuma doação.</Text>
                </View>
              ) : (
                <>
                  {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}
                  {myDonations.map(d => (
                    <View key={d.id} style={styles.donationItem}>
                      <View style={styles.donationRow}>
                        {d.photo_url ? (
                          <Image source={{ uri: d.photo_url }} style={styles.donationImage} />
                        ) : (
                          <View style={[styles.donationImage, styles.donationImagePlaceholder]}>
                            <FontAwesome name="image" size={20} color={COLORS.textLight} />
                          </View>
                        )}
                        <View style={styles.donationInfo}>
                          <Text style={styles.donationTitle} numberOfLines={1}>{d.title}</Text>
                          <Text style={styles.donationCategory}>{d.category}</Text>
                        </View>
                        <View style={[styles.donationStatus, { borderColor: statusColor(d.status) }]}>
                          <Text style={[styles.donationStatusText, { color: statusColor(d.status) }]}>
                            {statusLabel(d.status)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.donationActions}>
                        {d.status === 'available' && (
                          <TouchableOpacity style={styles.actionChip} onPress={() => handleStatusChange(d.id, 'reserved')} activeOpacity={0.7}>
                            <Text style={styles.actionChipText}>Reservar</Text>
                          </TouchableOpacity>
                        )}
                        {d.status !== 'completed' && (
                          <TouchableOpacity style={[styles.actionChip, styles.actionChipGreen]} onPress={() => handleOpenConfirmModal(d.id)} activeOpacity={0.7}>
                            <Text style={[styles.actionChipText, styles.actionChipTextGreen]}>Concluir</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={[styles.actionChip, styles.actionChipDanger]} onPress={() => handleDeleteDonation(d.id)} activeOpacity={0.7}>
                          <FontAwesome name="trash-o" size={13} color="#C0392B" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )
            )}

            {activeTab === 'Historia' && (
              (donationsLoading || wishlistLoading) ? (
                <ActivityIndicator color={COLORS.primary} style={{ padding: 30 }} />
              ) : (
                <View>
                  {/* Doações feitas */}
                  <Text style={styles.historySection}>Doações feitas</Text>
                  {myDonations.filter(d => d.status === 'completed').length === 0 ? (
                    <View style={styles.historyEmpty}>
                      <Text style={styles.emptyStateText}>Nenhuma doação concluída ainda.</Text>
                    </View>
                  ) : (
                    myDonations.filter(d => d.status === 'completed').map(d => (
                      <View key={d.id} style={styles.historyItem}>
                        {d.photo_url ? (
                          <Image source={{ uri: d.photo_url }} style={styles.historyImage} />
                        ) : (
                          <View style={[styles.historyImage, styles.historyImagePlaceholder]}>
                            <FontAwesome name="gift" size={18} color={COLORS.primary} />
                          </View>
                        )}
                        <View style={styles.historyInfo}>
                          <Text style={styles.historyItemTitle} numberOfLines={1}>{d.title}</Text>
                          <Text style={styles.historyItemCategory}>{d.category}</Text>
                          <Text style={styles.historyItemDate}>
                            {new Date(d.created_at).toLocaleDateString('pt-BR')}
                          </Text>
                        </View>
                        <View style={styles.historyBadgeDone}>
                          <Text style={styles.historyBadgeDoneText}>Doado</Text>
                        </View>
                      </View>
                    ))
                  )}

                  {/* Doações recebidas */}
                  <Text style={[styles.historySection, { marginTop: 24 }]}>Doações recebidas</Text>
                  {wishlist.filter(d => d.status === 'completed').length === 0 ? (
                    <View style={styles.historyEmpty}>
                      <Text style={styles.emptyStateText}>Nenhuma doação recebida ainda.</Text>
                    </View>
                  ) : (
                    wishlist.filter(d => d.status === 'completed').map(d => (
                      <View key={d.id} style={styles.historyItem}>
                        {d.photo_url ? (
                          <Image source={{ uri: d.photo_url }} style={styles.historyImage} />
                        ) : (
                          <View style={[styles.historyImage, styles.historyImagePlaceholder]}>
                            <FontAwesome name="heart" size={18} color={COLORS.secondary} />
                          </View>
                        )}
                        <View style={styles.historyInfo}>
                          <Text style={styles.historyItemTitle} numberOfLines={1}>{d.title}</Text>
                          <Text style={styles.historyItemCategory}>{d.category}</Text>
                          <Text style={styles.historyItemDate}>
                            {new Date(d.created_at).toLocaleDateString('pt-BR')}
                          </Text>
                        </View>
                        <View style={styles.historyBadgeReceived}>
                          <Text style={styles.historyBadgeReceivedText}>Recebido</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )
            )}

            {activeTab === 'Favoritos' && (
              wishlistLoading ? (
                <ActivityIndicator color={COLORS.primary} style={{ padding: 30 }} />
              ) : wishlist.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Você ainda não salvou nenhuma doação.</Text>
                </View>
              ) : (
                <View style={styles.wishlistGrid}>
                  {wishlist.map(item => (
                    <View key={item.id} style={styles.wishlistCard}>
                      {item.photo_url ? (
                        <Image source={{ uri: item.photo_url }} style={styles.wishlistImage} resizeMode="cover" />
                      ) : (
                        <View style={[styles.wishlistImage, styles.wishlistImagePlaceholder]}>
                          <FontAwesome name="image" size={24} color={COLORS.textLight} />
                        </View>
                      )}
                      <View style={styles.wishlistCardInfo}>
                        <Text style={styles.wishlistCardTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.wishlistCardCategory}>{item.category}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )
            )}

          </View>

          {showLogoutConfirm ? (
            <View style={styles.logoutConfirmBox}>
              <Text style={styles.logoutConfirmQuestion}>Tem certeza que deseja sair?</Text>
              <View style={styles.logoutConfirmButtons}>
                <TouchableOpacity style={styles.logoutCancelBtn} onPress={() => setShowLogoutConfirm(false)}>
                  <Text style={styles.logoutCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.logoutConfirmBtn, isLoggingOut && { opacity: 0.6 }]}
                  onPress={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.logoutConfirmBtnText}>Sim, sair</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.logoutButton} onPress={() => setShowLogoutConfirm(true)} activeOpacity={0.7}>
              <FontAwesome name="sign-out" size={18} color="#C0392B" />
              <Text style={styles.logoutText}>Sair da conta</Text>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.backgroundGray },
  scrollContainer: { flexGrow: 1, paddingBottom: 60 },
  contentWrapper: { width: '100%', maxWidth: 1000, alignSelf: 'center', padding: 30 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 20 },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: COLORS.border, marginBottom: 20 },
  tabButton: { paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 3, borderBottomColor: 'transparent', marginBottom: -2 },
  tabButtonActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 18, fontWeight: 'bold', color: COLORS.textLight },
  tabTextActive: { color: COLORS.primary },
  tabContentCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { fontSize: 16, color: COLORS.textLight },

  // Donations
  donationItem: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 12 },
  donationRow: { flexDirection: 'row', alignItems: 'center' },
  donationImage: { width: 52, height: 52, borderRadius: 8, backgroundColor: COLORS.border, marginRight: 12 },
  donationImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  donationInfo: { flex: 1 },
  donationTitle: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  donationCategory: { fontSize: 12, color: COLORS.textLight },
  donationStatus: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  donationStatusText: { fontSize: 11, fontWeight: 'bold' },
  donationActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(217,217,217,0.5)' },
  actionChip: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FAFAFA' },
  actionChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textDark },
  actionChipGreen: { borderColor: '#27AE60', backgroundColor: 'rgba(39,174,96,0.08)' },
  actionChipTextGreen: { color: '#27AE60' },
  actionChipDanger: { borderColor: '#C0392B', backgroundColor: 'rgba(192,57,43,0.06)', paddingHorizontal: 10 },
  actionError: { color: '#C0392B', fontSize: 13, textAlign: 'center', marginBottom: 12 },

  // Wishlist grid
  wishlistGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  wishlistCard: { width: '30%', minWidth: 110, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FAFAFA' },
  wishlistImage: { width: '100%', aspectRatio: 1.2, backgroundColor: COLORS.border },
  wishlistImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  wishlistCardInfo: { padding: 8 },
  wishlistCardTitle: { fontSize: 12, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  wishlistCardCategory: { fontSize: 11, color: COLORS.textLight },

  // Logout
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 32, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#C0392B', backgroundColor: '#FFF5F5' },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#C0392B' },
  logoutConfirmBox: { marginTop: 32, padding: 20, backgroundColor: '#FFF5F5', borderRadius: 12, borderWidth: 1.5, borderColor: '#C0392B' },
  logoutConfirmQuestion: { fontSize: 15, color: '#C0392B', textAlign: 'center', marginBottom: 16, fontWeight: '600' },
  logoutConfirmButtons: { flexDirection: 'row', gap: 12 },
  logoutCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: '#FFF' },
  logoutCancelText: { fontSize: 15, color: COLORS.textDark, fontWeight: '600' },
  logoutConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#C0392B', alignItems: 'center' },
  logoutConfirmBtnText: { fontSize: 15, color: '#FFF', fontWeight: '600' },

  // Confirm donation modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  confirmModalBox: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 12 },
  confirmModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 4, textAlign: 'center' },
  confirmModalSubtitle: { fontSize: 14, color: COLORS.textDark, textAlign: 'center', marginBottom: 20 },
  confirmModalEmpty: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', paddingVertical: 20 },
  interestedUserItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
  interestedAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  interestedAvatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  interestedUserName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#000' },
  confirmModalClose: { marginTop: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  confirmModalCloseText: { fontSize: 15, color: COLORS.textDark, fontWeight: '600' },

  // History tab
  historySection: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  historyEmpty: { paddingVertical: 20, alignItems: 'center' },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  historyImage: { width: 46, height: 46, borderRadius: 8, backgroundColor: COLORS.border, marginRight: 12 },
  historyImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  historyInfo: { flex: 1 },
  historyItemTitle: { fontSize: 13, fontWeight: 'bold', color: '#000', marginBottom: 1 },
  historyItemCategory: { fontSize: 12, color: COLORS.textLight, marginBottom: 2 },
  historyItemDate: { fontSize: 11, color: COLORS.textLight },
  historyBadgeDone: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(18,128,42,0.1)', borderWidth: 1, borderColor: COLORS.primary },
  historyBadgeDoneText: { fontSize: 11, fontWeight: 'bold', color: COLORS.primary },
  historyBadgeReceived: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(254,108,0,0.1)', borderWidth: 1, borderColor: COLORS.secondary },
  historyBadgeReceivedText: { fontSize: 11, fontWeight: 'bold', color: COLORS.secondary },
});
