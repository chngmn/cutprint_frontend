import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
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
      <View style={styles.centerContent}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Text style={styles.title}>Cutprint</Text>
      </View>
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => navigation.replace('Main')}
      >
        <Text style={styles.loginButtonText}>Log in</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    width: 121,
    height: 121,
    marginBottom: 16, // 기존 40에서 16으로 줄임
  },
  title: {
    fontSize: 45,
    fontWeight: '700',
    fontFamily: 'Pretendard',
    color: '#000',
  },
  loginButton: {
    backgroundColor: '#599EF1',
    width: 226,
    height: 51,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 40,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '400',
    fontFamily: 'Pretendard',
  },
});

export default LoginScreen;
