import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, SIZES } from '../constants/theme';
import RatingStars from './RatingStars';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => Promise<void>;
  donorName: string;
}

export default function RatingModal({ visible, onClose, onSubmit, donorName }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleClose() {
    setRating(0);
    setError('');
    onClose();
  }

  async function handleSubmit() {
    if (rating <= 0) { setError('Escolha de meia a 5 estrelas.'); return; }
    setLoading(true);
    setError('');
    try {
      await onSubmit(rating);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar a avaliação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity style={styles.box} activeOpacity={1} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Avaliar {donorName}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <FontAwesome name="close" size={20} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Como foi receber essa doação e ser atendido pelo doador?</Text>

          <View style={styles.starsRow}>
            <RatingStars value={rating} onChange={setRating} size={36} />
          </View>
          <Text style={styles.ratingValue}>{rating > 0 ? `${rating.toFixed(1)} de 5` : 'Toque para avaliar'}</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitBtn, (rating <= 0 || loading) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={rating <= 0 || loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Enviar avaliação</Text>}
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  box: { width: '100%', maxWidth: 420, backgroundColor: '#FFF', borderRadius: SIZES.radius, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 14, color: COLORS.textDark, marginBottom: 20 },
  starsRow: { alignItems: 'center', marginBottom: 10 },
  ratingValue: { textAlign: 'center', fontSize: 14, color: COLORS.textLight, marginBottom: 20 },
  errorText: { color: '#D32F2F', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
