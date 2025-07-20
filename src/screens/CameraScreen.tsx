import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  AppState,
  Button,
  TouchableOpacity,
} from 'react-native';
import CustomText from '../components/CustomText';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

type HomeStackParamList = {
  HomeMain: undefined;
  CutSelection: undefined;
  Camera: { cutType: string; isOnlineMode?: boolean };
  PhotoSelection: { photos: string[]; cutType: string; isOnlineMode?: boolean };
  FilterFrame: { selectedPhotos: string[]; cutType: string };
};

type CameraScreenNavigationProp = StackNavigationProp<
  HomeStackParamList,
  'Camera'
>;

const CameraScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [countdown, setCountdown] = useState<number>(5);
  const [shotCount, setShotCount] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation<CameraScreenNavigationProp>();

  // Hide tab bar and header when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' },
          headerShown: false,
        });
      }

      return () => {
        if (parent) {
          parent.setOptions({
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 0,
              elevation: 10, // for Android shadow (much stronger)
              shadowOpacity: 0.2, // for iOS shadow (much stronger)
              shadowRadius: 10,
              shadowOffset: { width: 2, height: 8 },
              shadowColor: '#000000',
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
              height: 70,
              paddingBottom: 10,
              paddingTop: 10,
              // 완전히 떠있는 효과를 위한 스타일
              marginBottom: 15,
              marginHorizontal: 15,
              marginTop: 10,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
            },
            headerShown: true,
          });
        }
      };
    }, [navigation]),
  );
  const route = useRoute();
  const { cutType, isOnlineMode } = route.params as { cutType: string; isOnlineMode?: boolean };

  // Request camera permission on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // Start capture process when permission is granted
  useEffect(() => {
    if (permission?.granted) {
      setIsCapturing(true);
    }
  }, [permission]);

  // Countdown and picture taking logic
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null;

    if (isCapturing && shotCount < 8) {
      countdownInterval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      if (countdown === 0) {
        clearInterval(countdownInterval);
        takePicture();
      }
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [isCapturing, countdown, shotCount]);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          const newPhotos = [...capturedPhotos, photo.uri];
          setCapturedPhotos(newPhotos);
          console.log(`Photo ${shotCount + 1} taken: ${photo.uri}`);

          const nextShotCount = shotCount + 1;
          setShotCount(nextShotCount);

          if (nextShotCount < 8) {
            setCountdown(5); // Reset for next shot
          } else {
            setIsCapturing(false);
            navigation.navigate('PhotoSelection', {
              photos: newPhotos,
              cutType: cutType,
              isOnlineMode: isOnlineMode,
            });
          }
        }
      } catch (error) {
        console.error('Failed to take picture:', error);
        Alert.alert('오류', '사진 촬영에 실패했습니다.');
        setIsCapturing(false);
        navigation.goBack();
      }
    }
  };

  const handleQuickShot = () => {
    setCountdown(0);
  };

  const handleAddTime = () => {
    setCountdown((prev) => prev + 5);
  };

  if (!permission) {
    // Permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Permissions are not granted
    return (
      <View style={styles.container}>
        <CustomText style={{ textAlign: 'center' }}>
          We need your permission to show the camera
        </CustomText>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={'front'} ref={cameraRef}>
        <View style={styles.overlay}>
          {isCapturing && shotCount < 8 && (
            <>
              <CustomText style={styles.countdownText}>{countdown}</CustomText>
              <CustomText
                style={styles.shotCountText}
              >{`${shotCount + 1}/8`}</CustomText>
            </>
          )}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.addTimeButton}
              onPress={handleAddTime}
            >
              <MaterialCommunityIcons
                name="clock-plus-outline"
                size={28}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickShotButton}
              onPress={handleQuickShot}
            >
              <MaterialCommunityIcons
                name={'camera-enhance-outline' as any}
                size={28}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    position: 'absolute',
    top: 60,
    left: 30,
    fontSize: 64,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  shotCountText: {
    position: 'absolute',
    top: 70,
    right: 25,
    fontSize: 25,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  addTimeButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 24,
  },
  quickShotButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CameraScreen;
