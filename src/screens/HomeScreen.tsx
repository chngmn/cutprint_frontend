import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Animated,
  ScrollView,
  Text,
} from 'react-native';
import CustomText from '../components/CustomText';
import { useNavigation } from '@react-navigation/native';
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

  const fetchNotifications = () => {
    apiService.getNotifications()
      .then(setNotifications)
      .catch(console.error);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRead = async (notificationId: number) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

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
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="notifications-outline" size={20} color="#111" style={{ marginRight: 7 }} />
          <CustomText style={{ fontSize: 15, fontWeight: 'bold', color: '#111' }}>알림</CustomText>
        </View>
        <View style={{ maxHeight: 220, minHeight: 120 }}>
          {notifications.length === 0 ? (
            <>
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
            </>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
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
