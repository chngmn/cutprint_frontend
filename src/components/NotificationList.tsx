import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';

interface Notification {
  id: number;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface NotificationListProps {
  notifications: Notification[];
  onRead: (notificationId: number) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ notifications, onRead }) => (
  <FlatList
    data={notifications.filter(n => !n.is_read)}
    keyExtractor={item => item.id?.toString?.() ?? Math.random().toString()}
    renderItem={({ item }) => (
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderColor: '#eee' }}>
        <View style={{ flex: 1 }}>
          <Text>{item.message}</Text>
          <Text style={{ fontSize: 12, color: '#888' }}>{item.created_at}</Text>
        </View>
        <TouchableOpacity onPress={() => onRead(item.id)}>
          <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>읽음</Text>
        </TouchableOpacity>
      </View>
    )}
  />
);

export default NotificationList; 