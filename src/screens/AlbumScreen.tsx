import React, { useMemo, useState, useEffect } from 'react';
import { ScrollView, Image, StyleSheet, Dimensions, View, Modal, Pressable, TouchableOpacity, Alert, Text } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { apiService } from '../services/apiService';

type FrameType = '1x4' | '2x2' | '3x2' | 'Vertical 4-cut' | '4-cut grid' | '6-cut grid';
interface Photo { id: string; url: string; frameType: FrameType; }

const { width } = Dimensions.get('window');
const GAP = 4;

// 배열을 n개씩 묶는 헬퍼
function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export default function AlbumScreen() {
  const route = useRoute();
  const { userId, userName, newImageUri, frameType, refresh } = (route.params || {}) as { userId?: number; userName?: string; newImageUri?: string; frameType?: FrameType, refresh?: boolean };

  const [appPhotos, setAppPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [selectedPhotoForAction, setSelectedPhotoForAction] = useState<Photo | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const fetchPhotos = async () => {
    try {
      let photos;
      if (userId) {
        photos = await apiService.getFriendPhotos(userId);
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
      const html = `
        <html>
          <body style="margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; height: 100vh;">
            <img src="${photo.url}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </body>
        </html>
      `;
      
      await Print.printAsync({
        html,
        width: 612, // A4 width in points
        height: 792, // A4 height in points
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

  // 전체 사용 가능한 화면 너비 (마진 제외)
  const availableWidth = width - GAP * 2;



  // 사진들을 2개씩 묶어서 각 행(Row) 구성
  const rows = useMemo(() => chunkArray(appPhotos, 2), [appPhotos]);




  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {rows.map((rowPhotos: Photo[], rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {rowPhotos.map(photo => {
              const getRatio = (p: Photo) => {
                switch (p.frameType) {
                  case '1x4':
                  case 'Vertical 4-cut':
                    return 70 / 270; // width / height
                  case '2x2':
                  case '3x2':
                  case '4-cut grid':
                  case '6-cut grid':
                    return 140 / 240; // width / height
                  default:
                    return 1;
                }
              };

              let photoWidth = 0;
              let calculatedHeight = 0;
              const photoRatio = getRatio(photo);

              if (rowPhotos.length === 1) {
                // 한 행에 사진이 하나일 경우, 좌우 여백(GAP/2 * 2 = GAP)을 제외한 나머지 공간을 모두 차지합니다.
                photoWidth = availableWidth - GAP;
                calculatedHeight = photoWidth / photoRatio;

              } else if (rowPhotos.length === 2) {
                const ratio1 = getRatio(rowPhotos[0]);
                const ratio2 = getRatio(rowPhotos[1]);

                // 두 사진의 너비 합 + 사진 사이의 여백(GAP)이 전체 가용 너비를 채우도록 계산합니다.
                // (w1 + w2) + GAP = availableWidth
                const totalImageWidth = availableWidth - GAP;
                
                // h = total_width / (r1 + r2) 공식을 사용하여 모든 사진의 높이를 동일하게 맞춥니다.
                calculatedHeight = totalImageWidth / (ratio1 + ratio2);
                
                // 계산된 높이와 각 사진의 비율을 곱해 최종 너비를 구합니다.
                photoWidth = photoRatio * calculatedHeight;
              }

              return (
                <TouchableOpacity
                  key={photo.id}
                  style={{ width: photoWidth, height: calculatedHeight, marginHorizontal: GAP / 2 }}
                  activeOpacity={0.8}
                  onPress={() => setSelectedPhoto(photo)}
                >
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

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
  container: {
    padding: GAP,
    backgroundColor: '#f5f5f5',

  },
  row: {
    flexDirection: 'row',
    marginBottom: GAP,
    justifyContent: 'flex-start',

  },
  image: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: '#ddd',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 8,
  },
  // saveButton: {
  //   marginTop: 24,
  //   paddingVertical: 14,
  //   paddingHorizontal: 32,
  //   backgroundColor: '#599EF1',
  //   borderRadius: 24,
  //   // iOS 그림자
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 3 },
  //   shadowOpacity: 0.3,
  //   shadowRadius: 4,
  //   // Android 그림자
  //   elevation: 6,
  // },
  // saveText: {
  //   color: '#fff',
  //   fontSize: 18,
  //   fontWeight: '600',
  //   letterSpacing: 0.5,
  // },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    // 터치 영역 확장
    padding: 8,
  },
  // Action Menu Styles
  actionModalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  actionMenu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    minWidth: 280,
    maxWidth: width * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1001,
  },
  actionMenuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionMenuItemDisabled: {
    opacity: 0.5,
  },
  actionMenuText: {
    fontSize: 16,
    marginLeft: 16,
    color: '#34495E',
    fontWeight: '500',
  },
  deleteMenuItem: {
    backgroundColor: '#fdf2f2',
  },
  deleteMenuText: {
    color: '#e74c3c',
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
    textAlign: 'center',
  },
});