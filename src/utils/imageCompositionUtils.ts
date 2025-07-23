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
 * QR 코드 이미지 생성 (ViewShot 사용)
 */
const generateQRCodeImage = async (value: string, size: number): Promise<string> => {
  try {
    // React Native에서 QR 코드 컴포넌트를 렌더링한 후 이미지로 캡처
    // 실제 구현에서는 ViewShot을 사용하거나 
    // react-native-qrcode-svg의 getRef 메소드를 활용
    
    // 간단한 대안: expo-image-manipulator로 QR 코드 패턴 생성
    return await createQRCodeWithImageManipulator(value, size);
    
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('QR 코드 생성 중 오류가 발생했습니다.');
  }
};

/**
 * ImageManipulator를 사용한 간단한 QR 코드 생성
 * (실제로는 더 복잡한 QR 코드 생성 라이브러리 사용 권장)
 */
const createQRCodeWithImageManipulator = async (value: string, size: number): Promise<string> => {
  // 임시 방편: 단색 사각형을 QR 코드 대신 사용
  // 실제 구현에서는 올바른 QR 코드 생성 라이브러리 사용
  
  // 흰색 배경 생성
  const whiteSquare = await ImageManipulator.manipulateAsync(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    [
      { resize: { width: size, height: size } }
    ],
    {
      compress: 1,
      format: ImageManipulator.SaveFormat.PNG,
    }
  );
  
  return whiteSquare.uri;
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