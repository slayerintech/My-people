import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const MapViewComp = Platform.OS === 'web' ? null : require('react-native-maps').default;
const UserMarker = Platform.OS === 'web' ? null : require('../components/UserMarker').default;
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';

export default function MapScreen({ route }) {
  const { uid } = route.params;
  const [target, setTarget] = useState(null);
  const { mapMode } = useApp();
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
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => setTarget(snap.data() || null));
    return () => unsub();
  }, [uid]);

  const allowed = target?.visibleTo?.includes(auth.currentUser?.uid);
  const region = target?.location
    ? {
        latitude: target.location.lat,
        longitude: target.location.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02
      }
    : {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421
      };

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ backgroundColor: '#24283C', padding: 16, borderRadius: 12 }}>
          <Text style={{ color: colors.primaryText }}>Map is not supported on web with your current setup. Please use a device.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <MapViewComp
        style={{ flex: 1 }}
        initialRegion={region}
        region={region}
        mapType={mapMode === 'satellite' ? 'satellite' : mapMode === 'hybrid' ? 'hybrid' : 'standard'}
        showsTraffic={mapMode === 'traffic' || mapMode === 'hybrid'}
        customMapStyle={mapMode === 'satellite' || mapMode === 'hybrid' ? undefined : mapStyle}
      >
        {target?.sharingEnabled && target?.location && allowed && UserMarker ? (
          <UserMarker coordinate={{ latitude: target.location.lat, longitude: target.location.lng }} title={target.name || 'User'} />
        ) : null}
      </MapViewComp>

      {!target?.sharingEnabled || !target?.location || !allowed ? (
        <View style={{ position: 'absolute', bottom: 24, left: 24, right: 24, backgroundColor: '#24283Caa', padding: 12, borderRadius: 12 }}>
          <Text style={{ color: colors.primaryText }}>{!allowed ? 'You do not have permission to view this location.' : 'This user is not sharing their location right now.'}</Text>
        </View>
      ) : null}
      {target?.location?.lastUpdated ? (
        <View style={{ position: 'absolute', bottom: 90, left: 24, right: 24, backgroundColor: '#24283Caa', padding: 12, borderRadius: 12 }}>
          <Text style={{ color: colors.secondaryText }}>Last updated: {new Date(target.location.lastUpdated).toLocaleString()}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
