import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import AuthHeader from '../../components/AuthHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { COLORS, SIZES } from '../../constants/theme';
import { useAuth } from '../../services/AuthContext';
import { ConflictError, NetworkError, ValidationError } from '../../services/authService';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ nome: '', dia: '', mes: '', ano: '', email: '', senha: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      const birthDate = `${form.ano}-${form.mes.padStart(2, '0')}-${form.dia.padStart(2, '0')}`;
      await signUp(form.nome, form.email, form.senha, birthDate);
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

            <Text style={styles.customLabel}>Data de nascimento</Text>
            <View style={styles.dateRow}>
              <TextInput style={styles.dateInput} placeholder="Dia" placeholderTextColor={COLORS.textDark} value={form.dia} onChangeText={(t) => handleChange('dia', t)} keyboardType="numeric" maxLength={2} />
              <TextInput style={[styles.dateInput, styles.middleInput]} placeholder="Mês" placeholderTextColor={COLORS.textDark} value={form.mes} onChangeText={(t) => handleChange('mes', t)} maxLength={2} />
              <TextInput style={styles.dateInput} placeholder="Ano" placeholderTextColor={COLORS.textDark} value={form.ano} onChangeText={(t) => handleChange('ano', t)} keyboardType="numeric" maxLength={4} />
            </View>

            <Input label="Email" placeholder="seu@email.com" value={form.email} onChangeText={(t) => handleChange('email', t)} />
            <Input label="Senha" placeholder="*******" secureTextEntry value={form.senha} onChangeText={(t) => handleChange('senha', t)} />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Button title="Continuar" onPress={handleRegister} loading={loading} />

            <Text style={styles.termsText}>
              Ao se inscrever, você concorda com os <Text style={styles.linkText}>termos de serviço</Text> e a <Text style={styles.linkText}>Política de Privacidade</Text>
            </Text>
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
  customLabel: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 8 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  dateInput: { flex: 1, minWidth: 0, backgroundColor: COLORS.inputBackground, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#000', textAlign: 'center' },
  middleInput: { marginHorizontal: 12 },
  termsText: { textAlign: 'center', marginTop: 20, fontSize: 12, color: '#000' },
  linkText: { color: COLORS.secondary },
  loginText: { marginTop: 24, fontSize: 16, color: COLORS.textDark },
  loginLink: { color: COLORS.primary, fontWeight: 'bold' },
  errorText: { color: 'red', fontSize: 14, marginBottom: 8, textAlign: 'center' }
});