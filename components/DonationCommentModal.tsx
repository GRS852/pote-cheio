import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { COLORS, SIZES } from '../constants/theme';

const MAX_PHOTOS = 3;

interface DonationCommentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (comment: string, photoUrls: string[]) => Promise<void>;
}

export default function DonationCommentModal({ visible, onClose, onSubmit }: DonationCommentModalProps) {
  const [comment, setComment] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setComment('');
    setPhotoUris([]);
    setError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handlePickImage() {
    if (photoUris.length >= MAX_PHOTOS) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { setError('Permissão para acessar a galeria foi negada.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) { setPhotoUris(prev => [...prev, result.assets[0].uri]); setError(''); }
  }

  function handleRemoveImage(index: number) {
    setPhotoUris(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!comment.trim()) { setError('Escreva um comentário antes de enviar.'); return; }
    setLoading(true);
    setError('');
    try {
      const photoUrls: string[] = [];
      for (const uri of photoUris) {
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const blob = await fetch(uri).then(r => r.blob());
        const uploadResponse = await fetch(
          `https://oguvupgbutzkudpeurgr.supabase.co/storage/v1/object/imagens-potecheio/${fileName}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
              'Content-Type': blob.type || 'image/jpeg',
            },
            body: blob,
          }
        );
        if (!uploadResponse.ok) {
          const err = await uploadResponse.json();
          throw new Error(err.message);
        }
        photoUrls.push(`https://oguvupgbutzkudpeurgr.supabase.co/storage/v1/object/public/imagens-potecheio/${fileName}`);
      }

      await onSubmit(comment.trim(), photoUrls);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o comentário.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity style={styles.box} activeOpacity={1} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Deixar comentário</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <FontAwesome name="close" size={20} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Conte como foi receber essa doação. Seu comentário fica visível no perfil do doador.</Text>

          <TextInput
            style={styles.textArea}
            placeholder="Ex: chegou tudo certinho e no prazo combinado!"
            placeholderTextColor={COLORS.textLight}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Fotos do que recebeu ({photoUris.length}/{MAX_PHOTOS})</Text>
          <View style={styles.photoRow}>
            {photoUris.map((uri, index) => (
              <View key={uri} style={styles.photoThumbWrapper}>
                <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.photoRemoveBtn}
                  onPress={() => handleRemoveImage(index)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <FontAwesome name="close" size={12} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
            {photoUris.length < MAX_PHOTOS && (
              <TouchableOpacity style={styles.photoAddTile} onPress={handlePickImage} activeOpacity={0.8}>
                <FontAwesome name="camera" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            )}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitBtn, (!comment.trim() || loading) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!comment.trim() || loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Enviar comentário</Text>}
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
  subtitle: { fontSize: 13, color: COLORS.textDark, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginTop: 14, marginBottom: 8 },
  textArea: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoThumbWrapper: { width: 64, height: 64, borderRadius: SIZES.radius, overflow: 'hidden', position: 'relative' },
  photoThumb: { width: '100%', height: '100%' },
  photoRemoveBtn: {
    position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
  },
  photoAddTile: {
    width: 64, height: 64, borderRadius: SIZES.radius, borderWidth: 1.5, borderColor: COLORS.border,
    borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.inputBackground,
  },
  errorText: { color: '#D32F2F', fontSize: 13, marginTop: 14, textAlign: 'center' },
  submitBtn: { marginTop: 18, backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
