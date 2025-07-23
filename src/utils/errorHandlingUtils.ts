// src/utils/errorHandlingUtils.ts
import { Platform, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export interface ErrorHandlingOptions {
  fallbackAction?: () => void;
  showUserFriendlyMessage?: boolean;
  logError?: boolean;
}

/**
 * iOS 보안정책 관련 에러 타입 감지
 */
export const detectErrorType = (error: any): string => {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || '';
  
  // 사용자 취소
  if (errorMessage.includes('cancelled') || 
      errorMessage.includes('printing did not complete') ||
      errorMessage.includes('user cancelled')) {
    return 'USER_CANCELLED';
  }
  
  // iOS 보안 정책
  if (errorMessage.includes('security') || 
      errorMessage.includes('blocked') ||
      errorMessage.includes('not allowed') ||
      errorMessage.includes('permission denied')) {
    return 'SECURITY_POLICY';
  }
  
  // 프린터 관련
  if (errorMessage.includes('printer') || 
      errorMessage.includes('airprint') ||
      errorMessage.includes('no printer')) {
    return 'PRINTER_ERROR';
  }
  
  // 메모리 부족
  if (errorMessage.includes('memory') || 
      errorMessage.includes('out of memory') ||
      errorCode === 'ENOMEM') {
    return 'MEMORY_ERROR';
  }
  
  // 네트워크 관련
  if (errorMessage.includes('network') || 
      errorMessage.includes('connection') ||
      errorCode.includes('NETWORK')) {
    return 'NETWORK_ERROR';
  }
  
  // 파일 시스템 관련
  if (errorMessage.includes('file') || 
      errorMessage.includes('not found') ||
      errorCode.includes('ENOENT')) {
    return 'FILE_ERROR';
  }
  
  return 'UNKNOWN_ERROR';
};

/**
 * iOS 인쇄 에러 전용 핸들러
 */
export const handlePrintError = async (
  error: any, 
  imageUri: string,
  options?: ErrorHandlingOptions
): Promise<void> => {
  const errorType = detectErrorType(error);
  
  if (options?.logError) {
    console.error('Print error details:', {
      error,
      errorType,
      platform: Platform.OS,
      imageUri: imageUri.substring(0, 50) + '...'
    });
  }
  
  switch (errorType) {
    case 'USER_CANCELLED':
      // 사용자가 취소한 경우 - 별도 알림 없음
      return;
      
    case 'SECURITY_POLICY':
      Alert.alert(
        '인쇄 제한',
        Platform.OS === 'ios' 
          ? 'iOS 보안 정책으로 인해 인쇄할 수 없습니다. 대신 공유 기능을 사용해보세요.'
          : '보안 정책으로 인해 인쇄할 수 없습니다.',
        [
          { text: '확인', style: 'default' },
          { 
            text: '공유하기', 
            style: 'default',
            onPress: () => shareImageAsFallback(imageUri)
          }
        ]
      );
      break;
      
    case 'PRINTER_ERROR':
      Alert.alert(
        '프린터 오류',
        Platform.OS === 'ios'
          ? 'AirPrint 호환 프린터가 연결되어 있는지 확인해주세요.'
          : '프린터 연결을 확인해주세요.',
        [
          { text: '확인', style: 'default' },
          { 
            text: '다시 시도', 
            style: 'default',
            onPress: options?.fallbackAction
          }
        ]
      );
      break;
      
    case 'MEMORY_ERROR':
      Alert.alert(
        '메모리 부족',
        '메모리가 부족하여 인쇄할 수 없습니다. 다른 앱을 종료한 후 다시 시도해보세요.',
        [
          { text: '확인', style: 'default' },
          { 
            text: '공유하기', 
            style: 'default',
            onPress: () => shareImageAsFallback(imageUri)
          }
        ]
      );
      break;
      
    case 'NETWORK_ERROR':
      Alert.alert(
        '네트워크 오류',
        '네트워크 연결을 확인한 후 다시 시도해주세요.',
        [
          { text: '확인', style: 'default' },
          { 
            text: '다시 시도', 
            style: 'default',
            onPress: options?.fallbackAction
          }
        ]
      );
      break;
      
    case 'FILE_ERROR':
      Alert.alert(
        '파일 오류',
        '이미지 파일에 문제가 있습니다. 다시 촬영해보세요.',
        [{ text: '확인', style: 'default' }]
      );
      break;
      
    default:
      Alert.alert(
        '인쇄 오류',
        '인쇄 중 오류가 발생했습니다.',
        [
          { text: '확인', style: 'default' },
          { 
            text: '다시 시도', 
            style: 'default',
            onPress: options?.fallbackAction
          }
        ]
      );
  }
};

/**
 * QR 코드 생성/합성 에러 핸들러
 */
export const handleQRCodeError = (error: any, options?: ErrorHandlingOptions): void => {
  const errorType = detectErrorType(error);
  
  if (options?.logError) {
    console.error('QR Code error details:', {
      error,
      errorType,
      platform: Platform.OS
    });
  }
  
  switch (errorType) {
    case 'MEMORY_ERROR':
      Alert.alert(
        'QR 코드 생성 실패',
        '메모리가 부족하여 QR 코드를 생성할 수 없습니다. QR 코드 없이 진행하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '계속', style: 'default', onPress: options?.fallbackAction }
        ]
      );
      break;
      
    case 'NETWORK_ERROR':
      Alert.alert(
        'QR 코드 생성 실패',
        '네트워크 연결을 확인한 후 다시 시도해주세요.',
        [
          { text: '확인', style: 'default' },
          { text: '다시 시도', style: 'default', onPress: options?.fallbackAction }
        ]
      );
      break;
      
    default:
      Alert.alert(
        'QR 코드 오류',
        'QR 코드를 생성하는 중 오류가 발생했습니다. QR 코드 없이 진행하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '계속', style: 'default', onPress: options?.fallbackAction }
        ]
      );
  }
};

