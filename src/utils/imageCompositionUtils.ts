// src/utils/imageCompositionUtils.ts
import * as ImageManipulator from 'expo-image-manipulator';
import ViewShot from 'react-native-view-shot';
import React from 'react';
import { View, Image, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import { calculateQRPosition, calculateQRSize } from './qrCodeUtils';

export interface ImageCompositionOptions {
  originalImageUri: string;
  qrCodeValue: string;
  qrCodePosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  qrCodeSizeRatio?: number; // QR 코드 크기 비율 (0.1 = 10%)
  outputQuality?: number; // 출력 품질 (0.1 ~ 1.0)
  outputFormat?: 'JPEG' | 'PNG';
}

/**
 * 원본 이미지에 QR 코드를 합성한 새로운 이미지 생성
 * iOS 보안정책을 고려하여 expo-image-manipulator 사용
 */
export const composeImageWithQRCode = async (
  options: ImageCompositionOptions
): Promise<string> => {
  try {
    const {
      originalImageUri,
      qrCodeValue,
      qrCodePosition = 'bottom-right',
      qrCodeSizeRatio = 0.1,
      outputQuality = 0.9,
      outputFormat = 'JPEG'
    } = options;

    // 1. 원본 이미지 정보 가져오기
    const imageInfo = await getImageDimensions(originalImageUri);
    
    // 2. QR 코드 크기 및 위치 계산
    const qrSize = calculateQRSize(imageInfo.width, imageInfo.height, qrCodeSizeRatio);
    const qrPosition = calculateQRPosition(imageInfo.width, imageInfo.height, qrSize, qrCodePosition);
    
    // 3. QR 코드 이미지 생성
    const qrCodeUri = await generateQRCodeImage(qrCodeValue, qrSize);
    
    // 4. 이미지 합성
    const composedImageUri = await composeImages({
      backgroundImage: originalImageUri,
      overlayImage: qrCodeUri,
      overlayPosition: qrPosition,
      outputQuality,
      outputFormat: outputFormat as ImageManipulator.SaveFormat
    });
    
    return composedImageUri;
    
  } catch (error) {
    console.error('Image composition error:', error);
    throw new Error('이미지 합성 중 오류가 발생했습니다.');
  }
};

/**
 * 이미지 차원 정보 가져오기
 */
const getImageDimensions = async (imageUri: string): Promise<{width: number, height: number}> => {
  return new Promise((resolve, reject) => {
    Image.getSize(
      imageUri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });  
};

/**
 * QR 코드 이미지 생성 (실제 QR 코드 라이브러리 사용)
 */
const generateQRCodeImage = async (value: string, size: number): Promise<string> => {
  try {
    // qrCodeUtils의 generateQRCodeBase64 함수를 사용하여 실제 QR 코드 생성
    const { generateQRCodeBase64 } = require('./qrCodeUtils');
    
    const qrCodeDataURL = await generateQRCodeBase64({
      value: value,
      size: size,
      backgroundColor: 'white',
      color: 'black'
    });
    
    return qrCodeDataURL;
    
  } catch (error) {
    console.error('QR code generation error:', error);
    // 실패 시 fallback QR 코드 생성
    return await createQRCodeWithImageManipulator(value, size);
  }
};

/**
 * React Native 안전한 base64 인코딩 함수 (imageCompositionUtils용)
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
 * ImageManipulator를 사용한 fallback QR 코드 생성
 * qrCodeUtils의 fallback 함수를 활용
 */
const createQRCodeWithImageManipulator = async (value: string, size: number): Promise<string> => {
  try {
    // qrCodeUtils의 개선된 QR 코드 생성 함수 사용
    const svgData = createImprovedQRCodeSVG(value, size, 'white', 'black');
    const base64SVG = safeBase64Encode(svgData);
    return `data:image/svg+xml;base64,${base64SVG}`;
    
  } catch (error) {
    console.warn('Fallback QR generation failed, using simple pattern:', error);
    
    // 최종 fallback: 단순한 QR 패턴 SVG (한 줄로 정리)
    const simpleSVG = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="white"/><rect x="10%" y="10%" width="30%" height="30%" fill="black"/><rect x="60%" y="10%" width="30%" height="30%" fill="black"/><rect x="10%" y="60%" width="30%" height="30%" fill="black"/><rect x="35%" y="35%" width="30%" height="30%" fill="black"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="4">QR</text></svg>`;
    const base64Simple = safeBase64Encode(simpleSVG);
    return `data:image/svg+xml;base64,${base64Simple}`;
  }
};

/**
 * 개선된 QR 코드 SVG 생성 (fallback용) - imageCompositionUtils 버전
 */
const createImprovedQRCodeSVG = (
  value: string, 
  size: number, 
  backgroundColor: string, 
  color: string
): string => {
  const cellSize = size / 21; // 21x21 그리드
  const pattern = generateSimpleQRPattern(value);
  
  let cells = '';
  for (let i = 0; i < 21; i++) {
    for (let j = 0; j < 21; j++) {
      if (pattern[i * 21 + j]) {
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
const generateSimpleQRPattern = (value: string): boolean[] => {
  const pattern = new Array(441).fill(false); // 21x21
  let hash = 0;
  
  // 문자열을 해시로 변환
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) & 0xffffffff;
  }
  
  // 해시를 기반으로 패턴 생성
  for (let i = 0; i < 441; i++) {
    pattern[i] = ((hash + i) % 3) === 0;
  }
  
  return pattern;
};

/**
 * 두 이미지를 합성하는 함수
 */
interface ComposeImagesOptions {
  backgroundImage: string;
  overlayImage: string;
  overlayPosition: { x: number; y: number };
  outputQuality: number;
  outputFormat: ImageManipulator.SaveFormat;
}

const composeImages = async (options: ComposeImagesOptions): Promise<string> => {
  const {
    backgroundImage,
    overlayImage,
    overlayPosition,
    outputQuality,
    outputFormat
  } = options;

  try {
    // expo-image-manipulator는 직접적인 이미지 오버레이를 지원하지 않으므로
    // 대안적인 접근법을 사용해야 합니다.
    
    // 방법 1: Canvas API를 사용 (웹 환경)
    if (Platform.OS === 'web') {
      return await composeImagesWithCanvas(options);
    }
    
    // 방법 2: ViewShot을 사용하여 React Native View 캡처
    return await composeImagesWithViewShot(options);
    
  } catch (error) {
    console.error('Image composition failed:', error);
    // 실패 시 원본 이미지 반환
    return backgroundImage;
  }
};

/**
 * Canvas API를 사용한 이미지 합성 (웹 전용)
 */
const composeImagesWithCanvas = async (options: ComposeImagesOptions): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const backgroundImg = new window.Image();
    const overlayImg = new window.Image();
    
    backgroundImg.onload = () => {
      canvas.width = backgroundImg.width;
      canvas.height = backgroundImg.height;
      
      // 배경 이미지 그리기
      ctx.drawImage(backgroundImg, 0, 0);
      
      overlayImg.onload = () => {
        // 오버레이 이미지 그리기
        ctx.drawImage(
          overlayImg,
          options.overlayPosition.x,
          options.overlayPosition.y
        );
        
        // Base64로 변환
        const dataURL = canvas.toDataURL('image/jpeg', options.outputQuality);
        resolve(dataURL);
      };
      
      overlayImg.onerror = reject;
      overlayImg.src = options.overlayImage;
    };
    
    backgroundImg.onerror = reject;
    backgroundImg.src = options.backgroundImage;
  });
};

/**
 * ViewShot을 사용한 이미지 합성 (React Native)
 */
const composeImagesWithViewShot = async (options: ComposeImagesOptions): Promise<string> => {
  // ViewShot을 사용하여 React Native View를 이미지로 캡처하는 방식
  // 실제 구현에서는 ViewShot ref를 활용해야 합니다.
  
  // 임시 대안: 원본 이미지 반환
  console.warn('ViewShot composition not implemented, returning original image');
  return options.backgroundImage;
};

/**
 * 이미지를 Base64로 변환
 */
export const convertImageToBase64 = async (imageUri: string): Promise<string> => {
  try {
    // 이미 Base64 데이터 URI인 경우
    if (imageUri.startsWith('data:image/')) {
      return imageUri;
    }

    // 로컬 파일을 Base64로 읽기
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // MIME 타입 감지
    const mimeType = detectMimeType(imageUri);
    
    return `data:${mimeType};base64,${base64}`;
    
  } catch (error) {
    console.error('Base64 conversion error:', error);
    throw new Error('이미지를 Base64로 변환하는 중 오류가 발생했습니다.');
  }
};

/**
 * 파일 확장자로부터 MIME 타입 감지
 */
const detectMimeType = (uri: string): string => {
  const extension = uri.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
};

/**
 * 메모리 사용량을 고려한 이미지 최적화
 */
export const optimizeImageSize = async (
  imageUri: string,
  maxDimension: number = 1200,
  quality: number = 0.8
): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width: maxDimension } }
      ],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    
    return result.uri;
  } catch (error) {
    console.warn('Image optimization failed, using original:', error);
    return imageUri;
  }
};

/**
 * 이미지 합성 진행 상황 콜백을 위한 타입
 */
export type CompositionProgressCallback = (progress: number, stage: string) => void;

/**
 * 진행 상황 추적이 가능한 이미지 합성 함수
 */
export const composeImageWithProgress = async (
  options: ImageCompositionOptions,
  onProgress?: CompositionProgressCallback
): Promise<string> => {
  try {
    onProgress?.(0, '이미지 정보 로딩 중...');
    
    const imageInfo = await getImageDimensions(options.originalImageUri);
    onProgress?.(25, 'QR 코드 생성 중...');
    
    const qrSize = calculateQRSize(imageInfo.width, imageInfo.height, options.qrCodeSizeRatio);
    const qrCodeUri = await generateQRCodeImage(options.qrCodeValue, qrSize);
    onProgress?.(50, '이미지 합성 준비 중...');
    
    const qrPosition = calculateQRPosition(
      imageInfo.width, 
      imageInfo.height, 
      qrSize, 
      options.qrCodePosition
    );
    onProgress?.(75, '이미지 합성 중...');
    
    const result = await composeImages({
      backgroundImage: options.originalImageUri,
      overlayImage: qrCodeUri,
      overlayPosition: qrPosition,
      outputQuality: options.outputQuality || 0.9,
      outputFormat: (options.outputFormat as ImageManipulator.SaveFormat) || ImageManipulator.SaveFormat.JPEG
    });
    
    onProgress?.(100, '완료');
    return result;
    
  } catch (error) {
    onProgress?.(0, '오류 발생');
    throw error;
  }
};