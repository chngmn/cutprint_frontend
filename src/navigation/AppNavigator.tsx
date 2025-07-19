
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import MainTabNavigator from './MainTabNavigator';
import PhotoSelectionScreen from '../screens/PhotoSelectionScreen';
import FilterFrameScreen from '../screens/FilterFrameScreen';
import PreviewAndSaveScreen from '../screens/PreviewAndSaveScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="PhotoSelection" component={PhotoSelectionScreen} />
        <Stack.Screen name="FilterFrame" component={FilterFrameScreen} />
        <Stack.Screen name="PreviewAndSave" component={PreviewAndSaveScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
