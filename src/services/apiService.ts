import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.249.27.137:3000'; // 실제 서버 주소로 변경 필요

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

  // 사진 업로드 (base64)
  async uploadPhoto(base64Image: string, friendIds?: number[]): Promise<any> {
    return this.makeRequest('/photos/upload-base64', {
      method: 'POST',
      body: JSON.stringify({ image: base64Image, friendIds }),
    });
  }

  // 내 사진 목록 조회
  async getMyPhotos(): Promise<any[]> {
    return this.makeRequest('/photos/my-photos');
  }

  // 친구 사진 목록 조회
  async getFriendPhotos(friendId: number): Promise<any[]> {
    return this.makeRequest(`/photos/user/${friendId}`);
  }

  // 사진 삭제
  async deletePhoto(photoId: number): Promise<any> {
    return this.makeRequest(`/photos/${photoId}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();