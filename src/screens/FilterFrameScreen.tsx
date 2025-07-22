import React, { useState, useRef, useEffect } from 'react';
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
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Theme from '../constants/theme';
// Assuming these components are available in your project structure
import CustomText from '../components/CustomText';
import FilterSelector from '../components/FilterSelector';
import FrameSelector from '../components/FrameSelector';
// import PhotoEditingTools from './components/PhotoEditingTools'; // Removed as per request
import { getFilterById, applyFilterToStyle } from '../utils/filterEffects';
import { getFrameById, applyFrameStyle } from '../utils/frameStyles';

const { Colors, Typography, Spacing, Radius, Shadow } = Theme;

type FilterFrameStackParamList = {
  PreviewAndSave: { imageUri: string; cutType: string };
  FilterFrame: { selectedPhotos: string[]; cutType: string };
};

type FilterFrameNavigationProp = StackNavigationProp<
  FilterFrameStackParamList,
  'FilterFrame'
>;

// Define the type for active editing sections
type ActiveSection = 'filters' | 'frames' | null;

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
  // State to manage which editing section is active (filters, frames, or none)
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const [beforeAfterMode, setBeforeAfterMode] = useState(false);
  const [labelText, setLabelText] = useState('cutprint');

  // Animated value for the height of the editing panel
  const animatedPanelHeight = useRef(new Animated.Value(0)).current;

  const requiredCount = getRequiredPhotoCount(cutType);
  const slots = Array.from({ length: requiredCount });
  const viewShotRef = useRef<ViewShot>(null);
  const scrollY = useRef(new Animated.Value(0)).current; // For potential future scroll animations

  const currentFilter = getFilterById(selectedFilter);
  const currentFrame = getFrameById(selectedFrame);

  // Effect to animate the panel height based on activeSection
  useEffect(() => {
    if (activeSection) {
      // Animate to a specific height when a section is active
      Animated.timing(animatedPanelHeight, {
        toValue: 200, // This value should be adjusted based on the actual height of your FilterSelector/FrameSelector
        duration: 300,
        useNativeDriver: false, // Height animation does not support native driver
      }).start();
    } else {
      // Animate to 0 height when no section is active
      Animated.timing(animatedPanelHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [activeSection]); // Re-run animation when activeSection changes

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

  // Removed handleEditingToolChange and editingValues as PhotoEditingTools is commented out

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

    // Apply filter's base transform values
    filterStyle.brightness = transform.brightness || 1;
    filterStyle.contrast = transform.contrast || 1;
    filterStyle.saturation = transform.saturation || 1;

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
            {/* Filter overlay */}
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
            {/* Before/After mode (shows original image on left half) */}
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

  // Helper to render mode tabs (Filter, Frame)
  const renderModeTab = (mode: ActiveSection, label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.modeTab,
        activeSection === mode && styles.modeTabSelected,
      ]}
      // Toggle the active section: if already active, set to null (close); otherwise, set to new mode
      onPress={() => setActiveSection(activeSection === mode ? null : mode)}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={20}
        color={activeSection === mode ? '#FFFFFF' : '#6C757D'}
      />
      <CustomText
        style={[
          styles.modeTabText,
          activeSection === mode && styles.modeTabTextSelected,
        ]}
      >
        {label}
      </CustomText>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Unified Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <CustomText style={styles.headerTitle}>편집하기</CustomText>
          <CustomText style={styles.headerSubtitle}>필터와 프레임 적용</CustomText>
        </View>
        <View style={styles.headerAction}>
          <TouchableOpacity
            style={[
              styles.headerBeforeAfterButton,
              beforeAfterMode && styles.headerBeforeAfterButtonActive,
            ]}
            onPress={() => setBeforeAfterMode(!beforeAfterMode)}
          >
            <MaterialCommunityIcons
              name="compare"
              size={20}
              color={beforeAfterMode ? Colors.white : Colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
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
          {/* Main Preview Area */}
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
                    // styles.framePreviewContainer,
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
          {/* User Input for Label */}
          <View style={styles.labelInputContainer}>
            <TextInput
              value={labelText}
              onChangeText={setLabelText}
              style={styles.labelInput}
              maxLength={12}
              placeholder="라벨 입력"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
        </View>
      </ScrollView>

      {/* Editing Mode Tabs and Sliding Section */}
      <View>
        <View style={styles.modeTabContainer}>
          {renderModeTab('filters', '필터', 'camera-enhance')}
          {renderModeTab('frames', '프레임', 'image-frame')}
        </View>

        {/* Animated Editing Section */}
        <Animated.View style={[styles.editingSection, { height: animatedPanelHeight }]}>
          {/* Render content based on activeSection, ensuring it's only rendered when visible */}
          {activeSection === 'filters' && (
            <FilterSelector
              selectedFilterId={selectedFilter}
              onFilterSelect={setSelectedFilter}
            />
          )}

          {activeSection === 'frames' && (
            <FrameSelector
              selectedFrameId={selectedFrame}
              onFrameSelect={setSelectedFrame}
            />
          )}
        </Animated.View>
      </View>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            setSelectedFilter('original');
            setSelectedFrame('no_frame');
            // setEditingValues({}); // Removed as PhotoEditingTools is removed
            setBeforeAfterMode(false);
            setActiveSection(null); // Close the editing panel on reset
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
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  // Header Styles (Unified with PreviewAndSaveScreen)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerPadding,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
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
  },
  headerAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  // Header Before/After Button (New Position)
  headerBeforeAfterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  headerBeforeAfterButtonActive: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
    ...Shadow.small,
  },
  previewSection: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.containerPadding,
    backgroundColor: Colors.white,
    minHeight: 300,
  },
  previewContainer: {
    alignItems: 'center',
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
    backgroundColor: Colors.black,
    padding: 2,
    borderRadius: 0,
    ...Shadow.medium,
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
    backgroundColor: Colors.gray200,
  },
  previewSlotVertical: {
    width: '100%',
    height: '25%',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: Colors.black,
  },
  previewSlotGrid4: {
    width: '50%',
    height: '50%',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: Colors.black,
  },
  previewSlotGrid6: {
    width: '50%',
    height: '33.33%',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: Colors.black,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    backgroundColor: Colors.gray300,
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
    backgroundColor: Colors.black,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cutprintText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  // Filter/Frame Tab Section (Brand Aligned & Minimal)
  modeTabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.gray50,
    paddingHorizontal: Spacing.containerPadding,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    gap: Spacing.sm,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray200,
  },
  modeTabSelected: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
    ...Shadow.medium,
    transform: [{ scale: 1.01 }],
  },
  modeTabText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
  modeTabTextSelected: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
  },
  // Editing Section (Minimal Design)
  editingSection: {
    backgroundColor: Colors.gray50,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },

  // Bottom Action Buttons (Brand Aligned)
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.containerPadding,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    gap: Spacing.md,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.gray200,
    ...Shadow.small,
  },
  resetButtonText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginLeft: Spacing.xs,
    letterSpacing: 0.2,
  },
  nextButton: {
    flex: 1,
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.medium,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
  // Label Input Section
  labelInputContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  labelInput: {
    borderWidth: 2,
    borderColor: Colors.gray200,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    width: 140,
    textAlign: 'center',
    fontSize: Typography.fontSize.sm,
    backgroundColor: Colors.white,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
    letterSpacing: 0.3,
    ...Shadow.small,
  },
});

export default FilterFrameScreen;
