import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import MainHeader from '../../components/MainHeader';
import ProfileImpactMetrics from '../../components/ProfileImpactMetrics';
import ProfileUserInfo from '../../components/ProfileUserInfo';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../services/AuthContext';
import { getUserByIdRequest } from '../../services/authService';

interface DonorData {
  name: string;
  avatarUrl: string | null;
  memberSince: string;
}

export default function DonorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [donor, setDonor] = useState<DonorData | null>(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id || !token) { setLoading(false); return; }
    getUserByIdRequest(token, Number(id))
      .then(u => {
        if (u) {
          setDonor({
            name: u.full_name,
            avatarUrl: u.avatar_url ?? null,
            memberSince: new Date().getFullYear().toString(),
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, token]);

  const displayName = donor?.name ?? 'Usuário';
  const displayAvatar = donor?.avatarUrl ?? null;
  const memberSince = donor?.memberSince ?? new Date().getFullYear().toString();

  return (
    <View style={styles.mainContainer}>
      <MainHeader />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.contentWrapper}>

          <Text style={styles.pageTitle}>
            Perfil <Text style={{ color: COLORS.secondary }}>doador</Text>
          </Text>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <>
              <ProfileUserInfo
                name={displayName}
                avatarUrl={displayAvatar as any}
                memberSince={memberSince}
                location=""
                stats={[]}
              />

              <ProfileImpactMetrics
                totalDonatedValue=""
                itemsDonatedCount={0}
                animalsHelpedCount={0}
              />
            </>
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
});
