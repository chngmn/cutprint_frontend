
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Modal,
  Pressable
} from 'react-native';
import { apiService } from '../services/apiService';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Theme from '../constants/theme';
import PhotoPermissionIndicator, { PhotoVisibility } from '../components/PhotoPermissionIndicator';

type FriendAlbumScreenRouteProp = RouteProp<RootStackParamList, 'FriendAlbum'>;

interface Photo { 
  id: number; 
  url: string;
  visibility?: PhotoVisibility;
}

const { width } = Dimensions.get('window');
const { Colors, Typography, Spacing, Radius } = Theme;

const FriendAlbumScreen = () => {
  const route = useRoute<FriendAlbumScreenRouteProp>();
  const navigation = useNavigation();
  const { friendId, friendName } = route.params;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const userPhotos = await apiService.getUserPhotos(friendId);
        setPhotos(userPhotos);
        setError(null);
      } catch (err) {
        setError('사진을 불러오는 데 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [friendId]);

  // 3-Column Grid Configuration (same as AlbumScreen)
  const numColumns = 3;
  const gridSpacing = Spacing.xs;
  const sidePadding = 8;
  const itemSize = (width - sidePadding * 2 - (numColumns - 1) * gridSpacing) / numColumns;

  // Header Component - Minimal Design
  const FriendHeader = () => (
    <SafeAreaView style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{friendName}</Text>
          <Text style={styles.headerSubtitle}>{photos.length} photos</Text>
        </View>
        <View style={styles.headerRight} />
      </View>
    </SafeAreaView>
  );

  // Photo Item Component - Minimal Design (same as AlbumScreen)
  const PhotoItem = ({ item, index }: { item: Photo, index: number }) => (
    <TouchableOpacity
      style={[
        styles.photoItem,
        {
          width: itemSize,
          height: itemSize,
          marginRight: (index + 1) % numColumns === 0 ? 0 : gridSpacing
        }
      ]}
      activeOpacity={0.9}
      onPress={() => setSelectedPhoto(item)}
    >
      <Image
        source={{ uri: item.url }}
        style={styles.photoImage}
        resizeMode="cover"
      />
      {/* Permission Indicator - only show for close friends photos */}
      {item.visibility && item.visibility === 'CLOSE_FRIENDS' && (
        <PhotoPermissionIndicator
          visibility={item.visibility}
          size="small"
          style={styles.permissionIndicator}
        />
      )}
    </TouchableOpacity>
  );

  // Empty State Component
  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="camera-outline" size={64} color={Colors.gray400} />
      <Text style={styles.emptyTitle}>No Photos Yet</Text>
      <Text style={styles.emptySubtitle}>
        {friendName} hasn't shared any photos yet
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <FriendHeader />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.textPrimary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <FriendHeader />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.gray400} />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <FriendHeader />

      {photos.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={photos}
          renderItem={PhotoItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          contentContainerStyle={styles.photoGrid}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={12}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          getItemLayout={(data, index) => ({
            length: itemSize,
            offset: Math.floor(index / numColumns) * (itemSize + gridSpacing),
            index,
          })}
        />
      )}

      {/* Fullscreen Modal */}
      {selectedPhoto && (
        <Modal
          visible={true}
          transparent={true}
          onRequestClose={() => setSelectedPhoto(null)}
        >
          <Pressable
            style={styles.modalBackground}
            onPress={() => setSelectedPhoto(null)}
          >
            <Image
              source={{ uri: selectedPhoto.url }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  
  // Header Styles - Minimal like AlbumScreen
  header: {
    backgroundColor: Colors.white,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.sm,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  headerTitle: {
    fontSize: Typography.fontSize['xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },

  // Photo Grid Styles - Same as AlbumScreen
  photoGrid: {
    paddingHorizontal: 8,
    paddingTop: Spacing.containerPadding,
    paddingBottom: Spacing.xl,
  },
  photoItem: {
    marginBottom: Spacing.xs,
    overflow: 'hidden',
    backgroundColor: Colors.gray50,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray100,
  },

  // Empty State & Error Styles
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
  },
  errorTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  errorSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
  },

  // Fullscreen Modal Styles - Same as AlbumScreen
  modalBackground: {
    flex: 1,
    backgroundColor: Colors.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: Radius.md,
  },
  // Permission Indicator Styles
  permissionIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});

export default FriendAlbumScreen;
