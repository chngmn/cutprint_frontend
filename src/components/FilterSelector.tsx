import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomText from './CustomText';
import { 
  FilterEffect, 
  filterCategories, 
  getFiltersByCategory, 
  getFilterById 
} from '../utils/filterEffects';

interface FilterSelectorProps {
  selectedFilterId: string;
  onFilterSelect: (filterId: string) => void;
  previewImage?: string;
}

const { width } = Dimensions.get('window');

const FilterSelector: React.FC<FilterSelectorProps> = ({
  selectedFilterId,
  onFilterSelect,
  previewImage,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('classic');

  const currentFilters = getFiltersByCategory(selectedCategory);
  const selectedFilter = getFilterById(selectedFilterId);

  const renderCategoryTab = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.categoryTab,
        selectedCategory === item.id && styles.categoryTabSelected,
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <CustomText style={styles.categoryIcon}>{item.icon}</CustomText>
      <CustomText
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.categoryTextSelected,
        ]}
      >
        {item.name}
      </CustomText>
    </TouchableOpacity>
  );

  const renderFilterItem = ({ item }: { item: FilterEffect }) => {
    const isSelected = selectedFilterId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.filterItem,
          isSelected && styles.filterItemSelected,
        ]}
        onPress={() => onFilterSelect(item.id)}
      >
        <View style={styles.filterPreview}>
          {/* 필터 미리보기 이미지 영역 */}
          <View
            style={[
              styles.filterPreviewBox,
              {
                backgroundColor: '#E9ECEF',
                // 실제 필터 효과를 적용할 수 있는 영역
              },
            ]}
          >
            {/* 필터 오버레이 효과 미리보기 */}
            {item.transform.overlay && (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: item.transform.overlay.color,
                    opacity: item.transform.overlay.opacity,
                  },
                ]}
              />
            )}
            {item.transform.grayscale && (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: '#808080',
                    opacity: item.transform.grayscale * 0.5,
                  },
                ]}
              />
            )}
            {item.transform.sepia && (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: '#8B4513',
                    opacity: item.transform.sepia * 0.3,
                  },
                ]}
              />
            )}
            
            {/* 체크 표시 */}
            {isSelected && (
              <View style={styles.selectedOverlay}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color="#4867B7"
                />
              </View>
            )}
          </View>
        </View>
        
        <CustomText
          style={[
            styles.filterName,
            isSelected && styles.filterNameSelected,
          ]}
          numberOfLines={1}
        >
          {item.name}
        </CustomText>
        
        {/* 필터 강도 표시 */}
        {item.intensity && (
          <View style={styles.intensityIndicator}>
            {[...Array(3)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.intensityDot,
                  index < item.intensity! && styles.intensityDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 선택된 필터 정보 */}
      {selectedFilter && (
        <View style={styles.selectedFilterInfo}>
          <CustomText style={styles.selectedFilterName}>
            {selectedFilter.name}
          </CustomText>
          <CustomText style={styles.selectedFilterDescription}>
            {selectedFilter.description}
          </CustomText>
        </View>
      )}

      {/* 카테고리 탭 */}
      <View style={styles.categoryContainer}>
        <FlatList
          data={filterCategories}
          renderItem={renderCategoryTab}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* 필터 목록 */}
      <View style={styles.filterContainer}>
        <FlatList
          data={currentFilters}
          renderItem={renderFilterItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          ItemSeparatorComponent={() => <View style={styles.filterSeparator} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
  },
  selectedFilterInfo: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  selectedFilterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343A40',
    marginBottom: 2,
  },
  selectedFilterDescription: {
    fontSize: 12,
    color: '#6C757D',
  },
  categoryContainer: {
    paddingVertical: 10,
  },
  categoryList: {
    paddingHorizontal: 15,
  },
  categoryTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    minWidth: 70,
  },
  categoryTabSelected: {
    backgroundColor: '#4867B7',
    borderColor: '#4867B7',
  },
  categoryIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  filterContainer: {
    paddingVertical: 15,
  },
  filterList: {
    paddingHorizontal: 15,
  },
  filterItem: {
    alignItems: 'center',
    width: 80,
  },
  filterItemSelected: {
    // 선택된 필터 아이템 스타일
  },
  filterPreview: {
    marginBottom: 8,
  },
  filterPreviewBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    position: 'relative',
    overflow: 'hidden',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(72, 103, 183, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterName: {
    fontSize: 12,
    color: '#495057',
    textAlign: 'center',
    fontWeight: '500',
  },
  filterNameSelected: {
    color: '#4867B7',
    fontWeight: 'bold',
  },
  filterSeparator: {
    width: 15,
  },
  intensityIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  intensityDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CED4DA',
    marginHorizontal: 1,
  },
  intensityDotActive: {
    backgroundColor: '#4867B7',
  },
});

export default FilterSelector;