import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type PhotoVisibility = 'PRIVATE' | 'CLOSE_FRIENDS' | 'ALL_FRIENDS';

interface PhotoPermissionIndicatorProps {
  visibility: PhotoVisibility;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

const PhotoPermissionIndicator: React.FC<PhotoPermissionIndicatorProps> = ({
  visibility,
  size = 'small',
  style,
}) => {
  const getIconConfig = () => {
    switch (visibility) {
      case 'PRIVATE':
        return {
          icon: 'lock',
          color: '#666',
          backgroundColor: 'rgba(220, 220, 220, 0.9)',
        };
      case 'CLOSE_FRIENDS':
        return {
          icon: 'star',
          color: '#FFD700',
          backgroundColor: 'rgba(255, 215, 0, 0.2)',
        };
      case 'ALL_FRIENDS':
        return {
          icon: 'account-group',
          color: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
        };
      default:
        return {
          icon: 'account-group',
          color: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { iconSize: 12, containerSize: 20 };
      case 'medium':
        return { iconSize: 16, containerSize: 26 };
      case 'large':
        return { iconSize: 20, containerSize: 32 };
      default:
        return { iconSize: 12, containerSize: 20 };
    }
  };

  const iconConfig = getIconConfig();
  const sizeConfig = getSizeConfig();

  // Don't show indicator for ALL_FRIENDS (default visibility)
  if (visibility === 'ALL_FRIENDS') {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: iconConfig.backgroundColor,
          width: sizeConfig.containerSize,
          height: sizeConfig.containerSize,
          borderRadius: sizeConfig.containerSize / 2,
        },
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={iconConfig.icon as any}
        size={sizeConfig.iconSize}
        color={iconConfig.color}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
});

export default PhotoPermissionIndicator;