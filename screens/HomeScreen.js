import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors, radius, shadow } from '../theme';
import { useApp } from '../context/AppContext';

export default function HomeScreen({ navigation }) {
  const { user } = useApp();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 24 }}>
      <View style={{ backgroundColor: colors.card, borderRadius: radius, padding: 16, marginBottom: 16, ...shadow }}>
        <Text style={{ color: colors.primaryText, fontSize: 20, fontWeight: '600' }}>Hi {user?.displayName || 'there'} 👋</Text>
        <Text style={{ color: colors.secondaryText, marginTop: 8 }}>
          You are in full control. You can start or stop sharing your live location anytime.
        </Text>
      </View>
      <View style={{ gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.navigate('Share')} style={{ backgroundColor: colors.accent, borderRadius: radius, padding: 16, alignItems: 'center', ...shadow }}>
          <Text style={{ color: colors.primaryText, fontWeight: '600' }}>Share My Location</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('View')} style={{ backgroundColor: colors.card, borderRadius: radius, padding: 16, alignItems: 'center', ...shadow }}>
          <Text style={{ color: colors.primaryText, fontWeight: '600' }}>View Locations</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
