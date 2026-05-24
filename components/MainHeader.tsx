import React from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, useWindowDimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; 
import { COLORS } from '../constants/theme';

// =====================================================================
// (Ponto de integração para o Back-end)
// =====================================================================
const useAuth = () => {
  return {
    user: {
      name: "Wanessa Nunes", // O banco manda o nome do usuário logado
      avatarUrl: null, // Se o banco mandar o link da foto, o layout muda sozinho
    }
  };
};

export default function MainHeader() {
  const router = useRouter(); 
  const { width } = useWindowDimensions();
  const isMobile = width < 768; // Definição de limite para telas de celular
  
//O Header consome os dados do usuário logado dinamicamente
  const { user } = useAuth();

  //Pega a primeira letra do nome que veio do banco
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.leftSection} onPress={() => router.push('/home')} activeOpacity={0.7}>
        <Image source={require('../assets/images/logo.png')} style={styles.logoIcon} resizeMode="contain" />
      </TouchableOpacity>

      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} placeholder="Procure itens" placeholderTextColor={COLORS.textDark} />
        <FontAwesome name="search" size={16} color={COLORS.textDark} style={styles.searchIcon} />
      </View>

      {/* Gap dinâmico: menor em celulares, maior em telas grandes */}
      <View style={[styles.rightSection, { gap: isMobile ? 12 : 20 }]}>
        
        {/* Renderiza os links em texto apenas se a tela não for de celular */}
        {!isMobile && (
          <>
            <TouchableOpacity><Text style={styles.linkVerde}>Doações</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.linkVerde}>Quero doar</Text></TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.iconButton}><FontAwesome name="bell-o" size={20} color={COLORS.secondary} /></TouchableOpacity>
        
        {/* Se tem foto, mostra a foto. Se não tem, mostra a letra. */}
        <TouchableOpacity 
          style={styles.avatarContainer} 
          onPress={() => router.push('/profile')} 
          activeOpacity={0.8}
        >
          {user?.avatarUrl ? (
             <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
             <Text style={styles.avatarText}>{userInitial}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  leftSection: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { height: 40, width: 40 },
  searchContainer: { flex: 1, maxWidth: 400, marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBackground, borderRadius: 8, paddingHorizontal: 12, overflow: 'hidden' },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 14, color: '#000', outlineStyle: 'none' as any },
  searchIcon: { marginLeft: 8 },
  rightSection: { flexDirection: 'row', alignItems: 'center' }, 
  linkVerde: { color: COLORS.primary, fontSize: 16, fontWeight: '500' },
  iconButton: { padding: 4 },
  avatarContainer: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  avatarImage: { width: '100%', height: '100%' }
});