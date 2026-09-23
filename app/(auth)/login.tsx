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
import { AccountBannedError, AccountDisabledError, AuthError, NetworkError } from '../../services/authService';
import { useAuth } from '../../services/AuthContext';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ?? '';
const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '';

const facebookDiscovery = {
  authorizationEndpoint: 'https://www.facebook.com/v19.0/dialog/oauth',
};

export default function LoginScreen() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [error, setError] = useState('');
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { signIn, signInWithGoogle, signInWithFacebook } = useAuth();

  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID,
    responseType: AuthSession.ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'],
  });

  const [facebookRequest, facebookResponse, promptFacebookAsync] = AuthSession.useAuthRequest(
    {
      clientId: FACEBOOK_APP_ID,
      scopes: ['public_profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      redirectUri: AuthSession.makeRedirectUri(),
    },
    facebookDiscovery
  );

  useEffect(() => {
    if (googleResponse?.type !== 'success') return;
    const idToken = googleResponse.authentication?.idToken ?? (googleResponse.params as any)?.id_token;
    if (!idToken) return;
    (async () => {
      setError('');
      setSocialLoading('google');
      try {
        await signInWithGoogle(idToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível entrar com Google.');
      } finally {
        setSocialLoading(null);
      }
    })();
  }, [googleResponse]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (facebookResponse?.type !== 'success') return;
    const accessToken = facebookResponse.authentication?.accessToken;
    if (!accessToken) return;
    (async () => {
      setError('');
      setSocialLoading('facebook');
      try {
        await signInWithFacebook(accessToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível entrar com Facebook.');
      } finally {
        setSocialLoading(null);
      }
    })();
  }, [facebookResponse]); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (err instanceof NetworkError) {
        setError('Não foi possível conectar ao servidor. Verifique sua conexão.');
      } else if (err instanceof AccountDisabledError) {
        setError('Esta conta foi desativada. Entre em contato com o suporte se acredita que isso é um engano.');
      } else if (err instanceof AccountBannedError) {
        const until = new Date(err.bannedUntil).toLocaleString('pt-BR');
        setError(`Sua conta está temporariamente banida até ${until}.`);
      } else if (err instanceof AuthError) {
        setError('E-mail ou senha inválidos. Tente novamente.');
      } else {
        // Erro inesperado: exibe a mensagem real para facilitar o diagnóstico
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Login] Erro inesperado:', msg);
        setError(`Erro inesperado: ${msg}`);
      }
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

            <View style={styles.socialRow}>
              <View style={styles.socialButtonWrapper}>
                <Button
                  title="Facebook"
                  variant="outline"
                  icon={<FontAwesome name="facebook" size={24} color="#1877F2" />}
                  onPress={() => promptFacebookAsync()}
                  loading={socialLoading === 'facebook'}
                  disabled={!facebookRequest || socialLoading !== null}
                />
                {!FACEBOOK_APP_ID && (
                  <View style={styles.comingSoonOverlay} pointerEvents="none">
                    <Text style={styles.comingSoonText}>Em Breve</Text>
                  </View>
                )}
              </View>
              <View style={styles.socialButtonWrapper}>
                <Button
                  title="Google"
                  variant="outline"
                  icon={<FontAwesome name="google" size={24} color="#DB4437" />}
                  onPress={() => promptGoogleAsync()}
                  loading={socialLoading === 'google'}
                  disabled={!googleRequest || socialLoading !== null}
                />
                {!GOOGLE_CLIENT_ID && (
                  <View style={styles.comingSoonOverlay} pointerEvents="none">
                    <Text style={styles.comingSoonText}>Em Breve</Text>
                  </View>
                )}
              </View>
            </View>

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
  socialRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  socialButtonWrapper: { flex: 1, position: 'relative' },
  comingSoonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: { fontSize: 13, fontWeight: '700', color: COLORS.textDark, letterSpacing: 0.5 },
  registerText: { textAlign: 'center', marginTop: 24, fontSize: 16 },
  registerLink: { color: COLORS.secondary, fontWeight: 'bold' },
  termsText: { textAlign: 'center', marginTop: 16, fontSize: 12, color: COLORS.textDark },
  linkText: { color: COLORS.secondary },
  errorText: { color: '#D32F2F', fontSize: 14, textAlign: 'center', marginBottom: 4 },
});