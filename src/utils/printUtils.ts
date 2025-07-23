// src/utils/printUtils.ts
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform, Alert } from 'react-native';

export interface PrintImageOptions {
  imageUri: string;
  qrCodeUri?: string;
  qrCodePosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  qrCodeSize?: number;
  title?: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * iOS 보안정책을 고려한 안전한 이미지 인쇄 함수
 * HTML 기반 인쇄를 사용하여 iOS WKWebView 제약을 우회
 */
export const printImageSafely = async (options: PrintImageOptions): Promise<void> => {
  try {
    const {
      imageUri,
      qrCodeUri,
      qrCodePosition = 'bottom-right',
      qrCodeSize = 60,
      title = 'Cutprint Photo',
      orientation = 'portrait'
    } = options;

    // 1. 이미지를 Base64로 변환
    const base64Image = await convertImageToBase64(imageUri);
    
    // 2. QR 코드가 있다면 Base64로 변환  
    let base64QRCode = '';
    if (qrCodeUri) {
      base64QRCode = await convertImageToBase64(qrCodeUri);
    }

    // 3. HTML 템플릿 생성
    const htmlContent = generatePrintHTML({
      base64Image,
      base64QRCode,
      qrCodePosition,
      qrCodeSize,
      title,
      orientation
    });

    // 4. iOS/Android 호환 인쇄 옵션 설정
    const printOptions = getPrintOptions(orientation);

    // 5. HTML 기반 인쇄 실행
    await Print.printAsync({
      html: htmlContent,
      ...printOptions
    });

  } catch (error: any) {
    // 'Printing did not complete' 메시지가 포함된 경우 로그를 남기지 않고 조용히 종료
    if (error?.message?.includes('Printing did not complete')) {
      return;
    }
    console.error('Print error:', error);
    
    // iOS 특화 에러 처리
    if (Platform.OS === 'ios') {
      await handleIOSPrintError(error, options);
    } else {
      throw error;
    }
  }
};

/**
 * 이미지 URI를 Base64로 변환 (iOS 보안정책 대응)
 */
const convertImageToBase64 = async (uri: string): Promise<string> => {
  try {
    // 이미 Base64 데이터 URI인 경우
    if (uri.startsWith('data:image/')) {
      return uri;
    }

    // 로컬 파일을 Base64로 읽기
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // MIME 타입 감지
    const mimeType = detectMimeType(uri);
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Base64 conversion error:', error);
    throw new Error('이미지를 변환하는 중 오류가 발생했습니다.');
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
      return 'image/jpeg'; // 기본값
  }
};

/**
 * 인쇄용 HTML 템플릿 생성
 */
interface HTMLTemplateOptions {
  base64Image: string;
  base64QRCode?: string;
  qrCodePosition: string;
  qrCodeSize: number;
  title: string;
  orientation: string;
}

const generatePrintHTML = (options: HTMLTemplateOptions): string => {
  const {
    base64Image,
    base64QRCode,
    qrCodePosition,
    qrCodeSize,
    title,
    orientation
  } = options;

  // 디버깅: QR 코드 전달 상태 로깅
  console.log('Print HTML generation:', {
    hasImage: !!base64Image,
    hasQRCode: !!base64QRCode,
    qrCodeSize,
    qrCodePosition
  });

  // QR 코드 위치 CSS 계산
  const qrPosition = getQRPositionCSS(qrCodePosition, qrCodeSize);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            @page {
                size: ${orientation === 'landscape' ? 'landscape' : 'portrait'};
                margin: 0.5in;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: white;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                padding: 20px;
            }
            
            .print-container {
                position: relative;
                max-width: 100%;
                max-height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            .main-image {
                max-width: 100%;
                max-height: 80vh;
                height: auto;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .qr-code {
                position: absolute;
                width: ${qrCodeSize}px;
                height: ${qrCodeSize}px;
                ${qrPosition}
                background: rgba(255, 255, 255, 0.95);
                border-radius: 6px;
                padding: 6px;
                box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
                z-index: 10;
                border: 2px solid rgba(255, 255, 255, 0.8);
            }
            
            .qr-code img {
                width: 100%;
                height: 100%;
                border-radius: 2px;
            }
            
            .title {
                position: absolute;
                bottom: -40px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 14px;
                color: #666;
                text-align: center;
                width: 100%;
            }
            
            /* iOS Safari 인쇄 최적화 */
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                
                .print-container {
                    page-break-inside: avoid;
                }
            }
        </style>
    </head>
    <body>
        <div class="print-container">
            <img src="${base64Image}" alt="Photo" class="main-image" />
            
            ${base64QRCode ? `
                <!-- QR Code Present: ${base64QRCode.substring(0, 50)}... -->
                <div class="qr-code">
                    <img src="${base64QRCode}" alt="QR Code" />
                </div>
            ` : '<!-- No QR Code provided -->'}
            
            <div class="title">${title}</div>
        </div>
    </body>
    </html>
  `;
};

/**
 * QR 코드 위치에 따른 CSS 생성
 */
const getQRPositionCSS = (position: string, size: number): string => {
  const margin = 16; // 16px 여백
  
  switch (position) {
    case 'bottom-right':
      return `bottom: ${margin}px; right: ${margin}px;`;
    case 'bottom-left':
      return `bottom: ${margin}px; left: ${margin}px;`;
    case 'top-right':
      return `top: ${margin}px; right: ${margin}px;`;
    case 'top-left':
      return `top: ${margin}px; left: ${margin}px;`;
    default:
      return `bottom: ${margin}px; right: ${margin}px;`;
  }
};

/**
 * 플랫폼별 인쇄 옵션 설정
 */
const getPrintOptions = (orientation: string) => {
  const baseOptions = {
    orientation: orientation as 'portrait' | 'landscape',
    margins: {
      left: 0.5,
      right: 0.5,
      top: 0.5,
      bottom: 0.5,
    },
  };

  if (Platform.OS === 'ios') {
    return {
      ...baseOptions,
      // iOS 특화 옵션
      printerUrl: undefined, // 프린터 선택 UI 표시
    };
  } else {
    return {
      ...baseOptions,
      // Android 특화 옵션
    };
  }
};

/**
 * iOS 인쇄 에러 처리
 */
const handleIOSPrintError = async (error: any, options: PrintImageOptions): Promise<void> => {
  const errorMessage = error?.message || '';
  
  // 사용자가 인쇄를 취소한 경우
  if (errorMessage.includes('cancelled') || errorMessage.includes('Printing did not complete')) {
    console.log('사용자가 인쇄를 취소했습니다.');
    return;
  }
  
  // iOS 보안정책으로 인한 에러
  if (errorMessage.includes('security') || errorMessage.includes('blocked')) {
    Alert.alert(
      '인쇄 오류',
      'iOS 보안 정책으로 인해 인쇄할 수 없습니다. 대신 공유 기능을 사용해보세요.',
      [
        { text: '확인', style: 'default' },
        { 
          text: '공유하기', 
          style: 'default',
          onPress: () => {
            // 공유 기능으로 리디렉션 (구현 필요)
            console.log('공유 기능으로 이동');
          }
        }
      ]
    );
    return;
  }
  
  // 프린터 관련 에러
  if (errorMessage.includes('printer') || errorMessage.includes('AirPrint')) {
    Alert.alert(
      '프린터 오류',
      'AirPrint 호환 프린터가 연결되어 있는지 확인해주세요.',
      [{ text: '확인', style: 'default' }]
    );
    return;
  }
  
  // 일반적인 에러
  Alert.alert(
    '인쇄 오류',
    '인쇄 중 오류가 발생했습니다. 다시 시도해주세요.',
    [
      { text: '확인', style: 'default' },
      { 
        text: '다시 시도', 
        style: 'default',
        onPress: () => printImageSafely(options)
      }
    ]
  );
};

/**
 * 인쇄 가능 여부 확인
 * expo-print에는 isAvailableAsync 함수가 없으므로 플랫폼 체크로 대체
 */
export const isPrintingAvailable = (): boolean => {
  // 네이티브 플랫폼(iOS, Android)에서만 인쇄 가능
  return Platform.OS !== 'web';
};

/**
 * 메모리 사용량을 고려한 이미지 크기 최적화
 */
export const optimizeImageForPrinting = async (
  imageUri: string,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<string> => {
  try {
    // expo-image-manipulator를 사용해서 이미지 최적화
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width: maxWidth } }
      ],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    
    return manipulatedImage.uri;
  } catch (error) {
    console.warn('Image optimization failed, using original:', error);
    return imageUri;
  }
};