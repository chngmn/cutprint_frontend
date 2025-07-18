import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';

// 중요: 웹 브라우저가 자동으로 닫히도록 설정
WebBrowser.maybeCompleteAuthSession();

const webClientId = Constants.expoConfig?.extra?.googleAuth?.webClientId
// const ANDROID_CLIENT_ID = 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com'; // Android 유형
const iosClientId = Constants.expoConfig?.extra?.googleAuth?.iosClientId; // iOS 유형

interface UserInfo {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

export default function App() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  // const redirectUri = AuthSession.makeRedirectUri({ useProxy: true } as any);
  // console.log('👉 redirectUri:', redirectUri);

  // useAuthRequest 훅을 사용하여 인증 요청을 준비합니다.
  // makeRedirectUri()를 사용하여 플랫폼에 맞는 리디렉션 URI를 자동으로 생성합니다.
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: webClientId,
    // androidClientId: ANDROID_CLIENT_ID,
    iosClientId: iosClientId,
    scopes: ['profile', 'email'], // 필요한 스코프 (사용자 정보, 이메일)
    // redirectUri는 makeRedirectUri()가 내부적으로 처리하므로,
    // 대부분의 경우 명시적으로 설정할 필요가 없습니다.
    // 하지만 app.json의 scheme과 일치하는지 확인하는 것은 중요합니다.
    // redirectUri: redirectUri// Expo Go 환경에서 필수
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        fetchUserInfo(authentication.accessToken);
      }
    } else if (response?.type === 'error') {
      // 에러 발생 시 처리
      console.error('인증 오류:', response.error);
      Alert.alert('로그인 오류', '구글 로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      setLoading(false);
    } else if (response?.type === 'cancel') {
      // 사용자가 로그인 취소 시
      console.log('구글 로그인 취소됨');
      setLoading(false);
    }
  }, [response]);

  // 액세스 토큰을 사용하여 사용자 정보를 가져오는 함수
  const fetchUserInfo = async (accessToken: string) => {
    setLoading(true);
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const user: UserInfo = await userInfoResponse.json();
      setUserInfo(user);
    } catch (error) {
      console.error('사용자 정보 가져오기 오류:', error);
      Alert.alert('오류', '사용자 정보를 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 로그인 버튼 클릭 핸들러
  const handleSignIn = async () => {
    if (request) {
      setLoading(true);
      await promptAsync({useProxy:true} as any);
    } else {
      Alert.alert('오류', '로그인 요청을 준비할 수 없습니다. 클라이언트 ID를 확인해주세요.');
    }
  };

  // 로그아웃 핸들러
  const handleSignOut = () => {
    setUserInfo(null);
    Alert.alert('로그아웃', '성공적으로 로그아웃되었습니다.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google 로그인</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#4285F4" />
      ) : userInfo ? (
        <View style={styles.userInfoContainer}>
          <Text style={styles.infoText}>환영합니다, {userInfo.name}!</Text>
          <Text style={styles.infoText}>이메일: {userInfo.email}</Text>
          {userInfo.picture && (
            <Image
              source={{ uri: userInfo.picture }}
              style={styles.profilePic}
            />
          )}
          <Button title="로그아웃" onPress={handleSignOut} color="#DB4437" />
        </View>
      ) : (
        <Button
          title="Google로 로그인"
          onPress={handleSignIn}
          disabled={!request} // request 객체가 준비되지 않으면 버튼 비활성화
          color="#4285F4"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  userInfoContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  infoText: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    color: '#555',
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: 10,
    marginBottom: 20,
    borderColor: '#eee',
    borderWidth: 2,
  },
});