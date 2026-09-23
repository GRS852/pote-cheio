import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AuthHeader from '../../components/AuthHeader';
import { COLORS } from '../../constants/theme';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <View style={styles.mainContainer}>
      <Head><title>Termos de serviço | Pote Cheio</title></Head>
      <AuthHeader />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>Termos de serviço</Text>

          <View style={styles.card}>
            <Text style={styles.paragraph}>
              O Pote Cheio é uma plataforma que conecta pessoas que desejam doar itens para pets a pessoas
              interessadas em recebê-los. Ao usar a plataforma, você concorda com os termos abaixo.
            </Text>

            <Text style={styles.sectionTitle}>1. Papel da plataforma</Text>
            <Text style={styles.paragraph}>
              O Pote Cheio apenas intermedia o contato entre doadores e interessados. A combinação de local,
              forma e data de entrega ou retirada dos itens é de responsabilidade exclusiva das partes envolvidas.
            </Text>

            <Text style={styles.sectionTitle}>2. Responsabilidade sobre a entrega</Text>
            <Text style={styles.paragraph}>
              A plataforma não se responsabiliza pela entrega, transporte, qualidade, integridade ou pelo não
              comparecimento de qualquer uma das partes na combinação feita entre doador e interessado.
            </Text>

            <Text style={styles.sectionTitle}>3. Conduta dos usuários</Text>
            <Text style={styles.paragraph}>
              Espera-se que doadores publiquem informações verdadeiras sobre os itens oferecidos e que
              interessados ajam de boa-fé ao demonstrar interesse em uma doação.
            </Text>

            <Text style={styles.sectionTitle}>4. Privacidade</Text>
            <Text style={styles.paragraph}>
              Os dados de cadastro são usados apenas para o funcionamento da plataforma, como autenticação,
              contato entre usuários e exibição do perfil.
            </Text>
          </View>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.backgroundGray },
  scrollContainer: { flexGrow: 1, paddingBottom: 40 },
  contentWrapper: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000', marginTop: 20, marginBottom: 20, textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginTop: 16, marginBottom: 6 },
  paragraph: { fontSize: 14, color: COLORS.textDark, lineHeight: 20 },
  backButton: { marginTop: 24, alignItems: 'center', paddingVertical: 12 },
  backButtonText: { fontSize: 16, color: COLORS.secondary, fontWeight: 'bold' },
});