/**
 * 이미지 합성 에러 핸들러
 */
export const handleImageCompositionError = (error: any, options?: ErrorHandlingOptions): void => {
  const errorType = detectErrorType(error);
  
  if (options?.logError) {
    console.error('Image composition error details:', {
      error,
      errorType,
      platform: Platform.OS
    });
  }
  
  switch (errorType) {
    case 'MEMORY_ERROR':
      Alert.alert(
        '이미지 합성 실패',
        '메모리가 부족하여 이미지를 합성할 수 없습니다. QR 코드 없이 진행하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '원본으로 진행', style: 'default', onPress: options?.fallbackAction }
        ]
      );
      break;
      
    case 'FILE_ERROR':
      Alert.alert(
        '이미지 합성 실패',
        '이미지 파일에 문제가 있습니다. 원본 이미지로 진행하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '원본으로 진행', style: 'default', onPress: options?.fallbackAction }
        ]
      );
      break;
      
    default:
      Alert.alert(
        '이미지 합성 오류',
        '이미지를 합성하는 중 오류가 발생했습니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '원본으로 진행', style: 'default', onPress: options?.fallbackAction }
        ]
      );
  }
};

/**
 * 공유하기 대체 기능
 */
const shareImageAsFallback = async (imageUri: string): Promise<void> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/jpeg',
        dialogTitle: '사진 공유하기',
      });
    } else {
      Alert.alert('공유 불가', '현재 기기에서는 공유 기능을 사용할 수 없습니다.');
    }
  } catch (shareError) {
    console.error('Share fallback failed:', shareError);
    Alert.alert('공유 실패', '공유하는 중 오류가 발생했습니다.');
  }
};

/**
 * 시스템 리소스 체크
 */
export const checkSystemResources = async (): Promise<{
  memoryWarning: boolean;
  storageWarning: boolean;
}> => {
  // React Native에서는 시스템 리소스를 직접 체크하기 어려우므로
  // 간접적인 방법으로 추정
  
  let memoryWarning = false;
  let storageWarning = false;
  
  try {
    // 메모리 사용량 추정 (간접적)
    const testArray = new Array(1000000).fill(0);
    testArray.length = 0; // 메모리 해제
    
    // 스토리지 체크 (expo-file-system 사용)
    const diskSpace = await FileSystem.getFreeDiskStorageAsync();
    
    // 100MB 미만이면 경고
    if (diskSpace < 100 * 1024 * 1024) {
      storageWarning = true;
    }
    
  } catch (error) {
    console.warn('Resource check failed:', error);
    // 체크 실패 시 안전을 위해 경고 표시
    memoryWarning = true;
  }
  
  return { memoryWarning, storageWarning };
};

/**
 * 플랫폼별 최적화 제안
 */
export const getPlatformOptimizationSuggestions = (): string[] => {
  const suggestions: string[] = [];
  
  if (Platform.OS === 'ios') {
    suggestions.push('iOS에서는 AirPrint 호환 프린터를 사용해주세요.');
    suggestions.push('배경 앱을 종료하여 메모리를 확보해보세요.');
    suggestions.push('설정 > 개인정보 보호 > 인쇄에서 앱 권한을 확인해주세요.');
  } else if (Platform.OS === 'android') {
    suggestions.push('Google Cloud Print 또는 제조사 전용 인쇄 앱을 확인해보세요.');
    suggestions.push('저장공간을 확보한 후 다시 시도해보세요.');
    suggestions.push('앱 권한에서 저장소 및 미디어 권한을 확인해주세요.');
  }
  
  return suggestions;
};

/**
 * 에러 복구를 위한 제안 사항 생성
 */
export const generateRecoverySuggestions = (errorType: string): string[] => {
  const suggestions: string[] = [];
  
  switch (errorType) {
    case 'SECURITY_POLICY':
      suggestions.push('공유 기능을 사용해보세요');
      suggestions.push('스크린샷을 촬영한 후 사진 앱에서 인쇄해보세요');
      break;
      
    case 'PRINTER_ERROR':
      suggestions.push('프린터가 켜져 있고 Wi-Fi에 연결되어 있는지 확인해주세요');
      suggestions.push('다른 프린터를 선택해보세요');
      break;
      
    case 'MEMORY_ERROR':
      suggestions.push('다른 앱을 종료해주세요');
      suggestions.push('기기를 재시작해보세요');
      break;
      
    case 'NETWORK_ERROR':
      suggestions.push('Wi-Fi 연결을 확인해주세요');
      suggestions.push('모바일 데이터로 전환해보세요');
      break;
      
    default:
      suggestions.push('앱을 재시작해보세요');
      suggestions.push('기기를 재시작해보세요');
  }
  
  return suggestions;
};