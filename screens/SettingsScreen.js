import React, { useEffect, useState } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert } from 'react-native';
import { colors, radius, shadow } from '../theme';
import { useApp } from '../context/AppContext';

export default function SettingsScreen() {
  const { user, usersById, toggleAllowFollow, deleteAccount } = useApp();
  const [profile, setProfile] = useState(null);
  const [allow, setAllow] = useState(true);

  useEffect(() => {
    const data = usersById[user?.uid];
    setProfile(data);
    setAllow(Boolean(data?.allowFollow));
  }, []);

  const toggleAllow = async (value) => {
    setAllow(value);
    toggleAllowFollow(value);
  };

  const onDeleteAccount = async () => {
    Alert.alert('Delete account', 'This will permanently delete your account and data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          deleteAccount();
        } catch (e) {
          Alert.alert('Error', e.message);
        }
      }}
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, gap: 16 }}>
      <View style={{ backgroundColor: colors.card, borderRadius: radius, padding: 16, gap: 12, ...shadow }}>
        <Text style={{ color: colors.primaryText, fontSize: 18, fontWeight: '600' }}>Settings & Privacy</Text>
        <Text style={{ color: colors.secondaryText }}>Name: {profile?.name || 'Unknown'}</Text>
        <Text style={{ color: colors.secondaryText }}>Email: {profile?.email || ''}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.primaryText }}>Allow others to follow me using my code</Text>
          <Switch value={allow} onValueChange={toggleAllow} trackColor={{ false: '#777', true: colors.accent }} thumbColor={colors.primaryText} />
        </View>
        <TouchableOpacity onPress={onDeleteAccount} style={{ backgroundColor: '#1F2234', borderRadius: radius, padding: 12, alignItems: 'center' }}>
          <Text style={{ color: colors.secondaryText }}>Delete my account and all my data</Text>
        </TouchableOpacity>
      </View>
      <View style={{ backgroundColor: colors.card, borderRadius: radius, padding: 16 }}>
        <Text style={{ color: colors.secondaryText }}>
          Location is only shared when you turn it ON. You can turn it OFF anytime. This app is for consent-based safety and family use.
        </Text>
      </View>
    </View>
  );
}
