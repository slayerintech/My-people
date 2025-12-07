import React, { useMemo, useRef, useEffect } from 'react';
import { View, ActivityIndicator, Animated } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, radius } from './theme';
import WelcomeScreen from './screens/WelcomeScreen';
import { LoginScreen, SignupScreen } from './screens/AuthScreens';
import HomeScreen from './screens/HomeScreen';
import ShareLocationScreen from './screens/ShareLocationScreen';
import ViewLocationsScreen from './screens/ViewLocationsScreen';
import MapScreen from './screens/MapScreen';
import SettingsScreen from './screens/SettingsScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import TermsScreen from './screens/TermsScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';
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
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen name="Subscription" component={SubscriptionScreen} />
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

function AnimatedTabIcon({ name, color, size, focused }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: focused ? 1.1 : 1, useNativeDriver: true }).start();
  }, [focused]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name={name} color={color} size={size} />
    </Animated.View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12,
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: 64,
          borderRadius: radius,
          paddingBottom: 8,
          elevation: 0,
          shadowColor: 'transparent',
          shadowOpacity: 0,
          shadowRadius: 0
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarIcon: ({ color, size, focused }) => {
          const name = route.name === 'Home' ? 'home' :
            route.name === 'View' ? 'map' : 'settings';
          return <AnimatedTabIcon name={name} color={color} size={size} focused={focused} />;
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="View" component={ViewLocationsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
