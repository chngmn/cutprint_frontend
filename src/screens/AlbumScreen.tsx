import React, { useMemo, useState } from 'react';
import { ScrollView, Image, StyleSheet, Dimensions, View, Modal, Pressable, TouchableOpacity, Alert, Text } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type FrameType = '1x4' | '2x2' | '3x2';
interface Photo { id: string; url: string; frameType: FrameType; }

// 더미 사진 데이터: frameType별로 섞여 있음
const dummyPhotos: Photo[] = [
  { id: '1',  url: 'https://picsum.photos/seed/1/400',  frameType: '1x4' },
  { id: '2',  url: 'https://picsum.photos/seed/2/400',  frameType: '2x2' },
  { id: '3',  url: 'https://picsum.photos/seed/3/400',  frameType: '3x2' },
  { id: '4',  url: 'https://picsum.photos/seed/4/400',  frameType: '2x2' },
  { id: '5',  url: 'https://picsum.photos/seed/5/400',  frameType: '3x2' },
  { id: '6',  url: 'https://picsum.photos/seed/6/400',  frameType: '1x4' },
  { id: '7',  url: 'https://picsum.photos/seed/7/400',  frameType: '2x2' },
  { id: '8',  url: 'https://picsum.photos/seed/8/400',  frameType: '3x2' },
  { id: '9',  url: 'https://picsum.photos/seed/9/400',  frameType: '1x4' },
  { id: '10', url: 'https://picsum.photos/seed/10/400', frameType: '2x2' },
  { id: '11', url: 'https://picsum.photos/seed/11/400', frameType: '3x2' },
  { id: '12', url: 'https://picsum.photos/seed/12/400', frameType: '1x4' },
];

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

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  // 전체 사용 가능한 화면 너비 (마진 제외)
  const availableWidth = width - GAP * 2;
  
  // 프레임별 크기 매핑: 높이는 항상 전체 너비, 가로만 1/3 또는 2/3
  const sizeMap = useMemo(() => {
    const oneThird = availableWidth / 3;
    const twoThirds = (availableWidth * 2) / 3;
    return {
      '1x4': { w: oneThird,    h: availableWidth },
      '2x2': { w: twoThirds,   h: availableWidth },
      '3x2': { w: twoThirds,   h: availableWidth },
    } as Record<FrameType, { w: number; h: number }>;
  }, [availableWidth]);

  // 사진들을 2개씩 묶어서 각 행(Row) 구성
  const rows = useMemo(() => chunkArray(dummyPhotos, 2), []);

  // 사진 저장 함수
  const saveToCameraRoll = async (uri: string) => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '저장하려면 사진 접근 권한이 필요합니다.');
      return;
    }
    try {
      // 임시 파일 경로 생성
      const fileName = `${FileSystem.documentDirectory}photo-${Date.now()}.jpg`;
      // 원격 이미지 다운로드
      const download = await FileSystem.downloadAsync(uri, fileName);
      // 로컬 파일을 갤러리에 에셋으로 생성
      await MediaLibrary.createAssetAsync(download.uri);
      Alert.alert('저장 완료', '사진이 갤러리에 저장되었습니다.');
    } catch (e) {
      console.error(e);
      Alert.alert('저장 실패', '사진 저장 중 오류가 발생했습니다.');
    }
  };


  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {rows.map((rowPhotos, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {rowPhotos.map(photo => {
              const { w, h } = sizeMap[photo.frameType];
              return (
                <TouchableOpacity
                  key={photo.id}
                  style={{ marginHorizontal: GAP / 2 }}
                  activeOpacity={0.8}
                  onPress={() => setSelectedPhoto(photo)}
                >
                  <Image
                    source={{ uri: photo.url }}
                    style={[{ width: w, height: h }, styles.image]}
                    resizeMode="cover"
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
              onPress={() => saveToCameraRoll(selectedPhoto.url)}
            >
              {/* <Text style={styles.saveText}>저장하기</Text> */}
              <MaterialCommunityIcons name="download" size={28} color="#fff" />
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