import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ListRenderItem,
  Image, // 프로필 이미지 추가를 위해 import
  Modal, // Modal 추가
  Animated, // Animated API 추가
  Easing, // Easing 추가
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  FriendAlbum: { friendId: number; friendName: string };
  // ...다른 스크린 타입도 여기에 추가
};

// --- 인터페이스 정의 ---
interface Friend {
  id: string;
  userId: number; // 추가
  name: string;
  profileImage: string | null; // 프로필 이미지 URL 추가
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
  profileImage: string | null; // 프로필 이미지 URL 추가
  isFriend: boolean;
  hasSentRequest: boolean;
  hasReceivedRequest: boolean;
}

const FriendsScreen = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResultUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const searchInputRef = useRef<TextInput>(null);
  const [selectedRequestAction, setSelectedRequestAction] = useState<{ id: string; action: 'accept' | 'decline' } | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const modalAnim = useRef(new Animated.Value(0)).current;
  const [onlineStatuses, setOnlineStatuses] = useState<{ [userId: string]: boolean }>({});

  // type RootStackParamList = {
  //   Album: { userId: number; userName: string };
  //   // ...다른 스크린
  // };

  // 친구들의 온라인 상태를 모두 불러오는 함수
  const fetchAllFriendsOnlineStatus = async (friendsList: Friend[]) => {
    const statusObj: { [userId: string]: boolean } = {};
    await Promise.all(
      friendsList.map(async (friend) => {
        try {
          const res = await apiService.isUserOnline(Number(friend.id));
          statusObj[String(friend.id)] = !!res.online;
          console.log('statusObj', statusObj);
        } catch (error) {
          statusObj[String(friend.id)] = false;
          console.log('error', error);
        }
      })
    );
    setOnlineStatuses(statusObj);
  };

  // 데이터 로드 함수들
  const loadFriends = async (): Promise<void> => {
    try {
      const friendsData = await apiService.getFriends();
      setFriends(friendsData);
      fetchAllFriendsOnlineStatus(friendsData);
      // console.log('onlineStatuses', onlineStatuses);
    } catch (error) {
      console.error('친구 목록 로드 실패:', error);
      Alert.alert('오류', '친구 목록을 불러올 수 없습니다.');
    }
  };

  const loadFriendRequests = async (): Promise<void> => {
    try {
      const requestsData = await apiService.getReceivedFriendRequests();
      setFriendRequests(requestsData);
    } catch (error) {
      console.error('친구 요청 목록 로드 실패:', error);
      Alert.alert('오류', '친구 요청 목록을 불러올 수 없습니다.');
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, []);

  // 검색어를 입력할 때마다 검색 결과를 업데이트
  const handleSearchInputChange = async (text: string): Promise<void> => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const searchData = await apiService.searchUsers(text);
      setSearchResults(searchData);
    } catch (error) {
      console.error('사용자 검색 실패:', error);
      Alert.alert('오류', '사용자 검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = (targetUser: SearchResultUser): void => {
    Alert.alert(
      '친구 요청',
      `${targetUser.name} 님에게 친구 요청을 보내시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '보내기',
          onPress: async () => {
            try {
              await apiService.sendFriendRequest(parseInt(targetUser.id));
              setSearchResults(prevResults =>
                prevResults.map(user =>
                  user.id === targetUser.id ? { ...user, hasSentRequest: true } : user
                )
              );
              Alert.alert('완료', `${targetUser.name} 님에게 친구 요청을 보냈습니다.`);
            } catch (error) {
              console.error('친구 요청 보내기 실패:', error);
              Alert.alert('오류', '친구 요청을 보낼 수 없습니다.');
            }
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
          onPress: async () => {
            try {
              // 보낸 요청 목록에서 해당 사용자 찾기
              const sentRequests = await apiService.getSentFriendRequests();
              const requestToCancel = sentRequests.find(req => req.id === targetUser.id);

              if (requestToCancel) {
                await apiService.cancelFriendRequest(requestToCancel.id);
                setSearchResults(prevResults =>
                  prevResults.map(user =>
                    user.id === targetUser.id ? { ...user, hasSentRequest: false } : user
                  )
                );
                Alert.alert('완료', '친구 요청을 취소했습니다.');
              }
            } catch (error) {
              console.error('친구 요청 취소 실패:', error);
              Alert.alert('오류', '친구 요청을 취소할 수 없습니다.');
            }
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
          onPress: async () => {
            try {
              await apiService.acceptFriendRequest(requestId);

              // 친구 목록과 요청 목록 새로고침
              await loadFriends();
              await loadFriendRequests();

              const acceptedRequest = friendRequests.find((req) => req.id === requestId);
              if (acceptedRequest) {
                Alert.alert('완료', `${acceptedRequest.name} 님과 친구가 되었습니다!`);
              }
            } catch (error) {
              console.error('친구 요청 수락 실패:', error);
              Alert.alert('오류', '친구 요청을 수락할 수 없습니다.');
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
          onPress: async () => {
            try {
              await apiService.declineFriendRequest(requestId);
              await loadFriendRequests();
              Alert.alert('완료', '친구 요청을 거절했습니다.');
            } catch (error) {
              console.error('친구 요청 거절 실패:', error);
              Alert.alert('오류', '친구 요청을 거절할 수 없습니다.');
            }
          },
        },
      ]
    );
  };

  const openFriendModal = (friend: Friend) => {
    setSelectedFriend(friend);
    setModalVisible(true);
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  };

  const closeFriendModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
      easing: Easing.in(Easing.ease),
    }).start(() => {
      setModalVisible(false);
      setTimeout(() => setSelectedFriend(null), 300);
    });
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
              style={[
                styles.requestButton,
                styles.acceptButton,
                selectedRequestAction?.id === item.id && selectedRequestAction.action === 'accept' && styles.selectedButton
              ]}
              onPress={async () => {
                setSelectedRequestAction({ id: item.id, action: 'accept' });
                await acceptFriendRequest(item.id);
                setSelectedRequestAction(null);
              }}>
              <Text
                style={[
                  styles.buttonText,
                  selectedRequestAction?.id === item.id && selectedRequestAction.action === 'accept' && styles.selectedButtonText
                ]}
              >수락</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.requestButton,
                styles.declineButton,
                selectedRequestAction?.id === item.id && selectedRequestAction.action === 'decline' && styles.selectedButton
              ]}
              onPress={async () => {
                setSelectedRequestAction({ id: item.id, action: 'decline' });
                await declineFriendRequest(item.id);
                setSelectedRequestAction(null);
              }}>
              <Text
                style={[
                  styles.buttonText,
                  selectedRequestAction?.id === item.id && selectedRequestAction.action === 'decline' && styles.selectedButtonText
                ]}
              >거절</Text>
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
  const renderFriendItem: ListRenderItem<Friend> = ({ item }) => {
    const isOnline = onlineStatuses[String(item.id)];
    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => openFriendModal(item)}
      >
        {item.profileImage ? (
          <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
        ) :
          <View style={styles.profileImage}>
            <MaterialCommunityIcons name="account-circle" size={40} color="#bbb" />
          </View>}
        <Text style={styles.listItemName}>{item.name}</Text>
        {/* 온라인 상태 점과 텍스트를 오른쪽에 예쁘게 표시 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 80, justifyContent: 'flex-end' }}>
          <View
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              marginRight: 8,
              backgroundColor: isOnline ? '#4cd137' : '#bbb',
              shadowColor: isOnline ? '#4cd137' : '#bbb',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: isOnline ? 0.6 : 0.18,
              shadowRadius: isOnline ? 6 : 3,
              elevation: isOnline ? 4 : 1,
            }}
          />
          <View
            style={{
              backgroundColor: isOnline ? '#e6fbe6' : '#f0f0f0',
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 2,
              minWidth: 48,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: isOnline ? '#27ae60' : '#888',
                fontSize: 12,
                fontWeight: '600',
                letterSpacing: 0.5,
              }}
            >
              {isOnline ? '온라인' : '오프라인'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
          ref={searchInputRef}
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
          <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, marginTop: 24 }}>
            <MaterialCommunityIcons name="email-open-outline" size={48} color="#adb5bd" style={{ marginBottom: 12 }} />
            <Text style={{ color: '#868e96', fontSize: 16, fontWeight: 'bold', marginBottom: 6 }}>
              받은 친구 요청이 없어요
            </Text>
            <Text style={{ color: '#adb5bd', fontSize: 14, textAlign: 'center' }}>
              친구가 당신에게 요청을 보내면 여기에 표시됩니다.
            </Text>
          </View>
        )}
      </View>

      {/* 내 친구 목록 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>내 친구</Text>
        {friends.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, marginTop: 40 }}>
            <MaterialCommunityIcons name="account-multiple-outline" size={64} color="#adb5bd" style={{ marginBottom: 16 }} />
            <Text style={{ color: '#868e96', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
              아직 친구가 없어요
            </Text>
            <Text style={{ color: '#adb5bd', fontSize: 15, marginBottom: 18 }}>
              친구를 추가하고 함께 추억을 만들어보세요!
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: 'black',
                borderRadius: 20,
                paddingVertical: 10,
                paddingHorizontal: 28,
                marginTop: 8,
                shadowColor: 'black',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 4,
                elevation: 2,
              }}
              onPress={() => {
                searchInputRef.current?.focus();
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                친구 찾기
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id}
            style={styles.friendList}
            nestedScrollEnabled
          />
        )}
      </View>

      {/* Modal for friend info */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeFriendModal}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' }}>
          <Animated.View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              alignItems: 'center',
              transform: [
                {
                  translateY: modalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [60, 0],
                  }),
                },
              ],
              opacity: modalAnim,
            }}
          >
            {/* Close X button at top right */}
            <TouchableOpacity
              onPress={closeFriendModal}
              style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 10 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="close" size={28} color="#888" />
            </TouchableOpacity>
            {selectedFriend && (
              <>
                {selectedFriend.profileImage ? (
                  <Image source={{ uri: selectedFriend.profileImage }} style={{ width: 72, height: 72, borderRadius: 36, marginBottom: 12, marginTop: 12 }} />
                ) : (
                  <View style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12, marginTop: 12 }}>
                    <MaterialCommunityIcons name="account-circle" size={72} color="#bbb" />
                  </View>
                )}
                {/* 이름과 온라인 점, 텍스트를 가로로, 점과 텍스트는 오른쪽 */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, width: '100%', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#222', marginRight: 10 }}>{selectedFriend.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        marginRight: 8,
                        backgroundColor: onlineStatuses[String(selectedFriend.id)] ? '#4cd137' : '#bbb',
                        shadowColor: onlineStatuses[String(selectedFriend.id)] ? '#4cd137' : '#bbb',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: onlineStatuses[String(selectedFriend.id)] ? 0.6 : 0.18,
                        shadowRadius: onlineStatuses[String(selectedFriend.id)] ? 6 : 3,
                        elevation: onlineStatuses[String(selectedFriend.id)] ? 4 : 1,
                      }}
                    />
                    <View
                      style={{
                        backgroundColor: onlineStatuses[String(selectedFriend.id)] ? '#e6fbe6' : '#f0f0f0',
                        borderRadius: 12,
                        paddingHorizontal: 10,
                        paddingVertical: 2,
                        minWidth: 48,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: onlineStatuses[String(selectedFriend.id)] ? '#27ae60' : '#888',
                          fontSize: 12,
                          fontWeight: '600',
                          letterSpacing: 0.5,
                        }}
                      >
                        {onlineStatuses[String(selectedFriend.id)] ? '온라인' : '오프라인'}
                      </Text>
                    </View>
                  </View>
                </View>
                {/* 상태 등 추가 가능 */}
                <TouchableOpacity
                  style={{ backgroundColor: 'black', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 32, marginTop: 18, marginBottom: 20 }}
                  onPress={() => {
                    closeFriendModal();
                    navigation.navigate('FriendAlbum', { friendId: parseInt(selectedFriend.id), friendName: selectedFriend.name });
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>앨범 보기</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
      </View>
    </TouchableWithoutFeedback>
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
    minHeight: 170,
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#222',
  },
  acceptButton: {
    // borderColor: '#28a745', // 필요시 초록 테두리
  },
  declineButton: {
    // borderColor: '#dc3545', // 필요시 빨간 테두리
  },
  selectedButton: {
    backgroundColor: 'black',
    borderColor: 'black',
    borderWidth: 1,
  },
  buttonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: 'Pretendard',
  },
  selectedButtonText: {
    color: '#fff',
  },
  actionButtonPrimary: { // 친구 추가 버튼
    // backgroundColor: '#599EF1', // 파란색
    backgroundColor: 'black', // 파란색
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  actionButtonSent: { // 요청 보냄 버튼
    // backgroundColor: '#6c757d', // 회색
    backgroundColor: 'black', // 회색
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