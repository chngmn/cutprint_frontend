import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

export type HomeStackParamList = {
  HomeMain: undefined;
  CutSelection: undefined;
  Camera: { cutType: string; isOnlineMode?: boolean };
  PhotoSelection: { photos: string[]; cutType: string; isOnlineMode?: boolean };
  FilterFrame: { selectedPhotos: string[]; cutType: string };
};

type PhotoSelectionNavigationProp = StackNavigationProp<
  HomeStackParamList,
  'PhotoSelection'
>;

const getRequiredPhotoCount = (cutType: string): number => {
  switch (cutType) {
    case 'Vertical 4-cut':
    case '4-cut grid':
      return 4;
    case '6-cut grid':
      return 6;
    default:
      return 4;
  }
};

const FramePreview = ({
  cutType,
  selectedPhotos,
}: {
  cutType: string;
  selectedPhotos: string[];
}) => {
  const requiredCount = getRequiredPhotoCount(cutType);
  const slots = Array.from({ length: requiredCount });

  const getFrameStyle = () => {
    switch (cutType) {
      case 'Vertical 4-cut':
        return styles.frameVertical;
      case '4-cut grid':
        return styles.frameGrid4;
      case '6-cut grid':
        return styles.frameGrid6;
      default:
        return styles.frameVertical;
    }
  };

  const getSlotStyle = () => {
    switch (cutType) {
      case 'Vertical 4-cut':
        return styles.slotVertical;
      case '4-cut grid':
        return styles.slotGrid4;
      case '6-cut grid':
        return styles.slotGrid6;
      default:
        return styles.slotVertical;
    }
  };

  const getCutprintLabelStyle = () => {
    switch (cutType) {
      case 'Vertical 4-cut':
        return { width: 70 };
      case '4-cut grid':
        return { width: 140 };
      case '6-cut grid':
        return { width: 140 };
      default:
        return { width: 70 };
    }
  };

  return (
    <>
      <View style={[styles.framePreviewContainer, getFrameStyle()]}>
        {slots.map((_, index) => (
          <View key={index} style={[styles.photoSlot, getSlotStyle()]}>
            {selectedPhotos[index] ? (
              <Image
                source={{ uri: selectedPhotos[index] }}
                style={styles.previewImage}
              />
            ) : (
              <View style={styles.placeholder} />
            )}
          </View>
        ))}
      </View>
      <View style={[styles.cutprintLabel, getCutprintLabelStyle()]}>
        <Text style={styles.cutprintText}>cutprint</Text>
      </View>
    </>
  );
};

const PhotoSelectionScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<PhotoSelectionNavigationProp>();
  const params = route.params as HomeStackParamList['PhotoSelection'];
  const { photos, cutType, isOnlineMode } = params;

  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const requiredCount = getRequiredPhotoCount(cutType);

  const handlePhotoPress = (uri: string) => {
    if (selectedPhotos.includes(uri)) {
      setSelectedPhotos(selectedPhotos.filter((item) => item !== uri));
    } else {
      if (isOnlineMode) {
        setSelectedPhotos([uri]);
      } else {
        if (selectedPhotos.length < requiredCount) {
          setSelectedPhotos([...selectedPhotos, uri]);
        }
      }
    }
  };

  const handleCompletion = () => {
    if (selectedPhotos.length === (isOnlineMode ? 1 : requiredCount)) {
      navigation.navigate('FilterFrame', { selectedPhotos, cutType });
    } else {
      Alert.alert('알림', `사진을 ${isOnlineMode ? 1 : requiredCount}장 선택해야 합니다.`);
    }
  };

  const renderPhoto = ({ item }: { item: string }) => {
    const isSelected = selectedPhotos.includes(item);
    return (
      <TouchableOpacity
        onPress={() => handlePhotoPress(item)}
        style={styles.photoContainer}
      >
        <Image source={{ uri: item }} style={styles.photo} />
        {isSelected && (
          <View style={styles.selectionOverlay}>
            <Text style={styles.selectionText}>
              {selectedPhotos.indexOf(item) + 1}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>사진 선택</Text>
        <Text
          style={styles.subtitle}
        >{`프레임에 사용할 사진 ${isOnlineMode ? 1 : requiredCount}장을 선택하세요.`}</Text>
      </View>
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item}
        numColumns={4}
        contentContainerStyle={styles.listContainer}
      />
      <View style={styles.bottomContainer}>
        <FramePreview cutType={cutType} selectedPhotos={selectedPhotos} />
        <TouchableOpacity
          style={[
            styles.completeButton,
            selectedPhotos.length === (isOnlineMode ? 1 : requiredCount)
              ? styles.completeButtonActive
              : styles.completeButtonInactive,
          ]}
          onPress={handleCompletion}
          disabled={selectedPhotos.length !== (isOnlineMode ? 1 : requiredCount)}
        >
          <Text style={styles.completeButtonText}>선택 완료</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#343A40',
  },
  subtitle: {
    fontSize: 16,
    color: '#868E96',
    marginTop: 5,
  },
  listContainer: {
    paddingHorizontal: 5,
  },
  photoContainer: {
    flex: 1 / 4,
    aspectRatio: 1,
    padding: 2,
  },
  photo: {
    flex: 1,
    borderRadius: 6,
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  selectionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomContainer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
  },
  framePreviewContainer: {
    marginBottom: 0,
    backgroundColor: 'black',
    padding: 2,
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  frameVertical: {
    width: 70,
    height: 240,
  },
  frameGrid4: {
    width: 140,
    height: 210,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  frameGrid6: {
    width: 140,
    height: 210,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoSlot: {
    backgroundColor: '#E9ECEF',
  },
  slotVertical: {
    width: '100%',
    height: '25%',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: '#000000',
  },
  slotGrid4: {
    width: '50%',
    height: '50%',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: '#000000',
  },
  slotGrid6: {
    width: '50%',
    height: '33.33%',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: '#000000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  completeButton: {
    width: '100%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonActive: {
    backgroundColor: '#000000',
  },
  completeButtonInactive: {
    backgroundColor: '#CED4DA',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cutprintLabel: {
    backgroundColor: '#000000',
    height: 30,
    width: 140,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cutprintText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default PhotoSelectionScreen;
