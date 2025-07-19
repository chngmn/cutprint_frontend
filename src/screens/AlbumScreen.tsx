import React, { useMemo } from 'react';
import { ScrollView, Image, StyleSheet, Dimensions, View } from 'react-native';

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {rows.map((rowPhotos, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {rowPhotos.map(photo => {
            const { w, h } = sizeMap[photo.frameType];
            return (
              <View key={photo.id} style={{ marginHorizontal: GAP / 2 }}>
                <Image
                  source={{ uri: photo.url }}
                  style={[{ width: w, height: h }, styles.image]}
                  resizeMode="cover"
                />
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
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
});