import { FontAwesome } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import AuthHeader from '../../components/AuthHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { COLORS } from '../../constants/theme';
import { AccountBannedError, AccountDisabledError, AuthError, GoogleAccountError, NetworkError } from '../../services/authService';
import { useAuth } from '../../services/AuthContext';

WebBrowser.maybeCompleteAuthSession();

// ID do cliente OAuth do Google (público). Pode ser trocado pela variável de build.
const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || '172922092574-mq3dutbto5dlqjummop19p57g70j54ab.apps.googleusercontent.com';

// Mensagem de erro do login (senha ou Google) para a pessoa
function loginErrorMessage(err: unknown, authFallback: string): string {
  if (err instanceof NetworkError) return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
  if (err instanceof AccountDisabledError) return 'Esta conta foi desativada. Entre em contato com o suporte se acredita que isso é um engano.';
  if (err instanceof AccountBannedError) return `Sua conta está temporariamente banida até ${new Date(err.bannedUntil).toLocaleString('pt-BR')}.`;
  if (err instanceof GoogleAccountError) return err.message;
  if (err instanceof AuthError) return authFallback;
  return err instanceof Error ? err.message : String(err);
}

export default function LoginScreen() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { signIn, signInWithGoogle } = useAuth();

  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID,
    responseType: AuthSession.ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'],
    // O Google devolve o pop-up para /login, que é onde maybeCompleteAuthSession()
    // roda e entrega o token para a janela principal (cadastrar no Google Console)
    redirectUri: AuthSession.makeRedirectUri({ path: 'login' }),
  });

  useEffect(() => {
    if (googleResponse?.type !== 'success') return;
    const idToken = googleResponse.authentication?.idToken ?? (googleResponse.params as any)?.id_token;
    if (!idToken) return;
    (async () => {
      setError('');
      setGoogleLoading(true);
      try {
        await signInWithGoogle(idToken);
      } catch (err) {
        setError(loginErrorMessage(err, 'Não foi possível validar sua conta Google. Tente novamente.'));
      } finally {
        setGoogleLoading(false);
      }
    })();
  }, [googleResponse]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setError('Preencha o e-mail e a senha.');
      return;
    }
    try {
      setIsSubmitting(true);
      await signIn(form.email, form.password);
      // O RouteGuard detecta isAuthenticated = true e redireciona para /(app)/home automaticamente
    } catch (err) {
      setError(loginErrorMessage(err, 'E-mail ou senha inválidos. Tente novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.mainContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Head><title>Entrar | Pote Cheio</title></Head>
      <AuthHeader activeTab="Entrar" />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={[styles.contentWrapper, { flexDirection: isDesktop ? 'row' : 'column' }]}>
          
          {isDesktop && (
            <View style={styles.bannerContainer}>
              <Image source={require('../../assets/images/logo_texto.png')} style={styles.mainLogo} resizeMode="contain" />
            </View>
          )}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Bem-vindo de volta</Text>
            <Text style={styles.subtitle}>Entre na sua conta e continue fazendo a diferença!</Text>

            <Input label="Email" placeholder="seu@email.com" value={form.email} onChangeText={(text) => handleChange('email', text)} />
            <Input label="Senha" placeholder="*******" secureTextEntry value={form.password} onChangeText={(text) => handleChange('password', text)} />
            
            <View style={styles.forgotPasswordContainer}>
              <Link href="/recover" style={styles.forgotPasswordText}>Esqueci minha senha</Link>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Button title="Entrar" onPress={handleLogin} loading={isSubmitting} disabled={isSubmitting} />

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.divider} />
            </View>

            <Button
              title="Entrar com Google"
              variant="outline"
              icon={<FontAwesome name="google" size={22} color="#DB4437" />}
              onPress={() => promptGoogleAsync()}
              loading={googleLoading}
              disabled={!googleRequest || googleLoading}
            />

            <Text style={styles.registerText}>
              Novo no Pote Cheio? <Link href="/register" style={styles.registerLink}>Cadastre-se</Link>
            </Text>
            
            <Text style={styles.termsText}>
              Ao se inscrever, você concorda com os <Link href={"/terms" as any} style={styles.linkText}>termos de serviço</Link> e a <Text style={styles.linkText}>Política de Privacidade</Text>
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
  title: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.textDark, marginBottom: 24 },
  forgotPasswordContainer: { alignItems: 'flex-end', marginBottom: 20 },
  forgotPasswordText: { color: '#000', fontSize: 14 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: 10, color: COLORS.textLight },
  registerText: { textAlign: 'center', marginTop: 24, fontSize: 16 },
  registerLink: { color: COLORS.secondary, fontWeight: 'bold' },
  termsText: { textAlign: 'center', marginTop: 16, fontSize: 12, color: COLORS.textDark },
  linkText: { color: COLORS.secondary },
  errorText: { color: '#D32F2F', fontSize: 14, textAlign: 'center', marginBottom: 4 },
});