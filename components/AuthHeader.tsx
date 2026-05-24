import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { COLORS } from '../constants/theme';

interface AuthHeaderProps {
  activeTab?: string;
}

export default function AuthHeader({ activeTab }: AuthHeaderProps) {
  const isRegister = activeTab === 'Cadastrar';
  const router = useRouter();

  return (
    <View>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.leftSection} 
          onPress={() => router.push('/')} 
          activeOpacity={0.7}
        >
          <Image source={require('../assets/images/logo.png')} style={styles.logoIcon} resizeMode="contain" />
          <Text style={styles.title}>
            <Text style={{color: COLORS.primary}}>Pets</Text> <Text style={{color: COLORS.secondary}}>Brasil</Text>
          </Text>
          {activeTab && (
            <View style={styles.activeTab}>
              <Text style={styles.activeTabText}>{activeTab}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <Link href="/help" style={styles.helpLink}>Precisa de Ajuda?</Link>
      </View>
      <View style={[styles.bottomLine, isRegister ? styles.lineRegister : styles.lineLogin]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFFFFF' },
  leftSection: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { height: 35, width: 35, marginRight: 10 },
  title: { fontSize: 22, fontWeight: 'bold', marginRight: 20 },
  activeTab: { backgroundColor: '#D1F0D9', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  activeTabText: { color: COLORS.primary, fontWeight: 'bold' },
  helpLink: { color: COLORS.secondary, fontSize: 16 },
  bottomLine: { width: '100%' },
  lineLogin: { height: 1, backgroundColor: COLORS.border },
  lineRegister: { height: 3, backgroundColor: '#2D9CDB' },
});