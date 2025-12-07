import React, { useEffect, useState } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const MapViewComp = Platform.OS === 'web' ? null : require('react-native-maps').default;
const UserMarker = Platform.OS === 'web' ? null : require('../components/UserMarker').default;
import * as Location from 'expo-location';
import { colors, radius, shadow } from '../theme';
import { useApp } from '../context/AppContext';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

export default function ViewLocationsScreen() {
  const { user } = useApp();
  const [myLoc, setMyLoc] = useState(null);
  const [targets, setTargets] = useState([]);
  const [mode, setMode] = useState('traffic');
  const mapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#3B3B3B' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#F0F1F4' }] },
    { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#F7F8FA' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ECEDEF' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#E6E7EA' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#FAFAFA' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#EAF7EE' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#F5F6F8' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#D8ECFF' }] },
  ];

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
      {Platform.OS === 'web' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: '#24283C', padding: 16, borderRadius: 12 }}>
            <Text style={{ color: colors.primaryText }}>Map is not supported on web with your current setup. Please use a device.</Text>
          </View>
        </View>
      ) : (
      <MapViewComp
        provider={'google'}
        style={{ flex: 1 }}
        initialRegion={region}
        region={region}
        mapType={mode === 'satellite' ? 'satellite' : mode === 'hybrid' ? 'hybrid' : 'standard'}
        showsTraffic={mode === 'traffic' || mode === 'hybrid'}
        customMapStyle={mode === 'satellite' || mode === 'hybrid' ? undefined : mapStyle}
      >
        {myLoc ? (
          <UserMarker coordinate={{ latitude: myLoc.lat, longitude: myLoc.lng }} title={user?.displayName || 'Me'} />
        ) : null}
        {targets.map((t) => {
          const d = t.data;
          const allowed = Array.isArray(d?.visibleTo) ? d.visibleTo.includes(auth.currentUser.uid) : false;
          if (d?.sharingEnabled && d?.location && allowed) {
            return (
              <UserMarker
                key={t.uid}
                coordinate={{ latitude: d.location.lat, longitude: d.location.lng }}
                title={d.name || t.uid}
              />
            );
          }
          return null;
        })}
      </MapViewComp>
      )}
      <View style={{ position: 'absolute', left: 16, top: 0, bottom: 0, justifyContent: 'center' }}>
        <View style={{ backgroundColor: '#1F2234', borderRadius: 16, overflow: 'hidden', flexDirection: 'column' }}>
          <Text onPress={() => setMode('traffic')} style={{ color: mode === 'traffic' ? colors.primaryText : colors.secondaryText, paddingHorizontal: 12, paddingVertical: 10 }}>Traffic</Text>
          <Text onPress={() => setMode('satellite')} style={{ color: mode === 'satellite' ? colors.primaryText : colors.secondaryText, paddingHorizontal: 12, paddingVertical: 10 }}>Satellite</Text>
          <Text onPress={() => setMode('hybrid')} style={{ color: mode === 'hybrid' ? colors.primaryText : colors.secondaryText, paddingHorizontal: 12, paddingVertical: 10 }}>Hybrid</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
