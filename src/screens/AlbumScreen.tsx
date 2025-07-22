import React, { useMemo, useState, useEffect } from 'react';
import {
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  View,
  Modal,
  Pressable,
  TouchableOpacity,
  Alert,
  Text,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  FlatList
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../services/apiService';
import Theme from '../constants/theme';

type FrameType = '1x4' | '2x2' | '3x2' | 'Vertical 4-cut' | '4-cut grid' | '6-cut grid';
interface Photo { id: string; url: string; frameType: FrameType; }

const { width, height } = Dimensions.get('window');
const { Colors, Typography, Spacing, Radius, Shadow } = Theme;


export default function AlbumScreen() {
  const route = useRoute();
  const { userId, userName, newImageUri, frameType, refresh } = (route.params || {}) as { userId?: number; userName?: string; newImageUri?: string; frameType?: FrameType, refresh?: boolean };

  const [appPhotos, setAppPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [selectedPhotoForAction, setSelectedPhotoForAction] = useState<Photo | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPhotos = async () => {
    try {
      let photos;
      if (userId) {
        photos = await apiService.getUserPhotos(userId);
        // console.log(userId);
      } else {
        photos = await apiService.getMyPhotos();
        // console.log(photos);
      }
      setAppPhotos(photos.map(p => ({ ...p, frameType: '2x2' }))); // Assuming a default frameType for now
    } catch (error) {
      console.error('Error fetching photos:', error);
      Alert.alert('오류', '사진을 불러오는 중 오류가 발생했습니다.');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchPhotos();
    }, [])
  );

  useEffect(() => {
    if (refresh) {
      fetchPhotos();
    }
  }, [refresh]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPhotos();
    setRefreshing(false);
  };

  // Header Component - Minimal Design like LoginScreen
  const AlbumHeader = () => (
    <SafeAreaView style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerSubtitle}>{appPhotos.length} photos</Text>
        </View>
      </View>
    </SafeAreaView>
  );

  const handleDeletePhoto = async (photo: Photo) => {
    Alert.alert(
      '사진 삭제',
      '이 사진을 삭제하시겠습니까? 삭제된 사진은 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading('deleting');
              await apiService.deletePhoto(parseInt(photo.id));
              await fetchPhotos(); // 목록 새로고침
              Alert.alert('성공', '사진이 삭제되었습니다.');
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('오류', '사진 삭제 중 오류가 발생했습니다.');
            } finally {
              setLoading(null);
              setShowActionMenu(false);
              setSelectedPhotoForAction(null);
              setSelectedPhoto(null); // 삭제 후에는 전체화면도 닫기
            }
          },
        },
      ]
    );
  };

  const handleSharePhoto = async (photo: Photo) => {
    try {
      setLoading('sharing');
      const fileUri = FileSystem.documentDirectory + `photo_${photo.id}.jpg`;

      // 이미지를 임시 파일로 다운로드
      const downloadResult = await FileSystem.downloadAsync(photo.url, fileUri);

      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        throw new Error('Failed to download image');
      }
    } catch (error) {
      console.error('Error sharing photo:', error);
      Alert.alert('오류', '사진 공유 중 오류가 발생했습니다.');
    } finally {
      setLoading(null);
      setShowActionMenu(false);
      setSelectedPhotoForAction(null);
    }
  };

  const handlePrintPhoto = async (photo: Photo) => {
    try {
      setLoading('printing');

      await Print.printAsync({
        uri: photo.url,
      });
    } catch (e: any) {
      if (e.message === 'Printing did not complete') {
        // 사용자가 취소한 경우: 무시하거나 안내 메시지
      } else {
        // 그 외 에러는 로그
        console.error('Printing error:', e);
      }
    } finally {
      setLoading(null);
      setShowActionMenu(false);
      setSelectedPhotoForAction(null);
    }
  };

  const handleSaveToGallery = async (photo: Photo) => {
    try {
      setLoading('saving');

      // 미디어 라이브러리 권한 확인
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('권한 필요', '갤러리에 저장하려면 사진 접근 권한이 필요합니다.');
        return;
      }

      // 이미지를 임시 파일로 다운로드
      const fileUri = FileSystem.documentDirectory + `photo_${photo.id}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(photo.url, fileUri);

      if (downloadResult.status === 200) {
        // 갤러리에 저장
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        await MediaLibrary.createAlbumAsync('Cutprint', asset, false);
        Alert.alert('성공', '사진이 갤러리에 저장되었습니다.');
      } else {
        throw new Error('Failed to download image');
      }
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert('오류', '갤러리 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(null);
      setShowActionMenu(false);
      setSelectedPhotoForAction(null);
    }
  };

  const openActionMenu = (photo: Photo) => {
    setSelectedPhotoForAction(photo);
    setShowActionMenu(true);
  };

  // 3-Column Grid Configuration
  const numColumns = 3;
  const gridSpacing = Spacing.xs;
  const sidePadding = 8; // 원하는 값으로
  const itemSize = (width - sidePadding * 2 - (numColumns - 1) * gridSpacing) / numColumns;

  // Photo Item Component - Minimal Design
  const PhotoItem = ({ item, index }: { item: Photo, index: number }) => (
    <TouchableOpacity
      style={[
        styles.photoItem,
        {
          width: itemSize,
          height: itemSize,
          marginRight: (index + 1) % numColumns === 0 ? 0 : gridSpacing
        }
      ]}
      activeOpacity={0.9}
      onPress={() => setSelectedPhoto(item)}
    >
      <Image
        source={{ uri: item.url }}
        style={styles.photoImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  // Empty State Component
  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="camera-outline" size={64} color={Colors.gray400} />
      <Text style={styles.emptyTitle}>No Photos Yet</Text>
      <Text style={styles.emptySubtitle}>
        Take your first photo to see it here
      </Text>
    </View>
  );




  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <AlbumHeader />

      {appPhotos.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={appPhotos}
          renderItem={PhotoItem}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={styles.photoGrid}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={12}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          getItemLayout={(data, index) => ({
            length: itemSize,
            offset: Math.floor(index / numColumns) * (itemSize + gridSpacing),
            index,
          })}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.textPrimary]}
              tintColor={Colors.textPrimary}
            />
          }
        />
      )}

      {/* 전체화면 모달 */}
      {selectedPhoto && !showActionMenu && (
        <Modal
          visible={true}
          transparent={true}
          onRequestClose={() => setSelectedPhoto(null)}
        >
          <Pressable
            style={styles.modalBackground}
            onPress={() => {
              if (!showActionMenu) {
                setSelectedPhoto(null);
              }
            }}
          >
            <Image
              source={{ uri: selectedPhoto.url }}
              style={styles.fullImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.fab}
              onPress={(e) => {
                e.stopPropagation();
                if (selectedPhoto) {
                  openActionMenu(selectedPhoto);
                }
              }}
            >
              <MaterialCommunityIcons name="dots-vertical" size={28} color="#fff" />
            </TouchableOpacity>
          </Pressable>
        </Modal>
      )}

      {/* 액션 메뉴 모달 */}
      {showActionMenu && selectedPhotoForAction && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowActionMenu(false)}
        >
          <Pressable style={styles.actionModalBackground} onPress={() => {
            setShowActionMenu(false);
            setSelectedPhotoForAction(null);
          }}>
            <View style={styles.actionMenu}>
              <Text style={styles.actionMenuTitle}>사진 옵션</Text>

              <TouchableOpacity
                style={[styles.actionMenuItem, loading === 'sharing' && styles.actionMenuItemDisabled]}
                onPress={() => handleSharePhoto(selectedPhotoForAction)}
                disabled={loading !== null}
              >
                <MaterialCommunityIcons name="share" size={24} color="#34495E" />
                <Text style={styles.actionMenuText}>공유하기</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionMenuItem, loading === 'printing' && styles.actionMenuItemDisabled]}
                onPress={() => handlePrintPhoto(selectedPhotoForAction)}
                disabled={loading !== null}
              >
                <MaterialCommunityIcons name="printer" size={24} color="#34495E" />
                <Text style={styles.actionMenuText}>인쇄하기</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionMenuItem, loading === 'saving' && styles.actionMenuItemDisabled]}
                onPress={() => handleSaveToGallery(selectedPhotoForAction)}
                disabled={loading !== null}
              >
                <MaterialCommunityIcons name="download" size={24} color="#34495E" />
                <Text style={styles.actionMenuText}>갤러리 저장</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionMenuItem, styles.deleteMenuItem, loading === 'deleting' && styles.actionMenuItemDisabled]}
                onPress={() => handleDeletePhoto(selectedPhotoForAction)}
                disabled={loading !== null}
              >
                <MaterialCommunityIcons name="delete" size={24} color="#e74c3c" />
                <Text style={[styles.actionMenuText, styles.deleteMenuText]}>삭제하기</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowActionMenu(false);
                  setSelectedPhotoForAction(null);
                }}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  // Header Styles - Minimal like LoginScreen
  header: {
    backgroundColor: Colors.white,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  headerContent: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.sm,
  },
  headerLeft: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
  },

  // Photo Grid Styles - Minimal Design
  photoGrid: {
    paddingHorizontal: 8, // ← 좌우만 8px로
    paddingTop: Spacing.containerPadding,
    paddingBottom: Spacing.xl,
  },
  photoItem: {
    marginBottom: Spacing.xs,
    overflow: 'hidden',
    backgroundColor: Colors.gray50,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray100,
  },

  // Empty State Styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
  },
  // Fullscreen Modal Styles - Minimal
  modalBackground: {
    flex: 1,
    backgroundColor: Colors.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: Radius.md,
  },
  // FAB Button - Minimal
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.medium,
  },
  // Action Menu Styles - Minimal like LoginScreen modals
  actionModalBackground: {
    flex: 1,
    backgroundColor: Colors.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionMenu: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadow.large,
  },
  actionMenuTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionMenuItemDisabled: {
    opacity: 0.5,
  },
  actionMenuText: {
    fontSize: Typography.fontSize.base,
    marginLeft: Spacing.md,
    color: Colors.textPrimary,
  },
  deleteMenuItem: {
    backgroundColor: Colors.white,
    borderColor: Colors.error,
    borderWidth: 1,
  },
  deleteMenuText: {
    color: Colors.error,
  },
  cancelButton: {
    backgroundColor: Colors.textPrimary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    textAlign: 'center',
  },
});