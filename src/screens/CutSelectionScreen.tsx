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
  imageSource: any; // Adjust type as per your image source format
  label: string;
  onPress: () => void;
};

const CutLayout = ({ imageSource, label, onPress }: CutLayoutProps) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={imageSource} style={styles.cardImage} />
      <Text style={styles.cardLabel}>{label}</Text>
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
        <CutLayout
          imageSource={require('../../assets/4cut_original.png')}
          label=""
          onPress={() => handleCutSelect('Vertical 4-cut')}
        />
        <CutLayout
          imageSource={require('../../assets/4cut_2x2.png')}
          label=""
          onPress={() => handleCutSelect('4-cut grid')}
        />
        <CutLayout
          imageSource={require('../../assets/6cut.png')}
          label=""
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
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#343A40',
  },
  subtitle: {
    fontSize: 16,
    color: '#868E96',
    marginTop: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    width: 110, // Fixed width for consistency
  },
  cardImage: {
    width: 90,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
});

export default CutSelectionScreen;
