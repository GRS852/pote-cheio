import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Modal, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

import { COLORS } from '../constants/theme';

interface ImageCarouselProps {
  photos: string[];
  imageStyle: StyleProp<ViewStyle>;
}

function cycle(index: number, total: number): number {
  return ((index % total) + total) % total;
}

export default function ImageCarousel({ photos, imageStyle }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <View style={[imageStyle, styles.placeholder]}>
        <FontAwesome name="image" size={48} color={COLORS.textLight} />
      </View>
    );
  }

  const hasMultiple = photos.length > 1;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => { setModalIndex(activeIndex); setFullscreen(true); }}
        style={imageStyle}
      >
        <Image source={{ uri: photos[activeIndex] }} style={StyleSheet.absoluteFill} resizeMode="cover" />

        {hasMultiple && (
          <>
            <TouchableOpacity
              style={[styles.arrow, styles.arrowLeft]}
              onPress={() => setActiveIndex(i => cycle(i - 1, photos.length))}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="chevron-left" size={14} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.arrow, styles.arrowRight]}
              onPress={() => setActiveIndex(i => cycle(i + 1, photos.length))}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="chevron-right" size={14} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.counterBadge}>
              <FontAwesome name="clone" size={11} color="#FFF" />
            </View>
          </>
        )}
      </TouchableOpacity>

      {hasMultiple && (
        <View style={styles.dots}>
          {photos.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setActiveIndex(i)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <View style={[styles.dot, i === activeIndex && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Modal visible={fullscreen} transparent animationType="fade" onRequestClose={() => setFullscreen(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setFullscreen(false)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <FontAwesome name="close" size={26} color="#FFF" />
          </TouchableOpacity>

          <Image source={{ uri: photos[modalIndex] }} style={styles.modalImage} resizeMode="contain" />

          {hasMultiple && (
            <>
              <TouchableOpacity
                style={[styles.modalArrow, styles.modalArrowLeft]}
                onPress={() => setModalIndex(i => cycle(i - 1, photos.length))}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              >
                <FontAwesome name="chevron-left" size={22} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalArrow, styles.modalArrowRight]}
                onPress={() => setModalIndex(i => cycle(i + 1, photos.length))}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              >
                <FontAwesome name="chevron-right" size={22} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.modalDots}>
                {photos.map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => setModalIndex(i)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <View style={[styles.dot, i === modalIndex && styles.dotActive]} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowLeft: { left: 10 },
  arrowRight: { right: 10 },
  counterBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.primary, width: 20 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 40, right: 24, zIndex: 2 },
  modalImage: { width: '90%', height: '80%' },
  modalArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalArrowLeft: { left: 20 },
  modalArrowRight: { right: 20 },
  modalDots: { position: 'absolute', bottom: 30, flexDirection: 'row', gap: 8 },
});
