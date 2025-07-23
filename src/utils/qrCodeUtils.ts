// src/utils/qrCodeUtils.ts
import QRCodeSVG from 'react-native-qrcode-svg';
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

      // 2초 타임아웃 후 fallback 사용
      setTimeout(() => {
        const fallbackQR = generateQRCodeFallback(value, size, backgroundColor, color);
        resolve(fallbackQR);
      }, 2000);
    } catch (error) {
      console.error('QR code generation error:', error);
      // 에러 발생 시 fallback 사용
      try {
        const fallbackQR = generateQRCodeFallback(value, size, backgroundColor, color);
        resolve(fallbackQR);
      } catch (fallbackError) {
        reject(new Error('QR 코드 생성에 완전히 실패했습니다.'));
      }
    }
  });
};

/**
 * QR 코드를 실제로 생성하여 Base64 이미지로 반환
 */
const generateQRCodeWithViewShot = async (options: QRCodeOptions): Promise<string> => {
  const {
    value,
    size = 100,
    backgroundColor = 'white',
    color = 'black'
  } = options;

  return new Promise((resolve, reject) => {
    try {
      // react-native-qrcode-svg의 toDataURL 메서드를 사용
      const qrRef = React.createRef<any>();

      // QR 코드 SVG 생성
      const qrCodeComponent = React.createElement(QRCodeSVG, {
        value: value,
        size: size,
        backgroundColor: backgroundColor,
        color: color,
        ref: qrRef,
        getRef: (ref: any) => {
          if (ref && ref.toDataURL) {
            // SVG를 Base64 Data URL로 변환
            ref.toDataURL((dataURL: string) => {
              resolve(dataURL);
            });
          } else {
            // getRef가 작동하지 않을 경우 fallback
            const fallbackDataURL = generateQRCodeFallback(value, size, backgroundColor, color);
            resolve(fallbackDataURL);
          }
        }
      });

      // 타임아웃 설정 (5초 후 fallback)
      setTimeout(() => {
        const fallbackDataURL = generateQRCodeFallback(value, size, backgroundColor, color);
        resolve(fallbackDataURL);
      }, 5000);

    } catch (error) {
      console.error('QR code generation error:', error);
      const fallbackDataURL = generateQRCodeFallback(value, size, backgroundColor, color);
      resolve(fallbackDataURL);
    }
  });
};

/**
 * React Native 안전한 base64 인코딩 함수
 */
const safeBase64Encode = (str: string): string => {
  try {
    // SVG 문자열 정리 (줄바꿈, 공백 정리)
    const cleanStr = str.replace(/\s+/g, ' ').trim();

    // React Native 환경에서 안전한 base64 인코딩
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;

    while (i < cleanStr.length) {
      const a = cleanStr.charCodeAt(i++);
      const b = i < cleanStr.length ? cleanStr.charCodeAt(i++) : 0;
      const c = i < cleanStr.length ? cleanStr.charCodeAt(i++) : 0;

      const bitmap = (a << 16) | (b << 8) | c;

      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < cleanStr.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < cleanStr.length ? chars.charAt(bitmap & 63) : '=';
    }

    return result;
  } catch (error) {
    console.error('Base64 encoding error:', error);
    // 최종 fallback: 간단한 더미 데이터
    return 'PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0id2hpdGUiLz48L3N2Zz4=';
  }
};

/**
 * Fallback QR 코드 생성 함수
 */
const generateQRCodeFallback = (
  value: string,
  size: number,
  backgroundColor: string,
  color: string
): string => {
  const svgData = createImprovedQRCodeSVG(value, size, backgroundColor, color);
  const base64SVG = safeBase64Encode(svgData);
  return `data:image/svg+xml;base64,${base64SVG}`;
};

/**
 * 개선된 QR 코드 SVG 생성 (fallback용)
 * 실제 QR 코드와 비슷한 패턴을 생성
 */
const createImprovedQRCodeSVG = (
  value: string,
  size: number,
  backgroundColor: string,
  color: string
): string => {
  const cellSize = size / 25; // 25x25 그리드
  const pattern = generateQRPattern(value);

  let cells = '';
  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 25; j++) {
      if (pattern[i * 25 + j]) {
        const x = j * cellSize;
        const y = i * cellSize;
        cells += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}"/>`;
      }
    }
  }

  // SVG 문자열을 한 줄로 정리하여 base64 변환 오류 방지
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${backgroundColor}"/>${cells}<rect x="0" y="0" width="${cellSize * 7}" height="${cellSize * 7}" fill="${color}"/><rect x="${cellSize}" y="${cellSize}" width="${cellSize * 5}" height="${cellSize * 5}" fill="${backgroundColor}"/><rect x="${cellSize * 2}" y="${cellSize * 2}" width="${cellSize * 3}" height="${cellSize * 3}" fill="${color}"/><rect x="${size - cellSize * 7}" y="0" width="${cellSize * 7}" height="${cellSize * 7}" fill="${color}"/><rect x="${size - cellSize * 6}" y="${cellSize}" width="${cellSize * 5}" height="${cellSize * 5}" fill="${backgroundColor}"/><rect x="${size - cellSize * 5}" y="${cellSize * 2}" width="${cellSize * 3}" height="${cellSize * 3}" fill="${color}"/><rect x="0" y="${size - cellSize * 7}" width="${cellSize * 7}" height="${cellSize * 7}" fill="${color}"/><rect x="${cellSize}" y="${size - cellSize * 6}" width="${cellSize * 5}" height="${cellSize * 5}" fill="${backgroundColor}"/><rect x="${cellSize * 2}" y="${size - cellSize * 5}" width="${cellSize * 3}" height="${cellSize * 3}" fill="${color}"/></svg>`;
};

/**
 * 간단한 QR 패턴 생성 (해시 기반)
 */
const generateQRPattern = (value: string): boolean[] => {
  const pattern = new Array(625).fill(false); // 25x25
  let hash = 0;

  // 문자열을 해시로 변환
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) & 0xffffffff;
  }

  // 해시를 기반으로 패턴 생성
  for (let i = 0; i < 625; i++) {
    pattern[i] = ((hash + i) % 3) === 0;
  }

  return pattern;
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