import React, { useMemo, useState, useEffect } from 'react';
import { ScrollView, Image, StyleSheet, Dimensions, View, Modal, Pressable, TouchableOpacity, Alert, Text } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

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
  const { newImageUri, frameType } = (route.params || {}) as { newImageUri?: string; frameType?: FrameType };

  const [appPhotos, setAppPhotos] = useState<Photo[]>([
    { id: 'mock1', url: 'https://via.placeholder.com/70x270/FF0000/FFFFFF?text=Vertical+4-cut', frameType: 'Vertical 4-cut' },
    { id: 'mock2', url: 'https://via.placeholder.com/140x240/00FF00/FFFFFF?text=4-cut+grid', frameType: '4-cut grid' },
    { id: 'mock3', url: 'https://via.placeholder.com/70x270/0000FF/FFFFFF?text=1x4', frameType: '1x4' },
    { id: 'mock4', url: 'https://via.placeholder.com/140x240/FFFF00/000000?text=6-cut+grid', frameType: '6-cut grid' },
    { id: 'mock5', url: 'https://via.placeholder.com/140x240/FF00FF/FFFFFF?text=2x2', frameType: '2x2' },
    { id: 'mock6', url: 'https://via.placeholder.com/140x240/00FFFF/000000?text=3x2', frameType: '3x2' },
  ]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    if (newImageUri && frameType) {
      setAppPhotos(prevPhotos => [
        { id: Date.now().toString(), url: newImageUri, frameType: frameType },
        ...prevPhotos,
      ]);
    }
  }, [newImageUri, frameType]);

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
              const ratios = rowPhotos.map(p => {
                switch (p.frameType) {
                  case '1x4':
                  case 'Vertical 4-cut':
                    return 70 / 270;
                  case '2x2':
                  case '3x2':
                  case '4-cut grid':
                  case '6-cut grid':
                    return 140 / 240;
                  default:
                    return 1;
                }
              });

              let calculatedHeight = 0;
              if (ratios.length === 2) {
                calculatedHeight = (availableWidth - GAP * 2) / (ratios[0] + ratios[1]);
              } else if (ratios.length === 1) {
                calculatedHeight = (availableWidth - GAP * 2) / ratios[0];
              }

              let photoWidth = 0;
              if (calculatedHeight > 0) {
                switch (photo.frameType) {
                  case '1x4':
                  case 'Vertical 4-cut':
                    photoWidth = calculatedHeight * (70 / 270);
                    break;
                  case '2x2':
                  case '3x2':
                  case '4-cut grid':
                  case '6-cut grid':
                    photoWidth = calculatedHeight * (140 / 240);
                    break;
                  default:
                    photoWidth = calculatedHeight * 1;
                }
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
      {selectedPhoto && (
        <Modal
          visible={true}
          transparent={true}
          onRequestClose={() => setSelectedPhoto(null)}
        >
          <Pressable style={styles.modalBackground} onPress={() => setSelectedPhoto(null)}>
            <Image
              source={{ uri: selectedPhoto.url }}
              style={styles.fullImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.fab}
              onPress={() => Alert.alert('알림', '이 사진은 앱 앨범에 저장되어 있습니다.')}
            >
              <MaterialCommunityIcons name="information-outline" size={28} color="#fff" />
            </TouchableOpacity>
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
    borderRadius: 6,
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
    backgroundColor: '#34495E',
    // backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6
  }
});