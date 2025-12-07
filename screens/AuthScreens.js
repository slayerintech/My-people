import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Popup from '../components/Popup';
import { auth } from '../firebaseConfig';
import { useApp } from '../context/AppContext';

// --- Theme Imports ---
const colors = {
  background: '#1A1D2E',
  card: '#24283C',
  primaryText: '#FFFFFF',
  secondaryText: '#8E99B0',
  accent: '#e26104ff',
  gradientStart: '#FF6A00',
  gradientEnd: '#FF6A00'
};
const radius = 20;
const shadow = {
  shadowColor: colors.accent,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.35,
  shadowRadius: 20,
  elevation: 12
};
const inputBackground = '#333852';

// --- Reusable UI Components (Identical to previous versions) ---

function Card({ children }) {
  return (
    <View style={componentStyles.card}>
      {children}
    </View>
  );
}

function Label({ children }) {
  return <Text style={componentStyles.label}>{children}</Text>;
}

function Field(props) {
  const [isFocused, setIsFocused] = useState(false);
  const inputStyle = [
    componentStyles.field,
    isFocused && { borderColor: colors.accent, borderWidth: 1 }
  ];
  return (
    <TextInput
      {...props}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      placeholderTextColor={colors.secondaryText + 'AA'}
      style={inputStyle}
      keyboardAppearance="dark"
      autoCapitalize={props.keyboardType === 'email-address' ? 'none' : 'sentences'}
    />
  );
}

function PrimaryButton({ title, onPress, isLoading = false }) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[componentStyles.primaryButton, { opacity: isLoading ? 0.7 : 1 }]}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.primaryText} size="small" />
      ) : (
        <Text style={componentStyles.primaryButtonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

 

function SecondaryLink({ title, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={componentStyles.secondaryLinkText}>{title}</Text>
    </TouchableOpacity>
  );
}

// --- Styles for Reusable Components ---
const componentStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 20,
    gap: 15,
    ...shadow,
    shadowRadius: 10,
    shadowOpacity: 0.2,
    elevation: 5,
  },
  label: {
    color: colors.secondaryText,
    fontSize: 14,
    marginTop: 5,
    marginBottom: -10,
  },
  field: {
    color: colors.primaryText,
    backgroundColor: inputBackground,
    borderRadius: radius * 0.5,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: inputBackground,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius * 0.7,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    ...shadow,
    shadowColor: colors.accent,
    shadowRadius: 10,
    shadowOpacity: 0.6,
    elevation: 8,
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryLinkText: {
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
  }
});

// --- Login Screen ---

export function LoginScreen({ navigation }) {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [popup, setPopup] = useState({ visible: false, title: '', message: '', confirmText: 'OK', cancelText: 'Cancel', onConfirm: null });

  const onLogin = async () => {
    setIsLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setPopup({ visible: true, title: 'Login Failed', message: String(e.message || e), confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <ScrollView contentContainerStyle={screenStyles.scrollContent}>
        
        {/* New: Professional Logo/Icon Section - Center Aligned */}
        <View style={screenStyles.logoContainer}>
            <Ionicons name="location-outline" size={60} color={colors.accent} />
        </View>

        {/* Updated: Professional Title and Subtitle - Center Aligned */}
        <Text style={screenStyles.header}>Access Your Account</Text>
        <Text style={screenStyles.subHeader}>
          Please sign in to continue with secure location management.
        </Text>

        <Card>
          <Label>Email Address</Label>
          <Field value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" />
          
          <Label>Password</Label>
          <Field value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
          
          <PrimaryButton title="Sign In" onPress={onLogin} isLoading={isLoading} />
          
          
          <SecondaryLink title="Need an account? Create one here" onPress={() => navigation.navigate('Signup')} />
        </Card>
      </ScrollView>
      <Popup visible={popup.visible} title={popup.title} message={popup.message} confirmText={popup.confirmText} cancelText={popup.cancelText} onConfirm={popup.onConfirm} onCancel={() => setPopup({ ...popup, visible: false })} />
    </SafeAreaView>
  );
}

// --- Signup Screen ---

export function SignupScreen({ navigation }) {
  const { signup } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [popup, setPopup] = useState({ visible: false, title: '', message: '', confirmText: 'OK', cancelText: 'Cancel', onConfirm: null });

  const onSignup = async () => {
    setIsLoading(true);
    try {
      if (!name.trim()) throw new Error("Please enter your name.");
      await signup(name, email.trim(), password);
    } catch (e) {
      setPopup({ visible: true, title: 'Signup Failed', message: String(e.message || e), confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <ScrollView contentContainerStyle={screenStyles.scrollContent}>
        <View style={screenStyles.logoContainer}>
            <Ionicons name="people-outline" size={60} color={colors.accent} />
        </View>

        <Text style={screenStyles.header}>Create New Account</Text>
        <Text style={screenStyles.subHeader}>Join the safe circle and start sharing securely.</Text>

        <Card>
          <Label>Full Name</Label>
          <Field value={name} onChangeText={setName} placeholder="Your name" />

          <Label>Email Address</Label>
          <Field value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" />
          
          <Label>Password</Label>
          <Field value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
          
          <PrimaryButton title="Sign Up" onPress={onSignup} isLoading={isLoading} />
          
          <SecondaryLink title="Already have an account? Back to login" onPress={() => navigation.navigate('Login')} />
        </Card>
      </ScrollView>
      <Popup visible={popup.visible} title={popup.title} message={popup.message} confirmText={popup.confirmText} cancelText={popup.cancelText} onConfirm={popup.onConfirm} onCancel={() => setPopup({ ...popup, visible: false })} />
    </SafeAreaView>
  );
}

// --- Screen Specific Styles ---

const screenStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Key changes here for center alignment
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
    flexGrow: 1, // Allows the content to expand and be centered
    justifyContent: 'center', // Centers content vertically
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30, // Increased spacing below the logo
    paddingTop: 10,
  },
  header: {
    color: colors.primaryText,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 5,
    textAlign: 'center', // Center aligned header text
  },
  subHeader: {
    color: colors.secondaryText,
    fontSize: 15,
    marginBottom: 30, // Increased spacing before the card
    textAlign: 'center', // Center aligned sub-header text
  },
  separator: {
    height: 1,
    backgroundColor: colors.secondaryText + '1A',
    marginVertical: 5,
  }
});
