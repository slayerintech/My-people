import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView from 'react-native-maps';
import UserMarker from '../components/UserMarker';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';

export default function MapScreen({ route }) {
  const { uid } = route.params;
  const [target, setTarget] = useState(null);
  const { mapMode } = useApp();
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <MapView
        provider={'google'}
        style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height }}
        initialRegion={region}
        region={region}
        mapType={mapMode === 'satellite' ? 'satellite' : mapMode === 'hybrid' ? 'hybrid' : 'standard'}
        showsTraffic={mapMode === 'traffic' || mapMode === 'hybrid'}
        customMapStyle={mapMode === 'satellite' || mapMode === 'hybrid' ? undefined : mapStyle}
      >
        {target?.sharingEnabled && target?.location && allowed ? (
          <UserMarker coordinate={{ latitude: target.location.lat, longitude: target.location.lng }} title={target.name || 'User'} />
        ) : null}
      </MapView>
      
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
