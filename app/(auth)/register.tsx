import { Link } from 'expo-router';
import Head from 'expo-router/head';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import AuthHeader from '../../components/AuthHeader';
import BirthDateFields from '../../components/BirthDateFields';
import Button from '../../components/Button';
import Input from '../../components/Input';
import TermsCheckbox from '../../components/TermsCheckbox';
import { COLORS } from '../../constants/theme';
import { birthDateError, buildBirthDate } from '../../services/age';
import { useAuth } from '../../services/AuthContext';
import { ConflictError, NetworkError, ValidationError } from '../../services/authService';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ nome: '', dia: '', mes: '', ano: '', email: '', senha: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleRegister = async () => {
    setError('');
    // Idade mínima conferida aqui e de novo na API
    const ageError = birthDateError(form);
    if (ageError) return setError(ageError);
    if (!acceptedTerms) return setError('É preciso aceitar os Termos de Uso e a Política de Privacidade.');
    setLoading(true);
    try {
      await signUp(form.nome, form.email, form.senha, buildBirthDate(form) as string, acceptedTerms);
    } catch (e) {
      if (e instanceof ConflictError) setError('Este email já está cadastrado.');
      else if (e instanceof ValidationError) setError(e.message);
      else if (e instanceof NetworkError) setError('Sem conexão com o servidor. Tente novamente.');
      else if (e instanceof Error) setError(e.message);
      else setError('Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.mainContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Head><title>Criar conta | Pote Cheio</title></Head>
      <AuthHeader activeTab="Cadastrar" />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.contentWrapper}>
          
          <View style={styles.topSection}>
            <Image source={require('../../assets/images/logo.png')} style={styles.centerLogo} resizeMode="contain" />
            <Text style={styles.title}>Crie sua conta</Text>
            <Text style={styles.subtitle}>Junte-se a milhares de Brasileiros que fazem a diferença</Text>
          </View>

          <View style={styles.card}>
            <Input label="Nome completo" placeholder="Insira seu nome completo" value={form.nome} onChangeText={(t) => handleChange('nome', t)} />

            <BirthDateFields value={form} onChange={b => setForm(prev => ({ ...prev, ...b }))} />

            <Input label="Email" placeholder="seu@email.com" value={form.email} onChangeText={(t) => handleChange('email', t)} />
            <Input label="Senha" placeholder="*******" secureTextEntry value={form.senha} onChangeText={(t) => handleChange('senha', t)} />

            <TermsCheckbox checked={acceptedTerms} onChange={setAcceptedTerms} />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Button title="Continuar" onPress={handleRegister} loading={loading} disabled={!acceptedTerms} />
          </View>

          <Text style={styles.loginText}>
            Já tem conta? <Link href="/login" style={styles.loginLink}>Entrar</Link>
          </Text>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.backgroundGray },
  scrollContainer: { flexGrow: 1, paddingBottom: 40 },
  contentWrapper: { alignItems: 'center', paddingTop: 30, paddingHorizontal: 20 },
  topSection: { alignItems: 'center', marginBottom: 20 },
  centerLogo: { height: 60, width: 60, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 5 },
  subtitle: { fontSize: 16, color: COLORS.textDark, textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', width: '100%', maxWidth: 480, borderRadius: 16, padding: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderWidth: 1, borderColor: COLORS.border },
  loginText: { marginTop: 24, fontSize: 16, color: COLORS.textDark },
  loginLink: { color: COLORS.primary, fontWeight: 'bold' },
  errorText: { color: 'red', fontSize: 14, marginBottom: 8, textAlign: 'center' }
});