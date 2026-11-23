import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS } from '../constants/theme';
import { LEGAL_UPDATED_AT, LegalSection } from '../constants/legal';
import AuthHeader from './AuthHeader';

// Layout comum dos Termos de Uso e da Política de Privacidade
export default function LegalPage({ title, intro, sections }: { title: string; intro?: string; sections: LegalSection[] }) {
  const router = useRouter();

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <View style={styles.mainContainer}>
      <Head><title>{`${title} | Pote Cheio`}</title></Head>
      <AuthHeader />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.updated}>Última atualização: {LEGAL_UPDATED_AT}</Text>

          <View style={styles.card}>
            {intro ? <Text style={styles.paragraph}>{intro}</Text> : null}
            {sections.map(section => (
              <View key={section.title}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.paragraphs?.map((p, i) => <Text key={`p${i}`} style={styles.paragraph}>{p}</Text>)}
                {section.bullets?.map((b, i) => (
                  <View key={`b${i}`} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={[styles.paragraph, styles.bulletText]}>{b}</Text>
                  </View>
                ))}
                {section.after?.map((p, i) => <Text key={`a${i}`} style={[styles.paragraph, styles.after]}>{p}</Text>)}
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.7}>
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
  contentWrapper: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000', marginTop: 20, textAlign: 'center' },
  updated: { fontSize: 13, color: COLORS.textDark, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginTop: 18, marginBottom: 6 },
  paragraph: { fontSize: 14, color: COLORS.textDark, lineHeight: 21 },
  bulletRow: { flexDirection: 'row', marginTop: 4, paddingRight: 4 },
  bulletDot: { width: 16, fontSize: 14, lineHeight: 21, color: COLORS.secondary, fontWeight: 'bold' },
  bulletText: { flex: 1 },
  after: { marginTop: 8 },
  backButton: { marginTop: 24, alignItems: 'center', paddingVertical: 12 },
  backButtonText: { fontSize: 16, color: COLORS.secondary, fontWeight: 'bold' },
});
