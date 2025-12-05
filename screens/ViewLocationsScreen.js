import React, { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView from 'react-native-maps';
import UserMarker from '../components/UserMarker';
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
    { elementType: 'geometry', stylers: [{ color: '#1A1D2E' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1A1D2E' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8E99B0' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2A2F45' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8E99B0' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#24283C' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1F2234' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#151828' }] },
  ];
  const lightStyle = [
    { elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#333333' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#E0E0E0' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#666666' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#F5F5F5' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#E8F5E9' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CFE8FF' }] },
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
      <MapView
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
      </MapView>
      <View style={{ position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 8 }}>
        <View style={{ backgroundColor: '#1F2234', borderRadius: 16, overflow: 'hidden', flexDirection: 'row' }}>
          <Text onPress={() => setMode('traffic')} style={{ color: mode === 'traffic' ? colors.primaryText : colors.secondaryText, paddingHorizontal: 12, paddingVertical: 8 }}>Traffic</Text>
          <Text onPress={() => setMode('satellite')} style={{ color: mode === 'satellite' ? colors.primaryText : colors.secondaryText, paddingHorizontal: 12, paddingVertical: 8 }}>Satellite</Text>
          <Text onPress={() => setMode('hybrid')} style={{ color: mode === 'hybrid' ? colors.primaryText : colors.secondaryText, paddingHorizontal: 12, paddingVertical: 8 }}>Hybrid</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
