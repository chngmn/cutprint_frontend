
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import FriendsScreen from '../screens/FriendsScreen';
import AlbumScreen from '../screens/AlbumScreen';
import CutSelectionScreen from '../screens/CutSelectionScreen';
import CameraScreen from '../screens/CameraScreen'; // Import the new screen
import { Ionicons } from '@expo/vector-icons';
import type { StackNavigationProp } from '@react-navigation/stack';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

type RootStackParamList = {
  Login: undefined;
  // Add other screens here if needed
};

type MainTabNavigatorProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Login'>;
};

// New Stack Navigator for the Home tab
const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="CutSelection" component={CutSelectionScreen} />
      <Stack.Screen name="Camera" component={CameraScreen} />
    </Stack.Navigator>
  );
};

const MainTabNavigator: React.FC<MainTabNavigatorProps> = ({ navigation }) => {
  const handleLogout = () => {
    // Navigate back to the Login screen
    navigation.replace('Login');
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Friends') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Album') {
            iconName = focused ? 'images' : 'images-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
            <Ionicons name="log-out-outline" size={24} color="#000" />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack} // Use the HomeStack navigator
        options={{ title: '홈' }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ title: '친구' }}
      />
      <Tab.Screen
        name="Album"
        component={AlbumScreen}
        options={{ title: '사진첩' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;

