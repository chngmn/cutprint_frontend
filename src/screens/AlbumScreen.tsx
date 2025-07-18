
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AlbumScreen = () => {
  return (
    <View style={styles.container}>
      <Text>사진첩</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AlbumScreen;
