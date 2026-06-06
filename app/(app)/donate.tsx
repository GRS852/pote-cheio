import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Button from '../../components/Button';
import MainHeader from '../../components/MainHeader';
import { COLORS, SIZES } from '../../constants/theme';
import { useAuth } from '../../services/AuthContext';
import { Category, createDonationRequest } from '../../services/donationService';

const CATEGORIES: Category[] = ['Coleiras', 'Rações', 'Higiene'];

export default function DonateScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Coleiras');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { setError('Permissão para acessar a galeria foi negada.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) { setPhotoUri(result.assets[0].uri); setError(''); }
  }

  async function handleSubmit() {
    setError('');
    if (!title.trim()) return setError('Informe o título do item.');
    if (!description.trim()) return setError('Adicione uma descrição.');
    if (!token) return setError('Sessão expirada. Faça login novamente.');

    setLoading(true);
    try {
      await createDonationRequest(token, {
        title,
        category,
        description,
        photo_url: photoUri,
        quantity: quantity ? Number(quantity) : null,
      });
      router.replace('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível publicar a doação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <MainHeader />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.banner}>
          <View style={styles.bannerInner}>
            <Text style={styles.bannerTitle}>Criar doação</Text>
            <Text style={styles.bannerSubtitle}>Compartilhe itens que podem fazer a diferença na vida de um pet</Text>
          </View>
        </View>

        <View style={styles.contentWrapper}>
          <View style={styles.card}>

            <Text style={styles.label}>Foto do item</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage} activeOpacity={0.8}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.imagePreview} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <FontAwesome name="camera" size={32} color={COLORS.textLight} />
                  <Text style={styles.imagePlaceholderText}>Toque para adicionar uma foto</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>Título do item</Text>
            <TextInput style={styles.input} placeholder="Ex: Coleira vermelha tamanho M" placeholderTextColor={COLORS.textDark} value={title} onChangeText={setTitle} />

            <Text style={styles.label}>Categoria</Text>
            <View style={styles.pillRow}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity key={cat} style={[styles.pill, category === cat && styles.pillActive]} onPress={() => setCategory(cat)} activeOpacity={0.8}>
                  <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Quantidade (opcional)</Text>
            <TextInput style={styles.input} placeholder="Ex: 2" placeholderTextColor={COLORS.textDark} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />

            <Text style={styles.label}>Descrição</Text>
            <TextInput style={[styles.input, styles.textarea]} placeholder="Descreva o estado do item, tamanho, observações..." placeholderTextColor={COLORS.textDark} value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button title="Publicar doação" onPress={handleSubmit} loading={loading} />
            <Button title="Cancelar" onPress={() => router.back()} variant="outline" />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.backgroundGray },
  scrollContainer: { flexGrow: 1, paddingBottom: 60 },
  banner: { backgroundColor: COLORS.primary, paddingVertical: 30, paddingHorizontal: 20 },
  bannerInner: { width: '100%', maxWidth: 1200, alignSelf: 'center' },
  bannerTitle: { color: '#FFF', fontSize: 26, fontWeight: 'bold', marginBottom: 6 },
  bannerSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 16 },
  contentWrapper: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 30, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  label: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: COLORS.inputBackground, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#000', marginBottom: 16 },
  textarea: { height: 110, paddingTop: 14 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  pill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFF' },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { color: COLORS.textDark, fontWeight: '600', fontSize: 14 },
  pillTextActive: { color: '#FFF' },
  imagePicker: { borderRadius: SIZES.radius, borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed', marginBottom: 16, overflow: 'hidden' },
  imagePlaceholder: { height: 180, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: COLORS.inputBackground },
  imagePlaceholderText: { color: COLORS.textLight, fontSize: 14 },
  imagePreview: { width: '100%', height: 220 },
  errorText: { color: '#C0392B', fontSize: 14, marginBottom: 12, textAlign: 'center' },
});
