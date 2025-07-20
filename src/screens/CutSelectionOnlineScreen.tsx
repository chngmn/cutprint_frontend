import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  FlatList,
  Text,
  Alert,
} from 'react-native';
import CustomText from '../components/CustomText';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

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
  CameraGuide: { cutType: string; isOnlineMode: boolean };
};

interface Friend {
  id: string;
  name: string;
  profileImage: string | null;
  status: 'online' | 'offline';
}

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

const CutSelectionOnlineScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);

  // 더미 친구 데이터
  const [friends] = useState<Friend[]>([
    { id: '1', name: '김민준', profileImage: null, status: 'online' },
    { id: '2', name: '이서연', profileImage: null, status: 'online' },
    { id: '3', name: '박지훈', profileImage: null, status: 'online' },
    { id: '4', name: '최유진', profileImage: null, status: 'online' },
    { id: '5', name: '정민수', profileImage: null, status: 'online' },
    { id: '6', name: '한지영', profileImage: null, status: 'online' },
  ]);

  const handleCutSelect = (cutType: string) => {
    setSelectedFrame(cutType);
    setShowFriendModal(true);
  };

  const toggleFriendSelection = (friend: Friend) => {
    const maxCount = getRequiredPhotoCount(selectedFrame || '')-1;
    const isSelected = selectedFriends.some(f => f.id === friend.id);
    
    if (isSelected) {
      setSelectedFriends(selectedFriends.filter(f => f.id !== friend.id));
    } else {
      if (selectedFriends.length >= maxCount) {
        Alert.alert('인원 제한', `최대 ${maxCount}명까지 선택할 수 있습니다.`);
        return;
      }
      setSelectedFriends([...selectedFriends, friend]);
    }
  };

  const handleFriendSelectionComplete = () => {
    if (selectedFriends.length === 0) {
      Alert.alert('친구 선택', '함께 찍을 친구를 선택해주세요.');
      return;
    }
    
    Alert.alert(
      '선택 완료',
      `선택된 프레임: ${selectedFrame}\n선택된 친구: ${selectedFriends.map(f => f.name).join(', ')}\n\n이제 카메라로 이동합니다.`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '카메라로 이동', 
          onPress: () => {
            setShowFriendModal(false);
            navigation.navigate('CameraGuide', { cutType: selectedFrame || '', isOnlineMode: true });
          }
        }
      ]
    );
  };

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const isSelected = selectedFriends.some(f => f.id === item.id);
    const maxCount = getRequiredPhotoCount(selectedFrame || '')-1;
    const isDisabled = selectedFriends.length >= maxCount && !isSelected;
    
    return (
      <TouchableOpacity
        style={[
          styles.friendItem, 
          isSelected && styles.selectedFriendItem,
          isDisabled && styles.disabledFriendItem
        ]}
        onPress={() => toggleFriendSelection(item)}
        disabled={isDisabled}
      >
        <View style={styles.friendInfo}>
          <View style={[styles.statusIndicator, { backgroundColor: item.status === 'online' ? '#4CAF50' : '#9E9E9E' }]} />
          <Text style={[styles.friendName, isDisabled && styles.disabledText]}>{item.name}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* <CustomText style={styles.title}>온라인 함께 찍기</CustomText> */}
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

      {/* 친구 선택 모달 */}
      <Modal
        visible={showFriendModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFriendModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <CustomText style={styles.modalTitle}>친구 선택</CustomText>
              <TouchableOpacity onPress={() => setShowFriendModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                {selectedFrame && `최대 ${getRequiredPhotoCount(selectedFrame)-1}명 선택 가능`}
              </Text>
              <FlatList
                data={friends.filter(f => f.status === 'online')}
                keyExtractor={(item) => item.id}
                renderItem={renderFriendItem}
                style={styles.friendList}
              />
              <View style={styles.modalFooter}>
                <Text style={styles.selectionCount}>
                  {selectedFriends.length}/{selectedFrame ? getRequiredPhotoCount(selectedFrame)-1 : 0}명 선택됨
                </Text>
                <TouchableOpacity
                  style={[
                    styles.completeButton,
                    selectedFriends.length === 0 && styles.disabledButton
                  ]}
                  onPress={handleFriendSelectionComplete}
                  disabled={selectedFriends.length === 0}
                >
                  <Text style={styles.completeButtonText}>선택 완료</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  friendList: {
    maxHeight: 300,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedFriendItem: {
    backgroundColor: '#f0f8ff',
  },
  disabledFriendItem: {
    backgroundColor: '#f5f5f5',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  friendName: {
    fontSize: 16,
    color: '#333',
  },
  disabledText: {
    color: '#999',
  },
  modalFooter: {
    marginTop: 20,
    alignItems: 'center',
  },
  selectionCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default CutSelectionOnlineScreen;
