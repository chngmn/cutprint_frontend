//src/screens/PreviewAndSaveScreen.tsx
import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import CustomText from '../components/CustomText';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  PreviewAndSave: { imageUri: string; cutType: string };
  Album: { newImageUri: string; frameType: string };
};

type PreviewAndSaveScreenRouteProp = RouteProp<
  RootStackParamList,
  'PreviewAndSave'
>;

type PreviewAndSaveScreenNavigationProp = StackNavigationProp<any>;

const PreviewAndSaveScreen = () => {
  const route = useRoute<PreviewAndSaveScreenRouteProp>();
  const navigation = useNavigation<PreviewAndSaveScreenNavigationProp>();
  const { imageUri, cutType } = route.params;

  const saveToAlbum = async () => {
    try {
      // @ts-ignore
      navigation.navigate('Main', { screen: 'Album', params: { newImageUri: imageUri, frameType: cutType } });
      Alert.alert('저장 완료', '사진이 앱 앨범에 저장되었습니다.');
    } catch (error) {
      console.error('Error navigating to AlbumScreen:', error);
      Alert.alert('오류', '사진을 앱 앨범에 저장하는 중 오류가 발생했습니다.');
    }
  };

  const printImage = async () => {
    try {
      await Print.printAsync({
        uri: imageUri,
      });
    } catch (error: any) {
      if (
        error.message &&
        error.message.includes('Printing did not complete')
      ) {
        console.log('Printing was cancelled by the user.');
      } else {
        console.error('Error printing image:', error);
        Alert.alert('오류', '인쇄 중 오류가 발생했습니다.');
      }
    }
  };

  const shareToInstagramStory = async () => {
    try {
      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/jpeg',
        UTI: 'com.instagram.sharedSticker.backgroundImage',
        dialogTitle: '인스타그램 스토리에 공유',
      });
    } catch (error) {
      console.error('Error sharing to Instagram Story:', error);
      Alert.alert('오류', '공유하는 중 오류가 발생했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#343A40" />
        </TouchableOpacity>
        <CustomText style={styles.title}>미리보기 및 저장</CustomText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.previewContainer}>
        <Image source={{ uri: imageUri }} style={styles.previewImage} />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={saveToAlbum}>
          <Ionicons name="download-outline" size={28} color="#495057" />
          <CustomText style={styles.buttonText}>사진첩에 저장</CustomText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={printImage}>
          <Ionicons name="print-outline" size={28} color="#495057" />
          <CustomText style={styles.buttonText}>인쇄하기</CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={shareToInstagramStory}
        >
          <Ionicons name="logo-instagram" size={28} color="#495057" />
          <CustomText style={styles.buttonText}>스토리에 공유</CustomText>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#343A40',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
  },
  actionButton: {
    alignItems: 'center',
    padding: 10,
  },
  buttonText: {
    fontSize: 14,
    color: '#495057',
    marginTop: 8,
  },
});

export default PreviewAndSaveScreen;
