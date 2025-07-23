//src/screens/PreviewAndSaveScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  StatusBar,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';
import { printImageSafely, isPrintingAvailable } from '../utils/printUtils';
import { composeImageWithQRCode, composeImageWithProgress, CompositionProgressCallback, calculateViewShotCompositionProps } from '../utils/imageCompositionUtils';
import { validateQRCodeValue } from '../utils/qrCodeUtils';
import { handlePrintError, handleQRCodeError, handleImageCompositionError, checkSystemResources } from '../utils/errorHandlingUtils';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Theme from '../constants/theme';

type RootStackParamList = {
  PreviewAndSave: { imageUri: string; cutType: string };
  Album: { userId?: number; userName?: string; newImageUri: string; frameType: string };
};

type PreviewAndSaveScreenRouteProp = RouteProp<
  RootStackParamList,
  'PreviewAndSave'
>;

type PreviewAndSaveScreenNavigationProp = StackNavigationProp<any>;

import * as FileSystem from 'expo-file-system';
import { apiService } from '../services/apiService';
import PhotoPermissionSelector, { PhotoVisibility } from '../components/PhotoPermissionSelector';

const { width, height } = Dimensions.get('window');
const { Colors, Typography, Spacing, Radius, Shadow } = Theme;

const PreviewAndSaveScreen = () => {
  const route = useRoute<PreviewAndSaveScreenRouteProp>();
  const navigation = useNavigation<PreviewAndSaveScreenNavigationProp>();
  const { imageUri, cutType } = route.params;

  const [friends, setFriends] = useState<{ id: number; name: string }[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(1);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [photoVisibility, setPhotoVisibility] = useState<PhotoVisibility>('ALL_FRIENDS');
  const [showPermissionSelector, setShowPermissionSelector] = useState(false);
  const [includeQRCode, setIncludeQRCode] = useState(false);
  const [isComposingImage, setIsComposingImage] = useState(false);
  const [compositionProgress, setCompositionProgress] = useState(0);
  const [compositionStage, setCompositionStage] = useState('');
  const [s3ImageUrl, setS3ImageUrl] = useState<string>('');
  const [photoId, setPhotoId] = useState<number | null>(null);
  const [isPrintAvailable, setIsPrintAvailable] = useState(false);

  // State for tracking section heights for dynamic layout
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const [qrSectionHeight, setQrSectionHeight] = useState<number>(0);
  const [actionButtonsHeight, setActionButtonsHeight] = useState<number>(0);
  const [availableImageSpace, setAvailableImageSpace] = useState<number>(height * 0.55);

  // ViewShot ref for image composition
  const compositionViewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const data = await apiService.getFriends();
        setFriends(data); // [{id, name}...]
      } catch (error) {
        console.error('친구 목록 불러오기 실패:', error);
      }
    };
    fetchFriends();

    // 인쇄 기능 사용 가능 여부 확인
    const checkPrintAvailability = async () => {
      const available = await isPrintingAvailable();
      setIsPrintAvailable(available);

      // 시스템 리소스 체크
      const resources = await checkSystemResources();
      if (resources.memoryWarning || resources.storageWarning) {
        console.warn('System resource warning:', resources);
      }
    };
    checkPrintAvailability();

    // 임시 공유 링크 생성 (QR 코드 미리보기용)
    // const generateTemporaryShareLink = () => {
    //   const timestamp = Date.now();
    //   const tempLink = `https://cutprint.app/temp/${timestamp}`;
    //   setShareLink(tempLink);
    // };
    // generateTemporaryShareLink();
  }, []);

  useEffect(() => {
    // Get image dimensions to calculate aspect ratio
    if (imageUri) {
      Image.getSize(
        imageUri,
        (imageWidth, imageHeight) => {
          const aspectRatio = imageWidth / imageHeight;
          setImageAspectRatio(aspectRatio);
          setImageDimensions({ width: imageWidth, height: imageHeight });
          console.log('Image dimensions loaded:', { imageWidth, imageHeight, aspectRatio });
        },
        (error) => {
          console.error('Error getting image size:', error);
          // Fallback to square aspect ratio
          setImageAspectRatio(1);
          // Set fallback dimensions for ViewShot consistency
          setImageDimensions({ width: 400, height: 400 });
        }
      );
    }
  }, [imageUri]);

  // Update available image space when section heights change
  useEffect(() => {
    const newAvailableSpace = calculateAvailableImageSpace();
    setAvailableImageSpace(newAvailableSpace);
  }, [headerHeight, qrSectionHeight, actionButtonsHeight, height]);

  // Calculate available space for image based on measured section heights
  const calculateAvailableImageSpace = () => {
    const statusBarHeight = StatusBar.currentHeight || 0;
    const safeAreaPadding = 40; // Approximate safe area padding
    const usedSpace = statusBarHeight + safeAreaPadding + headerHeight + qrSectionHeight + actionButtonsHeight;
    const padding = Spacing.xl * 2; // Top and bottom padding for preview container
    const availableSpace = height - usedSpace - padding;

    // Ensure minimum space (at least 200px for image)
    return Math.max(availableSpace, 200);
  };

  // Calculate optimal container dimensions based on image aspect ratio and available space
  const getOptimalImageContainerStyle = () => {
    const maxWidth = width - (2 * Spacing.containerPadding);
    const maxHeight = availableImageSpace;

    let containerWidth = maxWidth;
    let containerHeight = maxWidth; // Default square

    if (imageAspectRatio > 0) {
      if (imageAspectRatio > 1) {
        // Landscape image: width-constrained
        containerWidth = maxWidth;
        containerHeight = maxWidth / imageAspectRatio;

        // If height exceeds max, constrain by height
        if (containerHeight > maxHeight) {
          containerHeight = maxHeight;
          containerWidth = maxHeight * imageAspectRatio;
        }
      } else {
        // Portrait image: height-constrained
        containerHeight = Math.min(maxHeight, maxWidth / imageAspectRatio);
        containerWidth = containerHeight * imageAspectRatio;
      }
    }

    return {
      width: containerWidth,
      height: containerHeight,
    };
  };

  const saveToAlbum = async () => {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const result = await apiService.uploadPhoto(base64, selectedFriends, photoVisibility);

      // 업로드 후 photo ID와 S3 URL 저장
      if (result && result.id) {
        setPhotoId(result.id);

        // S3 URL 직접 사용 (QR 코드에 S3 객체 URL 포함)
        if (result.url) {
          setS3ImageUrl(result.url);
        }
      }

      // @ts-ignore
      navigation.navigate('Main', { screen: 'Album', params: { newImageUri: imageUri, frameType: cutType, refresh: true, friends: selectedFriends } });
      Alert.alert('저장 완료', '사진이 앱 앨범에 저장되었습니다.');
    } catch (error) {
      console.error('Error saving photo to album:', error);
      Alert.alert('오류', '사진을 앱 앨범에 저장하는 중 오류가 발생했습니다.');
    }
  };

  // ViewShot을 사용한 이미지 합성 함수
  const composeImageWithViewShot = async (): Promise<string> => {
    try {
      if (!compositionViewShotRef.current || !compositionViewShotRef.current.capture) {
        throw new Error('ViewShot ref not available');
      }

      // 이미지 크기가 로드되지 않은 경우 에러
      if (!imageDimensions.width || !imageDimensions.height) {
        throw new Error('Image dimensions not loaded. Please wait for image to load completely.');
      }

      setIsComposingImage(true);
      setCompositionStage('이미지 합성 중...');
      setCompositionProgress(75);

      console.log('Starting ViewShot capture with dimensions:', imageDimensions);

      // ViewShot으로 합성된 이미지 캡처
      const capturedUri = await compositionViewShotRef.current.capture();

      console.log('ViewShot capture completed:', capturedUri);

      setCompositionProgress(100);
      setCompositionStage('완료');

      return capturedUri;
    } catch (error) {
      console.error('ViewShot composition error:', error);
      throw new Error('이미지 합성 중 오류가 발생했습니다.');
    } finally {
      setIsComposingImage(false);
    }
  };

  const printImage = async () => {
    try {
      if (!isPrintAvailable) {
        Alert.alert('인쇄 불가', '현재 기기에서는 인쇄 기능을 사용할 수 없습니다.');
        return;
      }

      // QR 코드 포함 옵션이 선택되지 않은 경우 - AlbumScreen과 동일한 직접 인쇄 방식 사용
      if (!includeQRCode) {
        await proceedWithDirectPrint(imageUri);
        return;
      }

      let finalImageUri: string = imageUri;

      // QR 코드 포함 옵션이 선택된 경우 - ViewShot으로 이미지 합성
      if (includeQRCode && s3ImageUrl) {
        try {
          // QR 코드 값 유효성 검증 (S3 URL 사용)
          const validation = validateQRCodeValue(s3ImageUrl);
          if (!validation.isValid) {
            throw new Error(validation.error);
          }

          // ViewShot을 사용하여 이미지 합성
          const composedImageUri = await composeImageWithViewShot();
          finalImageUri = composedImageUri;

        } catch (compositionError) {
          console.error('이미지 합성 실패:', compositionError);

          // 이미지 합성 실패 시 사용자에게 선택권 제공
          Alert.alert(
            '이미지 합성 오류',
            '이미지와 QR 코드를 합성할 수 없습니다. QR 코드 없이 인쇄하시겠습니까?',
            [
              { text: '취소', style: 'cancel' },
              { text: 'QR 없이 인쇄', onPress: () => proceedWithDirectPrint(imageUri) }
            ]
          );
          return;
        }
      } else if (includeQRCode && !s3ImageUrl) {
        // S3 URL이 없는 경우 사용자 안내
        Alert.alert(
          'QR 코드 알림',
          'QR 코드를 생성하려면 먼저 "앱 앨범에 저장"을 눌러주세요. 계속 인쇄하시겠습니까?',
          [
            { text: '취소', style: 'cancel' },
            { text: 'QR 없이 인쇄', onPress: () => proceedWithDirectPrint(imageUri) },
            {
              text: '저장 후 인쇄', onPress: () => {
                Alert.alert('안내', '먼저 앨범에 저장한 후 다시 인쇄해주세요.');
              }
            }
          ]
        );
        return;
      }

      // 합성된 이미지로 인쇄 (복잡한 방식)
      await proceedWithPrint(finalImageUri);

    } catch (error: any) {
      if (error?.message?.includes('Printing did not complete')) {
        // 사용자가 인쇄를 취소한 경우: 아무것도 하지 않음
        return;
      }
      console.error('Print preparation error:', error);
      Alert.alert('오류', '인쇄 준비 중 오류가 발생했습니다.');
    }
  };

  const proceedWithPrint = async (uri: string) => {
    try {
      // 합성된 단일 이미지로 인쇄 (QR 코드가 이미 포함되어 있음)
      await printImageSafely({
        imageUri: uri,
        title: '',
        orientation: 'portrait'
      });
    } catch (error: any) {
      if (error?.message?.includes('Printing did not complete')) {
        // 사용자가 인쇄를 취소한 경우: 아무것도 하지 않음
        return;
      }
      console.error('Printing failed:', error);

      // 추가적인 에러 핸들링
      handlePrintError(error, uri, {
        fallbackAction: () => proceedWithPrint(uri),
        logError: true
      });
    }
  };

  const proceedWithDirectPrint = async (uri: string) => {
    try {
      // AlbumScreen과 동일한 직접 인쇄 방식 - 원본 이미지 크기 유지
      await Print.printAsync({
        uri: uri,
      });
    } catch (e: any) {
      if (e.message === 'Printing did not complete') {
        // 사용자가 취소한 경우: 무시하거나 안내 메시지
      } else {
        // 그 외 에러는 로그
        console.error('Direct printing error:', e);
        Alert.alert('오류', '인쇄 중 오류가 발생했습니다.');
      }
    }
  };

  const shareToInstagramStory = async () => {
    try {
      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/jpeg',
        UTI: 'com.instagram.sharedSticker.backgroundImage',
        dialogTitle: '인스타그램 스토리에 공유',
      });
    } catch (error) {
      console.error('Error sharing to Instagram Story:', error);
      Alert.alert('오류', '공유하는 중 오류가 발생했습니다.');
    }
  };

  const QrCodeComponent = QRCode as any;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View
        style={styles.header}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setHeaderHeight(height);
        }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>미리보기</Text>
          <Text style={styles.headerSubtitle}>사진을 인쇄하고 공유하기</Text>
        </View>
        <TouchableOpacity
          style={styles.friendButton}
          onPress={() => setShowFriendSelector(true)}
        >
          <Ionicons name="person-add" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Preview Image */}
      <View style={styles.previewContainer}>
        <View style={[styles.imageFrame, getOptimalImageContainerStyle()]}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        </View>
      </View>

      {/* QR Code Options */}
      <View
        style={styles.qrOptionsContainer}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setQrSectionHeight(height);
        }}
      >
        <TouchableOpacity
          style={styles.qrToggleContainer}
          onPress={() => setIncludeQRCode(!includeQRCode)}
          activeOpacity={0.7}
        >
          <View style={styles.qrToggleLeft}>
            <MaterialCommunityIcons
              name="qrcode"
              size={20}
              color={includeQRCode ? Colors.textPrimary : Colors.textSecondary}
            />
            <Text style={[
              styles.qrToggleText,
              { color: includeQRCode ? Colors.textPrimary : Colors.textSecondary }
            ]}>
              QR 코드 포함하여 인쇄
            </Text>
          </View>
          <View style={[
            styles.qrToggleSwitch,
            { backgroundColor: includeQRCode ? Colors.textPrimary : Colors.gray300 }
          ]}>
            <View style={[
              styles.qrToggleThumb,
              {
                transform: [{ translateX: includeQRCode ? 18 : 2 }],
                backgroundColor: Colors.white
              }
            ]} />
          </View>
        </TouchableOpacity>

        {includeQRCode && (
          <View style={styles.qrPreviewContainer}>
            <QRCode
              value={s3ImageUrl || 'https://cutprint.app'}
              size={60}
              backgroundColor="white"
              color="black"
            />
            <Text style={styles.qrPreviewText}>
              {!s3ImageUrl
                ? '사진 저장 후 S3 URL로 업데이트됩니다'
                : '사진 우하단에 S3 이미지 URL QR 코드가 추가됩니다'
              }
            </Text>
          </View>
        )}
      </View>

      {/* Composition Progress */}
      {isComposingImage && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${compositionProgress}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {compositionStage} ({Math.round(compositionProgress)}%)
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View
        style={styles.actionContainer}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setActionButtonsHeight(height);
        }}
      >
        <TouchableOpacity
          style={[
            styles.primaryAction,
            { opacity: isComposingImage ? 0.5 : 1 }
          ]}
          onPress={saveToAlbum}
          disabled={isComposingImage}
        >
          <Ionicons name="download" size={24} color={Colors.white} />
          <Text style={styles.primaryActionText}>앱 앨범에 저장</Text>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => setShowPermissionSelector(true)}
          >
            <MaterialCommunityIcons
              name={photoVisibility === 'PRIVATE' ? 'lock' : photoVisibility === 'CLOSE_FRIENDS' ? 'star' : 'account-group'}
              size={20}
              color={Colors.textPrimary}
            />
            <Text style={styles.secondaryActionText}>공개 설정</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryAction,
              { opacity: (isComposingImage || !isPrintAvailable) ? 0.5 : 1 }
            ]}
            onPress={printImage}
            disabled={isComposingImage || !isPrintAvailable}
          >
            <Ionicons name="print-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.secondaryActionText}>
              {isPrintAvailable ? '출력' : '인쇄불가'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryAction} onPress={shareToInstagramStory}>
            <MaterialCommunityIcons name="share-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.secondaryActionText}>공유</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Friend Selector Modal */}
      <Modal
        visible={showFriendSelector}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFriendSelector(false)}
      >
        <Pressable
          style={styles.modalBackground}
          onPress={() => setShowFriendSelector(false)}
        >
          <View style={styles.friendModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>친구와 함께 저장하기</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFriendSelector(false)}
              >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.friendList}>
              {friends.length === 0 ? (
                <View style={styles.emptyFriends}>
                  <Ionicons name="person-outline" size={48} color={Colors.gray400} />
                  <Text style={styles.emptyFriendsText}>No friends yet</Text>
                </View>
              ) : (
                friends.map(friend => {
                  const selected = selectedFriends.includes(friend.id);
                  return (
                    <TouchableOpacity
                      key={friend.id}
                      style={[styles.friendItem, selected && styles.friendItemSelected]}
                      onPress={() => {
                        setSelectedFriends(prev =>
                          prev.includes(friend.id)
                            ? prev.filter(id => id !== friend.id)
                            : [...prev, friend.id]
                        );
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.friendInfo}>
                        <View style={[styles.avatar, selected && styles.avatarSelected]}>
                          <Text style={[styles.avatarText, selected && styles.avatarTextSelected]}>
                            {friend.name[0].toUpperCase()}
                          </Text>
                        </View>
                        <Text style={[styles.friendName, selected && styles.friendNameSelected]}>
                          {friend.name}
                        </Text>
                      </View>
                      <Ionicons
                        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={24}
                        color={selected ? Colors.textPrimary : Colors.gray400}
                      />
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => setShowFriendSelector(false)}
            >
              <Text style={styles.confirmButtonText}>
                {selectedFriends.length > 0 ? `${selectedFriends.length}명의 친구 선택 완료` : '완료'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Photo Permission Selector Modal */}
      <PhotoPermissionSelector
        visible={showPermissionSelector}
        currentVisibility={photoVisibility}
        onSelect={(visibility) => {
          setPhotoVisibility(visibility);
        }}
        onClose={() => setShowPermissionSelector(false)}
      />

      {/* Hidden ViewShot for Image Composition */}
      {includeQRCode && s3ImageUrl && imageDimensions.width > 0 && imageDimensions.height > 0 && (
        <View style={styles.hiddenCompositionView}>
          <ViewShot
            ref={compositionViewShotRef}
            options={{ format: 'png', quality: 1 }}
            style={[
              styles.compositionContainer,
              calculateViewShotCompositionProps(
                imageDimensions.width,
                imageDimensions.height,
                Math.min(imageDimensions.width, imageDimensions.height) * 0.15
              ).containerStyle
            ]}
          >
            {/* Background Image */}
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.compositionImage,
                calculateViewShotCompositionProps(
                  imageDimensions.width,
                  imageDimensions.height,
                  Math.min(imageDimensions.width, imageDimensions.height) * 0.15
                ).imageStyle
              ]}
              resizeMode="contain"
            />

            {/* QR Code Overlay */}
            <View
              style={[
                styles.compositionQRContainer,
                calculateViewShotCompositionProps(
                  imageDimensions.width,
                  imageDimensions.height,
                  Math.min(imageDimensions.width, imageDimensions.height) * 0.15,
                  'bottom-right'
                ).qrCodeStyle
              ]}
            >
              <QRCode
                value={s3ImageUrl}
                size={calculateViewShotCompositionProps(
                  imageDimensions.width,
                  imageDimensions.height,
                  Math.min(imageDimensions.width, imageDimensions.height) * 0.15
                ).adjustedQRSize}
                backgroundColor="white"
                color="black"
              />
            </View>
          </ViewShot>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerPadding,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  friendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },

  // Preview Section
  previewContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerPadding,
    paddingVertical: Spacing.md,
    minHeight: 200, // Ensure minimum space for image
  },
  imageFrame: {
    overflow: 'hidden',
    backgroundColor: Colors.gray50,
    alignSelf: 'center',
    ...Shadow.medium,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },

  // Action Buttons
  actionContainer: {
    paddingHorizontal: Spacing.containerPadding,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  primaryAction: {
    backgroundColor: Colors.textPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  primaryActionText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.gray300,
    backgroundColor: Colors.white,
  },
  secondaryActionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginLeft: Spacing.xs,
  },

  // Friend Modal Styles
  modalBackground: {
    flex: 1,
    backgroundColor: Colors.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendModal: {
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: height * 0.7,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    ...Shadow.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
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

  // Friend List
  friendList: {
    maxHeight: height * 0.4,
    paddingHorizontal: Spacing.xl,
  },
  emptyFriends: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyFriendsText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.surfaceVariant,
  },
  friendItemSelected: {
    backgroundColor: Colors.gray100,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarSelected: {
    backgroundColor: Colors.textPrimary,
  },
  avatarText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  avatarTextSelected: {
    color: Colors.white,
  },
  friendName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  friendNameSelected: {
    fontWeight: Typography.fontWeight.semibold,
  },

  // Confirm Button
  confirmButton: {
    backgroundColor: Colors.textPrimary,
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },

  // QR Code Options Styles
  qrOptionsContainer: {
    paddingHorizontal: Spacing.containerPadding,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    backgroundColor: Colors.white,
  },
  qrToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  qrToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  qrToggleText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: Spacing.sm,
  },
  qrToggleSwitch: {
    width: 40,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    position: 'relative',
  },
  qrToggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    position: 'absolute',
  },
  qrPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  qrPreviewText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.md,
    flex: 1,
  },

  // Progress Styles
  progressContainer: {
    paddingHorizontal: Spacing.containerPadding,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.gray50,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.textPrimary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },

  // Hidden ViewShot Composition Styles
  hiddenCompositionView: {
    position: 'absolute',
    top: -10000, // Hide off-screen
    left: -10000,
    opacity: 0,
  },
  compositionContainer: {
    backgroundColor: 'transparent',
  },
  compositionImage: {
    // Style will be calculated dynamically
  },
  compositionQRContainer: {
    // Style will be calculated dynamically
  },
});

export default PreviewAndSaveScreen;
