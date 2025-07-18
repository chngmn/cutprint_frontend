import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

// 네비게이터 param 타입 정의
type RootStackParamList = {
  Camera: undefined;
  // 다른 스크린들...
};

type CutLayoutProps = {
  type: 'vertical-4' | 'grid-4' | 'grid-6';
  onPress: () => void;
};

const CutLayout = ({ type, onPress }: CutLayoutProps) => {
  const renderLayout = () => {
    switch (type) {
      case 'vertical-4':
        return (
          <View style={styles.layoutContainer_for_vertical_4}>
            <View style={[styles.layoutBox, styles.verticalBox]} />
            <View style={[styles.layoutBox, styles.verticalBox]} />
            <View style={[styles.layoutBox, styles.verticalBox]} />
            <View style={[styles.layoutBox, styles.verticalBox]} />
          </View>
        );
      case 'grid-4':
        return (
          <View
            style={[
              styles.layoutContainer,
              { flexDirection: 'row', flexWrap: 'wrap' },
            ]}
          >
            <View style={[styles.layoutBox, styles.grid4Box]} />
            <View style={[styles.layoutBox, styles.grid4Box]} />
            <View style={[styles.layoutBox, styles.grid4Box]} />
            <View style={[styles.layoutBox, styles.grid4Box]} />
          </View>
        );
      case 'grid-6':
        return (
          <View
            style={[
              styles.layoutContainer,
              { flexDirection: 'row', flexWrap: 'wrap' },
            ]}
          >
            <View style={[styles.layoutBox, styles.grid6Box]} />
            <View style={[styles.layoutBox, styles.grid6Box]} />
            <View style={[styles.layoutBox, styles.grid6Box]} />
            <View style={[styles.layoutBox, styles.grid6Box]} />
            <View style={[styles.layoutBox, styles.grid6Box]} />
            <View style={[styles.layoutBox, styles.grid6Box]} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.cutOption}>
      {renderLayout()}
    </TouchableOpacity>
  );
};

const CutSelectionScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleCutSelect = (cutType: string) => {
    console.log(`${cutType} selected`);
    navigation.navigate('Camera');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>원하는 컷을 선택하세요</Text>
      <View style={styles.optionsContainer}>
        <CutLayout
          type="vertical-4"
          onPress={() => handleCutSelect('Vertical 4-cut')}
        />
        <CutLayout
          type="grid-4"
          onPress={() => handleCutSelect('4-cut grid')}
        />
        <CutLayout
          type="grid-6"
          onPress={() => handleCutSelect('6-cut grid')}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  cutOption: {
    padding: 10,
    alignItems: 'center',
  },
  layoutContainer: {
    width: 100,
    height: 150,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 10,
    overflow: 'hidden',
  },
  layoutContainer_for_vertical_4: {
    width: 50,
    height: 150,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 10,
    overflow: 'hidden',
  },
  layoutBox: {
    backgroundColor: '#f0f0f0',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  verticalBox: {
    flex: 1,
  },
  grid4Box: {
    width: '50%',
    height: '50%',
  },
  grid6Box: {
    width: '50%',
    height: '33.33%',
  },
});

export default CutSelectionScreen;
