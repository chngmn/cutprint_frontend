//src/screens/PhotoSelectionScreen.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../components/CustomText';
import { Colors, Typography, Spacing, Radius, Shadow, Layout } from '../constants/theme';
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
        return { width: 84 };
      case '4-cut grid':
        return { width: 168 };
      case '6-cut grid':
        return { width: 168 };
      default:
        return { width: 84 };
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
        <CustomText style={styles.cutprintText}>cutprint</CustomText>
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
        } else {
          // Haptic feedback would be nice here
          Alert.alert('알림', `최대 ${requiredCount}장까지 선택할 수 있습니다.`);
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
    const selectionIndex = selectedPhotos.indexOf(item) + 1;

    return (
      <Pressable
        onPress={() => handlePhotoPress(item)}
        style={({ pressed }) => [
          styles.photoContainer,
          pressed && styles.photoPressed
        ]}
      >
        <Image source={{ uri: item }} style={styles.photo} />
        {isSelected && (
          <View style={styles.selectionOverlay}>
            <View style={styles.selectionBadge}>
              <CustomText style={styles.selectionText}>{selectionIndex}</CustomText>
            </View>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <CustomText style={styles.headerTitle}>사진 선택</CustomText>
          <CustomText style={styles.headerSubtitle}>
            {`프레임에 사용할 사진 ${isOnlineMode ? 1 : requiredCount}장을 선택하세요`}
          </CustomText>
        </View>
        <View style={styles.headerAction}>
          <View style={styles.progressContainer}>
            <CustomText style={styles.progressText}>
              {selectedPhotos.length}/{isOnlineMode ? 1 : requiredCount}
            </CustomText>
          </View>
        </View>
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
          activeOpacity={0.8}
        >
          <CustomText style={[
            styles.completeButtonText,
            selectedPhotos.length !== (isOnlineMode ? 1 : requiredCount) && styles.completeButtonTextDisabled
          ]}>
            선택 완료
          </CustomText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  // Header Styles (Unified with FilterFrameScreen and PreviewAndSaveScreen)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerPadding,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    backgroundColor: Colors.white,
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
    textAlign: 'center',
  },
  headerAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    backgroundColor: Colors.gray200,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    minWidth: 36,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.containerPadding,
  },
  photoContainer: {
    flex: 1 / 4,
    aspectRatio: Layout.photoAspectRatio,
    padding: Layout.gridGap / 2,
  },
  photoPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  photo: {
    flex: 1,
    borderRadius: Radius.sm,
    backgroundColor: Colors.gray100,
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(96, 96, 96, 0.7)',
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.black,
  },
  selectionBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.medium,
  },
  selectionText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.small,
  },
  bottomContainer: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  framePreviewContainer: {
    marginBottom: 0,
    backgroundColor: Colors.black,
    padding: 2,
  },
  frameVertical: {
    width: 84,
    height: 288,
  },
  frameGrid4: {
    width: 168,
    height: 252,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  frameGrid6: {
    width: 168,
    height: 252,
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
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.medium,
  },
  completeButtonActive: {
    backgroundColor: Colors.black,
  },
  completeButtonInactive: {
    backgroundColor: Colors.gray200,
  },
  completeButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  completeButtonTextDisabled: {
    color: Colors.gray600,
  },
  cutprintLabel: {
    backgroundColor: Colors.black,
    height: 34,
    marginTop: 0,
    marginBottom: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cutprintText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 1,
  },
});

export default PhotoSelectionScreen;
