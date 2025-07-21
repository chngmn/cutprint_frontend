import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ViewShot from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomText from '../components/CustomText';
import FilterSelector from '../components/FilterSelector';
import FrameSelector from '../components/FrameSelector';
import PhotoEditingTools from '../components/PhotoEditingTools';
import { getFilterById, applyFilterToStyle } from '../utils/filterEffects';
import { getFrameById, applyFrameStyle } from '../utils/frameStyles';

type FilterFrameStackParamList = {
  PreviewAndSave: { imageUri: string; cutType: string };
  FilterFrame: { selectedPhotos: string[]; cutType: string };
};

type FilterFrameNavigationProp = StackNavigationProp<
  FilterFrameStackParamList,
  'FilterFrame'
>;

// 편집 모드 타입
type EditMode = 'filters' | 'frames' | 'editing';

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
  const navigation = useNavigation<FilterFrameNavigationProp>();
  const { selectedPhotos, cutType } = route.params as {
    selectedPhotos: string[];
    cutType: string;
  };

  const [selectedFilter, setSelectedFilter] = useState<string>('original');
  const [selectedFrame, setSelectedFrame] = useState<string>('no_frame');
  const [editMode, setEditMode] = useState<EditMode>('filters');
  const [editingToolsVisible, setEditingToolsVisible] = useState(false);
  const [editingValues, setEditingValues] = useState<{ [key: string]: number }>({});
  const [beforeAfterMode, setBeforeAfterMode] = useState(false);
  const [labelText, setLabelText] = useState('cutprint');

  const requiredCount = getRequiredPhotoCount(cutType);
  const slots = Array.from({ length: requiredCount });
  const viewShotRef = useRef<ViewShot>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const currentFilter = getFilterById(selectedFilter);
  const currentFrame = getFrameById(selectedFrame);

  const getFrameStyle = () => {
    const baseStyle = {
      Vertical: styles.previewFrameVertical,
      Grid4: styles.previewFrameGrid4,
      Grid6: styles.previewFrameGrid6,
    };
    
    switch (cutType) {
      case 'Vertical 4-cut':
        return baseStyle.Vertical;
      case '4-cut grid':
        return baseStyle.Grid4;
      case '6-cut grid':
        return baseStyle.Grid6;
      default:
        return baseStyle.Vertical;
    }
  };

  const getSlotStyle = () => {
    const frameStyle = currentFrame ? applyFrameStyle(currentFrame) : {};
    
    const baseSlotStyles = {
      'Vertical 4-cut': styles.previewSlotVertical,
      '4-cut grid': styles.previewSlotGrid4,
      '6-cut grid': styles.previewSlotGrid6,
    };

    return {
      ...baseSlotStyles[cutType as keyof typeof baseSlotStyles] || styles.previewSlotVertical,
      ...frameStyle,
    };
  };

  const getCutprintLabelStyle = () => {
    const widths = {
      'Vertical 4-cut': 70,
      '4-cut grid': 140,
      '6-cut grid': 140,
    };
    
    return {
      width: widths[cutType as keyof typeof widths] || 70,
      backgroundColor: currentFrame?.style.borderColor || '#000000',
    };
  };

  const handleEditingToolChange = (toolId: string, value: number) => {
    setEditingValues(prev => ({ ...prev, [toolId]: value }));
  };

  const getContrastTextColor = (hexColor: string) => {
    if (!hexColor || hexColor.length < 7) return '#FFFFFF';
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  const applyImageFilters = (imageStyle: any) => {
    if (!currentFilter) return imageStyle;

    const filterStyle = { ...imageStyle };
    const { transform } = currentFilter;

    // 편집 도구 값들 적용
    const brightness = 1 + (editingValues.brightness || 0) / 100;
    const contrast = 1 + (editingValues.contrast || 0) / 100;
    const saturation = 1 + (editingValues.saturation || 0) / 100;
    
    // 필터의 기본 변환값과 편집값 결합
    filterStyle.brightness = (transform.brightness || 1) * brightness;
    filterStyle.contrast = (transform.contrast || 1) * contrast;
    filterStyle.saturation = (transform.saturation || 1) * saturation;

    return filterStyle;
  };

  const renderPhotoSlot = (index: number) => {
    const hasPhoto = selectedPhotos[index];
    const slotStyle = getSlotStyle();
    
    return (
      <View key={index} style={[styles.previewPhotoSlot, slotStyle]}>
        {hasPhoto ? (
          <View style={{ position: 'relative', flex: 1 }}>
            <Image
              source={{ uri: selectedPhotos[index] }}
              style={[styles.previewImage, applyImageFilters({})]}
            />
            {/* 필터 오버레이 */}
            {currentFilter?.transform.overlay && (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: currentFilter.transform.overlay.color,
                    opacity: currentFilter.transform.overlay.opacity,
                  },
                ]}
              />
            )}
            {/* Before/After 모드 */}
            {beforeAfterMode && (
              <View style={[StyleSheet.absoluteFillObject, styles.beforeAfterSplit]}>
                <View style={styles.beforeHalf}>
                  <Image
                    source={{ uri: selectedPhotos[index] }}
                    style={styles.previewImage}
                  />
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    );
  };

  const renderModeTab = (mode: EditMode, label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.modeTab,
        editMode === mode && styles.modeTabSelected,
      ]}
      onPress={() => setEditMode(mode)}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={20}
        color={editMode === mode ? '#FFFFFF' : '#6C757D'}
      />
      <CustomText
        style={[
          styles.modeTabText,
          editMode === mode && styles.modeTabTextSelected,
        ]}
      >
        {label}
      </CustomText>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <CustomText style={styles.title}>필터 및 프레임 선택</CustomText>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.previewSection}>
          {/* Before/After 토글 버튼 */}
          <View style={styles.previewControls}>
            <TouchableOpacity
              style={[
                styles.beforeAfterButton,
                beforeAfterMode && styles.beforeAfterButtonActive,
              ]}
              onPress={() => setBeforeAfterMode(!beforeAfterMode)}
            >
              <MaterialCommunityIcons
                name="compare"
                size={16}
                color={beforeAfterMode ? '#FFFFFF' : '#6C757D'}
              />
              <CustomText
                style={[
                  styles.beforeAfterText,
                  beforeAfterMode && styles.beforeAfterTextActive,
                ]}
              >
                전후비교
              </CustomText>
            </TouchableOpacity>
          </View>

          {/* 메인 프리뷰 */}
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
            <View style={styles.previewContainer}>
              {currentFrame?.type === 'gradient' && currentFrame.style.gradient ? (
                <LinearGradient
                  colors={currentFrame.style.gradient.colors as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.framePreviewContainer,
                    getFrameStyle(),
                    applyFrameStyle(currentFrame),
                  ]}
                >
                  {slots.map((_, index) => renderPhotoSlot(index))}
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.framePreviewContainer,
                    getFrameStyle(),
                    currentFrame ? applyFrameStyle(currentFrame) : {},
                  ]}
                >
                  {slots.map((_, index) => renderPhotoSlot(index))}
                </View>
              )}
              <View style={[styles.cutprintLabel, getCutprintLabelStyle()]}> 
                <CustomText
                  style={[
                    styles.cutprintText,
                    {
                      color: getContrastTextColor(
                        currentFrame?.style.borderColor || '#000000'
                      ),
                    },
                  ]}
                >
                  {labelText}
                </CustomText>
              </View>
            </View>
          </ViewShot>
          {/* 사용자 입력창 */}
          <View style={{ alignItems: 'center', marginVertical: 10 }}>
            <TextInput
              value={labelText}
              onChangeText={setLabelText}
              style={{
                borderWidth: 1,
                borderColor: '#E9ECEF',
                borderRadius: 8,
                padding: 8,
                width: 120,
                textAlign: 'center',
                fontSize: 14,
                backgroundColor: '#fff',
              }}
              maxLength={12}
              placeholder="라벨 입력"
              placeholderTextColor="#B0B0B0"
            />
          </View>
        </View>
      </ScrollView>

      {/* 편집 모드 탭 */}
      <View style={styles.modeTabContainer}>
        {renderModeTab('filters', '필터', 'camera-enhance')}
        {renderModeTab('frames', '프레임', 'image-frame')}
        {renderModeTab('editing', '편집', 'tune')}
      </View>

      {/* 편집 도구 영역 */}
      <View style={styles.editingSection}>
        {editMode === 'filters' && (
          <FilterSelector
            selectedFilterId={selectedFilter}
            onFilterSelect={setSelectedFilter}
          />
        )}
        
        {editMode === 'frames' && (
          <FrameSelector
            selectedFrameId={selectedFrame}
            onFrameSelect={setSelectedFrame}
          />
        )}
        
        {editMode === 'editing' && (
          <PhotoEditingTools
            onToolChange={handleEditingToolChange}
            currentValues={editingValues}
            visible={editingToolsVisible}
            onToggle={() => setEditingToolsVisible(!editingToolsVisible)}
          />
        )}
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            setSelectedFilter('original');
            setSelectedFrame('no_frame');
            setEditingValues({});
            setBeforeAfterMode(false);
          }}
        >
          <MaterialCommunityIcons name="restore" size={20} color="#6C757D" />
          <CustomText style={styles.resetButtonText}>초기화</CustomText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.nextButton}
          onPress={async () => {
            if (viewShotRef.current?.capture) {
              const uri = await viewShotRef.current.capture();
              navigation.navigate('PreviewAndSave', { imageUri: uri, cutType: cutType });
            }
          }}
        >
          <CustomText style={styles.nextButtonText}>완료</CustomText>
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
  scrollView: {
    flex: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 400,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  beforeAfterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  beforeAfterButtonActive: {
    backgroundColor: '#4867B7',
    borderColor: '#4867B7',
  },
  beforeAfterText: {
    fontSize: 12,
    color: '#6C757D',
    marginLeft: 4,
    fontWeight: '500',
  },
  beforeAfterTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  beforeAfterSplit: {
    flexDirection: 'row',
  },
  beforeHalf: {
    flex: 1,
    overflow: 'hidden',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  cutprintText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modeTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  modeTabSelected: {
    backgroundColor: '#4867B7',
    borderColor: '#4867B7',
  },
  modeTabText: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 6,
    fontWeight: '500',
  },
  modeTabTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  editingSection: {
    backgroundColor: '#FFFFFF',
    maxHeight: 300,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginRight: 12,
  },
  resetButtonText: {
    color: '#6C757D',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#4867B7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FilterFrameScreen;
