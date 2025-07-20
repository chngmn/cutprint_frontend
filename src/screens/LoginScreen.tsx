import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser'; // WebBrowser import 추가
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 중요: 웹 브라우저가 자동으로 닫히도록 설정
WebBrowser.maybeCompleteAuthSession();

type RootStackParamList = {
  Main: undefined;
  Login: undefined; // 내비게이션 스택에 Login 스크린이 정의되어 있다고 가정
};

type LoginScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Main'>;
};

interface UserInfo {
  id: string;
  nickname: string;
  email: string;
  picture?: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false); // Google 로그인 과정의 로딩 상태
  const [nickname, setNickname] = useState('');  
  const [needsNickname, setNeedsNickname] = useState(false);

  // app.json의 extra 필드에서 클라이언트 ID를 가져옵니다.
  const iosClientId = Constants.expoConfig?.extra?.googleAuth?.iosClientId as string;
  // const androidClientId = Constants.expoConfig?.extra?.googleAuth?.androidClientId as string; // Android 사용 시 주석 해제
  const webClientId = Constants.expoConfig?.extra?.googleAuth?.webClientId as string;

  // Google 인증 요청 훅
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: webClientId,
    iosClientId: iosClientId,
    // androidClientId: androidClientId, // Android 사용 시 주석 해제
    scopes: ['profile', 'email'], // 프로필 정보와 이메일 주소를 요청합니다.
  });

  // request 객체 상태 로깅 (디버깅용)
  useEffect(() => {
    console.log('--- useEffect: Request Object Status ---');
    if (request) {
      console.log('Google Auth Request object available.');
      console.log('Google Auth Request Redirect URI:', request.redirectUri); // ⭐⭐⭐ 이 로그를 확인하여 리디렉션 URI가 올바른지 확인하세요! ⭐⭐⭐
    } else {
      console.log('Google Auth Request object is not yet available or is null.');
    }
    console.log('--- End Request Object Log ---');
  }, [request]);

  // response 객체 상태 로깅 및 처리
  useEffect(() => {
    console.log('useEffect triggered. Current response:', response);

    if (response) { // response 객체가 존재할 때만 처리
      if (response.type === 'success') {
        console.log('Login Success! Fetching user info...');
        // 인증 성공 시 로딩 시작
        setLoading(true);
        const { authentication } = response;
        // accessToken을 사용하여 사용자 정보를 가져오는 함수 호출
        fetchUserInfo(authentication?.accessToken);
      } else if (response.type === 'error') {
        console.log('Login Error:', response.error);
        // 인증 실패 시 오류 메시지 표시 후 메인 화면으로 이동
        Alert.alert('Google 로그인 오류', '로그인에 실패했습니다. 메인 화면으로 이동합니다.');
        setLoading(false); // 로딩 상태를 false로 설정
        navigation.replace('Main'); // Main 화면으로 이동
      } else if (response.type === 'dismiss' || response.type === 'cancel' ) {
        // 사용자가 로그인 창을 닫았을 때 (취소)
        console.log('Login Dismissed by user.');
        Alert.alert('로그인 취소', 'Google 로그인이 취소되었습니다. 메인 화면으로 이동합니다.');
        setLoading(false); // 로딩 상태를 false로 설정
        navigation.replace('Main'); // Main 화면으로 이동
      } else {
        console.log('Unexpected response type:', response.type); // 예상치 못한 응답 타입
      }
    }
  }, [response]); // response 객체가 변경될 때마다 이 훅이 실행됩니다.

  // accessToken을 사용하여 Google로부터 사용자 정보를 가져오는 비동기 함수
  const fetchUserInfo = async (token: string | undefined) => {
    if (!token) {
      Alert.alert('오류', '인증 토큰을 찾을 수 없습니다.');
      setLoading(false); // 로딩 상태를 false로 설정
      navigation.replace('Main'); // 토큰이 없을 때도 Main 화면으로 이동
      return;
    }
    try {
      // Google UserInfo API 호출
      const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await response.json();
      setUserInfo(user); // 가져온 사용자 정보 저장
      console.log('Google 로그인 성공:', user);

      if(!user.nickname) {
        setNeedsNickname(true);
      } else {
        // 실제 앱에서는 여기서 사용자 정보를 서버에 전송하고,
        // 서버로부터 받은 세션 토큰 등으로 로그인 처리를 완료합니다.
        navigation.replace('Main'); // 사용자 정보 처리 후 메인 화면으로 이동
      }

    } catch (error) {
      console.error('사용자 정보 가져오기 오류:', error);
      Alert.alert('오류', '사용자 정보를 가져오지 못했습니다. 메인 화면으로 이동합니다.');
      navigation.replace('Main'); // 사용자 정보 가져오기 실패 시에도 Main 화면으로 이동
    } finally {
      setLoading(false); // 어떤 경우든 로딩 종료
    }
  };

  // 기존 "Log in" 버튼 핸들러 (디자인 유지 및 기능 분리)
  // const handleRegularLogin = () => {
  //   // 이 버튼은 Google 로그인과 별개로 작동합니다.
  //   // 여기에 일반 로그인 로직 (예: 이메일/비밀번호 입력 폼으로 이동)을 추가하거나
  //   // 임시로 Main 화면으로 이동하도록 할 수 있습니다.
  //   Alert.alert('알림', '일반 로그인 버튼 클릭 (현재는 Main 화면으로 이동)');
  //   navigation.replace('Main'); // 기존 동작 유지
  // };

  // Google 로그인 버튼 핸들러
  const handleGoogleSignIn = () => {
    if (request) {
      setLoading(true); // 버튼 클릭 시 로딩 시작
      promptAsync({useProxy:true} as any); // Google 로그인 프롬프트 실행
    } else {
      Alert.alert('오류', 'Google 로그인 요청을 준비할 수 없습니다. 클라이언트 ID를 확인해주세요.');
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Text style={styles.title}>Cutprint</Text>
      </View>

      {/* 기존 "Log in" 버튼 유지 */}
      {/* <TouchableOpacity
        style={styles.loginButton}
        onPress={handleRegularLogin} // 기존 핸들러 연결
      >
        <Text style={styles.loginButtonText}>Log in</Text>
      </TouchableOpacity> */}

      {/* Google 로그인 버튼 추가 */}
      <TouchableOpacity
        style={[styles.googleLoginButton, (!request || loading) && styles.disabledButton]} // 로딩 중이거나 request 객체가 없을 때 비활성화 스타일 적용
        onPress={handleGoogleSignIn}
        disabled={!request || loading} // 요청 객체가 없거나 로딩 중일 때 버튼 비활성화
      >
        {loading ? (
          <ActivityIndicator color="#4285F4" /> // 로딩 중일 때 로딩 인디케이터 표시
        ) : (
          <>
            {/* Google 로고 이미지 추가 (예시 URL, 실제 앱에서는 로컬 에셋 사용 권장) */}
            <Image
              source={{ uri: 'https://img.icons8.com/color/48/000000/google-logo.png' }}
              style={styles.googleIcon}
            />
            <Text style={styles.googleLoginButtonText}>Google로 시작하기</Text>
          </>
        )}
      </TouchableOpacity>

      {/* 닉네임 입력용 모달 */}
      <Modal
        visible={needsNickname}
        animationType="slide"
        transparent
        onRequestClose={() => {
          // 뒤로 버튼 눌러도 닫지 않도록 막거나, 원하면 needsNickname=false 처리
          Alert.alert('닉네임을 입력해야만 계속할 수 있어요.');
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>닉네임을 설정해주세요</Text>
            <TextInput
              style={styles.nicknameInput}
              placeholder="닉네임 입력"
              value={nickname}
              onChangeText={setNickname}
              maxLength={50}
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={async () => {
                if (!nickname.trim()) {
                  return Alert.alert('닉네임을 입력해주세요');
                }
                try {
                  // await fetch('/api/users/me', {
                  //   method: 'PATCH',
                  //   headers: { 'Content-Type': 'application/json' },
                  //   body: JSON.stringify({ nickname }),
                  // });
                  await AsyncStorage.setItem('nickname', nickname);
                  console.log('설정된 닉네임',AsyncStorage.getItem('nickname'));
                  setNeedsNickname(false);
                  navigation.replace('Main');
                } catch {
                  Alert.alert('저장에 실패했습니다');
                }
              }}
            >
              <Text style={styles.submitText}>완료</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      
      {/* Google 로그인 성공 시 사용자 정보 표시 (개발/디버깅용, 실제 앱에서는 제거 또는 다른 화면으로 이동) */}
      {/* {userInfo && (
        <View style={styles.userInfoContainer}>
          <Text style={styles.userInfoText}>이름: {userInfo.name}</Text>
          <Text style={styles.userInfoText}>이메일: {userInfo.email}</Text>
          {userInfo.picture && (
            <Image source={{ uri: userInfo.picture }} style={styles.userPicture} />
          )}
        </View>
      )} */}
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
    marginBottom: 16,
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
    marginBottom: 10, // Google 버튼과의 간격 조정을 위해 기존 40에서 10으로 줄임
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '400',
    fontFamily: 'Pretendard',
  },
  // Google 로그인 버튼을 위한 새로운 스타일
  googleLoginButton: {
    flexDirection: 'row', // 아이콘과 텍스트를 가로로 배열
    backgroundColor: '#fff', // Google 버튼은 흰색 배경이 일반적
    width: 226,
    height: 51,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 40, // 하단 여백 유지
    borderColor: '#ccc', // 테두리 색상
    borderWidth: 1, // 테두리 두께
    boxShadow: '0px 2px 3px rgba(0,0,0,0.1)',
    elevation: 3, // Android용 그림자
  },
  disabledButton: {
    opacity: 0.6, // 비활성화된 버튼의 투명도
  },
  googleIcon: {
    width: 24, // Google 아이콘 크기
    height: 24,
    marginRight: 10, // 아이콘과 텍스트 사이 간격
  },
  googleLoginButtonText: {
    color: '#000', // Google 버튼 텍스트 색상 (일반적으로 검정 또는 진한 회색)
    fontSize: 18, // Google 버튼 텍스트 크기
    fontWeight: '500',
    fontFamily: 'Pretendard', // 이 폰트가 로드되었는지 확인하세요.
  },
  // 디버깅용 사용자 정보 컨테이너 (주석 처리됨)
  userInfoContainer: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
  },
  userInfoText: {
    fontSize: 16,
    marginBottom: 5,
  },
  userPicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginTop: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',  // 반투명 검정
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 모달 내부 컨테이너
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  nicknameContainer: {
    width: '80%',
    alignItems: 'center',
    marginTop: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 8,
  },
  nicknameInput: {
    width: '100%',
    height: 44,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#599EF1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  submitText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
  },
});

export default LoginScreen;