import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, AppState, Button } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { useCameraPermissions } from 'expo-camera';

const CameraScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [countdown, setCountdown] = useState<number>(5);
  const [shotCount, setShotCount] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation();

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
        console.log(`Photo ${shotCount + 1} taken: ${photo?.uri}`);

        const nextShotCount = shotCount + 1;
        setShotCount(nextShotCount);

        if (nextShotCount < 8) {
          setCountdown(5); // Reset for next shot
        } else {
          setIsCapturing(false);
          Alert.alert('촬영 완료', '8장의 사진 촬영이 모두 끝났습니다.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        }
      } catch (error) {
        console.error('Failed to take picture:', error);
        Alert.alert('오류', '사진 촬영에 실패했습니다.');
        setIsCapturing(false);
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
        <Text style={{ textAlign: 'center' }}>
          We need your permission to show the camera
        </Text>
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
              <Text style={styles.countdownText}>{countdown}</Text>
              <Text style={styles.shotCountText}>{`${shotCount + 1}/8`}</Text>
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
