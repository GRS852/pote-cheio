import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
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
import ImageCarousel from '../../components/ImageCarousel';
import InfoBox from '../../components/InfoBox';
import MainHeader from '../../components/MainHeader';
import ReportModal from '../../components/ReportModal';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../services/AuthContext';
import { Donation, addToWishlistRequest, getDonationRequest, removeFromWishlistRequest } from '../../services/donationService';

const SectionTitle = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>+ {title}</Text>
);

const STATUS_LABEL: Record<Donation['status'], string> = {
  available: 'Disponível',
  reserved: 'Reservado',
  completed: 'Doado',
  cancelled: 'Encerrada',
  closed: 'Encerrada',
  removed: 'Removida',
};

// Para quem não é o dono: a publicação não está mais disponível e, em vez
// do anúncio, mostramos o que aconteceu com ela.
function unavailableNotice(donation: Donation): { icon: React.ComponentProps<typeof FontAwesome>['name']; text: string; mine: boolean } | null {
  switch (donation.status) {
    case 'completed':
      return donation.received_by_me
        ? { icon: 'gift', text: 'Esse item foi doado para você', mine: true }
        : { icon: 'handshake-o', text: 'Esse item foi doado para outra pessoa', mine: false };
    case 'closed':
    case 'cancelled':
      return { icon: 'ban', text: 'Publicação encerrada', mine: false };
    case 'removed':
      return { icon: 'exclamation-triangle', text: 'Publicação violou as diretrizes do site', mine: false };
    default:
      return null;
  }
}

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
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDonationRequest(token, Number(id))
      .then(d => {
        setDonation(d);
        setInWishlist(d.in_wishlist);
      })
      .catch(() => setDonation(null))
      .finally(() => setLoading(false));
  }, [token, id]);

  async function handleWishlist() {
    if (!donation) return;
    if (!token) {
      router.push({ pathname: '/(auth)/login', params: { redirect: `/product?id=${donation.id}` } });
      return;
    }
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

  function handleReportPress() {
    if (!donation) return;
    if (!token) {
      router.push({ pathname: '/(auth)/login', params: { redirect: `/product?id=${donation.id}` } });
      return;
    }
    setShowReportModal(true);
  }

  const imageMaxWidth: DimensionValue = isDesktop ? '50%' : '100%';

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <Head><title>Pote Cheio</title></Head>
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
        <Head><title>Doação não encontrada | Pote Cheio</title></Head>
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

  const isOwner = !!user && user.id === donation.donor_id;
  const notice = isOwner ? null : unavailableNotice(donation);

  if (notice) {
    // Removida pela moderação: o conteúdo não é exibido (a API nem envia)
    const showContent = donation.status !== 'removed';
    return (
      <View style={styles.mainContainer}>
        <Head><title>{showContent ? `${donation.title} | Pote Cheio` : 'Publicação indisponível | Pote Cheio'}</title></Head>
        <MainHeader />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.noticeCard}>
            <View style={[styles.noticeIcon, notice.mine && styles.noticeIconMine]}>
              <FontAwesome name={notice.icon} size={30} color={notice.mine ? COLORS.primary : COLORS.textDark} />
            </View>
            <Text style={styles.noticeText}>{notice.text}</Text>
            {showContent && (
              <View style={styles.noticeItem}>
                {donation.photo_url ? (
                  <Image source={{ uri: donation.photo_url }} style={styles.noticeItemImage} />
                ) : null}
                <Text style={styles.noticeItemTitle} numberOfLines={2}>{donation.title}</Text>
              </View>
            )}
            <View style={styles.noticeButtons}>
              {notice.mine && (
                <Button
                  title="Ver detalhes da doação"
                  icon={<FontAwesome name="list-alt" size={16} color="#FFF" />}
                  onPress={() => router.push({ pathname: '/(app)/transaction', params: { id: String(donation.id) } })}
                />
              )}
              <Button
                title="Ver outras doações"
                variant={notice.mine ? 'outline' : undefined}
                onPress={() => router.push('/home')}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <Head><title>{donation.title} | Pote Cheio</title></Head>
      <MainHeader />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.contentWrapper, { flexDirection: isDesktop ? 'row' : 'column' }]}>

          <View style={[styles.imageContainer, { maxWidth: imageMaxWidth }]}>
            <ImageCarousel
              photos={donation.photos?.length ? donation.photos : donation.photo_url ? [donation.photo_url] : []}
              imageStyle={styles.productImage}
            />
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.productTitle}>{donation.title}</Text>
              {!isOwner && (
                <TouchableOpacity style={styles.reportLink} onPress={handleReportPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <FontAwesome name="flag-o" size={14} color={COLORS.textLight} />
                  <Text style={styles.reportLinkText}>Denunciar</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.categoryRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{donation.category}</Text>
              </View>
              <View style={[styles.statusBadge, donation.status !== 'available' && styles.statusBadgeReserved]}>
                <Text style={styles.statusBadgeText}>{STATUS_LABEL[donation.status] ?? donation.status}</Text>
              </View>
            </View>

            {isOwner && (donation.status === 'closed' || donation.status === 'cancelled') && (
              <View style={styles.ownerNotice}>
                <FontAwesome name="ban" size={14} color={COLORS.textDark} />
                <Text style={styles.ownerNoticeText}>Você encerrou esta publicação. Ela não aparece mais para outras pessoas.</Text>
              </View>
            )}
            {isOwner && donation.status === 'removed' && (
              <View style={[styles.ownerNotice, styles.ownerNoticeDanger]}>
                <FontAwesome name="exclamation-triangle" size={14} color="#C0392B" />
                <Text style={[styles.ownerNoticeText, { color: '#C0392B' }]}>
                  Publicação removida por violar as diretrizes do site.{donation.removed_reason ? ` Motivo: ${donation.removed_reason}` : ''}
                </Text>
              </View>
            )}
            {!isOwner && donation.status === 'reserved' && donation.is_my_transaction && (
              <TouchableOpacity
                style={styles.ownerNotice}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/(app)/transaction', params: { id: String(donation.id) } })}
              >
                <FontAwesome name="truck" size={14} color={COLORS.primary} />
                <Text style={[styles.ownerNoticeText, { color: COLORS.primary }]}>Esse item está a caminho de você — toque para ver a entrega.</Text>
              </TouchableOpacity>
            )}

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

            {donation.donor_name && (
              <>
                <SectionTitle title="DOADOR" />
                <TouchableOpacity
                  style={styles.donorCard}
                  activeOpacity={0.8}
                  onPress={() => router.push({
                    pathname: '/donor-profile',
                    params: { id: String(donation.donor_id), name: donation.donor_name },
                  })}
                >
                  <View style={styles.donorAvatar}>
                    {donation.donor_avatar_url ? (
                      <Image source={{ uri: donation.donor_avatar_url }} style={styles.donorAvatarImage} />
                    ) : (
                      <Text style={styles.donorAvatarLetter}>{donation.donor_name[0]}</Text>
                    )}
                  </View>
                  <View style={styles.donorInfo}>
                    <Text style={styles.donorName}>{donation.donor_name}</Text>
                    <Text style={styles.donorSince}>
                      Membro desde {new Date(donation.donor_created_at).getFullYear()}
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
        fallbackUserName={donation.donor_name}
      />

      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="donation"
        targetId={donation.id}
        photoUrl={donation.photo_url}
        targetTitle={donation.title}
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
  productImage: { width: '100%', aspectRatio: 1, borderRadius: 16, backgroundColor: COLORS.border, overflow: 'hidden', position: 'relative' },
  detailsContainer: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  productTitle: { flex: 1, fontSize: 28, fontWeight: 'bold', color: '#000' },
  reportLink: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 6 },
  reportLinkText: { fontSize: 13, color: COLORS.textLight, textDecorationLine: 'underline' },
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
  donorAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, marginRight: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  donorAvatarImage: { width: 60, height: 60 },
  donorAvatarLetter: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  donorInfo: { flex: 1 },
  donorName: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  donorSince: { fontSize: 12, color: COLORS.textLight },
  ownerNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 8 },
  ownerNoticeDanger: { borderColor: 'rgba(192,57,43,0.35)', backgroundColor: 'rgba(192,57,43,0.06)' },
  ownerNoticeText: { flex: 1, fontSize: 14, color: COLORS.textDark, lineHeight: 20 },
  noticeCard: { width: '100%', maxWidth: 520, alignSelf: 'center', marginTop: 40, padding: 28, gap: 16, alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  noticeIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.06)' },
  noticeIconMine: { backgroundColor: 'rgba(18,128,42,0.12)' },
  noticeText: { fontSize: 20, fontWeight: 'bold', color: '#000', textAlign: 'center' },
  noticeItem: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', padding: 12, borderRadius: 12, backgroundColor: COLORS.backgroundGray },
  noticeItemImage: { width: 56, height: 56, borderRadius: 10, backgroundColor: COLORS.border },
  noticeItemTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  noticeButtons: { alignSelf: 'stretch', gap: 10 },
});
