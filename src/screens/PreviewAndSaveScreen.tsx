//src/screens/PreviewAndSaveScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import CustomText from '../components/CustomText';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';

type RootStackParamList = {
  PreviewAndSave: { imageUri: string; cutType: string };
  Album: { userId?: number; userName?: string; newImageUri: string; frameType: string };
};

type PreviewAndSaveScreenRouteProp = RouteProp<
  RootStackParamList,
  'PreviewAndSave'
>;

type PreviewAndSaveScreenNavigationProp = StackNavigationProp<any>;

import * as FileSystem from 'expo-file-system';
import { apiService } from '../services/apiService';

const PreviewAndSaveScreen = () => {
  const route = useRoute<PreviewAndSaveScreenRouteProp>();
  const navigation = useNavigation<PreviewAndSaveScreenNavigationProp>();
  const { imageUri, cutType } = route.params;

  const [friends, setFriends] = useState<{ id: number; name: string }[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  const [showFriendSelector, setShowFriendSelector] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const data = await apiService.getFriends();
        setFriends(data); // [{id, name}...]
      } catch (error) {
        console.error('친구 목록 불러오기 실패:', error);
      }
    };
    fetchFriends();
  }, []);

  const saveToAlbum = async () => {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await apiService.uploadPhoto(base64, selectedFriends);

      // @ts-ignore
      navigation.navigate('Main', { screen: 'Album', params: { newImageUri: imageUri, frameType: cutType, refresh: true, friends: selectedFriends } });
      Alert.alert('저장 완료', '사진이 앱 앨범에 저장되었습니다.');
    } catch (error) {
      console.error('Error saving photo to album:', error);
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
        <View style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
        }}>
          <TouchableOpacity
            onPress={() => setShowFriendSelector(prev => !prev)}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.85)',
              borderRadius: 16,
              paddingVertical: 5,
              paddingHorizontal: 12,
              shadowColor: '#228be6',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.10,
              shadowRadius: 3,
              elevation: 2,
              borderWidth: 1,
              borderColor: '#4dabf7',
            }}
          >
            <Ionicons name="person-add" size={16} color="#228be6" style={{ marginRight: 4 }} />
            <Text style={{ color: '#228be6', fontWeight: 'bold', fontSize: 13 }}>
              친구 선택
            </Text>
          </TouchableOpacity>
          {showFriendSelector && (
            <View
              style={{
                position: 'absolute',
                top: 36,
                right: 0,
                width: 160,
                maxHeight: 260,
                backgroundColor: 'rgba(255,255,255,0.97)',
                borderRadius: 14,
                paddingVertical: 8,
                paddingHorizontal: 0,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.13,
                shadowRadius: 8,
                elevation: 6,
                zIndex: 20,
              }}
            >
              <ScrollView style={{ maxHeight: 180 }}>
                {friends.length === 0 ? (
                  <CustomText style={{ color: '#adb5bd', fontSize: 14, textAlign: 'center', marginVertical: 12 }}>
                    친구가 없습니다.
                  </CustomText>
                ) : (
                  friends.map(friend => {
                    const selected = selectedFriends.includes(friend.id);
                    return (
                      <TouchableOpacity
                        key={friend.id}
                        onPress={() => {
                          setSelectedFriends(prev =>
                            prev.includes(friend.id)
                              ? prev.filter(id => id !== friend.id)
                              : [...prev, friend.id]
                          );
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 10,
                          paddingHorizontal: 16,
                          backgroundColor: selected ? '#e7f5ff' : 'transparent',
                          borderBottomWidth: 1,
                          borderBottomColor: '#f1f3f5',
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={selected ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={selected ? '#228be6' : '#adb5bd'}
                          style={{ marginRight: 10 }}
                        />
                        <Text style={{
                          color: selected ? '#228be6' : '#343a40',
                          fontWeight: selected ? 'bold' : 'normal',
                          fontSize: 15,
                        }}>
                          {friend.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
              <TouchableOpacity
                onPress={() => setShowFriendSelector(false)}
                style={{
                  marginTop: 8,
                  marginHorizontal: 12,
                  backgroundColor: '#4dabf7',
                  borderRadius: 10,
                  paddingVertical: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  elevation: 2,
                }}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>
                  선택 완료
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    position: 'relative', // 오버레이 버튼을 위해 추가
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
