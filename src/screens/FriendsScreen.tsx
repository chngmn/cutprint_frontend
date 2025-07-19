import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ListRenderItem,
  Image // 프로필 이미지 추가를 위해 import
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// --- 인터페이스 정의 ---
interface Friend {
  id: string;
  name: string;
  profileImage: string  | null; // 프로필 이미지 URL 추가
  status?: string; // 상태는 선택적으로 변경
}

interface FriendRequest {
  id: string;
  name: string;
  profileImage: string | null; // 프로필 이미지 URL 추가
  status?: 'pending' | 'accepted' | 'declined'; // 요청 상태 추가
}

interface SearchResultUser {
  id: string;
  name: string;
  profileImage: string | null ; // 프로필 이미지 URL 추가
  isFriend: boolean;
  hasSentRequest: boolean;
  hasReceivedRequest: boolean;
}

const FriendsScreen = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [friends, setFriends] = useState<Friend[]>([
    // 구글 profile image가 있는 경우 profileImage에 불러올 것
    // { id: '1', name: '김민준', profileImage: 'https://via.placeholder.com/40/FF5733/FFFFFF?text=KMJ', status: '온라인' },

    // 일반 로그인인 경우 기본 프로필 화면이 보이게 할 것
    { id: '1', name: '김민준', profileImage: null, status: '온라인' },
    { id: '2', name: '이서연', profileImage: null, status: '오프라인' },
    { id: '3', name: '박지훈', profileImage: null, status: '온라인' },
    { id: '6', name: 'Martha Craig', profileImage: null, status: '온라인' }, // 스크린샷 예시
    { id: '7', name: 'Martha Craig 2', profileImage: null, status: '오프라인' },
    { id: '8', name: 'Martha Craig 3', profileImage: null, status: '온라인' },
    { id: '9', name: 'Martha Craig 4', profileImage: null, status: '온라인' },
    { id: '10', name: 'Martha Craig 5', profileImage: null, status: '온라인' },
  ]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([
    { id: '4', name: '최유진', profileImage: null, status: 'pending' },
    { id: '5', name: 'Martha Craig', profileImage: null, status: 'pending' }, // 스크린샷 예시
  ]);
  const [searchResults, setSearchResults] = useState<SearchResultUser[]>([]);

  // 검색어를 입력할 때마다 검색 결과를 업데이트 (프론트엔드 필터링)
  const handleSearchInputChange = (text: string): void => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setSearchResults([]); // 검색어가 없으면 결과 초기화
      return;
    }

    // ⭐️ 실제 앱에서는 이곳에서 API 호출을 통해 서버에서 사용자 검색을 수행합니다.
    // 여기서는 가상의 검색 결과를 반환합니다. (친구 목록에 없는 사용자 위주로)
    const mockAllUsers: SearchResultUser[] = [
      { id: 'u100', name: '이강인', profileImage: null, isFriend: false, hasSentRequest: false, hasReceivedRequest: false },
      { id: 'u101', name: '손흥민', profileImage: null, isFriend: true, hasSentRequest: false, hasReceivedRequest: false }, // 이미 친구
      { id: 'u102', name: '김연아', profileImage: null, isFriend: false, hasSentRequest: true, hasReceivedRequest: false }, // 내가 요청 보냄
      { id: 'u103', name: '류현진', profileImage: null, isFriend: false, hasSentRequest: false, hasReceivedRequest: true }, // 상대방이 요청 보냄
      { id: 'u104', name: '마동석', profileImage: null, isFriend: false, hasSentRequest: false, hasReceivedRequest: false },
    ];

    const filteredResults = mockAllUsers.filter(user =>
      user.name.includes(text) || user.id.includes(text.toLowerCase())
    );
    setSearchResults(filteredResults);
  };

  const sendFriendRequest = (targetUser: SearchResultUser): void => {
    Alert.alert(
      '친구 요청',
      `${targetUser.name} 님에게 친구 요청을 보내시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '보내기',
          onPress: () => {
            console.log(`${targetUser.name}(${targetUser.id})에게 친구 요청 보냄`);
            // ⭐️ 실제 API 호출: 요청 성공 시 아래 UI 업데이트
            setSearchResults(prevResults =>
              prevResults.map(user =>
                user.id === targetUser.id ? { ...user, hasSentRequest: true } : user
              )
            );
            Alert.alert('완료', `${targetUser.name} 님에게 친구 요청을 보냈습니다.`);
          },
        },
      ]
    );
  };

  const cancelFriendRequest = (targetUser: SearchResultUser): void => {
    Alert.alert(
      '요청 취소',
      `${targetUser.name} 님에게 보낸 친구 요청을 취소하시겠습니까?`,
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '예',
          onPress: () => {
            console.log(`${targetUser.name}(${targetUser.id})에게 보낸 친구 요청 취소`);
            // ⭐️ 실제 API 호출: 요청 취소 성공 시 아래 UI 업데이트
            setSearchResults(prevResults =>
              prevResults.map(user =>
                user.id === targetUser.id ? { ...user, hasSentRequest: false } : user
              )
            );
            Alert.alert('완료', '친구 요청을 취소했습니다.');
          },
        },
      ]
    );
  };

  const acceptFriendRequest = (requestId: string): void => {
    Alert.alert(
      '요청 수락',
      '친구 요청을 수락하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '수락',
          onPress: () => {
            // ⭐️ 실제 API 호출: 요청 수락 성공 시 아래 UI 업데이트
            const acceptedRequest = friendRequests.find((req) => req.id === requestId);
            if (acceptedRequest) {
              setFriends([...friends, { id: acceptedRequest.id, name: acceptedRequest.name, profileImage: acceptedRequest.profileImage, status: '온라인' }]);
              setFriendRequests(friendRequests.map(req =>
                req.id === requestId ? { ...req, status: 'accepted' } : req
              ));
              // 일정 시간 후 목록에서 제거하거나 애니메이션 처리 가능
              setTimeout(() => {
                setFriendRequests(friendRequests.filter((req) => req.id !== requestId));
              }, 500); // 0.5초 후 목록에서 완전히 제거
              Alert.alert('완료', `${acceptedRequest.name} 님과 친구가 되었습니다!`);
            }
          },
        },
      ]
    );
  };

  const declineFriendRequest = (requestId: string): void => {
    Alert.alert(
      '요청 거절',
      '친구 요청을 거절하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '거절',
          onPress: () => {
            // ⭐️ 실제 API 호출: 요청 거절 성공 시 아래 UI 업데이트
            setFriendRequests(friendRequests.map(req =>
              req.id === requestId ? { ...req, status: 'declined' } : req
            ));
            setTimeout(() => {
              setFriendRequests(friendRequests.filter((req) => req.id !== requestId));
            }, 500); // 0.5초 후 목록에서 완전히 제거
            Alert.alert('완료', '친구 요청을 거절했습니다.');
          },
        },
      ]
    );
  };

  // 검색 결과 아이템 렌더링
  const renderSearchResultItem: ListRenderItem<SearchResultUser> = ({ item }) => (
    <View style={styles.listItem}>
      {item.profileImage ? (
        <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
      ) : 
      <View style={styles.profileImage}>
        <MaterialCommunityIcons name="account-circle" size={40} color="#bbb" />
      </View>}
      <Text style={styles.listItemName}>{item.name}</Text>
      <View style={styles.listItemActions}>
        {item.isFriend ? (
          <Text style={styles.statusText}>친구</Text>
        ) : item.hasSentRequest ? (
          <TouchableOpacity style={styles.actionButtonSent} onPress={() => cancelFriendRequest(item)}>
            <Text style={styles.actionButtonText}>요청 보냄</Text>
          </TouchableOpacity>
        ) : item.hasReceivedRequest ? (
          // 검색 결과에 상대방이 보낸 요청이 포함된 경우 (중복될 수 있음)
          <View style={styles.requestButtons}>
            <TouchableOpacity
              style={[styles.requestButton, styles.acceptButton]}
              onPress={() => acceptFriendRequest(item.id)}>
              <Text style={styles.buttonText}>수락</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.requestButton, styles.declineButton]}
              onPress={() => declineFriendRequest(item.id)}>
              <Text style={styles.buttonText}>거절</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.actionButtonPrimary} onPress={() => sendFriendRequest(item)}>
            <Text style={styles.actionButtonText}>추가</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // 친구 요청 아이템 렌더링
  const renderFriendRequestItem: ListRenderItem<FriendRequest> = ({ item }) => (
    <View style={styles.listItem}>
      {item.profileImage ? (
        <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
      ) : 
      <View style={styles.profileImage}>
        <MaterialCommunityIcons name="account-circle" size={40} color="#bbb" />
      </View>}
      <Text style={styles.listItemName}>{item.name}</Text>
      <View style={styles.listItemActions}>
        {item.status === 'pending' ? (
          <View style={styles.requestButtons}>
            <TouchableOpacity
              style={[styles.requestButton, styles.acceptButton]}
              onPress={() => acceptFriendRequest(item.id)}>
              <Text style={styles.buttonText}>수락</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.requestButton, styles.declineButton]}
              onPress={() => declineFriendRequest(item.id)}>
              <Text style={styles.buttonText}>거절</Text>
            </TouchableOpacity>
          </View>
        ) : item.status === 'accepted' ? (
          <Text style={[styles.statusText, { color: '#28a745' }]}>수락됨</Text>
        ) : item.status === 'declined' ? (
          <Text style={[styles.statusText, { color: '#dc3545' }]}>거절됨</Text>
        ) : null}
      </View>
    </View>
  );

  // 내 친구 아이템 렌더링
  const renderFriendItem: ListRenderItem<Friend> = ({ item }) => (
    <View style={styles.listItem}>
      {item.profileImage ? (
        <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
      ) : 
      <View style={styles.profileImage}>
        <MaterialCommunityIcons name="account-circle" size={40} color="#bbb" />
      </View>}
      
      <Text style={styles.listItemName}>{item.name}</Text>
      {item.status && <Text style={styles.statusText}>{item.status}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}> */}
        {/* <Text style={styles.title}>친구</Text> */}
        {/* <TouchableOpacity style={styles.headerIcon}> */}
          {/* <MaterialCommunityIcons name="cog-outline" size={24} color="#555" /> 설정 아이콘 추가 */}
        {/* </TouchableOpacity> */}
      {/* </View> */}

      {/* 검색창 */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search" // 스크린샷처럼 영어로 변경
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={handleSearchInputChange} // 입력할 때마다 검색 실행
        />
      </View>

      {/* 검색 결과 목록 (검색어가 있고 결과가 있을 때만 표시) */}
      {searchQuery.trim() !== '' && searchResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>검색 결과</Text>
          <FlatList<SearchResultUser>
            data={searchResults}
            renderItem={renderSearchResultItem}
            keyExtractor={(item) => item.id}
            style={styles.resultsList} // 스크롤 가능하도록 스타일 적용
            nestedScrollEnabled // Android에서 중첩 스크롤 이슈 방지
            ListEmptyComponent={() => <Text style={styles.emptyText}>검색 결과 없음</Text>}
          />
        </View>
      )}

      {/* 친구 요청 목록 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>친구 요청</Text>
        {friendRequests.length > 0 ? (
          <FlatList<FriendRequest>
            data={friendRequests}
            renderItem={renderFriendRequestItem}
            keyExtractor={(item) => item.id}
            style={styles.requestList} // 스크롤 가능하도록 스타일 적용
            nestedScrollEnabled
          />
        ) : (
          <Text style={styles.emptyText}>받은 요청 없음</Text>
        )}
      </View>

      {/* 내 친구 목록 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>내 친구</Text>
        {friends.length > 0 ? (
          <FlatList<Friend>
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id}
            style={styles.friendList} // 스크롤 가능하도록 스타일 적용
            nestedScrollEnabled
          />
        ) : (
          <Text style={styles.emptyText}>친구가 없어요</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20, // 좌우 패딩만 적용
    paddingTop: 20, // 상단 패딩 추가하여 상태바 공간 확보
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Pretendard',
  },
  headerIcon: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 25, // 섹션 간 간격 확보
    height: 48, // 검색창 높이 고정
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Pretendard',
  },
  section: {
    marginBottom: 25, // 각 섹션 하단 마진
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15, // 제목과 목록 사이 간격
    fontFamily: 'Pretendard',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, // 리스트 아이템 세로 패딩
    borderBottomWidth: 0.5, // 얇은 구분선
    borderBottomColor: '#eee',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20, // 원형 프로필 이미지
    marginRight: 15,
    // backgroundColor: '#e0e0e0', // 이미지가 없을 경우 대비 배경색
  },
  listItemName: {
    flex: 1, // 이름이 남은 공간을 차지하도록
    fontSize: 16,
    color: '#333',
    fontFamily: 'Pretendard',
    fontWeight: '500',
  },
  listItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Pretendard',
    marginLeft: 10, // 상태 텍스트 왼쪽 마진
  },
  requestButtons: {
    flexDirection: 'row',
  },
  requestButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20, // 둥근 버튼
    marginLeft: 8,
    minWidth: 70, // 최소 너비 설정
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#28a745', // 녹색
  },
  declineButton: {
    backgroundColor: '#dc3545', // 빨간색
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: 'Pretendard',
  },
  actionButtonPrimary: { // 친구 추가 버튼
    backgroundColor: '#599EF1', // 파란색
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  actionButtonSent: { // 요청 보냄 버튼
    backgroundColor: '#6c757d', // 회색
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: 'Pretendard',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 10,
    fontFamily: 'Pretendard',
  },
  // 개별 스크롤 목록 높이
  resultsList: {
    maxHeight: 200, // 검색 결과 목록 최대 높이
    marginBottom: 15, // 다음 섹션과의 간격
  },
  requestList: {
    maxHeight: 180, // 친구 요청 목록 최대 높이
    marginBottom: 15,
  },
  friendList: {
    maxHeight: 300, // 내 친구 목록 최대 높이 (더 많은 친구를 보여줄 수 있도록)
    flexGrow: 0, // 컨테이너 전체 크기 내에서만 스크롤되도록
  },
});

export default FriendsScreen;