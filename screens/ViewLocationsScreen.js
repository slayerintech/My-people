import React, { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { colors, radius, shadow } from '../theme';
import { useApp } from '../context/AppContext';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

export default function ViewLocationsScreen() {
  const { user } = useApp();
  const [myLoc, setMyLoc] = useState(null);
  const [targets, setTargets] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Allow location to view your position on the map.');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setMyLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (!auth.currentUser) return;
        // Load followed list and subscribe to each user doc for live updates
        const meSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const list = meSnap.data()?.followedUsers || [];
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
      } catch (e) {
        Alert.alert('Error', e.message);
      }
    };
    load();
  }, []);

  const region = myLoc
    ? { latitude: myLoc.lat, longitude: myLoc.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: 37.78825, longitude: -122.4324, latitudeDelta: 0.0922, longitudeDelta: 0.0421 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <MapView style={{ flex: 1 }} initialRegion={region} region={region}>
        {myLoc ? (
          <Marker coordinate={{ latitude: myLoc.lat, longitude: myLoc.lng }} title={user?.displayName || 'Me'} />
        ) : null}
        {targets.map((t) => {
          const d = t.data;
          const allowed = Array.isArray(d?.visibleTo) ? d.visibleTo.includes(auth.currentUser.uid) : false;
          if (d?.sharingEnabled && d?.location && allowed) {
            return (
              <Marker
                key={t.uid}
                coordinate={{ latitude: d.location.lat, longitude: d.location.lng }}
                title={d.name || t.uid}
              />
            );
          }
          return null;
        })}
      </MapView>
    </SafeAreaView>
  );
}
