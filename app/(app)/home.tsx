import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import ChatWidget from '../../components/ChatWidget';
import MainHeader from '../../components/MainHeader';
import ProductCard from '../../components/ProductCard';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../services/AuthContext';
import { FeedDonation, getFeedRequest } from '../../services/feedService';

type FilterType = 'Todos' | 'Coleiras' | 'Rações' | 'Higiene';

const CATEGORIES = [
  { id: '1', name: 'Todos' as FilterType },
  { id: '2', name: 'Coleiras' as FilterType, icon: require('../../assets/images/coleiras.png') },
  { id: '3', name: 'Rações' as FilterType,   icon: require('../../assets/images/racoes.png')  },
  { id: '4', name: 'Higiene' as FilterType,  icon: require('../../assets/images/higiene.png') },
];

function groupByCategory(donations: FeedDonation[]): Record<string, FeedDonation[]> {
  return donations.reduce<Record<string, FeedDonation[]>>((acc, d) => {
    (acc[d.category] = acc[d.category] ?? []).push(d);
    return acc;
  }, {});
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterType>('Todos');
  const [donations, setDonations] = useState<FeedDonation[]>([]);
  const [loading, setLoading] = useState(true);

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Visitante';

  const loadFeed = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getFeedRequest(token, {
        category: activeFilter !== 'Todos' ? activeFilter : undefined,
        limit: 20,
      });
      setDonations(res.donations);
    } catch {
      setDonations([]);
    } finally {
      setLoading(false);
    }
  }, [token, activeFilter]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const grouped = groupByCategory(donations);
  const sections =
    activeFilter === 'Todos'
      ? Object.entries(grouped)
      : [[activeFilter, grouped[activeFilter] ?? []] as [string, FeedDonation[]]];

  const categoryIcons: Record<string, any> = {
    Coleiras: require('../../assets/images/coleiras.png'),
    Rações:   require('../../assets/images/racoes.png'),
    Higiene:  require('../../assets/images/higiene.png'),
  };

  return (
    <View style={styles.mainContainer}>
      <MainHeader />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

        <View style={styles.banner}>
          <View style={styles.bannerInner}>
            <Text style={styles.bannerGreeting}>Olá, {firstName}</Text>
            <Text style={styles.bannerTitle}>O que você procura hoje?</Text>
            <Text style={styles.bannerSubtitle}>Encontre doações perto de você e faça parte dessa corrente do bem</Text>
          </View>
        </View>

        <View style={styles.filtersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScrollContent}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterPill, activeFilter === cat.name && styles.filterPillActive]}
                onPress={() => setActiveFilter(cat.name)}
              >
                {'icon' in cat && <Image source={cat.icon} style={styles.filterIcon} />}
                <Text style={[styles.filterText, activeFilter === cat.name && styles.filterTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.contentWrapper}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : sections.length === 0 || sections.every(([, items]) => items.length === 0) ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma doação encontrada.</Text>
            </View>
          ) : (
            sections.map(([category, items]) =>
              items.length === 0 ? null : (
                <View key={category} style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    {categoryIcons[category] && (
                      <Image source={categoryIcons[category]} style={styles.sectionIcon} />
                    )}
                    <Text style={styles.sectionTitle}>Doações {category}</Text>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
                    {items.map(donation => (
                      <ProductCard
                        key={donation.id}
                        title={donation.title}
                        category={donation.category}
                        imageUrl={donation.photo_url}
                        in_wishlist={donation.in_wishlist}
                        onPress={() => router.push({ pathname: '/product', params: { id: String(donation.id) } })}
                      />
                    ))}
                  </ScrollView>
                </View>
              )
            )
          )}
        </View>
      </ScrollView>

      <ChatWidget />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.backgroundGray },
  scrollContainer: { flexGrow: 1, paddingBottom: 60 },
  banner: { backgroundColor: COLORS.primary, paddingVertical: 30, paddingHorizontal: 20 },
  bannerInner: { width: '100%', maxWidth: 1200, alignSelf: 'center' },
  bannerGreeting: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 4 },
  bannerTitle: { color: '#FFF', fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
  bannerSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 16 },
  filtersWrapper: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filtersScrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  filterPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFF' },
  filterPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterIcon: { width: 16, height: 16, marginRight: 6, resizeMode: 'contain' },
  filterText: { color: COLORS.textDark, fontWeight: '600' },
  filterTextActive: { color: '#FFF' },
  contentWrapper: { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingVertical: 10 },
  loadingContainer: { padding: 60, alignItems: 'center' },
  emptyContainer: { padding: 60, alignItems: 'center' },
  emptyText: { fontSize: 16, color: COLORS.textLight },
  sectionContainer: { marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16, marginTop: 10 },
  sectionIcon: { width: 20, height: 20, marginRight: 10, resizeMode: 'contain' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  carouselContent: { paddingHorizontal: 20, paddingBottom: 10 },
});
