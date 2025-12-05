import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AuthSession from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { colors, radius, shadow } from '../theme';
import { useApp } from '../context/AppContext';

export function LoginScreen({ navigation }) {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLogin = async () => {
    try {
      await login(email.trim(), password);
    } catch (e) {
      Alert.alert('Login failed', e.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 24, gap: 16 }}>
      <Text style={{ color: colors.primaryText, fontSize: 24, fontWeight: '600' }}>Login</Text>
      <Card>
        <Label>Email</Label>
        <Field value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" />
        <Label>Password</Label>
        <Field value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
        <PrimaryButton title="Login" onPress={onLogin} />
        <GoogleButton />
        <SecondaryLink title="Create account" onPress={() => navigation.navigate('Signup')} />
      </Card>
    </SafeAreaView>
  );
}

export function SignupScreen({ navigation }) {
  const { signup } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSignup = async () => {
    try {
      await signup(name, email.trim(), password);
    } catch (e) {
      Alert.alert('Signup failed', e.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 24, gap: 16 }}>
      <Text style={{ color: colors.primaryText, fontSize: 24, fontWeight: '600' }}>Create Account</Text>
      <Card>
        <Label>Name</Label>
        <Field value={name} onChangeText={setName} placeholder="Your name" />
        <Label>Email</Label>
        <Field value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" />
        <Label>Password</Label>
        <Field value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
        <PrimaryButton title="Sign Up" onPress={onSignup} />
        <SecondaryLink title="Back to login" onPress={() => navigation.navigate('Login')} />
      </Card>
    </SafeAreaView>
  );
}

function Card({ children }) {
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: radius, padding: 16, gap: 12, ...shadow }}>
      {children}
    </View>
  );
}

function Label({ children }) {
  return <Text style={{ color: colors.secondaryText, fontSize: 14 }}>{children}</Text>;
}

function Field(props) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.secondaryText}
      style={{ color: colors.primaryText, backgroundColor: '#1F2234', borderRadius: radius, padding: 12 }}
    />
  );
}

function PrimaryButton({ title, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ backgroundColor: colors.accent, borderRadius: radius, padding: 14, alignItems: 'center', ...shadow }}>
      <Text style={{ color: colors.primaryText, fontWeight: '600' }}>{title}</Text>
    </TouchableOpacity>
  );
}

function GoogleButton() {
  const onGoogle = async () => {
    try {
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
      const result = await AuthSession.startAsync({
        authUrl: `https://accounts.google.com/o/oauth2/v2/auth?response_type=id_token&client_id=${process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20email%20profile`,
      });
      if (result.type === 'success' && result.params?.id_token) {
        const credential = GoogleAuthProvider.credential(result.params.id_token);
        await signInWithCredential(auth, credential);
      }
    } catch (e) {
      Alert.alert('Google login failed', e.message);
    }
  };
  return (
    <TouchableOpacity onPress={onGoogle} style={{ backgroundColor: '#1F2234', borderRadius: radius, padding: 14, alignItems: 'center' }}>
      <Text style={{ color: colors.secondaryText }}>Continue with Google</Text>
    </TouchableOpacity>
  );
}

function SecondaryLink({ title, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={{ color: colors.secondaryText, textAlign: 'center', marginTop: 8 }}>{title}</Text>
    </TouchableOpacity>
  );
}
