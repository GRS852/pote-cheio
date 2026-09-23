import { FontAwesome } from '@expo/vector-icons';
import Head from 'expo-router/head';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import Input from '../../components/Input';
import { COLORS, SIZES } from '../../constants/theme';
import { useAdminAuth } from '../../services/AdminAuthContext';

export default function AdminLoginScreen() {
  const { adminSignIn } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError('Preencha o e-mail e a senha.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await adminSignIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Head><title>Login administrativo | Pote Cheio</title></Head>
      <View style={styles.box}>
        <View style={styles.logoRow}>
          <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>
            <Text style={{ color: COLORS.primary }}>Pote</Text> <Text style={{ color: COLORS.secondary }}>Cheio</Text>
          </Text>
        </View>
        <View style={styles.badgeRow}>
          <FontAwesome name="shield" size={14} color={COLORS.textDark} />
          <Text style={styles.badgeText}>Painel do Administrador</Text>
        </View>

        <Input label="E-mail" placeholder="admin@potecheio.site" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Input label="Senha" placeholder="*******" secureTextEntry value={password} onChangeText={setPassword} />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button title="Entrar" onPress={handleLogin} loading={isSubmitting} disabled={isSubmitting} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundGray, justifyContent: 'center', alignItems: 'center', padding: 20 },
  box: { width: '100%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: SIZES.radius, padding: 28 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 },
  logo: { width: 36, height: 36 },
  title: { fontSize: 22, fontWeight: 'bold' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24 },
  badgeText: { fontSize: 13, color: COLORS.textDark, fontWeight: '600' },
  errorText: { color: '#D32F2F', fontSize: 14, textAlign: 'center', marginBottom: 4 },
});
