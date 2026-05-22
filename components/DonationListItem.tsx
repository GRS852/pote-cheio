import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

//O que o banco deve enviar para cada item da lista
export interface DonationItemProps {
  id: string;
  title: string;
  receiver: string;
  date: string;
  status: 'Entregue' | 'Em andamento';
  imageUrl: any; // Quando plugar o back-end, mude para 'string' (URL)
}

export default function DonationListItem({ title, receiver, date, status, imageUrl }: DonationItemProps) {
  const isDelivered = status === 'Entregue';

  return (
    <View style={styles.container}>
      <Image source={imageUrl} style={styles.image} resizeMode="cover" />
      
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.receiverText}>
          Entregue para: <Text style={styles.receiverName}>{receiver}</Text>
        </Text>
        <View style={styles.dateRow}>
          <FontAwesome name="calendar" size={12} color={COLORS.textDark} />
          <Text style={styles.dateText}>{date}</Text>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: isDelivered ? '#D1F0D9' : '#FFE5D9' }]}>
          <Text style={[styles.statusText, { color: isDelivered ? COLORS.primary : COLORS.secondary }]}>
            {status}
          </Text>
        </View>
        <Text style={styles.statusSubtitle}>
          {isDelivered ? 'Entrega realizada com sucesso' : 'Aguardando envio'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  image: { width: 120, height: 80, borderRadius: 8, backgroundColor: '#CCC', marginRight: 16 },
  infoContainer: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  receiverText: { fontSize: 12, color: COLORS.textDark, marginBottom: 4 },
  receiverName: { color: COLORS.primary },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 12, color: COLORS.textDark, marginLeft: 6 },
  statusContainer: { alignItems: 'flex-end', marginLeft: 16 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 6 },
  statusText: { fontWeight: 'bold', fontSize: 12 },
  statusSubtitle: { fontSize: 10, color: '#000' }
});