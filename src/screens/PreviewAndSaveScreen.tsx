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

      await apiService.uploadPhoto(base64, selectedFriends, photoVisibility);

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
      await Print.printAsync({
        uri: imageUri,
      });
    } catch (error: any) {
      if (
        error.message &&
        error.message.includes('Printing did not complete')
      ) {
        console.log('Printing was cancelled by the user.');
      } else {
        console.error('Error printing image:', error);
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

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.primaryAction} onPress={saveToAlbum}>
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

          <TouchableOpacity style={styles.secondaryAction} onPress={printImage}>
            <Ionicons name="print-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.secondaryActionText}>출력</Text>
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
});

export default PreviewAndSaveScreen;
