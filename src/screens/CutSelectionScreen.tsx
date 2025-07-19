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

const FramePreview = ({ cutType }: { cutType: string }) => {
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
      style={[styles.optionContainer, containerStyle]}
      onPress={onPress}
    >
      <FramePreview cutType={cutType} />
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
            cutType="Vertical 4-cut"
            onPress={() => handleCutSelect('Vertical 4-cut')}
          />
          <CutLayout
            cutType="4-cut grid"
            onPress={() => handleCutSelect('4-cut grid')}
          />
        </View>
        <CutLayout
          cutType="6-cut grid"
          onPress={() => handleCutSelect('6-cut grid')}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    paddingTop: 80,
    paddingBottom: 50,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#343A40',
  },
  optionsContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30, // Increased margin for more space
  },
  optionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topImage: {
    width: 100,
    height: 180,
    resizeMode: 'contain',
  },
  bottomImage: {
    width: 180, // Made the bottom image wider
    height: 160,
    resizeMode: 'contain',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginTop: 15, // Added margin top for spacing
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
  placeholder: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  cutprintLabel: {
    backgroundColor: '#000000',
    height: 20,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cutprintText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default CutSelectionScreen;
