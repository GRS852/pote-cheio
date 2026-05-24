import { FontAwesome } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import AuthHeader from '../../components/AuthHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { COLORS } from '../../constants/theme';

export default function LoginScreen() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768; 

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <KeyboardAvoidingView style={styles.mainContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <AuthHeader activeTab="Entrar" />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={[styles.contentWrapper, { flexDirection: isDesktop ? 'row' : 'column' }]}>
          
          {isDesktop && (
            <View style={styles.bannerContainer}>
              <Image source={require('../../assets/images/logo_texto.png')} style={styles.mainLogo} resizeMode="contain" />
            </View>
          )}
          <View style={styles.formContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Bem-vindo de volta</Text>
              <Image source={require('../../assets/images/emoji.png')} style={styles.emoji} />
            </View>
            <Text style={styles.subtitle}>Entre na sua conta e continue fazendo a diferença!</Text>

            <Input label="Email" placeholder="seu@email.com" value={form.email} onChangeText={(text) => handleChange('email', text)} />
            <Input label="Senha" placeholder="*******" secureTextEntry value={form.password} onChangeText={(text) => handleChange('password', text)} />
            
            <View style={styles.forgotPasswordContainer}>
              <Link href="/recover" style={styles.forgotPasswordText}>Esqueci minha senha</Link>
            </View>

            <Button title="Entrar" onPress={() => console.log('Login Form:', form)} />

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialRow}>
              <View style={styles.socialButtonWrapper}>
                <Button title="Facebook" variant="outline" icon={<FontAwesome name="facebook" size={24} color="#1877F2" />} onPress={() => {}} />
              </View>
              <View style={styles.socialButtonWrapper}>
                <Button title="Google" variant="outline" icon={<FontAwesome name="google" size={24} color="#DB4437" />} onPress={() => {}} />
              </View>
            </View>

            <Text style={styles.registerText}>
              Novo no Pote Cheio? <Link href="/register" style={styles.registerLink}>Cadastre-se</Link>
            </Text>
            
            <Text style={styles.termsText}>
              Ao se inscrever, você concorda com os <Text style={styles.linkText}>termos de serviço</Text> e a <Text style={styles.linkText}>Política de Privacidade</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background },
  scrollContainer: { flexGrow: 1 },
  contentWrapper: { 
    flex: 1, 
    width: '100%', 
    maxWidth: 1000, 
    alignSelf: 'center', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 20, 
    gap: 40 
  },
  bannerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mainLogo: { width: '100%', maxWidth: 400, height: 400 },
  formContainer: { flex: 1, width: '100%', maxWidth: 450, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  emoji: { width: 28, height: 28, marginLeft: 8 },
  subtitle: { fontSize: 16, color: COLORS.textDark, marginBottom: 24 },
  forgotPasswordContainer: { alignItems: 'flex-end', marginBottom: 20 },
  forgotPasswordText: { color: '#000', fontSize: 14 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: 10, color: COLORS.textLight },
  socialRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  socialButtonWrapper: { flex: 1 },
  registerText: { textAlign: 'center', marginTop: 24, fontSize: 16 },
  registerLink: { color: COLORS.secondary, fontWeight: 'bold' },
  termsText: { textAlign: 'center', marginTop: 16, fontSize: 12, color: COLORS.textDark },
  linkText: { color: COLORS.secondary }
});