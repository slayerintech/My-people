import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { colors } from '../theme';

export default function MapScreen({ route }) {
  const { uid } = route.params;
  const [target, setTarget] = useState(null);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => setTarget(snap.data() || null));
    return () => unsub();
  }, [uid]);

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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MapView style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height }} initialRegion={region} region={region}>
        {target?.sharingEnabled && target?.location ? (
          <Marker coordinate={{ latitude: target.location.lat, longitude: target.location.lng }} title={target.name || 'User'} />
        ) : null}
      </MapView>
      {!target?.sharingEnabled || !target?.location ? (
        <View style={{ position: 'absolute', bottom: 24, left: 24, right: 24, backgroundColor: '#24283Caa', padding: 12, borderRadius: 12 }}>
          <Text style={{ color: colors.primaryText }}>This user is not sharing their location right now.</Text>
        </View>
      ) : null}
      {target?.location?.lastUpdated ? (
        <View style={{ position: 'absolute', bottom: 90, left: 24, right: 24, backgroundColor: '#24283Caa', padding: 12, borderRadius: 12 }}>
          <Text style={{ color: colors.secondaryText }}>Last updated: {new Date(target.location.lastUpdated).toLocaleString()}</Text>
        </View>
      ) : null}
    </View>
  );
}
