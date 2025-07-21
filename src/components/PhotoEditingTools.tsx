import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  PanGestureHandler,
  State,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import CustomText from './CustomText';

interface EditingTool {
  id: string;
  name: string;
  icon: string;
  min: number;
  max: number;
  default: number;
  step?: number;
}

interface PhotoEditingToolsProps {
  onToolChange: (toolId: string, value: number) => void;
  currentValues: { [key: string]: number };
  visible: boolean;
  onToggle: () => void;
}

const editingTools: EditingTool[] = [
  {
    id: 'brightness',
    name: '밝기',
    icon: 'brightness-6',
    min: -100,
    max: 100,
    default: 0,
    step: 1,
  },
  {
    id: 'contrast',
    name: '대비',
    icon: 'contrast',
    min: -100,
    max: 100,
    default: 0,
    step: 1,
  },
  {
    id: 'saturation',
    name: '채도',
    icon: 'palette',
    min: -100,
    max: 100,
    default: 0,
    step: 1,
  },
  {
    id: 'sharpness',
    name: '선명도',
    icon: 'tune',
    min: -100,
    max: 100,
    default: 0,
    step: 1,
  },
  {
    id: 'temperature',
    name: '색온도',
    icon: 'thermometer',
    min: -100,
    max: 100,
    default: 0,
    step: 1,
  },
  {
    id: 'tint',
    name: '색조',
    icon: 'color-lens',
    min: -100,
    max: 100,
    default: 0,
    step: 1,
  },
  {
    id: 'highlights',
    name: '하이라이트',
    icon: 'weather-sunny',
    min: -100,
    max: 100,
    default: 0,
    step: 1,
  },
  {
    id: 'shadows',
    name: '그림자',
    icon: 'weather-cloudy',
    min: -100,
    max: 100,
    default: 0,
    step: 1,
  },
  {
    id: 'vignette',
    name: '비네팅',
    icon: 'circle-outline',
    min: 0,
    max: 100,
    default: 0,
    step: 1,
  },
  {
    id: 'grain',
    name: '그레인',
    icon: 'grain',
    min: 0,
    max: 100,
    default: 0,
    step: 1,
  },
];

const PhotoEditingTools: React.FC<PhotoEditingToolsProps> = ({
  onToolChange,
  currentValues,
  visible,
  onToggle,
}) => {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const getCurrentValue = (toolId: string): number => {
    const tool = editingTools.find(t => t.id === toolId);
    return currentValues[toolId] ?? tool?.default ?? 0;
  };

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(selectedTool === toolId ? null : toolId);
  };

  const handleValueChange = (toolId: string, value: number) => {
    onToolChange(toolId, value);
  };

  const handleReset = (toolId: string) => {
    const tool = editingTools.find(t => t.id === toolId);
    if (tool) {
      handleValueChange(toolId, tool.default);
    }
  };

  const handleResetAll = () => {
    editingTools.forEach(tool => {
      handleValueChange(tool.id, tool.default);
    });
    setSelectedTool(null);
  };

  const renderToolButton = (tool: EditingTool) => {
    const isSelected = selectedTool === tool.id;
    const currentValue = getCurrentValue(tool.id);
    const isModified = currentValue !== tool.default;

    return (
      <TouchableOpacity
        key={tool.id}
        style={[
          styles.toolButton,
          isSelected && styles.toolButtonSelected,
          isModified && styles.toolButtonModified,
        ]}
        onPress={() => handleToolSelect(tool.id)}
      >
        <MaterialCommunityIcons
          name={tool.icon as any}
          size={24}
          color={isSelected ? '#FFFFFF' : isModified ? '#4867B7' : '#6C757D'}
        />
        <CustomText
          style={[
            styles.toolButtonText,
            isSelected && styles.toolButtonTextSelected,
            isModified && styles.toolButtonTextModified,
          ]}
        >
          {tool.name}
        </CustomText>
        {isModified && (
          <View style={styles.modificationIndicator} />
        )}
      </TouchableOpacity>
    );
  };

  const renderSlider = () => {
    if (!selectedTool) return null;

    const tool = editingTools.find(t => t.id === selectedTool);
    if (!tool) return null;

    const currentValue = getCurrentValue(selectedTool);

    return (
      <View style={styles.sliderContainer}>
        <View style={styles.sliderHeader}>
          <CustomText style={styles.sliderTitle}>{tool.name}</CustomText>
          <View style={styles.sliderActions}>
            <CustomText style={styles.sliderValue}>
              {currentValue > 0 ? '+' : ''}{currentValue}
            </CustomText>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => handleReset(selectedTool)}
            >
              <MaterialCommunityIcons
                name="restore"
                size={16}
                color="#6C757D"
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.sliderWrapper}>
          <CustomText style={styles.sliderMin}>{tool.min}</CustomText>
          <Slider
            style={styles.slider}
            minimumValue={tool.min}
            maximumValue={tool.max}
            value={currentValue}
            step={tool.step || 1}
            onValueChange={(value) => handleValueChange(selectedTool, Math.round(value))}
            minimumTrackTintColor="#4867B7"
            maximumTrackTintColor="#E9ECEF"
            thumbStyle={styles.sliderThumb}
            trackStyle={styles.sliderTrack}
          />
          <CustomText style={styles.sliderMax}>{tool.max}</CustomText>
        </View>
      </View>
    );
  };

  if (!visible) {
    return (
      <TouchableOpacity style={styles.toggleButton} onPress={onToggle}>
        <MaterialCommunityIcons name="tune" size={24} color="#4867B7" />
        <CustomText style={styles.toggleButtonText}>편집</CustomText>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <CustomText style={styles.headerTitle}>사진 편집</CustomText>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.resetAllButton}
            onPress={handleResetAll}
          >
            <MaterialCommunityIcons name="restore" size={20} color="#6C757D" />
            <CustomText style={styles.resetAllText}>초기화</CustomText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onToggle}>
            <MaterialCommunityIcons name="close" size={24} color="#6C757D" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 도구 목록 */}
      <View style={styles.toolsContainer}>
        <View style={styles.toolsGrid}>
          {editingTools.map(renderToolButton)}
        </View>
      </View>

      {/* 슬라이더 */}
      {renderSlider()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    maxHeight: 300,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  toggleButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#4867B7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343A40',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  resetAllText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#6C757D',
  },
  closeButton: {
    padding: 5,
  },
  toolsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toolButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '18%',
    aspectRatio: 1,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    position: 'relative',
  },
  toolButtonSelected: {
    backgroundColor: '#4867B7',
    borderColor: '#4867B7',
  },
  toolButtonModified: {
    borderColor: '#4867B7',
    borderWidth: 2,
  },
  toolButtonText: {
    fontSize: 10,
    color: '#6C757D',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  toolButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  toolButtonTextModified: {
    color: '#4867B7',
    fontWeight: '600',
  },
  modificationIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4867B7',
  },
  sliderContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sliderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343A40',
  },
  sliderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4867B7',
    marginRight: 10,
    minWidth: 35,
    textAlign: 'right',
  },
  resetButton: {
    padding: 5,
  },
  sliderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderMin: {
    fontSize: 12,
    color: '#6C757D',
    marginRight: 10,
    minWidth: 25,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderMax: {
    fontSize: 12,
    color: '#6C757D',
    marginLeft: 10,
    minWidth: 25,
    textAlign: 'center',
  },
  sliderThumb: {
    backgroundColor: '#4867B7',
    width: 20,
    height: 20,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
  },
});

export default PhotoEditingTools;