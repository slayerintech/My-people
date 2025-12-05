import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
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
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, gap: 16 }}>
      <Text style={{ color: colors.primaryText, fontSize: 24, fontWeight: '600' }}>Login</Text>
      <Card>
        <Label>Email</Label>
        <Field value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" />
        <Label>Password</Label>
        <Field value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
        <PrimaryButton title="Login" onPress={onLogin} />
        <SecondaryLink title="Create account" onPress={() => navigation.navigate('Signup')} />
      </Card>
    </View>
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
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, gap: 16 }}>
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
    </View>
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

function SecondaryLink({ title, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={{ color: colors.secondaryText, textAlign: 'center', marginTop: 8 }}>{title}</Text>
    </TouchableOpacity>
  );
}
