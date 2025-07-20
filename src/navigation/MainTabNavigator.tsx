import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import FriendsScreen from '../screens/FriendsScreen';
import AlbumScreen from '../screens/AlbumScreen';
import CutSelectionScreen from '../screens/CutSelectionScreen';
import CutSelectionOnlineScreen from '../screens/CutSelectionOnlineScreen';
import CameraScreen from '../screens/CameraScreen';
import { Ionicons } from '@expo/vector-icons';
import type { StackNavigationProp } from '@react-navigation/stack';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

type RootStackParamList = {
  Login: undefined;
};

type HomeStackParamList = {
  HomeMain: undefined;
  CutSelection: undefined;
  CutSelectionOnline: undefined;
  Camera: { cutType: string };
  PhotoSelection: { photos: string[]; cutType: string };
  FilterFrame: { selectedPhotos: string[]; cutType: string };
};

type MainTabNavigatorProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Login'>;
};

import CameraGuideScreen from '../screens/CameraGuideScreen';

const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="CutSelection" component={CutSelectionScreen} />
      <Stack.Screen name="CutSelectionOnline" component={CutSelectionOnlineScreen} />
      <Stack.Screen
        name="CameraGuide"
        component={CameraGuideScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const MainTabNavigator: React.FC<MainTabNavigatorProps> = ({ navigation }) => {
  const handleLogout = () => {
    navigation.replace('Login');
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

          if (route.name === 'Home') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'Friends') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Album') {
            iconName = focused ? 'images' : 'images-outline';
          }

          return <Ionicons name={iconName} size={28} color={color} />;
        },
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#D1D5DB',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 10, // for Android shadow (much stronger)
          shadowOpacity: 0.2, // for iOS shadow (much stronger)
          shadowRadius: 10,
          shadowOffset: { width: 2, height: 8 },
          shadowColor: '#000000',
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          // 완전히 떠있는 효과를 위한 스타일
          marginBottom: 15,
          marginHorizontal: 15,
          marginTop: 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0, // for Android
          shadowOpacity: 0, // for iOS
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: 'bold',
        },
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
            <Ionicons name="log-out-outline" size={24} color="#333" />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ title: 'Cutprint' }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ title: 'Cutprint' }}
      />
      <Tab.Screen
        name="Album"
        component={AlbumScreen}
        options={{ title: 'Cutprint' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
