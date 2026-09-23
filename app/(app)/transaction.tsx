import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import DonationCommentModal from '../../components/DonationCommentModal';
import MainHeader from '../../components/MainHeader';
import RatingModal from '../../components/RatingModal';
import { COLORS, SIZES } from '../../constants/theme';
import { useAuth } from '../../services/AuthContext';
import {
  DonationTransaction,
  createCommentRequest,
  createRatingRequest,
  donorConfirmReceivedRequest,
  getTransactionRequest,
  receiveTransactionRequest,
  shipTransactionRequest,
} from '../../services/transactionService';

const STEPS: { key: string; label: string }[] = [
  { key: 'accepted_awaiting_shipment', label: 'Aceita' },
  { key: 'shipped', label: 'Enviada' },
  { key: 'finalized', label: 'Finalizada' },
];

function stepIndexFor(status: string): number {
  if (status === 'accepted_awaiting_shipment') return 0;
  if (status === 'shipped') return 1;
  return 2;
}

const FINALIZED_LABEL: Record<string, string> = {
  recipient: 'Confirmado pelo beneficiário',
  donor: 'Confirmado pelo doador (medida de segurança)',
  automatic: 'Finalizado automaticamente após 7 dias sem confirmação',
};

export default function TransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token, user } = useAuth();

  const [transaction, setTransaction] = useState<DonationTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);

  function load() {
    if (!token || !id) return;
    setLoading(true);
    getTransactionRequest(token, Number(id))
      .then(setTransaction)
      .catch(err => setError(err instanceof Error ? err.message : 'Não foi possível carregar a doação.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [token, id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <Head><title>Pote Cheio</title></Head>
        <MainHeader showSearch={false} />
        <View style={styles.centerContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </View>
    );
  }

  if (error || !transaction) {
    return (
      <View style={styles.mainContainer}>
        <Head><title>Pote Cheio</title></Head>
        <MainHeader showSearch={false} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || 'Essa doação ainda não tem um pedido aceito.'}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isDonor = user?.id === transaction.donor_id;
  const isFinalized = transaction.status.startsWith('finalized');
  const currentStep = stepIndexFor(transaction.status);

  async function runAction(action: () => Promise<DonationTransaction>) {
    setActionLoading(true);
    setActionError('');
    try {
      const updated = await action();
      setTransaction(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Não foi possível concluir a ação.');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <View style={styles.mainContainer}>
      <Head><title>Acompanhar doação | Pote Cheio</title></Head>
      <MainHeader showSearch={false} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentWrapper}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <FontAwesome name="chevron-left" size={12} color={COLORS.primary} />
            <Text style={styles.backLinkText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <View style={styles.donationRow}>
              {transaction.donation_photo_url ? (
                <Image source={{ uri: transaction.donation_photo_url }} style={styles.donationImage} resizeMode="cover" />
              ) : (
                <View style={[styles.donationImage, styles.donationImagePlaceholder]}>
                  <FontAwesome name="image" size={22} color={COLORS.textLight} />
                </View>
              )}
              <View style={styles.donationInfo}>
                <Text style={styles.donationTitle} numberOfLines={2}>{transaction.title}</Text>
                <Text style={styles.donationSubtitle}>
                  {isDonor ? `Beneficiário: ${transaction.recipient_name}` : `Doador: ${transaction.donor_name}`}
                </Text>
              </View>
            </View>

            <View style={styles.stepper}>
              {STEPS.map((step, index) => (
                <React.Fragment key={step.key}>
                  <View style={styles.stepItem}>
                    <View style={[styles.stepDot, index <= currentStep && styles.stepDotActive]}>
                      {index < currentStep && <FontAwesome name="check" size={11} color="#FFF" />}
                    </View>
                    <Text style={[styles.stepLabel, index <= currentStep && styles.stepLabelActive]}>{step.label}</Text>
                  </View>
                  {index < STEPS.length - 1 && (
                    <View style={[styles.stepLine, index < currentStep && styles.stepLineActive]} />
                  )}
                </React.Fragment>
              ))}
            </View>

            {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

            {!isFinalized && transaction.status === 'accepted_awaiting_shipment' && (
              isDonor ? (
                <View style={styles.actionBox}>
                  <Text style={styles.actionText}>Combine a entrega com o beneficiário pelo chat e, quando enviar o item, marque abaixo.</Text>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => runAction(() => shipTransactionRequest(token!, transaction.donation_id))}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Marquei como enviado</Text>}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.actionBox}>
                  <Text style={styles.actionText}>Aguardando o doador enviar o item. Combine os detalhes pelo chat.</Text>
                </View>
              )
            )}

            {!isFinalized && transaction.status === 'shipped' && (
              isDonor ? (
                <View style={styles.actionBox}>
                  <Text style={styles.actionText}>O beneficiário ainda não confirmou o recebimento.</Text>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => runAction(() => donorConfirmReceivedRequest(token!, transaction.donation_id))}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <ActivityIndicator color={COLORS.primary} /> : (
                      <Text style={styles.secondaryBtnText}>Confirmar que o beneficiário recebeu</Text>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.hintText}>
                    Use isso só como medida de segurança, caso o beneficiário já tenha recebido mas não confirmou. Se ninguém confirmar em 7 dias, o sistema finaliza automaticamente.
                  </Text>
                </View>
              ) : (
                <View style={styles.actionBox}>
                  <Text style={styles.actionText}>O doador marcou o item como enviado. Assim que receber, confirme abaixo.</Text>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => runAction(() => receiveTransactionRequest(token!, transaction.donation_id))}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Recebi a doação</Text>}
                  </TouchableOpacity>
                </View>
              )
            )}

            {isFinalized && (
              <View style={styles.finalizedBox}>
                <FontAwesome name="check-circle" size={22} color={COLORS.primary} />
                <Text style={styles.finalizedTitle}>Doação finalizada</Text>
                <Text style={styles.finalizedSubtitle}>
                  {FINALIZED_LABEL[transaction.finalized_by ?? ''] ?? 'Finalizada'}
                  {transaction.finalized_at ? ` em ${new Date(transaction.finalized_at).toLocaleDateString('pt-BR')}` : ''}
                </Text>
              </View>
            )}

            {isFinalized && !isDonor && (
              <View style={styles.feedbackRow}>
                <TouchableOpacity
                  style={[styles.feedbackBtn, transaction.has_rating && styles.feedbackBtnDone]}
                  onPress={() => !transaction.has_rating && setShowRatingModal(true)}
                  disabled={transaction.has_rating}
                >
                  <FontAwesome name={transaction.has_rating ? 'check' : 'star-o'} size={14} color={transaction.has_rating ? COLORS.primary : '#FFF'} />
                  <Text style={[styles.feedbackBtnText, transaction.has_rating && styles.feedbackBtnTextDone]}>
                    {transaction.has_rating ? 'Avaliado' : 'Avaliar doador'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.feedbackBtn, styles.feedbackBtnOutline, transaction.has_comment && styles.feedbackBtnDone]}
                  onPress={() => !transaction.has_comment && setShowCommentModal(true)}
                  disabled={transaction.has_comment}
                >
                  <FontAwesome name={transaction.has_comment ? 'check' : 'comment-o'} size={14} color={COLORS.primary} />
                  <Text style={[styles.feedbackBtnOutlineText, transaction.has_comment && styles.feedbackBtnTextDone]}>
                    {transaction.has_comment ? 'Comentado' : 'Deixar comentário'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        donorName={transaction.donor_name}
        onSubmit={async (rating) => {
          await createRatingRequest(token!, transaction.donation_id, rating);
          setTransaction(prev => prev ? { ...prev, has_rating: true } : prev);
        }}
      />

      <DonationCommentModal
        visible={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        onSubmit={async (comment, photoUrls) => {
          await createCommentRequest(token!, transaction.donation_id, comment, photoUrls);
          setTransaction(prev => prev ? { ...prev, has_comment: true } : prev);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.backgroundGray },
  scrollContainer: { flexGrow: 1, paddingBottom: 60 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 20 },
  contentWrapper: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 20 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  backLinkText: { color: COLORS.primary, fontWeight: 'bold' },
  errorText: { fontSize: 15, color: '#C0392B', textAlign: 'center' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  donationRow: { flexDirection: 'row', gap: 14, marginBottom: 24 },
  donationImage: { width: 64, height: 64, borderRadius: SIZES.radius, backgroundColor: COLORS.border },
  donationImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  donationInfo: { flex: 1, justifyContent: 'center' },
  donationTitle: { fontSize: 17, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  donationSubtitle: { fontSize: 13, color: COLORS.textLight },
  stepper: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 26, paddingHorizontal: 4 },
  stepItem: { alignItems: 'center', width: 74 },
  stepDot: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepLabel: { fontSize: 11, color: COLORS.textLight, textAlign: 'center' },
  stepLabelActive: { color: COLORS.primary, fontWeight: '700' },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginTop: 12 },
  stepLineActive: { backgroundColor: COLORS.primary },
  actionBox: { backgroundColor: COLORS.backgroundGray, borderRadius: SIZES.radius, padding: 16, gap: 12 },
  actionText: { fontSize: 14, color: COLORS.textDark, lineHeight: 20 },
  hintText: { fontSize: 12, color: COLORS.textLight, lineHeight: 17 },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  secondaryBtn: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 12, alignItems: 'center' },
  secondaryBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
  finalizedBox: { alignItems: 'center', gap: 6, paddingVertical: 10 },
  finalizedTitle: { fontSize: 17, fontWeight: 'bold', color: '#000' },
  finalizedSubtitle: { fontSize: 13, color: COLORS.textLight, textAlign: 'center' },
  feedbackRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  feedbackBtn: {
    flex: 1, flexDirection: 'row', gap: 6, backgroundColor: COLORS.secondary, borderRadius: SIZES.radius,
    paddingVertical: 12, justifyContent: 'center', alignItems: 'center',
  },
  feedbackBtnOutline: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: COLORS.primary },
  feedbackBtnDone: { backgroundColor: COLORS.backgroundGray, borderWidth: 1, borderColor: COLORS.border },
  feedbackBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  feedbackBtnOutlineText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13 },
  feedbackBtnTextDone: { color: COLORS.textLight },
});
