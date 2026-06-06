import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  DimensionValue,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import Button from '../../components/Button';
import ChatWidget from '../../components/ChatWidget';
import InfoBox from '../../components/InfoBox';
import MainHeader from '../../components/MainHeader';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../services/AuthContext';
import { Donation, addToWishlistRequest, getDonationRequest, removeFromWishlistRequest } from '../../services/donationService';

const SectionTitle = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>+ {title}</Text>
);

export default function ProductScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();

  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    getDonationRequest(token, Number(id))
      .then(d => {
        setDonation(d);
        setInWishlist(d.in_wishlist);
      })
      .catch(() => setDonation(null))
      .finally(() => setLoading(false));
  }, [token, id]);

  async function handleWishlist() {
    if (!token || !donation) return;
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await removeFromWishlistRequest(token, donation.id);
        setInWishlist(false);
      } else {
        const { conversation_id } = await addToWishlistRequest(token, donation.id);
        setInWishlist(true);
        setConversationId(conversation_id);
        setIsChatOpen(true);
      }
    } finally {
      setWishlistLoading(false);
    }
  }

  const imageMaxWidth: DimensionValue = isDesktop ? '50%' : '100%';

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <MainHeader />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  if (!donation) {
    return (
      <View style={styles.mainContainer}>
        <MainHeader />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Doação não encontrada.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isOwner = user?.id === donation.donor_id;

  return (
    <View style={styles.mainContainer}>
      <MainHeader />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.contentWrapper, { flexDirection: isDesktop ? 'row' : 'column' }]}>

          <View style={[styles.imageContainer, { maxWidth: imageMaxWidth }]}>
            {donation.photo_url ? (
              <Image source={{ uri: donation.photo_url }} style={styles.productImage} resizeMode="cover" />
            ) : (
              <View style={[styles.productImage, styles.imagePlaceholder]}>
                <FontAwesome name="image" size={48} color={COLORS.textLight} />
              </View>
            )}
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.productTitle}>{donation.title}</Text>

            <View style={styles.categoryRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{donation.category}</Text>
              </View>
              <View style={[styles.statusBadge, donation.status !== 'available' && styles.statusBadgeReserved]}>
                <Text style={styles.statusBadgeText}>
                  {donation.status === 'available' ? 'Disponível' : donation.status === 'reserved' ? 'Reservado' : 'Concluído'}
                </Text>
              </View>
            </View>

            <SectionTitle title="DESCRIÇÃO" />
            <Text style={styles.descriptionText}>{donation.description}</Text>

            {donation.quantity != null && (
              <>
                <SectionTitle title="INFORMAÇÕES" />
                <View style={styles.infoRow}>
                  <InfoBox label="Quantidade" value={String(donation.quantity)} highlightValue />
                </View>
              </>
            )}

            {!isOwner && donation.status === 'available' && (
              <View style={styles.actionButtons}>
                <Button
                  title={inWishlist ? 'Interesse registrado' : 'Eu quero'}
                  icon={<FontAwesome name={inWishlist ? 'heart' : 'heart-o'} size={18} color="#FFF" />}
                  onPress={handleWishlist}
                  loading={wishlistLoading}
                />
                {inWishlist && (
                  <Button
                    title="Abrir conversa"
                    variant="outline"
                    icon={<FontAwesome name="comment-o" size={18} color={COLORS.primary} />}
                    onPress={() => setIsChatOpen(true)}
                  />
                )}
              </View>
            )}

            {donation.donor && (
              <>
                <SectionTitle title="DOADOR" />
                <TouchableOpacity
                  style={styles.donorCard}
                  activeOpacity={0.8}
                  onPress={() => router.push('/donor-profile')}
                >
                  <View style={styles.donorAvatar}>
                    <Text style={styles.donorAvatarLetter}>{donation.donor.full_name[0]}</Text>
                  </View>
                  <View style={styles.donorInfo}>
                    <Text style={styles.donorName}>{donation.donor.full_name}</Text>
                    <Text style={styles.donorSince}>
                      Membro desde {new Date(donation.donor.created_at).getFullYear()}
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <ChatWidget
        forceOpenConversationId={conversationId}
        forceOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.backgroundGray },
  scrollContainer: { flexGrow: 1, paddingBottom: 60 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  errorText: { fontSize: 16, color: COLORS.textDark },
  backLink: { padding: 10 },
  backLinkText: { color: COLORS.primary, fontWeight: 'bold' },
  contentWrapper: { flex: 1, width: '100%', maxWidth: 1100, alignSelf: 'center', padding: 30, gap: 40 },
  imageContainer: { flex: 1 },
  productImage: { width: '100%', aspectRatio: 1, borderRadius: 16, backgroundColor: COLORS.border },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  detailsContainer: { flex: 1 },
  productTitle: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: COLORS.secondary },
  categoryBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: '#D1F0D9' },
  statusBadgeReserved: { backgroundColor: '#FFE5CC' },
  statusBadgeText: { color: COLORS.textDark, fontWeight: 'bold', fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.secondary, marginTop: 20, marginBottom: 12, textTransform: 'uppercase' },
  descriptionText: { fontSize: 16, color: COLORS.textDark, lineHeight: 24 },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  actionButtons: { gap: 12, marginBottom: 20, marginTop: 20 },
  donorCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  donorAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, marginRight: 16, alignItems: 'center', justifyContent: 'center' },
  donorAvatarLetter: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  donorInfo: { flex: 1 },
  donorName: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  donorSince: { fontSize: 12, color: COLORS.textLight },
});
