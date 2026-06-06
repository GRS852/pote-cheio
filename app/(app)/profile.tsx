import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MainHeader from '../../components/MainHeader';
import ProfileImpactMetrics from '../../components/ProfileImpactMetrics';
import ProfileUserInfo from '../../components/ProfileUserInfo';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../services/AuthContext';
import { Donation, getMyDonationsRequest } from '../../services/donationService';

type TabType = 'Minhas doações' | 'Historia' | 'Favoritos';
const TABS: TabType[] = ['Minhas doações', 'Historia', 'Favoritos'];

const MOCK_FAVORITES = [
  require('../../assets/images/logo.png'),
  require('../../assets/images/logo.png'),
];

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('Minhas doações');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [myDonations, setMyDonations] = useState<Donation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const { signOut, user, token } = useAuth();

  const memberSince = user?.created_at ? new Date(user.created_at).getFullYear().toString() : '';

  useEffect(() => {
    if (activeTab !== 'Minhas doações' || !token) return;
    setDonationsLoading(true);
    getMyDonationsRequest(token)
      .then(setMyDonations)
      .catch(() => setMyDonations([]))
      .finally(() => setDonationsLoading(false));
  }, [activeTab, token]);

  function handleLogout() {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => { setIsLoggingOut(true); await signOut(); } },
    ]);
  }

  const statusLabel = (s: string) =>
    s === 'available' ? 'Disponível' : s === 'reserved' ? 'Reservado' : 'Concluído';
  const statusColor = (s: string) =>
    s === 'available' ? COLORS.primary : s === 'reserved' ? COLORS.secondary : COLORS.textLight;

  return (
    <View style={styles.mainContainer}>
      <MainHeader />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.contentWrapper}>

          <Text style={styles.pageTitle}>Meu <Text style={{ color: COLORS.secondary }}>Perfil</Text></Text>

          <ProfileUserInfo
            name={user?.full_name ?? ''}
            avatarUrl={null}
            memberSince={memberSince}
            location=""
            stats={[]}
          />

          <ProfileImpactMetrics
            totalDonatedValue="R$0,00"
            itemsDonatedCount={myDonations.length}
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
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>Você ainda não publicou nenhuma doação.</Text>
                </View>
              ) : (
                myDonations.map(d => (
                  <View key={d.id} style={styles.donationItem}>
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
                ))
              )
            )}

            {activeTab === 'Historia' && (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>Nenhuma história registrada ainda.</Text>
              </View>
            )}

            {activeTab === 'Favoritos' && (
              <View style={styles.favoritesGrid}>
                {MOCK_FAVORITES.map((img, index) => (
                  <View key={index} style={styles.favoriteImageContainer}>
                    <Image source={img} style={styles.favoriteImage} resizeMode="cover" />
                  </View>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
            onPress={handleLogout}
            activeOpacity={0.7}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator color="#C0392B" size="small" />
            ) : (
              <>
                <FontAwesome name="sign-out" size={18} color="#C0392B" />
                <Text style={styles.logoutText}>Sair da conta</Text>
              </>
            )}
          </TouchableOpacity>

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
  emptyStateContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { fontSize: 16, color: COLORS.textLight },
  donationItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  donationImage: { width: 52, height: 52, borderRadius: 8, backgroundColor: COLORS.border, marginRight: 12 },
  donationImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  donationInfo: { flex: 1 },
  donationTitle: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  donationCategory: { fontSize: 12, color: COLORS.textLight },
  donationStatus: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  donationStatusText: { fontSize: 11, fontWeight: 'bold' },
  favoritesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  favoriteImageContainer: { width: '31%', minWidth: 120, aspectRatio: 1.5, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  favoriteImage: { width: '100%', height: '100%' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 32, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#C0392B', backgroundColor: '#FFF5F5' },
  logoutButtonDisabled: { opacity: 0.6 },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#C0392B' },
});
