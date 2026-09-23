import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MainHeader from '../../components/MainHeader';
import ProfileImpactMetrics from '../../components/ProfileImpactMetrics';
import ProfileUserInfo from '../../components/ProfileUserInfo';
import RatingStars from '../../components/RatingStars';
import { COLORS, SIZES } from '../../constants/theme';
import { useAuth } from '../../services/AuthContext';
import { getUserByIdRequest } from '../../services/authService';
import {
  DonorDonationStats,
  DonorFeedback,
  DonorRatingSummary,
  getUserDonationStatsRequest,
  getUserFeedbackRequest,
  getUserRatingSummaryRequest,
} from '../../services/transactionService';

interface DonorData {
  name: string;
  avatarUrl: string | null;
  memberSince: string;
}

export default function DonorProfileScreen() {
  const { id, name: paramName, avatar: paramAvatar } = useLocalSearchParams<{
    id: string;
    name?: string;
    avatar?: string;
  }>();
  const { token } = useAuth();
  const router = useRouter();
  const [donor, setDonor] = useState<DonorData | null>(null);
  // Show immediately from route params while API loads
  const [loading, setLoading] = useState(!paramName && !!id);
  const [ratingSummary, setRatingSummary] = useState<DonorRatingSummary>({ average: null, count: 0 });
  const [feedback, setFeedback] = useState<DonorFeedback[]>([]);
  const [stats, setStats] = useState<DonorDonationStats>({ donated_count: 0, reserved_count: 0, received_count: 0 });

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getUserByIdRequest(token, Number(id))
      .then(u => {
        if (u) {
          setDonor({
            name: u.full_name,
            avatarUrl: u.avatar_url ?? (paramAvatar || null),
            memberSince: new Date().getFullYear().toString(),
          });
        } else if (paramName) {
          // API returned nothing but we have route params — use them
          setDonor({
            name: paramName,
            avatarUrl: paramAvatar || null,
            memberSince: new Date().getFullYear().toString(),
          });
        }
      })
      .catch(() => {
        if (paramName) {
          setDonor({
            name: paramName,
            avatarUrl: paramAvatar || null,
            memberSince: new Date().getFullYear().toString(),
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id, token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!id) return;
    getUserRatingSummaryRequest(Number(id)).then(setRatingSummary).catch(() => {});
    getUserFeedbackRequest(Number(id)).then(setFeedback).catch(() => {});
    getUserDonationStatsRequest(Number(id)).then(setStats).catch(() => {});
  }, [id]);

  function goToRecipientProfile(recipientId: number, recipientName: string, recipientAvatarUrl: string | null) {
    router.push({
      pathname: '/donor-profile',
      params: {
        id: String(recipientId),
        name: recipientName,
        ...(recipientAvatarUrl ? { avatar: recipientAvatarUrl } : {}),
      },
    });
  }

  const displayName = donor?.name ?? paramName ?? 'Usuário';
  const displayAvatar = donor?.avatarUrl ?? (paramAvatar || null);
  const memberSince = donor?.memberSince ?? new Date().getFullYear().toString();

  return (
    <View style={styles.mainContainer}>
      <Head><title>{displayName} | Pote Cheio</title></Head>
      <MainHeader showSearch={false} />

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
                itemsDonatedCount={stats.donated_count}
                itemsReceivedCount={stats.received_count}
                itemsReservedCount={stats.reserved_count}
              />

              <View style={styles.ratingSummaryRow}>
                <RatingStars value={ratingSummary.average ?? 0} size={20} />
                <Text style={styles.ratingSummaryText}>
                  {ratingSummary.average != null
                    ? `${ratingSummary.average.toFixed(1)} (${ratingSummary.count} avaliação${ratingSummary.count === 1 ? '' : 'ões'})`
                    : 'Ainda sem avaliações'}
                </Text>
              </View>

              <Text style={styles.feedbackSectionTitle}>Comentários de quem já recebeu doações</Text>
              {feedback.length === 0 ? (
                <Text style={styles.feedbackEmpty}>Nenhum comentário ainda.</Text>
              ) : (
                feedback.map(item => (
                  <View key={item.id} style={styles.feedbackCard}>
                    <View style={styles.feedbackCardHeader}>
                      <TouchableOpacity
                        style={styles.feedbackAuthorRow}
                        onPress={() => goToRecipientProfile(item.recipient_id, item.recipient_name, item.recipient_avatar_url)}
                      >
                        <View style={styles.feedbackAvatar}>
                          {item.recipient_avatar_url ? (
                            <Image source={{ uri: item.recipient_avatar_url }} style={styles.feedbackAvatarImage} />
                          ) : (
                            <FontAwesome name="user-circle-o" size={22} color={COLORS.textLight} />
                          )}
                        </View>
                        <Text style={styles.feedbackAuthor}>{item.recipient_name}</Text>
                      </TouchableOpacity>
                      <Text style={styles.feedbackDate}>{new Date(item.created_at).toLocaleDateString('pt-BR')}</Text>
                    </View>
                    <Text style={styles.feedbackDonationTitle}>sobre &quot;{item.donation_title}&quot;</Text>
                    <Text style={styles.feedbackComment}>{item.comment}</Text>
                    {item.photos.length > 0 && (
                      <View style={styles.feedbackPhotoRow}>
                        {item.photos.map(url => (
                          <Image key={url} source={{ uri: url }} style={styles.feedbackPhoto} resizeMode="cover" />
                        ))}
                      </View>
                    )}
                  </View>
                ))
              )}
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
  ratingSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },
  ratingSummaryText: { fontSize: 14, color: COLORS.textDark },
  feedbackSectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.secondary, marginTop: 28, marginBottom: 12, textTransform: 'uppercase' },
  feedbackEmpty: { fontSize: 14, color: COLORS.textLight },
  feedbackCard: { backgroundColor: '#FFF', borderRadius: SIZES.radius, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  feedbackCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  feedbackAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feedbackAvatar: { width: 22, height: 22, borderRadius: 11, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  feedbackAvatarImage: { width: 22, height: 22 },
  feedbackAuthor: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  feedbackDate: { fontSize: 12, color: COLORS.textLight },
  feedbackDonationTitle: { fontSize: 12, color: COLORS.textLight, fontStyle: 'italic', marginBottom: 8 },
  feedbackComment: { fontSize: 14, color: COLORS.textDark, lineHeight: 20 },
  feedbackPhotoRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  feedbackPhoto: { width: 64, height: 64, borderRadius: 8, backgroundColor: COLORS.border },
});
