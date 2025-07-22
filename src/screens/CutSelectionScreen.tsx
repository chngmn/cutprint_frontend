import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import CustomText from '../components/CustomText';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Theme from '../constants/theme';

const { Colors, Typography, Spacing, Radius, Shadow } = Theme;

const getRequiredPhotoCount = (cutType: string): number => {
  switch (cutType) {
    case 'portrait 4-cut':
    case '4-cut grid':
      return 4;
    case '6-cut grid':
      return 6;
    default:
      return 4;
  }
};

const FramePreview = ({ cutType }: { cutType: string }) => {
  const requiredCount = getRequiredPhotoCount(cutType);
  const slots = Array.from({ length: requiredCount });

  const getFrameStyle = () => {
    switch (cutType) {
      case 'portrait 4-cut':
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
      case 'portrait 4-cut':
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
      case 'portrait 4-cut':
        return { width: 60 };
      case '4-cut grid':
        return { width: 120 };
      case '6-cut grid':
        return { width: 120 };
      default:
        return { width: 60 };
    }
  };

  return (
    <>
      <View style={[styles.framePreviewContainer, getFrameStyle()]}>
        {slots.map((_, index) => (
          <View key={index} style={[styles.photoSlot, getSlotStyle()]}>
            <View style={styles.placeholder} />
          </View>
        ))}
      </View>
      <View style={[styles.cutprintLabel, getCutprintLabelStyle()]}>
        <CustomText style={styles.cutprintText}>cutprint</CustomText>
      </View>
    </>
  );
};

type RootStackParamList = {
  Camera: { cutType: string };
  CameraGuide: { cutType: string };
};

type CutLayoutProps = {
  cutType: string;
  onPress: () => void;
  containerStyle?: object;
};

const CutLayout = ({ cutType, onPress, containerStyle }: CutLayoutProps) => {
  return (
    <TouchableOpacity
      style={[styles.optionCard, containerStyle]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <FramePreview cutType={cutType} />
        {/* <CustomText style={styles.cardLabel}>{cutType}</CustomText> */}
      </View>
    </TouchableOpacity>
  );
};

const CutSelectionScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleCutSelect = (cutType: string) => {
    navigation.navigate('CameraGuide', { cutType });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <CustomText style={styles.title}>원하는 프레임을 선택하세요</CustomText>
      </View>
      <View style={styles.optionsContainer}>
        <View style={styles.topRow}>
          <CutLayout
            cutType="portrait 4-cut"
            onPress={() => handleCutSelect('portrait 4-cut')}
            containerStyle={styles.smallCard}
          />
          <CutLayout
            cutType="4-cut grid"
            onPress={() => handleCutSelect('4-cut grid')}
            containerStyle={styles.smallCard}
          />
        </View>
        <CutLayout
          cutType="6-cut grid"
          onPress={() => handleCutSelect('6-cut grid')}
          containerStyle={styles.largeCard}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    paddingHorizontal: Spacing.containerPadding,
  },
  title: {
    fontSize: Typography.fontSize['xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerPadding,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },

  // Modern Card Design
  optionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadow.medium,
    overflow: 'hidden',
  },
  cardContent: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  cardLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  smallCard: {
    flex: 1,
    minHeight: 220,
  },
  largeCard: {
    width: '100%',
    minHeight: 200,
  },
  framePreviewContainer: {
    marginBottom: 0,
    backgroundColor: Colors.black,
    padding: 2,
  },
  frameVertical: {
    width: 60,
    height: 180,
  },
  frameGrid4: {
    width: 120,
    height: 160,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  frameGrid6: {
    width: 120,
    height: 160,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoSlot: {
    backgroundColor: Colors.gray200,
  },
  slotVertical: {
    width: '100%',
    height: '25%',
    borderWidth: 1,
    borderColor: Colors.black,
  },
  slotGrid4: {
    width: '50%',
    height: '50%',
    borderWidth: 1,
    borderColor: Colors.black,
  },
  slotGrid6: {
    width: '50%',
    height: '33.33%',
    borderWidth: 1,
    borderColor: Colors.black,
  },
  placeholder: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  cutprintLabel: {
    backgroundColor: Colors.black,
    height: 20,
    marginBottom: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cutprintText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
});

export default CutSelectionScreen;
