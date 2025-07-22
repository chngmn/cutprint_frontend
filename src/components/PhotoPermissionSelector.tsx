import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Pressable 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type PhotoVisibility = 'PRIVATE' | 'CLOSE_FRIENDS' | 'ALL_FRIENDS';

interface PhotoPermissionSelectorProps {
  visible: boolean;
  currentVisibility: PhotoVisibility;
  onSelect: (visibility: PhotoVisibility) => void;
  onClose: () => void;
}

const PhotoPermissionSelector: React.FC<PhotoPermissionSelectorProps> = ({
  visible,
  currentVisibility,
  onSelect,
  onClose,
}) => {
  const permissionOptions = [
    {
      value: 'PRIVATE' as PhotoVisibility,
      label: '나만 보기',
      description: '나만 볼 수 있어요',
      icon: 'lock',
      color: '#666',
    },
    {
      value: 'CLOSE_FRIENDS' as PhotoVisibility,
      label: '친한 친구만 보기',
      description: '친한 친구로 지정한 친구들만 볼 수 있어요',
      icon: 'star',
      color: '#FFD700',
    },
    {
      value: 'ALL_FRIENDS' as PhotoVisibility,
      label: '모든 친구 보기',
      description: '모든 친구들이 볼 수 있어요',
      icon: 'account-group',
      color: '#4CAF50',
    },
  ];

  const handleSelect = (visibility: PhotoVisibility) => {
    onSelect(visibility);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>사진 공개 설정</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
            {permissionOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  currentVisibility === option.value && styles.selectedOption
                ]}
                onPress={() => handleSelect(option.value)}
              >
                <View style={styles.optionContent}>
                  <MaterialCommunityIcons 
                    name={option.icon as any} 
                    size={24} 
                    color={currentVisibility === option.value ? option.color : '#888'} 
                  />
                  <View style={styles.optionText}>
                    <Text style={[
                      styles.optionLabel,
                      currentVisibility === option.value && styles.selectedOptionLabel
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      styles.optionDescription,
                      currentVisibility === option.value && styles.selectedOptionDescription
                    ]}>
                      {option.description}
                    </Text>
                  </View>
                  {currentVisibility === option.value && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={option.color} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Pretendard',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#f0f8ff',
    borderColor: '#e3f2fd',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionText: {
    flex: 1,
    marginLeft: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    fontFamily: 'Pretendard',
  },
  selectedOptionLabel: {
    color: '#1976d2',
  },
  optionDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    fontFamily: 'Pretendard',
  },
  selectedOptionDescription: {
    color: '#1976d2',
  },
});

export default PhotoPermissionSelector;