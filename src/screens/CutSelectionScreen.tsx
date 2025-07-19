import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Camera: undefined;
};

type CutLayoutProps = {
  imageSource: any;
  label: string;
  onPress: () => void;
  containerStyle?: object;
  imageStyle?: object;
};

const CutLayout = ({
  imageSource,
  label,
  onPress,
  containerStyle,
  imageStyle,
}: CutLayoutProps) => {
  return (
    <TouchableOpacity
      style={[styles.optionContainer, containerStyle]}
      onPress={onPress}
    >
      <Image source={imageSource} style={imageStyle} />
      <Text style={styles.optionLabel}>{label}</Text>
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
      <View style={styles.header}>
        <Text style={styles.title}>원하는 프레임을 선택하세요</Text>
      </View>
      <View style={styles.optionsContainer}>
        <View style={styles.topRow}>
          <CutLayout
            imageSource={require('../../assets/4cut_original.png')}
            label=""
            onPress={() => handleCutSelect('Vertical 4-cut')}
            imageStyle={styles.topImage}
          />
          <CutLayout
            imageSource={require('../../assets/4cut_2x2.png')}
            label=""
            onPress={() => handleCutSelect('4-cut grid')}
            imageStyle={styles.topImage}
          />
        </View>
        <CutLayout
          imageSource={require('../../assets/6cut.png')}
          label=""
          onPress={() => handleCutSelect('6-cut grid')}
          imageStyle={styles.bottomImage}
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
});

export default CutSelectionScreen;
