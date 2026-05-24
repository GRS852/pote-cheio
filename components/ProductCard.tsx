import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

// Enviar String (URL da imagem)
export interface ProductCardProps {
  title: string;
  location: string;
  condition: 'Novo' | 'Usado'; 
  imageUrl: string; 
  onPress: () => void;
}

export default function ProductCard({ title, location, condition, imageUrl, onPress }: ProductCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      
      {/* { uri: string } para links da internet */}
      <Image 
        source={{ uri: imageUrl }} 
        style={styles.image} 
        resizeMode="cover" 
      />
      
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        
        <View style={styles.footer}>
          <View style={styles.locationContainer}>
            <FontAwesome name="map-marker" size={12} color={COLORS.textLight} />
            <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
          </View>
          
          <View style={[styles.conditionPill, { backgroundColor: COLORS.secondary }]}>
            <Text style={styles.conditionText}>{condition}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    // TAMANHO FIXO para funcionar no carrossel horizontal
    width: 220, 
    marginRight: 16, // Espaçamento entre os cards no carrossel
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 2, 
    overflow: 'hidden' 
  },
  image: { 
    width: '100%', 
    aspectRatio: 1, 
    backgroundColor: COLORS.border 
  },
  infoContainer: { padding: 12 },
  title: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 10, minHeight: 34 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locationContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 5 },
  locationText: { fontSize: 12, color: COLORS.textLight, marginLeft: 4 },
  conditionPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  conditionText: { fontSize: 10, color: '#FFF', fontWeight: 'bold' }
});