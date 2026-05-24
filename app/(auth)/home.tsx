import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import MainHeader from '../../components/MainHeader';
import ProductCard from '../../components/ProductCard';
import ChatWidget from '../../components/ChatWidget';
import { COLORS } from '../../constants/theme';

type FilterType = 'Todos' | 'Coleiras' | 'Rações' | 'Higiene';

const CATEGORIES = [
  { id: '1', name: 'Todos' },
  { id: '2', name: 'Coleiras', icon: require('../../assets/images/coleiras.png') },
  { id: '3', name: 'Rações',   icon: require('../../assets/images/racoes.png')  },
  { id: '4', name: 'Higiene',  icon: require('../../assets/images/higiene.png') },
];

// =====================================================================
// (integração para o Back-end)
// =====================================================================
const useAuth = () => {
  return {
    user: {
      name: "Wanessa Nunes", // O banco manda o nome do usuário logado
      avatarUrl: null, 
    }
  };
};

// =====================================================================
// MOCK DATA: Estrutura JSON preparada para (Leitura - GET)
// =====================================================================
const MOCK_DB_SECTIONS = [
  {
    category: 'Coleiras',
    title: 'Doações Coleiras',
    icon: require('../../assets/images/coleiras.png'),
    products: [
      { id: 'c1', title: 'Coleira vermelha tamanho 12', location: 'Sp centro',      condition: 'Usado' as const, imageUrl: 'https://photos.enjoei.com.br/coleira-para-cao-tamanho-grande-98635891/800x800/czM6Ly9waG90b3MuZW5qb2VpLmNvbS5ici9wcm9kdWN0cy8xODUzMDg5NS8zNTQ2ZTk2NmRkODUxMmIzYjY5YTBhZjhiYjE0YjQ2ZS5qcGc' },
      { id: 'c2', title: 'Coleira preta de couro',      location: 'Guarulhos - sp', condition: 'Usado' as const, imageUrl: 'https://photos.enjoei.com.br/public/300x300/czM6Ly9waG90b3MuZW5qb2VpLmNvbS5ici9wcm9kdWN0cy8xMTYyNjc3NS9mNzZhMTAyYTI4MWIwMTEwMDQ1NGJjNTNhOGMwNzI3Zi5qcGc' },
      { id: 'c3', title: 'Coleira azul tamanho 10',     location: 'Santos',         condition: 'Novo'  as const, imageUrl: 'https://photos.enjoei.com.br/coleira-pescoco-azul-com-laranja-meu-auau-92549493/800x800/czM6Ly9waG90b3MuZW5qb2VpLmNvbS5ici9wcm9kdWN0cy84NDI5MjE1LzVlNDRiZDFjY2M0ZDcxMzRmM2FhY2UyNTlmNmIyMTdlLmpwZw' },
    ]
  },
  {
    category: 'Rações',
    title: 'Doações Rações',
    icon: require('../../assets/images/racoes.png'),
    products: [
      { id: 'r1', title: 'Ração Golden 1kg',  location: 'Sp centro',   condition: 'Novo' as const, imageUrl: 'https://m.magazineluiza.com.br/a-static/420x420/racao-golden-formula-filhotes-frango-e-arroz-15-kg-premier/animavida/974283bc8f6311ec896f4201ac185055/12dc34f63997865f25149d7888f5fd23.jpeg' },
      { id: 'r2', title: 'Ração Optimum 2kg', location: 'São Caetano', condition: 'Novo' as const, imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRs1MIBGUvz0p38ldqm7JReO7yXEQz2sgsd7w&s' },
    ]
  },
  {
    category: 'Higiene',
    title: 'Doações Higiene',
    icon: require('../../assets/images/higiene.png'),
    products: [
      { id: 'h1', title: 'Shampoo Neutro Pet Clean', location: 'Sp centro', condition: 'Novo' as const, imageUrl: 'https://petcleanbrasil.com.br/wp-content/uploads/2022/10/shampoo-neutro-para-caes-e-gatos-pet-clean-700-ml.jpg' },
    ]
  }
];

function getFilteredSections(activeFilter: FilterType) {
  if (activeFilter === 'Todos') return MOCK_DB_SECTIONS;
  return MOCK_DB_SECTIONS.filter(section => section.category === activeFilter);
}

export default function HomeScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>('Todos');

  // Consome os dados do usuário logado (integração com o Back-end)
  const { user } = useAuth();
  
  // Extrai apenas o primeiro nome 
  const firstName = user?.name ? user.name.split(' ')[0] : 'Visitante';

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
              <TouchableOpacity key={cat.id} style={[styles.filterPill, activeFilter === cat.name && styles.filterPillActive]} onPress={() => setActiveFilter(cat.name as FilterType)}>
                {'icon' in cat && <Image source={cat.icon} style={styles.filterIcon} />}
                <Text style={[styles.filterText, activeFilter === cat.name && styles.filterTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.contentWrapper}>
          {getFilteredSections(activeFilter).map(section => (
            <View key={section.category} style={styles.sectionContainer}>
              
              <View style={styles.sectionHeader}>
                <Image source={section.icon} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContentContainer}>
                {section.products.map(product => (
                  <ProductCard
                    key={product.id}
                    title={product.title}
                    location={product.location}
                    condition={product.condition}
                    imageUrl={product.imageUrl}
                    onPress={() => router.push('/product')}
                  />
                ))}
              </ScrollView>
            </View>
          ))}
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
  filtersWrapper: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  bannerInner: { width: '100%', maxWidth: 1200, alignSelf: 'center', marginHorizontal: 'auto' },
  bannerGreeting: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 4 },
  bannerTitle: { color: '#FFF', fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
  bannerSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 16 },
  filtersScrollContent: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    gap: 12 
  },
  
  filterPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFF' },
  filterPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterIcon: { width: 16, height: 16, marginRight: 6, resizeMode: 'contain' },
  filterText: { color: COLORS.textDark, fontWeight: '600' },
  filterTextActive: { color: '#FFF' },
  contentWrapper: { width: '100%', maxWidth: 1200, alignSelf: 'center', marginHorizontal: 'auto', paddingVertical: 10 },
  sectionContainer: { marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16, marginTop: 10 },
  sectionIcon: { width: 20, height: 20, marginRight: 10, resizeMode: 'contain' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  carouselContentContainer: { paddingHorizontal: 20, paddingBottom: 10 }
});