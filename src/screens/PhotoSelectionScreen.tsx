//src/screens/PhotoSelectionScreen.tsx
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

  const [selectedPhotoForUser, setSelectedPhotoForUser] = useState<string | null>(null); // 현재 사용자가 선택한 1장의 사진
  const [allParticipantsPhotos, setAllParticipantsPhotos] = useState<string[]>([]); // 모든 참가자의 최종 사진
  const [isWaitingForOthers, setIsWaitingForOthers] = useState<boolean>(false); // 다른 참가자 대기 중 상태
  const [hasSubmittedPhoto, setHasSubmittedPhoto] = useState<boolean>(false); // 사용자가 자신의 사진을 제출했는지 여부
  const requiredCount = getRequiredPhotoCount(cutType);

  const handlePhotoPress = (uri: string) => {
    if (isOnlineMode) {
      // 온라인 모드에서는 한 장만 선택 가능
      setSelectedPhotoForUser(selectedPhotoForUser === uri ? null : uri);
    } else {
      // 기존 로직 (여러 장 선택)
      if (allParticipantsPhotos.includes(uri)) {
        setAllParticipantsPhotos(allParticipantsPhotos.filter((item) => item !== uri));
      } else {
        if (allParticipantsPhotos.length < requiredCount) {
          setAllParticipantsPhotos([...allParticipantsPhotos, uri]);
        }
      }
    }
  };

  const handleSinglePhotoCompletion = () => {
    if (selectedPhotoForUser && isOnlineMode) {
      setIsWaitingForOthers(true);
      setHasSubmittedPhoto(true); // 사진 제출 완료 상태로 변경
      // TODO: 여기에 실제 서버로 사진을 전송하는 로직 추가
      console.log('Sending photo to server:', selectedPhotoForUser);

      // 다른 참가자들의 사진을 기다리는 시뮬레이션
      setTimeout(() => {
        // TODO: 실제 서버에서 모든 참가자의 사진을 받아오는 로직 추가
        // 현재는 더미 데이터로 시뮬레이션
        const dummyPhotos = Array.from({ length: requiredCount }).map(
          (_, i) => `https://via.placeholder.com/150/0000FF/FFFFFF?text=P${i + 1}`
        );
        // 사용자가 선택한 사진을 더미 사진 중 하나에 포함 (예: 첫 번째)
        dummyPhotos[0] = selectedPhotoForUser;
        setAllParticipantsPhotos(dummyPhotos);
        setIsWaitingForOthers(false);
        Alert.alert('알림', '모든 참가자의 사진이 도착했습니다!');
      }, 3000); // 3초 대기 시뮬레이션
    } else {
      Alert.alert('알림', '사진을 한 장 선택해주세요.');
    }
  };

  const handleFinalCompletion = () => {
    if (allParticipantsPhotos.length === requiredCount) {
      navigation.navigate('FilterFrame', { selectedPhotos: allParticipantsPhotos, cutType });
    } else {
      Alert.alert('알림', `사진을 ${requiredCount}장 선택해야 합니다.`);
    }
  };

  const renderPhoto = ({ item }: { item: string }) => {
    const isSelected = isOnlineMode
      ? selectedPhotoForUser === item
      : allParticipantsPhotos.includes(item);
    const selectionIndex = isOnlineMode
      ? (selectedPhotoForUser === item ? 1 : 0)
      : allParticipantsPhotos.indexOf(item) + 1;

    return (
      <TouchableOpacity
        onPress={() => handlePhotoPress(item)}
        style={styles.photoContainer}
        disabled={isWaitingForOthers || (isOnlineMode && hasSubmittedPhoto)} // 대기 중이거나 사진 제출 후에는 선택 비활성화
      >
        <Image source={{ uri: item }} style={styles.photo} />
        {isSelected && (
          <View style={styles.selectionOverlay}>
            <Text style={styles.selectionText}>
              {selectionIndex}
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
        <Text style={styles.subtitle}>
          {isOnlineMode
            ? isWaitingForOthers
              ? '다른 참가자들의 사진을 기다리는 중...'
              : '프레임에 사용할 사진 한 장을 선택하세요.'
            : `프레임에 사용할 사진 ${requiredCount}장을 선택하세요.`}
        </Text>
      </View>
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item}
        numColumns={4}
        contentContainerStyle={styles.listContainer}
      />
      {isOnlineMode && !isWaitingForOthers && allParticipantsPhotos.length === 0 && (
        <View style={styles.middleButtonContainer}>
          <TouchableOpacity
            style={[
              styles.myPhotoSelectButton,
              selectedPhotoForUser
                ? styles.completeButtonActive
                : styles.completeButtonInactive,
            ]}
            onPress={handleSinglePhotoCompletion}
            disabled={!selectedPhotoForUser}
          >
            <Text style={styles.completeButtonText}>내 사진 선택</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.bottomContainer}>
        <FramePreview
          cutType={cutType}
          selectedPhotos={isOnlineMode && allParticipantsPhotos.length > 0 ? allParticipantsPhotos : (selectedPhotoForUser ? [selectedPhotoForUser] : [])}
        />
        
        {isOnlineMode && allParticipantsPhotos.length === requiredCount && !isWaitingForOthers && (
          <TouchableOpacity
            style={[
              styles.completeButton,
              allParticipantsPhotos.length === requiredCount
                ? styles.completeButtonActive
                : styles.completeButtonInactive,
            ]}
            onPress={handleFinalCompletion}
            disabled={allParticipantsPhotos.length !== requiredCount}
          >
            <Text style={styles.completeButtonText}>선택 완료</Text>
          </TouchableOpacity>
        )}
        {isOnlineMode && isWaitingForOthers && (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>다른 참가자들의 사진을 기다리는 중...</Text>
          </View>
        )}
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
  middleButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
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
    padding: 50,
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
  myPhotoSelectButton: {
    width: 180, // 가로 길이 조절
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'center', // 가운데 정렬
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
  waitingContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: 'bold',
  },
});

export default PhotoSelectionScreen;
