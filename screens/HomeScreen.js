import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '../theme';
import { useApp } from '../context/AppContext';
import * as Location from 'expo-location';
import { auth, db } from '../firebaseConfig';
import { arrayUnion, doc, getDoc, getDocFromCache, updateDoc, onSnapshot } from 'firebase/firestore';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const { user, updateLocation, setSharingEnabled } = useApp();
  const [sharing, setSharing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const watcherRef = useRef(null);
  const [code, setCode] = useState('');
  const [followed, setFollowed] = useState([]);
  const [targets, setTargets] = useState([]);
  const [planTitle, setPlanTitle] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const TASK_NAME = 'BACKGROUND_LOCATION_TASK';

  useEffect(() => {
    setSharing(Boolean(user?.sharingEnabled));
    if (user?.location?.lastUpdated) setLastUpdated(new Date(user.location.lastUpdated));
    const loadFollowed = async () => {
      try {
        if (!auth.currentUser) return;
        const ref = doc(db, 'users', auth.currentUser.uid);
        let data = null;
        try {
          const snap = await getDoc(ref);
          data = snap.data() || {};
        } catch (e) {
          try {
            const csnap = await getDocFromCache(ref);
            data = csnap.data() || {};
          } catch {}
        }
        data = data || {};
        setFollowed(data.followedUsers || []);
        setPlanTitle(data.planTitle || null);
        setCreatedAt(data.createdAt || null);
        const list = data.followedUsers || [];
        const unsubs = [];
        list.forEach((uid) => {
          const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
            const d = snap.data();
            setTargets((prev) => {
              const next = prev.filter((p) => p.uid !== uid);
              next.push({ uid, data: d });
              return next;
            });
          });
          unsubs.push(unsub);
        });
        return () => unsubs.forEach((u) => u());
      } catch {}
    };
    loadFollowed();
    return () => {
      if (watcherRef.current) {
        watcherRef.current.remove();
      }
    };
  }, [user?.sharingEnabled]);

  const startSharing = async () => {
    const signupTime = createdAt || (auth.currentUser?.metadata?.creationTime ? Date.parse(auth.currentUser.metadata.creationTime) : null);
    const withinTrial = signupTime ? (Date.now() - signupTime) < (3 * 24 * 60 * 60 * 1000) : false;
    if (!planTitle && !withinTrial) {
      Alert.alert('Subscription required', 'Subscribe to continue using location sharing.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Subscribe', onPress: () => navigation.navigate('Subscription') }
      ]);
      return;
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is needed to share your live location.');
        return;
      }
      const bg = await Location.requestBackgroundPermissionsAsync();
      watcherRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          updateLocation(latitude, longitude);
          setLastUpdated(new Date());
          setSharing(true);
        }
      );
      if (bg.status === 'granted') {
        await Location.startLocationUpdatesAsync(TASK_NAME, {
          accuracy: Location.Accuracy.High,
          timeInterval: 15000,
          distanceInterval: 25,
          pausesUpdatesAutomatically: true,
          showsBackgroundLocationIndicator: true
        });
      }
      setSharingEnabled(true);
    } catch (e) {
      Alert.alert('Error starting sharing', e.message);
    }
  };

  const stopSharing = async () => {
    try {
      if (watcherRef.current) {
        watcherRef.current.remove();
        watcherRef.current = null;
      }
      try {
        await Location.stopLocationUpdatesAsync(TASK_NAME);
      } catch {}
      setSharingEnabled(false);
      setSharing(false);
    } catch (e) {
      Alert.alert('Error stopping sharing', e.message);
    }
  };

  const copyCode = async () => {
    try {
      if (!user?.uid) return;
      await Clipboard.setStringAsync(user.uid);
      Alert.alert('Copied', 'Share code copied');
    } catch {}
  };

  const onAddFollow = async () => {
    try {
      const signupTime = createdAt || (auth.currentUser?.metadata?.creationTime ? Date.parse(auth.currentUser.metadata.creationTime) : null);
      const withinTrial = signupTime ? (Date.now() - signupTime) < (3 * 24 * 60 * 60 * 1000) : false;
      if (!planTitle && !withinTrial) {
        Alert.alert('Subscription required', 'Subscribe to link and follow users.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Subscribe', onPress: () => navigation.navigate('Subscription') }
        ]);
        return;
      }
      if (!code.trim()) return;
      const targetUid = code.trim();
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { followedUsers: arrayUnion(targetUid) });
      const targetRef = doc(db, 'users', targetUid);
      const targetSnap = await getDoc(targetRef);
      if (targetSnap.exists()) {
        const t = targetSnap.data();
        if (t.allowFollow !== false) {
          await updateDoc(targetRef, { visibleTo: arrayUnion(auth.currentUser.uid) });
        }
      }
      setCode('');
      Alert.alert('Success', 'Linked. You will see their location when they share and allow visibility.');
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      setFollowed(snap.data()?.followedUsers || []);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 24, gap: 16 }}>
      <View style={{ backgroundColor: colors.card, borderRadius: radius, padding: 16, gap: 12, ...shadow }}>
        <Text style={{ color: colors.primaryText, fontSize: 20, fontWeight: '600' }}>Hi {user?.displayName || 'there'} 👋</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.secondaryText }}>Status: {sharing ? 'Sharing' : 'Not sharing'}{lastUpdated ? ` · ${lastUpdated.toLocaleTimeString()}` : ''}</Text>
          <Switch value={sharing} onValueChange={(v) => (v ? startSharing() : stopSharing())} trackColor={{ false: '#777', true: colors.accent }} thumbColor={colors.primaryText} />
        </View>
        {sharing ? (
          <View style={{ backgroundColor: '#1F2234', borderRadius: radius, padding: 12, alignItems: 'center' }}>
            <Text style={{ color: colors.primaryText, fontSize: 18, fontWeight: '700' }}>{user?.uid}</Text>
            <TouchableOpacity onPress={copyCode} style={{ backgroundColor: colors.accent, borderRadius: radius, paddingVertical: 8, paddingHorizontal: 16, marginTop: 10, ...shadow }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="copy" color={colors.primaryText} size={16} />
                <Text style={{ color: colors.primaryText }}>Copy</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <View style={{ backgroundColor: colors.card, borderRadius: radius, padding: 16, gap: 12, ...shadow }}>
        <Text style={{ color: colors.primaryText, fontSize: 18, fontWeight: '600' }}>Pairing / Linking</Text>
        
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
        <View style={{ backgroundColor: '#1F2234', borderRadius: radius, padding: 12 }}>
          <Text style={{ color: colors.secondaryText, marginBottom: 8 }}>Active Shares</Text>
          {targets.filter((t) => t.data?.sharingEnabled && t.data?.location).length === 0 ? (
            <Text style={{ color: colors.secondaryText }}>No one is sharing right now.</Text>
          ) : (
            targets
              .filter((t) => t.data?.sharingEnabled && t.data?.location)
              .map((t) => (
                <Text key={t.uid} style={{ color: colors.primaryText }}>
                  {(t.data?.name || t.uid)} — {new Date(t.data.location.lastUpdated).toLocaleTimeString()}
                </Text>
              ))
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
