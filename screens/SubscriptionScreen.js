import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';
import { colors, radius } from '../theme';

export default function SubscriptionScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 24 }}>
      <View style={{ backgroundColor: colors.card, borderRadius: radius, padding: 16 }}>
        <Text style={{ color: colors.primaryText, fontSize: 18, fontWeight: '600' }}>Subscription</Text>
        <Text style={{ color: colors.secondaryText, marginTop: 12 }}>Plans and billing coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}
