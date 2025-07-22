import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Animated,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Text,
  Alert,
  AppState,
} from 'react-native';
import CustomText from '../components/CustomText';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { StackNavigationProp } from '@react-navigation/stack';
import NotificationList from '../components/NotificationList';
import { apiService } from '../services/apiService';

interface Notification {
  id: number;
  message: string;
  created_at: string;
  is_read: boolean;
}

type RootStackParamList = {
  CutSelection: undefined;
  CutSelectionOnline: undefined;
};

const HomeScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scale] = useState(new Animated.Value(1));
  const [pressed, setPressed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  const fetchNotifications = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else if (notifications.length === 0) {
        setIsLoading(true);
      }
      
      const fetchedNotifications = await apiService.getNotifications();
      setNotifications(fetchedNotifications || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('알림 로드 실패:', error);
      // 네트워크 에러 시 사용자에게 알림 (선택적)
      if (showRefreshIndicator) {
        Alert.alert('알림', '알림을 불러오는데 실패했습니다. 네트워크 연결을 확인해주세요.');
      }
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [notifications.length]);

  // 컴포넌트 마운트 시 알림 로드
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // 화면 포커스 시 자동 새로고침
  useFocusEffect(
    useCallback(() => {
      // 마지막 업데이트로부터 30초 이상 경과했거나 처음 로드인 경우 새로고침
      const shouldRefresh = !lastUpdated || 
        (Date.now() - lastUpdated.getTime()) > 30000;
      
      if (shouldRefresh) {
        fetchNotifications();
      }
      
      // 주기적 자동 새로고침 시작 (5분마다)
      if (autoRefreshEnabled) {
        startAutoRefresh();
      }
      
      // 화면에서 벗어날 때 자동 새로고침 정지
      return () => {
        stopAutoRefresh();
      };
    }, [fetchNotifications, lastUpdated, autoRefreshEnabled])
  );

  // 앱 상태 변화 감지 (백그라운드/포그라운드)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // 백그라운드에서 포그라운드로 돌아왔을 때
        const timeSinceLastUpdate = lastUpdated ? Date.now() - lastUpdated.getTime() : Infinity;
        if (timeSinceLastUpdate > 60000) { // 1분 이상 경과 시 새로고침
          fetchNotifications();
        }
        if (autoRefreshEnabled) {
          startAutoRefresh();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // 포그라운드에서 백그라운드로 갈 때
        stopAutoRefresh();
      }
      appState.current = nextAppState;
    });

    return () => subscription?.remove();
  }, [fetchNotifications, lastUpdated, autoRefreshEnabled]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopAutoRefresh();
    };
  }, []);

  const handleRead = async (notificationId: number) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      // 읽음 처리 후 즉시 알림 목록 새로고침
      await fetchNotifications();
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
      Alert.alert('오류', '알림 읽음 처리에 실패했습니다.');
    }
  };

  // Pull-to-refresh 핸들러
  const onRefresh = useCallback(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // 자동 새로고침 시작
  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // 5분마다 자동 새로고침
    intervalRef.current = setInterval(() => {
      if (AppState.currentState === 'active') {
        fetchNotifications();
      }
    }, 5 * 60 * 1000); // 5분
  }, [fetchNotifications]);

  // 자동 새로고침 정지
  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 수동 새로고침 버튼 핸들러
  const handleManualRefresh = useCallback(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // 자동 새로고침 토글
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => {
      const newValue = !prev;
      if (newValue) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
      return newValue;
    });
  }, [startAutoRefresh, stopAutoRefresh]);

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 10,
    }).start();
  };

  const handleNavigate = () => {
    navigation.navigate('CutSelection');
  };

  return (
    <View style={styles.container}>
      {/* 알림 영역은 아래로 이동 */}
      {/* 기존 홈 화면 내용 */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          fadeDuration={0}
          loadingIndicatorSource={require('../../assets/logo.png')}
        />
        <CustomText style={styles.subHeader}>
          언제 어디서든, 간편하게 네컷
        </CustomText>
        <TouchableOpacity
          activeOpacity={0.8}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleNavigate}
          style={[
            styles.cutprintButton,
            pressed && styles.cutprintButtonPressed,
          ]}
        >
           <Animated.View style={[styles.cutprintButtonInner, { transform: [{ scale }] }] }>
             <CustomText style={styles.cutprintText}>cutprint</CustomText>
             <Ionicons name="camera-outline" size={28} color="#111" style={{ marginLeft: 8, marginBottom: 1 }} />
           </Animated.View>
        </TouchableOpacity>
        <CustomText style={styles.guideText}>네컷 사진 찍기</CustomText>
      </View>

      {/* 알림 리스트 (스크롤, 넓은 영역) */}
      <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="notifications-outline" size={20} color="#111" style={{ marginRight: 7 }} />
            <CustomText style={{ fontSize: 15, fontWeight: 'bold', color: '#111' }}>알림</CustomText>
            {isLoading && notifications.length === 0 && (
              <ActivityIndicator size="small" color="#666" style={{ marginLeft: 8 }} />
            )}
            {/* 자동 새로고침 상태 표시 */}
            {autoRefreshEnabled && !isLoading && (
              <View style={{ 
                backgroundColor: '#e8f5e8', 
                borderRadius: 8, 
                paddingHorizontal: 6, 
                paddingVertical: 2, 
                marginLeft: 8 
              }}>
                <CustomText style={{ fontSize: 10, color: '#2d7d32', fontWeight: 'bold' }}>자동</CustomText>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* 자동 새로고침 토글 버튼 */}
            <TouchableOpacity 
              onPress={toggleAutoRefresh}
              style={{ 
                padding: 4,
                marginRight: 8,
              }}
            >
              <Ionicons 
                name={autoRefreshEnabled ? "timer" : "timer-outline"} 
                size={16} 
                color={autoRefreshEnabled ? "#2d7d32" : "#999"}
              />
            </TouchableOpacity>
            {/* 수동 새로고침 버튼 */}
            <TouchableOpacity 
              onPress={handleManualRefresh}
              disabled={isRefreshing}
              style={{ 
                opacity: isRefreshing ? 0.5 : 1,
                padding: 4,
              }}
            >
              <Ionicons 
                name="refresh-outline" 
                size={18} 
                color="#666" 
                style={{ 
                  transform: [{ rotate: isRefreshing ? '180deg' : '0deg' }]
                }} 
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ maxHeight: 220, minHeight: 120 }}>
          {isLoading && notifications.length === 0 ? (
            // 초기 로딩 상태
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
              <ActivityIndicator size="large" color="#666" />
              <CustomText style={{ marginTop: 12, color: '#888', fontSize: 13 }}>알림을 불러오는 중...</CustomText>
            </View>
          ) : notifications.length === 0 ? (
            // 알림이 없는 경우 (기본 메시지들)
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={{ flexGrow: 0 }}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  tintColor="#666"
                  title="당겨서 새로고침"
                  titleColor="#666"
                />
              }
            >
              {[{
                id: 'default1',
                message: '사진을 찍으면 여기에서 결과를 확인할 수 있어요!',
                created_at: '',
                is_read: true,
              }, {
                id: 'default2',
                message: '친구와 함께 찍은 사진, 새로운 소식이 도착하면 알려드릴게요!',
                created_at: '',
                is_read: true,
              }].map(n => (
                <View key={n.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fafbfc', borderRadius: 10, borderWidth: 1, borderColor: '#eee', shadowColor: '#111', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 9 }}>
                  <Ionicons name="information-circle-outline" size={18} color="#bbb" style={{ marginRight: 10, alignSelf: 'flex-start', marginTop: 4 }} />
                  <View style={{ flex: 1 }}>
                    <CustomText style={{ color: '#888', fontSize: 13, fontWeight: 'bold', marginBottom: 1 }}>{n.message}</CustomText>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            // 알림이 있는 경우
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={{ flexGrow: 0 }}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  tintColor="#666"
                  title="당겨서 새로고침"
                  titleColor="#666"
                />
              }
            >
              {notifications.map(n => (
                <View key={n.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#eee', shadowColor: '#111', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 9 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: n.is_read ? '#ccc' : '#111', marginRight: 12, alignSelf: 'flex-start', marginTop: 5 }} />
                  <View style={{ flex: 1 }}>
                    <CustomText style={{ color: '#222', fontSize: 14, fontWeight: 'bold', marginBottom: 2 }}>{n.message}</CustomText>
                    <CustomText style={{ color: '#888', fontSize: 12 }}>{n.created_at}</CustomText>
                  </View>
                  {!n.is_read && (
                    <TouchableOpacity onPress={() => handleRead(n.id)} style={{ borderWidth: 1, borderColor: '#111', borderRadius: 10, paddingVertical: 3, paddingHorizontal: 10, marginLeft: 10, alignSelf: 'center' }}>
                      <CustomText style={{ color: '#111', fontSize: 12, fontWeight: 'bold' }}>읽음</CustomText>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {/* 마지막 업데이트 시간 표시 */}
              {lastUpdated && (
                <View style={{ alignItems: 'center', paddingVertical: 8, marginTop: 4 }}>
                  <CustomText style={{ color: '#999', fontSize: 11 }}>
                    마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </CustomText>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
  },
  header: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 10,
    // 이미지 로딩 최적화
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  cardContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '45%',
    height: 180,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343A40',
    marginTop: 12,
  },
  cardDescription: {
    fontSize: 13,
    color: '#868E96',
    marginTop: 4,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cutprintText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#111',
    letterSpacing: 2,
    textDecorationLine: 'none',
  },
  cutprintTouchable: {
    marginTop: 32,
    alignItems: 'center',
  },
  cutprintButton: {
    marginTop: 32,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#111',
    paddingVertical: 18,
    paddingHorizontal: 44,
    shadowColor: '#111',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cutprintButtonPressed: {
    backgroundColor: '#f5f5f5',
  },
  cutprintButtonInner: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  guideText: {
    marginTop: 14,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontWeight: '400',
  },
});

export default HomeScreen;
