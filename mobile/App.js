import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import UserHomeScreen from './src/screens/UserHomeScreen';
import SecurityHomeScreen from './src/screens/SecurityHomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import GeneratePassScreen from './src/screens/GeneratePassScreen';
import ScanInScreen from './src/screens/ScanInScreen';
import ScanOutScreen from './src/screens/ScanOutScreen';
import OverdueDashboardScreen from './src/screens/OverdueDashboardScreen';
import SecurityVideosScreen from './src/screens/SecurityVideosScreen';
import ClipPlayerScreen from './src/screens/ClipPlayerScreen';
import SecurityMapScreen from './src/screens/SecurityMapScreen';
import TestModelScreen from './src/screens/TestModelScreen';

import { colors } from './src/theme';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bgPrimary,
    card: colors.bgPrimary,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.accentPrimary,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bgPrimary },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="UserHome" component={UserHomeScreen} />
          <Stack.Screen name="SecurityHome" component={SecurityHomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="GeneratePass" component={GeneratePassScreen} />
          <Stack.Screen name="ScanIn" component={ScanInScreen} />
          <Stack.Screen name="ScanOut" component={ScanOutScreen} />
          <Stack.Screen name="Overdue" component={OverdueDashboardScreen} />
          <Stack.Screen name="Clips" component={SecurityVideosScreen} />
          <Stack.Screen name="ClipPlayer" component={ClipPlayerScreen} />
          <Stack.Screen name="SosMap" component={SecurityMapScreen} />
          <Stack.Screen name="TestModel" component={TestModelScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
