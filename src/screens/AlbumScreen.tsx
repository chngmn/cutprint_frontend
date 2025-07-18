import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AlbumScreen = () => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="image-album"
        size={56}
        color="#599EF1"
        style={styles.icon}
      />
      <Text style={styles.title}>사진첩</Text>
      {/* 향후 앨범 리스트 등 추가 UI 영역 */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Pretendard',
    color: '#222',
    marginBottom: 8,
  },
});

export default AlbumScreen;
