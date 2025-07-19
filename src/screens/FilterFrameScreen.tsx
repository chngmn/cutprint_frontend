import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import CustomText from '../components/CustomText';

// Dummy data for filters (replace with actual filter logic later)
const filters = [
  { id: 'original', name: '원본' },
  { id: 'bw', name: '흑백' },
  { id: 'sepia', name: '세피아' },
  { id: 'vintage', name: '빈티지' },
  { id: 'cool', name: '시원한' },
  { id: 'warm', name: '따뜻한' },
];

// Dummy data for frames (replace with actual frame assets/logic later)
const frames = [
  { id: 'black', name: '', color: '#000000' },
  { id: 'white', name: '', color: '#FFFFFF' },
  { id: 'pink', name: '', color: '#FFC0CB' },
  { id: 'blue', name: '', color: '#ADD8E6' },
];

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

const FilterFrameScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { selectedPhotos, cutType } = route.params as {
    selectedPhotos: string[];
    cutType: string;
  };

  const [selectedFilter, setSelectedFilter] = useState<string>('original');
  const [selectedFrame, setSelectedFrame] = useState<string>('black');

  const requiredCount = getRequiredPhotoCount(cutType);
  const slots = Array.from({ length: requiredCount });

  const getFrameStyle = () => {
    switch (cutType) {
      case 'Vertical 4-cut':
        return styles.previewFrameVertical;
      case '4-cut grid':
        return styles.previewFrameGrid4;
      case '6-cut grid':
        return styles.previewFrameGrid6;
      default:
        return styles.previewFrameVertical;
    }
  };

  const getSlotStyle = () => {
    const baseStyle = {
      borderColor: currentFrameColor,
    };

    switch (cutType) {
      case 'Vertical 4-cut':
        return { ...styles.previewSlotVertical, ...baseStyle };
      case '4-cut grid':
        return { ...styles.previewSlotGrid4, ...baseStyle };
      case '6-cut grid':
        return { ...styles.previewSlotGrid6, ...baseStyle };
      default:
        return { ...styles.previewSlotVertical, ...baseStyle };
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

  const renderFilterItem = ({
    item,
  }: {
    item: { id: string; name: string };
  }) => (
    <TouchableOpacity
      style={[
        styles.filterItem,
        selectedFilter === item.id && styles.filterItemSelected,
      ]}
      onPress={() => setSelectedFilter(item.id)}
    >
      <CustomText style={styles.filterText}>{item.name}</CustomText>
    </TouchableOpacity>
  );

  const getContrastTextColor = (hexColor: string) => {
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  const renderFrameItem = ({
    item,
  }: {
    item: { id: string; name: string; color: string };
  }) => (
    <TouchableOpacity
      style={[
        styles.frameItem,
        { backgroundColor: item.color },
        selectedFrame === item.id && styles.frameItemSelected,
      ]}
      onPress={() => setSelectedFrame(item.id)}
    >
      <CustomText
        style={[styles.frameText, { color: getContrastTextColor(item.color) }]}
      >
        {item.name}
      </CustomText>
    </TouchableOpacity>
  );

  const currentFrameColor =
    frames.find((f) => f.id === selectedFrame)?.color || 'black';

  const getFilterOverlay = () => {
    switch (selectedFilter) {
      case 'bw':
        return { backgroundColor: 'rgba(128, 128, 128, 0.3)' };
      case 'sepia':
        return { backgroundColor: 'rgba(112, 66, 20, 0.3)' };
      case 'vintage':
        return { backgroundColor: 'rgba(139, 69, 19, 0.4)' };
      case 'cool':
        return { backgroundColor: 'rgba(0, 150, 255, 0.2)' };
      case 'warm':
        return { backgroundColor: 'rgba(255, 165, 0, 0.2)' };
      default:
        return {};
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <CustomText style={styles.title}>필터 및 프레임 선택</CustomText>
      </View>

      <View style={styles.previewSection}>
        <View
          style={[
            styles.framePreviewContainer,
            getFrameStyle(),
            {
              borderColor: currentFrameColor,
              backgroundColor: currentFrameColor,
            },
          ]}
        >
          {slots.map((_, index) => (
            <View key={index} style={[styles.previewPhotoSlot, getSlotStyle()]}>
              {selectedPhotos[index] ? (
                <View style={{ position: 'relative' }}>
                  <Image
                    source={{ uri: selectedPhotos[index] }}
                    style={styles.previewImage}
                  />
                  {selectedFilter !== 'original' && (
                    <View style={[styles.filterOverlay, getFilterOverlay()]} />
                  )}
                </View>
              ) : (
                <View style={styles.placeholder} />
              )}
            </View>
          ))}
        </View>
        <View
          style={[
            styles.cutprintLabel,
            getCutprintLabelStyle(),
            { backgroundColor: currentFrameColor },
          ]}
        >
          <CustomText
            style={[
              styles.cutprintText,
              { color: getContrastTextColor(currentFrameColor) },
            ]}
          >
            cutprint
          </CustomText>
        </View>
      </View>

      <View style={styles.selectionSection}>
        <CustomText style={styles.sectionTitle}>필터</CustomText>
        <FlatList
          data={filters}
          renderItem={renderFilterItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterListContainer}
        />

        <CustomText style={styles.sectionTitle}>프레임</CustomText>
        <FlatList
          data={frames}
          renderItem={renderFrameItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.frameListContainer}
        />
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => console.log('Next')}
      >
        <CustomText style={styles.nextButtonText}>다음</CustomText>
      </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#343A40',
  },
  previewSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  previewFrameVertical: {
    width: 70,
    height: 240,
  },
  previewFrameGrid4: {
    width: 140,
    height: 210,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  previewFrameGrid6: {
    width: 140,
    height: 210,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  previewPhotoSlot: {
    backgroundColor: '#E9ECEF',
  },
  previewSlotVertical: {
    width: '100%',
    height: '25%',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: '#000000',
  },
  previewSlotGrid4: {
    width: '50%',
    height: '50%',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: '#000000',
  },
  previewSlotGrid6: {
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
    backgroundColor: '#D1D5DB',
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterOverlayText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cutprintLabel: {
    backgroundColor: '#000000',
    height: 30,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cutprintText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectionSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343A40',
    marginBottom: 10,
  },
  filterListContainer: {
    paddingBottom: 15,
  },
  filterItem: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CED4DA',
    marginRight: 10,
    backgroundColor: '#F8F9FA',
  },
  filterItemSelected: {
    borderColor: '#4867B7',
    backgroundColor: '#E0E7FF',
  },
  filterText: {
    fontSize: 14,
    color: '#495057',
  },
  frameListContainer: {
    paddingBottom: 15,
  },
  frameItem: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  frameItemSelected: {
    borderColor: '#4867B7',
  },
  frameText: {
    // color: 'white', // This will be dynamic now
    fontSize: 12,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#000000',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FilterFrameScreen;
