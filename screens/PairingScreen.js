import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { colors, radius, shadow } from '../theme';
import { useApp } from '../context/AppContext';

export default function PairingScreen() {
  const { user, addFollow, usersById } = useApp();
  const [code, setCode] = useState('');
  const [followed, setFollowed] = useState([]);

  useEffect(() => {
    setFollowed(usersById[user?.uid]?.followedUsers || []);
  }, []);

  const onAddFollow = async () => {
    if (!code.trim()) return;
    addFollow(code.trim());
    setCode('');
    Alert.alert('Success', 'User code added. You can view their location when sharing is ON.');
    setFollowed(usersById[user?.uid]?.followedUsers || []);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, gap: 16 }}>
      <View style={{ backgroundColor: colors.card, borderRadius: radius, padding: 16, gap: 12, ...shadow }}>
        <Text style={{ color: colors.primaryText, fontSize: 18, fontWeight: '600' }}>Pairing / Linking</Text>
        <Text style={{ color: colors.secondaryText }}>Your Share Code: {user?.uid}</Text>
        <Text style={{ color: colors.secondaryText }}>Enter partner/child code to follow them:</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="Enter their uid"
          placeholderTextColor={colors.secondaryText}
          style={{ color: colors.primaryText, backgroundColor: '#1F2234', borderRadius: radius, padding: 12 }}
        />
        <TouchableOpacity onPress={onAddFollow} style={{ backgroundColor: colors.accent, borderRadius: radius, padding: 14, alignItems: 'center', ...shadow }}>
          <Text style={{ color: colors.primaryText, fontWeight: '600' }}>Add</Text>
        </TouchableOpacity>
      </View>
      <View style={{ backgroundColor: colors.card, borderRadius: radius, padding: 16 }}>
        <Text style={{ color: colors.secondaryText, marginBottom: 8 }}>Following:</Text>
        {followed.length === 0 ? (
          <Text style={{ color: colors.secondaryText }}>No followed users yet.</Text>
        ) : (
          followed.map((uid) => (
            <Text key={uid} style={{ color: colors.primaryText }}>{uid}</Text>
          ))
        )}
      </View>
    </View>
  );
}
