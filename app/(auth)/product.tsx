import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  useWindowDimensions,
  DimensionValue,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import MainHeader from '../../components/MainHeader';
import Button from '../../components/Button';
import InfoBox from '../../components/InfoBox';
import ChatWidget from '../../components/ChatWidget';
import { COLORS } from '../../constants/theme';


// TYPES: Contrato de dados preparado para integração (GET /products/:id)


interface Donor {
  name: string;
  memberSince: string;
  city: string;
  donationCount: number;
}

interface ProductInfo {
  size: string;
  condition: 'Novo' | 'Usado';
  length: string;
}

interface Product {
  id: string;
  title: string;
  city: string;
  description: string;
  imageUrl: string;
  info: ProductInfo;
  donor: Donor;
}

// MOCK DATA: Estrutura JSON preparada para integração (Leitura - GET) 

const MOCK_DB_PRODUCT: Product = {
  id: 'c1',
  title: 'Coleira vermelha tamanho 12',
  city: 'São Paulo Centro',
  description:
    'Coleira unissex tamanho 12 na cor vermelha, em ótimo estado, bem conservada e lavada.',
  imageUrl:
    'https://photos.enjoei.com.br/coleira-para-cao-tamanho-grande-98635891/800x800/czM6Ly9waG90b3MuZW5qb2VpLmNvbS5ici9wcm9kdWN0cy8xODUzMDg5NS8zNTQ2ZTk2NmRkODUxMmIzYjY5YTBhZjhiYjE0YjQ2ZS5qcGc',
  info: {
    size: '12',
    condition: 'Usado',
    length: '40 cm',
  },
  donor: {
    name: 'Iara Santos',
    memberSince: '2023',
    city: 'São Paulo',
    donationCount: 20,
  },
};

interface SectionTitleProps {
  title: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title }) => (
  <Text style={styles.sectionTitle}>+ {title}</Text>
);

export default function ProductScreen() {
  const { width } = useWindowDimensions();
  const isDesktop: boolean = width >= 768;
  const router = useRouter();

  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const product: Product = MOCK_DB_PRODUCT;

  const imageMaxWidth: DimensionValue = isDesktop ? '50%' : '100%';

  return (
    <View style={styles.mainContainer}>
      <MainHeader />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.contentWrapper, { flexDirection: isDesktop ? 'row' : 'column' }]}>

          <View style={[styles.imageContainer, { maxWidth: imageMaxWidth }]}>
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.productTitle}>{product.title}</Text>

            <View style={styles.locationRow}>
              <FontAwesome name="map-marker" size={16} color={COLORS.textLight} />
              <Text style={styles.locationText}>{product.city}</Text>
            </View>

            <SectionTitle title="DESCRIÇÃO DO PRODUTO" />
            <Text style={styles.descriptionText}>{product.description}</Text>

            <SectionTitle title="INFORMAÇÕES DO PRODUTO" />
            <View style={styles.infoRow}>
              <InfoBox label="Tamanho"     value={product.info.size}      highlightValue />
              <InfoBox label="Condições"   value={product.info.condition} />
              <InfoBox label="Comprimento" value={product.info.length}    />
            </View>

            <View style={styles.actionButtons}>
              <Button
                title="Eu quero"
                icon={<FontAwesome name="heart-o" size={18} color="#FFF" />}
                onPress={() => setIsChatOpen(true)}
              />
              <Button
                title={isSaved ? 'Salvo' : 'Salvar para depois'}
                variant="outline"
                icon={
                  <FontAwesome
                    name={isSaved ? 'heart' : 'heart-o'}
                    size={18}
                    color={COLORS.primary}
                  />
                }
                onPress={() => setIsSaved(!isSaved)}
              />
            </View>

            <SectionTitle title="DOADOR" />

            <TouchableOpacity
              style={styles.donorCard}
              activeOpacity={0.8}
              onPress={() => router.push('/donor-profile')}
            >
              <View style={styles.donorAvatar}>
                <Text style={styles.donorAvatarLetter}>{product.donor.name[0]}</Text>
              </View>
              <View style={styles.donorInfo}>
                <Text style={styles.donorName}>{product.donor.name}</Text>
                <Text style={styles.donorSince}>
                  Membro desde {product.donor.memberSince}, {product.donor.city}
                </Text>
              </View>
              <View style={styles.donorStats}>
                <Text style={styles.donorCount}>{product.donor.donationCount}</Text>
                <Text style={styles.donorLabel}>Doações</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ChatWidget
        specificDonor={{
          name: product.donor.name,
          avatarLetter: product.donor.name[0],
        }}
        forceOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer:{ flex: 1, backgroundColor: COLORS.backgroundGray },
  scrollContainer:{ flexGrow: 1, paddingBottom: 60 },
  contentWrapper:{ flex: 1, width: '100%', maxWidth: 1100, alignSelf: 'center', padding: 30, gap: 40 },
  imageContainer:{ flex: 1 },
  productImage:{ width: '100%', aspectRatio: 1, borderRadius: 16, backgroundColor: '#CCC' },
  detailsContainer:{ flex: 1, justifyContent: 'flex-start' },
  productTitle:{ fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  locationRow:{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  locationText:{ fontSize: 14, color: COLORS.textLight, marginLeft: 8 },
  sectionTitle:{ fontSize: 16, fontWeight: 'bold', color: COLORS.secondary, marginTop: 20, marginBottom: 12, textTransform: 'uppercase' },
  descriptionText:{ fontSize: 16, color: COLORS.textDark, lineHeight: 24 },
  infoRow:{ flexDirection: 'row', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  actionButtons:{ gap: 12, marginBottom: 20 },
  donorCard:{ flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  donorAvatar:{ width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, marginRight: 16, alignItems: 'center', justifyContent: 'center' },
  donorAvatarLetter:{ fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  donorInfo:{ flex: 1 },
  donorName:{ fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  donorSince:{ fontSize: 12, color: COLORS.textLight },
  donorStats:{ alignItems: 'center', borderLeftWidth: 1, borderLeftColor: COLORS.border, paddingLeft: 16 },
  donorCount:{ fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  donorLabel:{ fontSize: 12, color: COLORS.textDark },
});