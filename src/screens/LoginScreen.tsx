import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Main: undefined;
  // 다른 스크린이 있다면 여기에 추가
};

type LoginScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Main'>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cutprint</Text>
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => navigation.replace('Main')}
      >
        <Text style={styles.loginButtonText}>로그인</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 50,
  },
  loginButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 80,
    borderRadius: 25,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
