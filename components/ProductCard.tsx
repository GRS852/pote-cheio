import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/theme';

export interface ProductCardProps {
  title: string;
  category: string;
  imageUrl: string | null;
  onPress: () => void;
  location?: string;
  in_wishlist?: boolean;
}

export default function ProductCard({ title, category, imageUrl, onPress, location, in_wishlist }: ProductCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageWrapper}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <FontAwesome name="image" size={32} color={COLORS.textLight} />
          </View>
        )}
        {in_wishlist && (
          <View style={styles.wishlistBadge}>
            <FontAwesome name="heart" size={12} color="#FFF" />
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>

        <View style={styles.footer}>
          {location ? (
            <View style={styles.locationContainer}>
              <FontAwesome name="map-marker" size={12} color={COLORS.textLight} />
              <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{category}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 12, width: 220, marginRight: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, overflow: 'hidden' },
  imageWrapper: { position: 'relative' },
  image: { width: '100%', aspectRatio: 1, backgroundColor: COLORS.border },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  wishlistBadge: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  infoContainer: { padding: 12 },
  title: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 10, minHeight: 34 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locationContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 5 },
  locationText: { fontSize: 12, color: COLORS.textLight, marginLeft: 4 },
  categoryPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: COLORS.secondary },
  categoryText: { fontSize: 10, color: '#FFF', fontWeight: 'bold' },
});
