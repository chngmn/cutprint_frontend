import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import CustomText from '../components/CustomText';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Camera: { cutType: string; isOnlineMode?: boolean };
  CameraGuide: { cutType: string; isOnlineMode?: boolean };
};

const CameraGuideScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { cutType, isOnlineMode } = route.params as { cutType: string; isOnlineMode?: boolean };

  const handleStart = () => {
    navigation.replace('Camera', { cutType, isOnlineMode });
  };

  return (
    <View style={styles.container}>
      <CustomText style={styles.title}>
        {isOnlineMode ? '🌐 온라인 함께 찍기' : '📸 찍기 전 주의사항'}
      </CustomText>
      <View style={styles.guideBox}>
        {isOnlineMode ? (
          <>
            <CustomText style={styles.guideText}>• 온라인 모드에서는 8컷을 촬영합니다.</CustomText>
            <CustomText style={styles.guideText}>• 촬영 후 각자 1컷씩만 선택합니다.</CustomText>
            <CustomText style={styles.guideText}>• 선택된 사진들로 프레임이 완성됩니다.</CustomText>
            <CustomText style={styles.guideText}>• 타이머는 기본 5초입니다.</CustomText>
            <CustomText style={styles.guideText}>• 설정에서 카메라 접근을 허용해주세요.</CustomText>
            <CustomText style={styles.guideText}>• 이제 온라인 촬영을 시작해볼까요?</CustomText>
          </>
        ) : (
          <>
            <CustomText style={styles.guideText}>• 타이머는 기본 5초입니다.</CustomText>
            <CustomText style={styles.guideText}>• 타이머 시간은 촬영 중 조정이 가능해요.</CustomText>
            <CustomText style={styles.guideText}>• 아래 버튼을 누르면 바로 촬영이 시작돼요.</CustomText>
            <CustomText style={styles.guideText}>• 사진은 기본 8번 촬영돼요.</CustomText>
            <CustomText style={styles.guideText}>• 설정에서 카메라 접근을 허용해주세요.</CustomText>
            <CustomText style={styles.guideText}>• 뒤로가기 버튼으로 촬영 중단이 가능해요.</CustomText>
            <CustomText style={styles.guideText}>• 이제 촬영을 시작해볼까요?</CustomText>
          </>
        )}
      </View>
      <TouchableOpacity style={styles.startButton} onPress={handleStart}>
        <CustomText style={styles.startButtonText}>촬영 시작하기</CustomText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 2,
  },
  guideBox: {
    width: '100%',
    backgroundColor: '#F5F6FA',
    borderRadius: 16,
    padding: 32,
    marginTop: 85,
    marginBottom: 40,
  },
  guideText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 18,
    lineHeight: 28,
  },
  startButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CameraGuideScreen;
