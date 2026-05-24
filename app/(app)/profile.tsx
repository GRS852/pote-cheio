import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';

import MainHeader from '../../components/MainHeader';
import ProfileUserInfo from '../../components/ProfileUserInfo';
import ProfileImpactMetrics from '../../components/ProfileImpactMetrics';
import DonationListItem from '../../components/DonationListItem';
import { COLORS } from '../../constants/theme';

type TabType = 'Minhas doações' | 'Historia' | 'Favoritos';
const TABS: TabType[] = ['Minhas doações', 'Historia', 'Favoritos'];

const MOCK_USER_PROFILE = {
  profile: {
    name: "Wanessa Nunes",
    avatarUrl: null, 
    memberSince: "2023",
    location: "São Paulo",
    stats: [
      { count: 20, label: 'Doações realizadas' }
    ],
    impact: { 
      totalDonatedValue: "R$1.200,00", 
      itemsDonatedCount: 48, 
      animalsHelpedCount: 30 
    }
  },
  donations: [
    { id: '1', title: 'Coleira preta', receiver: 'Rafaela Santos', date: '15 de mai de 2024', status: 'Entregue' as const, imageUrl: require('../../assets/images/logo.png') },
    { id: '2', title: 'Ração Golden', receiver: 'Guilherme santos', date: '15 de mai de 2024', status: 'Em andamento' as const, imageUrl: require('../../assets/images/logo.png') },
  ],
  favorites: [
    require('../../assets/images/logo.png'), require('../../assets/images/logo.png')
  ]
};

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('Minhas doações');

  return (
    <View style={styles.mainContainer}>
      <MainHeader />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.contentWrapper}>
          
          <Text style={styles.pageTitle}>Meu <Text style={{ color: COLORS.secondary }}>Perfil</Text></Text>

          <ProfileUserInfo 
            name={MOCK_USER_PROFILE.profile.name}
            avatarUrl={MOCK_USER_PROFILE.profile.avatarUrl}
            memberSince={MOCK_USER_PROFILE.profile.memberSince}
            location={MOCK_USER_PROFILE.profile.location}
            stats={MOCK_USER_PROFILE.profile.stats}
          />

          <ProfileImpactMetrics 
            totalDonatedValue={MOCK_USER_PROFILE.profile.impact.totalDonatedValue}
            itemsDonatedCount={MOCK_USER_PROFILE.profile.impact.itemsDonatedCount}
            animalsHelpedCount={MOCK_USER_PROFILE.profile.impact.animalsHelpedCount}
          />

          <View style={styles.tabsContainer}>
            {TABS.map((tab) => (
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
              <View>
                {MOCK_USER_PROFILE.donations.map((donation) => (
                  <DonationListItem key={donation.id} {...donation} />
                ))}
              </View>
            )}

            {activeTab === 'Historia' && (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>Nenhuma história registrada ainda.</Text>
              </View>
            )}

            {activeTab === 'Favoritos' && (
              <View style={styles.favoritesGrid}>
                {MOCK_USER_PROFILE.favorites.map((img, index) => (
                  <View key={index} style={styles.favoriteImageContainer}>
                    <Image source={img} style={styles.favoriteImage} resizeMode="cover" />
                  </View>
                ))}
              </View>
            )}
          </View>

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
  favoritesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'flex-start' },
  favoriteImageContainer: { width: '31%', minWidth: 120, aspectRatio: 1.5, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  favoriteImage: { width: '100%', height: '100%' },
  emptyStateContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { fontSize: 16, color: COLORS.textLight },
});