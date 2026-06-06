import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import MainHeader from '../../components/MainHeader';
import ProfileUserInfo from '../../components/ProfileUserInfo';
import ProfileImpactMetrics from '../../components/ProfileImpactMetrics';
import { COLORS } from '../../constants/theme';

const MOCK_DONOR_PROFILE = {
  name: "Lara santos",
  avatarUrl: require('../../assets/images/logo.png'), 
  memberSince: "2023",
  location: "São Paulo",
  stats: [
    { count: 2, label: 'Doações recebidas' },
    { count: 20, label: 'Doações realizadas' }
  ],
  impact: {
    totalDonatedValue: "R$1.200,00",
    itemsDonatedCount: 48,
    animalsHelpedCount: 30,
    tutorsHelpedCount: 22
  }
};

export default function DonorProfileScreen() {
  return (
    <View style={styles.mainContainer}>
      <MainHeader />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.contentWrapper}>
          
          <Text style={styles.pageTitle}>
            Perfil <Text style={{ color: COLORS.secondary }}>doadora</Text>
          </Text>

          <ProfileUserInfo 
            name={MOCK_DONOR_PROFILE.name}
            avatarUrl={MOCK_DONOR_PROFILE.avatarUrl} 
            memberSince={MOCK_DONOR_PROFILE.memberSince}
            location={MOCK_DONOR_PROFILE.location}
            stats={MOCK_DONOR_PROFILE.stats} 
          />

          <ProfileImpactMetrics 
            totalDonatedValue={MOCK_DONOR_PROFILE.impact.totalDonatedValue}
            itemsDonatedCount={MOCK_DONOR_PROFILE.impact.itemsDonatedCount}
            animalsHelpedCount={MOCK_DONOR_PROFILE.impact.animalsHelpedCount}
          />

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
});