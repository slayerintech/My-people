import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../theme';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 240 }} />
      <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: colors.primaryText, fontSize: 28, fontWeight: '600', marginBottom: 8 }}>Consent Location</Text>
          <Text style={{ color: colors.secondaryText, fontSize: 16 }}>Live location sharing with full control and privacy.</Text>
        </View>
        <View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={{ backgroundColor: colors.card, borderRadius: radius, padding: 16, alignItems: 'center', ...shadow }}
          >
            <Text style={{ color: colors.primaryText, fontSize: 16 }}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

