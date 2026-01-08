import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Popup from '../components/Popup';
import { auth } from '../firebaseConfig';
import { useApp } from '../context/AppContext';

// --- Theme Imports ---
const colors = {
  background: '#060818ff',
  card: '#1a1c2aff',
  primaryText: '#FFFFFF',
  secondaryText: '#8E99B0',
  accent: '#e26104ff',
  gradientStart: '#000000ff',
  gradientEnd: '#ff6a00ae'
};
const radius = 20;
const shadow = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0
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
    <View style={screenStyles.container}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={screenStyles.headerGradient}
      >
        <View style={screenStyles.logoPlaceholder}>
            <Ionicons name="location-outline" size={60} color={colors.primaryText} />
        </View>
      </LinearGradient>

      <SafeAreaView style={screenStyles.contentWrapper} edges={['bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={screenStyles.scrollContent} showsVerticalScrollIndicator={false}>
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
      </SafeAreaView>
      <Popup visible={popup.visible} title={popup.title} message={popup.message} confirmText={popup.confirmText} cancelText={popup.cancelText} onConfirm={popup.onConfirm} onCancel={() => setPopup({ ...popup, visible: false })} />
    </View>
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
    <View style={screenStyles.container}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={screenStyles.headerGradient}
      >
        <View style={screenStyles.logoPlaceholder}>
            <Ionicons name="people-outline" size={60} color={colors.primaryText} />
        </View>
      </LinearGradient>

      <SafeAreaView style={screenStyles.contentWrapper} edges={['bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={screenStyles.scrollContent} showsVerticalScrollIndicator={false}>
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
      </SafeAreaView>
      <Popup visible={popup.visible} title={popup.title} message={popup.message} confirmText={popup.confirmText} cancelText={popup.cancelText} onConfirm={popup.onConfirm} onCancel={() => setPopup({ ...popup, visible: false })} />
    </View>
  );
}

// --- Screen Specific Styles ---

const { height } = Dimensions.get('window');
const SPACING = 24;

const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    height: height * 0.35,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: radius * 2,
    borderBottomRightRadius: radius * 2,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: colors.primaryText + '55',
    ...shadow,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: SPACING,
    marginTop: -radius * 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    color: colors.primaryText,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 5,
    textAlign: 'center',
    marginTop: 10,
  },
  subHeader: {
    color: colors.secondaryText,
    fontSize: 15,
    marginBottom: 30,
    textAlign: 'center',
  },
});
