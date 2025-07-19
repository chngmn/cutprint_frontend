import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';

interface CustomTextProps extends TextProps {
  children: React.ReactNode;
}

const CustomText: React.FC<CustomTextProps> = ({ style, children, ...rest }) => {
  const flattenStyle = StyleSheet.flatten(style);
  const { fontWeight, ...otherStyles } = flattenStyle;

  let fontFamily = 'Pretendard-Regular'; // Default font

  if (fontWeight === 'bold' || fontWeight === '700') {
    fontFamily = 'Pretendard-Bold';
  } else if (fontWeight === '600') { // SemiBold
    fontFamily = 'Pretendard-SemiBold';
  } else if (fontWeight === '800') { // ExtraBold
    fontFamily = 'Pretendard-ExtraBold';
  } else if (fontWeight === '900') { // Black
    fontFamily = 'Pretendard-Black';
  } else if (fontWeight === '300') { // Light
    fontFamily = 'Pretendard-Light';
  } else if (fontWeight === '200') { // ExtraLight
    fontFamily = 'Pretendard-ExtraLight';
  } else if (fontWeight === '100') { // Thin
    fontFamily = 'Pretendard-Thin';
  } else if (fontWeight === '500') { // Medium
    fontFamily = 'Pretendard-Medium';
  }

  return (
    <Text style={[{ fontFamily }, otherStyles, { fontWeight: 'normal' }]} {...rest}>
      {children}
    </Text>
  );
};

export default CustomText;
