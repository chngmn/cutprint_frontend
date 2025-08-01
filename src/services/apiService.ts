import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://3.37.74.201:3000'; // 실제 서버 주소로 변경 필요

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      console.error('토큰 가져오기 실패:', error);
      return null;
    }
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    return await response.json();
  }

  // 친구 목록 조회
  async getFriends(): Promise<any[]> {
    const response = await this.makeRequest('/friendship/friends');
    return response.data;
  }

  // 받은 친구 요청 목록 조회
  async getReceivedFriendRequests(): Promise<any[]> {
    const response = await this.makeRequest('/friendship/requests/received');
    return response.data;
  }

  // 보낸 친구 요청 목록 조회
  async getSentFriendRequests(): Promise<any[]> {
    const response = await this.makeRequest('/friendship/requests/sent');
    return response.data;
  }

  // 사용자 검색
  async searchUsers(query: string): Promise<any[]> {
    const response = await this.makeRequest(`/friendship/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  // 친구 요청 보내기
  async sendFriendRequest(receiverId: number): Promise<any> {
    const response = await this.makeRequest('/friendship/request', {
      method: 'POST',
      body: JSON.stringify({ receiverId }),
    });
    return response;
  }

  // 친구 요청 수락
  async acceptFriendRequest(requestId: string): Promise<any> {
    const response = await this.makeRequest(`/friendship/accept/${requestId}`, {
      method: 'POST',
    });
    return response;
  }

  // 친구 요청 거절
  async declineFriendRequest(requestId: string): Promise<any> {
    const response = await this.makeRequest(`/friendship/decline/${requestId}`, {
      method: 'POST',
    });
    return response;
  }

  // 친구 요청 취소
  async cancelFriendRequest(requestId: string): Promise<any> {
    const response = await this.makeRequest(`/friendship/cancel/${requestId}`, {
      method: 'DELETE',
    });
    return response;
  }

  // 친구 삭제
  async removeFriend(friendId: string): Promise<any> {
    const response = await this.makeRequest(`/friendship/remove/${friendId}`, {
      method: 'DELETE',
    });
    return response;
  }

  // 친한 친구 토글
  async toggleCloseFriend(friendId: string): Promise<any> {
    const response = await this.makeRequest(`/friendship/close-friend/${friendId}`, {
      method: 'POST',
    });
    return response;
  }

  // 친한 친구 목록 조회
  async getCloseFriends(): Promise<any[]> {
    const response = await this.makeRequest('/friendship/close-friends');
    return response.data;
  }

  // 사진 업로드 (base64)
  async uploadPhoto(base64Image: string, friendIds?: number[], visibility?: 'PRIVATE' | 'CLOSE_FRIENDS' | 'ALL_FRIENDS'): Promise<any> {
    return this.makeRequest('/photos/upload-base64', {
      method: 'POST',
      body: JSON.stringify({ image: base64Image, friendIds, visibility: visibility || 'ALL_FRIENDS' }),
    });
  }

  // 내 사진 목록 조회
  async getMyPhotos(): Promise<any[]> {
    return this.makeRequest('/photos/my-photos');
  }

  // 특정 사용자 사진 목록 조회
  async getUserPhotos(userId: number): Promise<any[]> {
    return this.makeRequest(`/photos/user/${userId}`);
  }

  // 사진 삭제
  async deletePhoto(photoId: number): Promise<any> {
    return this.makeRequest(`/photos/${photoId}`, {
      method: 'DELETE',
    });
  }

  // 사진 공개 설정 업데이트
  async updatePhotoVisibility(photoId: number, visibility: 'PRIVATE' | 'CLOSE_FRIENDS' | 'ALL_FRIENDS'): Promise<any> {
    return this.makeRequest(`/photos/${photoId}/visibility`, {
      method: 'POST',
      body: JSON.stringify({ visibility }),
    });
  }

  // 사진 공유 링크 가져오기
  async getPhotoShareLink(photoId: number): Promise<{ shareLink: string }> {
    return this.makeRequest(`/photos/${photoId}/share-link`);
  }

  // 사용자 온라인 상태 확인
  async isUserOnline(userId: number): Promise<{ online: boolean; reason?: string }> {
    return this.makeRequest(`/auth/online/${userId}`);
  }

  // 알림 목록 조회
  async getNotifications(): Promise<any[]> {
    return this.makeRequest('/notifications');
  }

  // 알림 읽음 처리
  async markNotificationAsRead(notificationId: number): Promise<any> {
    return this.makeRequest(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }
}

export const apiService = new ApiService();