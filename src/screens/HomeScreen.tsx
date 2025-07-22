import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Animated,
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
      {/* 알림 목록 표시 */}
      <View style={{ marginTop: 20, marginBottom: 10 }}>
        <CustomText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>알림</CustomText>
        <NotificationList notifications={notifications} onRead={handleRead} />
      </View>
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
