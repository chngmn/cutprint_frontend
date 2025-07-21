import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Dimensions
} from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../constants/theme';

// 중요: 웹 브라우저가 자동으로 닫히도록 설정
WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');
const { Colors, Typography, Spacing, Radius, Shadow } = Theme;

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
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');
  const [signupNickname, setSignupNickname] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

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
      } else if (response.type === 'dismiss' || response.type === 'cancel') {
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

      if (!user.nickname) {
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
      promptAsync({ useProxy: true } as any); // Google 로그인 프롬프트 실행
    } else {
      Alert.alert('오류', 'Google 로그인 요청을 준비할 수 없습니다. 클라이언트 ID를 확인해주세요.');
    }
  };

  const BACKEND_URL = 'http://192.249.27.137:3000'; // 실제 배포시 주소로 변경

  const handleSignup = async () => {
    if (!signupEmail || !signupPassword || !signupPasswordConfirm || !signupNickname) {
      Alert.alert('오류', '모든 항목을 입력해주세요.');
      return;
    }
    if (signupPassword !== signupPasswordConfirm) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          nickname: signupNickname,
        }),
      });
      if (!res.ok) {
        let errMsg = '회원가입 실패';
        try { const err = await res.json(); errMsg = err.message || errMsg; } catch { }
        throw new Error(errMsg);
      }
      Alert.alert('회원가입 성공', '이제 로그인 해주세요!');
      setShowSignup(false);
      setSignupEmail('');
      setSignupPassword('');
      setSignupPasswordConfirm('');
      setSignupNickname('');
    } catch (err: any) {
      Alert.alert('회원가입 오류', err.message);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });
      if (!res.ok) {
        let errMsg = '로그인 실패';
        try { const err = await res.json(); errMsg = err.message || errMsg; } catch { }
        throw new Error(errMsg);
      }
      const data = await res.json();
      await AsyncStorage.setItem('access_token', data.access_token);
      Alert.alert('로그인 성공', '환영합니다!');
      setShowLogin(false);
      setLoginEmail('');
      setLoginPassword('');
      navigation.replace('Main'); // 로그인 성공 시 메인으로 이동
    } catch (err: any) {
      Alert.alert('로그인 오류', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} />
          </View>
          <Text style={styles.appTitle}>Cutprint</Text>
          <Text style={styles.appSubtitle}>
            당신의 순간을 기록하는 작은 부스
          </Text>
        </View>
      </View>

      {/* Action Section */}
      <View style={styles.actionSection}>
        <View style={styles.buttonContainer}>
          {/* Primary Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowSignup(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          {/* Secondary Button */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowLogin(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Login Button */}
          <TouchableOpacity
            style={[styles.googleButton, (!request || loading) && styles.disabledButton]}
            onPress={handleGoogleSignIn}
            disabled={!request || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.textSecondary} />
            ) : (
              <>
                <View style={styles.googleIconContainer}>
                  <Image
                    source={{ uri: 'https://img.icons8.com/color/48/000000/google-logo.png' }}
                    style={styles.googleIcon}
                  />
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 회원가입 모달 */}
      <Modal
        visible={showSignup}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSignup(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Account</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSignup(false)}
              >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.nicknameInput}
              placeholder="이메일"
              placeholderTextColor={Colors.textSecondary}
              value={signupEmail}
              onChangeText={setSignupEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.nicknameInput}
              placeholder="닉네임"
              placeholderTextColor={Colors.textSecondary}
              value={signupNickname}
              onChangeText={setSignupNickname}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.nicknameInput}
              placeholder="비밀번호"
              placeholderTextColor={Colors.textSecondary}
              value={signupPassword}
              onChangeText={setSignupPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.nicknameInput}
              placeholder="비밀번호 확인"
              placeholderTextColor={Colors.textSecondary}
              value={signupPasswordConfirm}
              onChangeText={setSignupPasswordConfirm}
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleSignup}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSubmitButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 로그인 모달 */}
      <Modal
        visible={showLogin}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLogin(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sign In</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowLogin(false)}
              >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.nicknameInput}
              placeholder="이메일"
              placeholderTextColor={Colors.textSecondary}
              value={loginEmail}
              onChangeText={setLoginEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.nicknameInput}
              placeholder="비밀번호"
              placeholderTextColor={Colors.textSecondary}
              value={loginPassword}
              onChangeText={setLoginPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSubmitButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Your Nickname</Text>
            </View>
            <TextInput
              style={styles.nicknameInput}
              placeholder="닉네임 입력"
              placeholderTextColor={Colors.textSecondary}
              value={nickname}
              onChangeText={setNickname}
              maxLength={50}
            />
            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={async () => {
                if (!nickname.trim()) {
                  return Alert.alert('Please enter a nickname');
                }
                try {
                  await AsyncStorage.setItem('nickname', nickname);
                  console.log('설정된 닉네임', AsyncStorage.getItem('nickname'));
                  setNeedsNickname(false);
                  navigation.replace('Main');
                } catch {
                  Alert.alert('Failed to save nickname');
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSubmitButtonText}>Continue</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'space-between',
  },

  // Hero Section
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 18,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 90,
    height: 90,
  },
  appTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
    maxWidth: 240,
  },

  // Action Section
  actionSection: {
    paddingHorizontal: Spacing.containerPadding,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  buttonContainer: {
    gap: Spacing.sm,
  },

  // Primary Button
  primaryButton: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },

  // Secondary Button
  secondaryButton: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray200,
  },
  dividerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.lg,
  },

  // Google Button
  googleButton: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.gray300,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconContainer: {
    marginRight: Spacing.sm,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  disabledButton: {
    opacity: 0.5,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadow.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: Spacing.xs,
    borderRadius: Radius.sm,
    backgroundColor: Colors.gray100,
  },
  nicknameInput: {
    height: 56,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalSubmitButton: {
    backgroundColor: Colors.textPrimary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  modalSubmitButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});

export default LoginScreen;