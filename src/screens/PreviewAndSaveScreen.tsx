//src/screens/PreviewAndSaveScreen.tsx
import React, { useEffect, useState } from 'react';
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
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';
import { printImageSafely, isPrintingAvailable } from '../utils/printUtils';
import { composeImageWithQRCode, composeImageWithProgress, CompositionProgressCallback } from '../utils/imageCompositionUtils';
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
  const [shareLink, setShareLink] = useState<string>('');
  const [photoId, setPhotoId] = useState<number | null>(null);
  const [isPrintAvailable, setIsPrintAvailable] = useState(false);

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
    const generateTemporaryShareLink = () => {
      const timestamp = Date.now();
      const tempLink = `https://cutprint.app/temp/${timestamp}`;
      setShareLink(tempLink);
    };
    generateTemporaryShareLink();
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
        },
        (error) => {
          console.error('Error getting image size:', error);
          // Fallback to square aspect ratio
          setImageAspectRatio(1);
        }
      );
    }
  }, [imageUri]);

  // Calculate optimal container dimensions based on image aspect ratio
  const getOptimalImageContainerStyle = () => {
    const maxWidth = width - (2 * Spacing.containerPadding);
    const maxHeight = height * 0.55; // 55% of screen height for the image area

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

      // 업로드 후 photo ID 저장
      if (result && result.id) {
        setPhotoId(result.id);

        // 공유 링크 생성
        try {
          const linkResponse = await apiService.getPhotoShareLink(result.id);
          setShareLink(linkResponse.shareLink);
        } catch (linkError) {
          console.warn('공유 링크 생성 실패:', linkError);
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

  const printImage = async () => {
    try {
      if (!isPrintAvailable) {
        Alert.alert('인쇄 불가', '현재 기기에서는 인쇄 기능을 사용할 수 없습니다.');
        return;
      }

      let finalImageUri = imageUri;

      // QR 코드 포함 옵션이 선택된 경우 (임시 링크가 아닌 경우에만)
      if (includeQRCode && shareLink && !shareLink.includes('/temp/')) {
        setIsComposingImage(true);

        const progressCallback: CompositionProgressCallback = (progress, stage) => {
          setCompositionProgress(progress);
          setCompositionStage(stage);
        };

        try {
          // QR 코드 값 유효성 검증
          const validation = validateQRCodeValue(shareLink);
          if (!validation.isValid) {
            throw new Error(validation.error);
          }

          // 이미지에 QR 코드 합성
          finalImageUri = await composeImageWithProgress({
            originalImageUri: imageUri,
            qrCodeValue: shareLink,
            qrCodePosition: 'top-right',
            qrCodeSizeRatio: 0.1,
            outputQuality: 0.9,
            outputFormat: 'JPEG'
          }, progressCallback);

        } catch (compositionError) {
          console.error('QR 코드 합성 실패:', compositionError);

          // 개선된 에러 핸들링
          handleImageCompositionError(compositionError, {
            fallbackAction: () => proceedWithPrint(imageUri),
            logError: true
          });
          return;
        } finally {
          setIsComposingImage(false);
        }
      } else if (includeQRCode && shareLink && shareLink.includes('/temp/')) {
        // 임시 링크인 경우 사용자 안내
        Alert.alert(
          'QR 코드 알림',
          '실제 공유 링크를 생성하려면 먼저 "앱 앨범에 저장"을 눌러주세요. 계속 인쇄하시겠습니까?',
          [
            { text: '취소', style: 'cancel' },
            { text: 'QR 없이 인쇄', onPress: () => proceedWithPrint(imageUri) },
            {
              text: '저장 후 인쇄', onPress: () => {
                Alert.alert('안내', '먼저 앨범에 저장한 후 다시 인쇄해주세요.');
              }
            }
          ]
        );
        return;
      }

      await proceedWithPrint(finalImageUri);

    } catch (error: any) {
      console.error('Print preparation error:', error);
      Alert.alert('오류', '인쇄 준비 중 오류가 발생했습니다.');
    }
  };

  const proceedWithPrint = async (uri: string) => {
    try {
      await printImageSafely({
        imageUri: uri,
        title: 'Cutprint Photo',
        orientation: 'portrait'
      });
    } catch (error) {
      console.error('Printing failed:', error);

      // 추가적인 에러 핸들링
      handlePrintError(error, uri, {
        fallbackAction: () => proceedWithPrint(uri),
        logError: true
      });
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
      <View style={styles.header}>
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
      <View style={styles.qrOptionsContainer}>
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
              value={shareLink || 'https://cutprint.app'}
              size={60}
              backgroundColor="white"
              color="black"
            />
            <Text style={styles.qrPreviewText}>
              {shareLink.includes('/temp/')
                ? '사진 저장 후 실제 공유 링크로 업데이트됩니다'
                : '사진 우하단에 QR 코드가 추가됩니다'
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
      <View style={styles.actionContainer}>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerPadding,
    paddingVertical: Spacing.xl,
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
    paddingVertical: Spacing.xl,
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
    paddingVertical: Spacing.md,
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
});

export default PreviewAndSaveScreen;
