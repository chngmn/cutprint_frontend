import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  AppState,
  Button,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
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
import Theme from '../constants/theme';

const { Colors, Typography, Spacing, Radius, Shadow } = Theme;
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
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
  const [showControls, setShowControls] = useState<boolean>(true);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation<CameraScreenNavigationProp>();

  // Animation values
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const countdownScale = useRef(new Animated.Value(1)).current;

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

  // Progress animation
  useEffect(() => {
    if (shotCount > 0) {
      Animated.timing(progressAnimation, {
        toValue: shotCount / 8,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [shotCount]);

  // Countdown animation
  useEffect(() => {
    if (countdown > 0 && countdown <= 3) {
      Animated.sequence([
        Animated.timing(countdownScale, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(countdownScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [countdown]);

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

  const handleScreenTap = () => {
    // Quick shot on screen tap
    if (isCapturing && countdown > 1) {
      setCountdown(0);
    }
  };

  const toggleControls = () => {
    const toValue = showControls ? 0 : 1;
    Animated.timing(controlsOpacity, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setShowControls(!showControls);
  };

  const toggleCamera = () => {
    setCameraFacing(prevFacing => prevFacing === 'front' ? 'back' : 'front');
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
      <CameraView style={styles.camera} facing={cameraFacing} ref={cameraRef}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleScreenTap}
        >
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <CustomText style={styles.progressText}>
              {shotCount}/8
            </CustomText>
          </View>

          {/* Countdown Display */}
          {isCapturing && shotCount < 8 && countdown > 0 && (
            <Animated.View
              style={[
                styles.countdownContainer,
                { transform: [{ scale: countdownScale }] }
              ]}
            >
              <CustomText style={styles.countdownText}>{countdown}</CustomText>
            </Animated.View>
          )}

          {/* Hint Text */}
          {isCapturing && shotCount < 8 && countdown > 3 && (
            <Animated.View style={[styles.hintContainer, { opacity: controlsOpacity }]}>
              <CustomText style={styles.hintText}>화면을 터치하면 바로 촬영</CustomText>
            </Animated.View>
          )}

          {/* Multi-function Control Button */}
          <Animated.View
            style={[
              styles.controlButton,
              { opacity: controlsOpacity }
            ]}
          >
            <TouchableOpacity
              style={styles.multiButton}
              onPress={handleAddTime}
              onLongPress={handleQuickShot}
              delayLongPress={500}
            >
              <View style={styles.buttonContent}>
                <MaterialCommunityIcons
                  name="timer-outline"
                  size={24}
                  color={Colors.white}
                />
                <CustomText style={styles.buttonText}>+5초</CustomText>
              </View>
              <View style={styles.buttonHint}>
                <CustomText style={styles.buttonHintText}>길게 누르면 즉시 촬영</CustomText>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Camera Switch Button */}
          <TouchableOpacity
            style={styles.cameraToggleButton}
            onPress={toggleCamera}
          >
            <MaterialCommunityIcons
              name="camera-flip"
              size={24}
              color={Colors.white}
            />
          </TouchableOpacity>

          {/* Hide/Show Controls Button */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleControls}
          >
            <Ionicons
              name={showControls ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={Colors.white}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Progress Bar Styles
  progressContainer: {
    position: 'absolute',
    top: 60,
    left: Spacing.containerPadding,
    right: Spacing.containerPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.overlayLight,
    borderRadius: Radius.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xs,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    textShadowColor: Colors.overlayDark,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    minWidth: 32,
    textAlign: 'center',
  },

  // Countdown Styles
  countdownContainer: {
    position: 'absolute',
    top: screenHeight * 0.35,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 96,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textShadowColor: Colors.overlayDark,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    textAlign: 'center',
  },

  // Hint Text
  hintContainer: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white,
    textAlign: 'center',
    backgroundColor: Colors.overlayDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },

  // Control Button Styles
  controlButton: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  multiButton: {
    backgroundColor: Colors.overlayDark,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    ...Shadow.medium,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  buttonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  buttonHint: {
    marginTop: Spacing.xs,
  },
  buttonHintText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  // Camera Toggle Button
  cameraToggleButton: {
    position: 'absolute',
    bottom: 60,
    left: Spacing.containerPadding,
    backgroundColor: Colors.overlayDark,
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.medium,
  },

  // Toggle Button
  toggleButton: {
    position: 'absolute',
    bottom: 60,
    right: Spacing.containerPadding,
    backgroundColor: Colors.overlayDark,
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CameraScreen;
