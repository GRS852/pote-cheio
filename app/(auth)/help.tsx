import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AuthHeader from '../../components/AuthHeader';
import { COLORS } from '../../constants/theme';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ: FaqItem[] = [
  {
    question: 'Como funciona o Pote Cheio?',
    answer:
      'Você pode publicar itens (rações, coleiras, produtos de higiene) para doar a outros tutores, ou navegar pelo feed e demonstrar interesse nas doações disponíveis.',
  },
  {
    question: 'Como faço uma doação?',
    answer:
      'Acesse "Quero doar", preencha o título, categoria e descrição do item e publique. Interessados poderão entrar em contato pelo chat.',
  },
  {
    question: 'Como recebo um item que quero?',
    answer:
      'Adicione o item aos favoritos e converse com o doador pelo chat. Quando ele confirmar a doação para você, o item passa para o status "Concluído".',
  },
  {
    question: 'A plataforma entrega os itens?',
    answer:
      'Não. O Pote Cheio conecta doadores e interessados, mas a combinação de entrega ou retirada é feita diretamente entre as partes.',
  },
  {
    question: 'Esqueci minha senha, e agora?',
    answer: 'Na tela de login, toque em "Esqueci minha senha" e siga os passos de recuperação por e-mail.',
  },
];

export default function HelpScreen() {
  const router = useRouter();

  return (
    <View style={styles.mainContainer}>
      <AuthHeader />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>Precisa de ajuda?</Text>
          <Text style={styles.subtitle}>Tire suas dúvidas sobre como usar o Pote Cheio</Text>

          <View style={styles.card}>
            {FAQ.map((item, index) => (
              <View key={item.question} style={[styles.faqItem, index === FAQ.length - 1 && styles.faqItemLast]}>
                <Text style={styles.question}>{item.question}</Text>
                <Text style={styles.answer}>{item.answer}</Text>
              </View>
            ))}
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>Ainda com dúvidas?</Text>
            <Text style={styles.contactText}>Fale com a gente pelo e-mail suporte@potecheio.site</Text>
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
  title: { fontSize: 28, fontWeight: 'bold', color: '#000', marginTop: 20, marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 16, color: COLORS.textDark, textAlign: 'center', marginBottom: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  faqItem: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 16 },
  faqItemLast: { borderBottomWidth: 0, paddingBottom: 0 },
  question: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  answer: { fontSize: 14, color: COLORS.textDark, lineHeight: 20 },
  contactCard: {
    backgroundColor: '#D1F0D9',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  contactTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
  contactText: { fontSize: 14, color: COLORS.primary },
  backButton: { marginTop: 24, alignItems: 'center', paddingVertical: 12 },
  backButtonText: { fontSize: 16, color: COLORS.secondary, fontWeight: 'bold' },
});
