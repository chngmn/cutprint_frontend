import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CustomText from './CustomText';
import { 
  FrameStyle, 
  frameCategories, 
  getFramesByCategory, 
  getFrameById 
} from '../utils/frameStyles';

interface FrameSelectorProps {
  selectedFrameId: string;
  onFrameSelect: (frameId: string) => void;
}

const { width } = Dimensions.get('window');

const FrameSelector: React.FC<FrameSelectorProps> = ({
  selectedFrameId,
  onFrameSelect,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('minimal');

  const currentFrames = getFramesByCategory(selectedCategory);
  const selectedFrame = getFrameById(selectedFrameId);

  const renderCategoryTab = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.categoryTab,
        selectedCategory === item.id && styles.categoryTabSelected,
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <CustomText style={styles.categoryIcon}>{item.icon}</CustomText>
      <CustomText
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.categoryTextSelected,
        ]}
      >
        {item.name}
      </CustomText>
    </TouchableOpacity>
  );

  const renderFramePreview = (frame: FrameStyle, isSelected: boolean) => {
    const baseStyle = [
      styles.framePreviewBox,
      isSelected && styles.framePreviewSelected,
    ];

    // 솔리드 프레임
    if (frame.type === 'solid') {
      return (
        <View
          style={[
            ...baseStyle,
            {
              borderWidth: frame.style.borderWidth || 2,
              borderColor: frame.style.borderColor || '#000000',
              backgroundColor: frame.style.backgroundColor || 'transparent',
            },
          ]}
        >
          <View style={styles.frameInner} />
          {isSelected && (
            <View style={styles.selectedOverlay}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color="#4867B7"
              />
            </View>
          )}
        </View>
      );
    }

    // 그라데이션 프레임
    if (frame.type === 'gradient' && frame.style.gradient) {
      const { colors, direction } = frame.style.gradient;
      let gradientProps: any = { colors };

      switch (direction) {
        case 'horizontal':
          gradientProps.start = { x: 0, y: 0 };
          gradientProps.end = { x: 1, y: 0 };
          break;
        case 'vertical':
          gradientProps.start = { x: 0, y: 0 };
          gradientProps.end = { x: 0, y: 1 };
          break;
        case 'diagonal':
          gradientProps.start = { x: 0, y: 0 };
          gradientProps.end = { x: 1, y: 1 };
          break;
        case 'radial':
          // LinearGradient doesn't support radial, use diagonal as fallback
          gradientProps.start = { x: 0.5, y: 0.5 };
          gradientProps.end = { x: 1, y: 1 };
          break;
        default:
          gradientProps.start = { x: 0, y: 0 };
          gradientProps.end = { x: 1, y: 0 };
      }

      return (
        <View style={[styles.framePreviewBox, isSelected && styles.framePreviewSelected]}>
          <LinearGradient
            {...gradientProps}
            style={[
              StyleSheet.absoluteFillObject,
              {
                borderRadius: 8,
                padding: frame.style.borderWidth || 2,
              },
            ]}
          >
            <View style={styles.frameInner} />
          </LinearGradient>
          {isSelected && (
            <View style={styles.selectedOverlay}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color="#4867B7"
              />
            </View>
          )}
        </View>
      );
    }

    // 텍스처 프레임 (패턴으로 표현)
    if (frame.type === 'texture' && frame.style.texture) {
      const textureColor = frame.style.texture.color;
      return (
        <View
          style={[
            ...baseStyle,
            {
              borderWidth: frame.style.borderWidth || 3,
              borderColor: textureColor,
              backgroundColor: textureColor,
            },
          ]}
        >
          {/* 텍스처 패턴 시뮬레이션 */}
          <View style={[styles.texturePattern, { backgroundColor: textureColor }]}>
            {frame.style.texture.type === 'wood' && (
              <View style={styles.woodPattern} />
            )}
            {frame.style.texture.type === 'metal' && (
              <View style={styles.metalPattern} />
            )}
            {frame.style.texture.type === 'paper' && (
              <View style={styles.paperPattern} />
            )}
          </View>
          <View style={styles.frameInner} />
          {isSelected && (
            <View style={styles.selectedOverlay}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color="#4867B7"
              />
            </View>
          )}
        </View>
      );
    }

    // 기본 프레임
    return (
      <View style={[...baseStyle]}>
        <View style={styles.frameInner} />
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color="#4867B7"
            />
          </View>
        )}
      </View>
    );
  };

  const renderFrameItem = ({ item }: { item: FrameStyle }) => {
    const isSelected = selectedFrameId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.frameItem,
          isSelected && styles.frameItemSelected,
        ]}
        onPress={() => onFrameSelect(item.id)}
      >
        <View style={styles.framePreview}>
          {renderFramePreview(item, isSelected)}
        </View>
        
        <CustomText
          style={[
            styles.frameName,
            isSelected && styles.frameNameSelected,
          ]}
          numberOfLines={1}
        >
          {item.name}
        </CustomText>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 선택된 프레임 정보 */}
      {selectedFrame && (
        <View style={styles.selectedFrameInfo}>
          <CustomText style={styles.selectedFrameName}>
            {selectedFrame.name}
          </CustomText>
          <CustomText style={styles.selectedFrameDescription}>
            {selectedFrame.description}
          </CustomText>
        </View>
      )}

      {/* 카테고리 탭 */}
      <View style={styles.categoryContainer}>
        <FlatList
          data={frameCategories}
          renderItem={renderCategoryTab}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* 프레임 목록 */}
      <View style={styles.frameContainer}>
        <FlatList
          data={currentFrames}
          renderItem={renderFrameItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.frameList}
          ItemSeparatorComponent={() => <View style={styles.frameSeparator} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    // paddingVertical: 10,
  },
  selectedFrameInfo: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    // borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  selectedFrameName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343A40',
    marginBottom: 2,
  },
  selectedFrameDescription: {
    fontSize: 12,
    color: '#6C757D',
  },
  categoryContainer: {
    paddingVertical: 5,
  },
  categoryList: {
    paddingHorizontal: 15,
  },
  categoryTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    minWidth: 70,
  },
  categoryTabSelected: {
    backgroundColor: '#4867B7',
    borderColor: '#4867B7',
  },
  categoryIcon: {
    fontSize: 12,
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  frameContainer: {
    paddingVertical: 10,
  },
  frameList: {
    paddingHorizontal: 15,
  },
  frameItem: {
    alignItems: 'center',
    width: 80,
  },
  frameItemSelected: {
    // 선택된 프레임 아이템 스타일
  },
  framePreview: {
    marginBottom: 8,
  },
  framePreviewBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
  },
  framePreviewSelected: {
    borderWidth: 3,
    borderColor: '#4867B7',
  },
  frameInner: {
    flex: 1,
    backgroundColor: '#E9ECEF',
    // backgroundColor: '#FFFFFF',
    margin: 8,
    borderRadius: 4,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(72, 103, 183, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameName: {
    fontSize: 12,
    color: '#495057',
    textAlign: 'center',
    fontWeight: '500',
  },
  frameNameSelected: {
    color: '#4867B7',
    fontWeight: 'bold',
  },
  frameSeparator: {
    width: 15,
  },
  // 텍스처 패턴 스타일
  texturePattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  woodPattern: {
    flex: 1,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    marginVertical: 10,
  },
  metalPattern: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  paperPattern: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
});

export default FrameSelector;