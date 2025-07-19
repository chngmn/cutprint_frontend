import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, AppState, Button } from 'react-native';
import CustomText from '../components/CustomText';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

type HomeStackParamList = {
  HomeMain: undefined;
  CutSelection: undefined;
  Camera: { cutType: string };
  PhotoSelection: { photos: string[]; cutType: string };
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
  const route = useRoute();
  const { cutType } = route.params as { cutType: string };

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
              <CustomText style={styles.shotCountText}>{`${shotCount + 1}/8`}</CustomText>
            </>
          )}
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
  countdownText: {
    fontSize: 96,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  shotCountText: {
    position: 'absolute',
    top: 60,
    right: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
});

export default CameraScreen;
