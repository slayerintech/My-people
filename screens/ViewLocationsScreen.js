import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { colors, radius, shadow } from '../theme';
import { useApp } from '../context/AppContext';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function ViewLocationsScreen({ navigation }) {
  const { user } = useApp();
  const [followed, setFollowed] = useState([]);
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!auth.currentUser) return;
        const ref = doc(db, 'users', auth.currentUser.uid);
        const snap = await getDoc(ref);
        const list = snap.data()?.followedUsers || [];
        setFollowed(list);
        const profs = [];
        for (const uid of list) {
          const s = await getDoc(doc(db, 'users', uid));
          if (s.exists()) {
            const d = s.data();
            profs.push({ uid, name: d.name || uid, sharingEnabled: d.sharingEnabled });
          }
        }
        setProfiles(profs);
      } catch (e) {
        Alert.alert('Error', e.message);
      }
    };
    load();
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
