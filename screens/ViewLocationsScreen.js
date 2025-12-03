import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { colors, radius, shadow } from '../theme';
import { useApp } from '../context/AppContext';

export default function ViewLocationsScreen({ navigation }) {
  const { user, usersById } = useApp();
  const [followed, setFollowed] = useState([]);
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    const list = usersById[user?.uid]?.followedUsers || [];
    setFollowed(list);
    const profs = list.map((uid) => {
      const d = usersById[uid];
      return { uid, name: d?.name || uid, sharingEnabled: Boolean(d?.sharingEnabled) };
    });
    setProfiles(profs);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, gap: 12 }}>
      <Text style={{ color: colors.primaryText, fontSize: 18, fontWeight: '600' }}>Followed Users</Text>
      <View style={{ backgroundColor: colors.card, borderRadius: radius, padding: 16, gap: 12, ...shadow }}>
        {profiles.length === 0 ? (
          <Text style={{ color: colors.secondaryText }}>No users followed yet. Add from Pair tab.</Text>
        ) : (
          profiles.map((p) => (
            <TouchableOpacity key={p.uid} onPress={() => navigation.navigate('Map', { uid: p.uid })} style={{ backgroundColor: '#1F2234', borderRadius: radius, padding: 12 }}>
              <Text style={{ color: colors.primaryText, fontWeight: '600' }}>{p.name}</Text>
              <Text style={{ color: colors.secondaryText }}>Status: {p.sharingEnabled ? 'Sharing' : 'Not sharing'}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}
