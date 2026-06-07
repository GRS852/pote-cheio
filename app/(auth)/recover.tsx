import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'react-native';

import AuthHeader from '../../components/AuthHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { COLORS } from '../../constants/theme';
import { forgotPasswordRequest, resetPasswordRequest, verifyResetCodeRequest } from '../../services/authService';

export default function RecoverScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', code: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  async function handleStep1() {
    if (!form.email.trim()) { setError('Informe seu e-mail.'); return; }
    setLoading(true);
    setError('');
    try {
      await forgotPasswordRequest(form.email.trim());
      setSuccess(`Código enviado para ${form.email}`);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível enviar o código.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2() {
    if (!form.code.trim()) { setError('Insira o código recebido.'); return; }
    setLoading(true);
    setError('');
    try {
      await verifyResetCodeRequest(form.email, form.code.trim());
      setSuccess('');
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStep3() {
    if (!form.newPassword || form.newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPasswordRequest(form.email, form.code, form.newPassword);
      router.replace('/login');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível redefinir a senha.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setLoading(true);
    setError('');
    try {
      await forgotPasswordRequest(form.email);
      setSuccess('Novo código enviado!');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao reenviar código.');
    } finally {
      setLoading(false);
    }
  }

  const renderProgressBar = () => (
    <View style={styles.progressRow}>
      <View style={[styles.progressLine, { backgroundColor: COLORS.secondary }]} />
      <View style={[styles.progressLine, { backgroundColor: step >= 2 ? COLORS.primary : COLORS.border }]} />
      <View style={[styles.progressLine, { backgroundColor: step === 3 ? COLORS.secondary : COLORS.border }]} />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.mainContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <AuthHeader />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.contentWrapper}>

          <View style={styles.topSection}>
            <Image source={require('../../assets/images/logo.png')} style={styles.centerLogo} resizeMode="contain" />
            <Text style={styles.title}>Recupere sua senha</Text>
            <Text style={styles.subtitle}>Siga os passos para redefinir sua senha</Text>
          </View>

          <View style={styles.card}>
            {renderProgressBar()}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}

            {step === 1 && (
              <>
                <Text style={styles.stepTitle}>Encontre sua conta</Text>
                <Text style={styles.stepSubtitle}>Informe o e-mail cadastrado</Text>
                <Input
                  placeholder="seu@email.com"
                  value={form.email}
                  onChangeText={t => handleChange('email', t)}
                  keyboardType="email-address"
                />
                {loading ? (
                  <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 12 }} />
                ) : (
                  <Button title="Enviar código" onPress={handleStep1} />
                )}
              </>
            )}

            {step === 2 && (
              <>
                <Text style={styles.stepTitle}>Confirme o código</Text>
                <Text style={styles.stepSubtitle}>Enviamos um código para {form.email}</Text>
                <Input
                  placeholder="Insira o código"
                  value={form.code}
                  onChangeText={t => handleChange('code', t)}
                  keyboardType="numeric"
                />
                {loading ? (
                  <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 12 }} />
                ) : (
                  <>
                    <Button title="Verificar código" onPress={handleStep2} />
                    <Button title="Reenviar código" variant="outline" onPress={handleResendCode} />
                  </>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <Text style={styles.stepTitle}>Nova senha</Text>
                <Text style={styles.stepSubtitle}>Escolha uma nova senha segura</Text>
                <Input
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry
                  value={form.newPassword}
                  onChangeText={t => handleChange('newPassword', t)}
                />
                {loading ? (
                  <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 12 }} />
                ) : (
                  <Button title="Redefinir senha" onPress={handleStep3} />
                )}
              </>
            )}
          </View>

          <Text style={styles.loginText}>
            Lembrou a senha? <Link href="/login" style={styles.loginLink}>Entrar</Link>
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
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 30 },
  progressLine: { flex: 1, height: 4, borderRadius: 2 },
  stepTitle: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 5 },
  stepSubtitle: { fontSize: 16, color: '#000', marginBottom: 20 },
  errorText: { color: '#C0392B', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  successText: { color: COLORS.primary, fontSize: 14, marginBottom: 12, textAlign: 'center', fontWeight: '600' },
  loginText: { marginTop: 24, fontSize: 16, color: COLORS.textDark },
  loginLink: { color: COLORS.primary, fontWeight: 'bold' },
});
