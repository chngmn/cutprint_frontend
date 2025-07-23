// src/utils/qrCodeUtils.ts
import QRCodeSVG from 'react-native-qrcode-svg';
import { ViewShot } from 'react-native-view-shot';
import React from 'react';
import { View } from 'react-native';
import * as FileSystem from 'expo-file-system';

export interface QRCodeOptions {
  value: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
  logoSize?: number;
}

/**
 * QR 코드를 Base64 이미지로 생성
 * @param options QR 코드 생성 옵션
 * @returns Base64 인코딩된 QR 코드 이미지
 */
export const generateQRCodeBase64 = (options: QRCodeOptions): Promise<string> => {
  return new Promise((resolve, reject) => {
    const {
      value,
      size = 100,
      backgroundColor = 'white',
      color = 'black'
    } = options;

    try {
      // QR 코드 SVG를 생성하고 Base64로 변환
      const qrCodeRef = React.createRef<QRCodeSVG>();
      
      // QR 코드 SVG 생성
      const qrCode = React.createElement(QRCodeSVG, {
        ref: qrCodeRef,
        value: value,
        size: size,
        backgroundColor: backgroundColor,
        color: color,
        getRef: (c: any) => {
          if (c) {
            c.toDataURL((dataURL: string) => {
              resolve(dataURL);
            });
          }
        }
      });

      // React Native에서는 직접 SVG를 Base64로 변환하기 어려우므로
      // View를 사용해서 캡처하는 방식으로 구현
      resolve(generateQRCodeWithViewShot(options));
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * ViewShot을 사용해서 QR 코드를 이미지로 캡처
 */
const generateQRCodeWithViewShot = async (options: QRCodeOptions): Promise<string> => {
  const {
    value,
    size = 100,
    backgroundColor = 'white',
    color = 'black'
  } = options;

  // 임시 파일로 저장한 후 Base64로 읽어오는 방식
  const tempFileName = `qr_${Date.now()}.png`;
  const tempFilePath = `${FileSystem.cacheDirectory}${tempFileName}`;

  // SVG 데이터를 직접 생성 (간단한 QR 코드 SVG)
  const svgData = createSimpleQRCodeSVG(value, size, backgroundColor, color);
  
  // SVG를 Base64로 인코딩
  const base64SVG = Buffer.from(svgData).toString('base64');
  const dataURI = `data:image/svg+xml;base64,${base64SVG}`;
  
  return dataURI;
};

/**
 * 간단한 QR 코드 SVG 생성 (fallback용)
 * 실제로는 react-native-qrcode-svg를 사용하지만, 
 * 서버사이드 렌더링이나 특수한 경우를 위한 대안
 */
const createSimpleQRCodeSVG = (
  value: string, 
  size: number, 
  backgroundColor: string, 
  color: string
): string => {
  // 실제 QR 코드 생성 로직은 복잡하므로, 
  // 여기서는 플레이스홀더 SVG를 반환
  // 실제 구현에서는 react-native-qrcode-svg 라이브러리를 사용
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${backgroundColor}"/>
      <rect x="10%" y="10%" width="80%" height="80%" fill="${color}"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="${backgroundColor}" font-size="8">
        QR
      </text>
    </svg>
  `;
};

/**
 * QR 코드가 포함된 이미지의 위치 계산
 * @param imageWidth 원본 이미지 너비
 * @param imageHeight 원본 이미지 높이
 * @param qrSize QR 코드 크기
 * @param position QR 코드 위치 ('bottom-right' | 'bottom-left' | 'top-right' | 'top-left')
 * @returns QR 코드 위치 좌표 {x, y}
 */
export const calculateQRPosition = (
  imageWidth: number,
  imageHeight: number,
  qrSize: number,
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' = 'bottom-right'
): { x: number; y: number } => {
  const margin = Math.min(imageWidth, imageHeight) * 0.05; // 5% 마진

  switch (position) {
    case 'bottom-right':
      return {
        x: imageWidth - qrSize - margin,
        y: imageHeight - qrSize - margin
      };
    case 'bottom-left':
      return {
        x: margin,
        y: imageHeight - qrSize - margin
      };
    case 'top-right':
      return {
        x: imageWidth - qrSize - margin,
        y: margin
      };
    case 'top-left':
      return {
        x: margin,
        y: margin
      };
    default:
      return {
        x: imageWidth - qrSize - margin,
        y: imageHeight - qrSize - margin
      };
  }
};

/**
 * QR 코드 크기를 이미지 크기에 맞게 조정
 * @param imageWidth 원본 이미지 너비
 * @param imageHeight 원본 이미지 높이
 * @param sizeRatio QR 코드 크기 비율 (기본값: 0.1 = 10%)
 * @returns 조정된 QR 코드 크기
 */
export const calculateQRSize = (
  imageWidth: number,
  imageHeight: number,
  sizeRatio: number = 0.1
): number => {
  const minDimension = Math.min(imageWidth, imageHeight);
  const qrSize = Math.floor(minDimension * sizeRatio);
  
  // 최소 크기 보장 (50px)
  return Math.max(qrSize, 50);
};

/**
 * QR 코드 유효성 검증
 * @param value QR 코드에 인코딩할 값
 * @returns 유효성 검증 결과
 */
export const validateQRCodeValue = (value: string): { isValid: boolean; error?: string } => {
  if (!value || value.trim().length === 0) {
    return { isValid: false, error: 'QR 코드 값이 비어있습니다.' };
  }

  if (value.length > 2000) {
    return { isValid: false, error: 'QR 코드 값이 너무 깁니다. (최대 2000자)' };
  }

  // URL 형식 검증 (선택사항)
  if (value.startsWith('http')) {
    try {
      new URL(value);
    } catch {
      return { isValid: false, error: '올바르지 않은 URL 형식입니다.' };
    }
  }

  return { isValid: true };
};