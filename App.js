import React, { useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from './theme';
import WelcomeScreen from './screens/WelcomeScreen';
import { LoginScreen, SignupScreen } from './screens/AuthScreens';
import HomeScreen from './screens/HomeScreen';
import ShareLocationScreen from './screens/ShareLocationScreen';
import ViewLocationsScreen from './screens/ViewLocationsScreen';
import MapScreen from './screens/MapScreen';
import SettingsScreen from './screens/SettingsScreen';
import PairingScreen from './screens/PairingScreen';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useApp } from './context/AppContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AppProvider>
      <InnerApp />
    </AppProvider>
  );
}


function InnerApp() {
  const { user } = useApp();
  const navTheme = useMemo(() => ({
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: colors.background, text: colors.primaryText }
  }), []);
  return (
    <NavigationContainer theme={navTheme}>
      {user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Map" component={MapScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: 72,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarIcon: ({ color, size }) => {
          const name = route.name === 'Home' ? 'home' :
            route.name === 'Share' ? 'location' :
            route.name === 'View' ? 'map' :
            route.name === 'Pair' ? 'link' : 'settings';
          return <Ionicons name={name} color={color} size={size} />;
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Share" component={ShareLocationScreen} />
      <Tab.Screen name="View" component={ViewLocationsScreen} />
      <Tab.Screen name="Pair" component={PairingScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
