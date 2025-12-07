import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import Popup from '../components/Popup';
 
const MapViewComp = Platform.OS === 'web' ? null : require('react-native-maps').default;
const UserMarker = Platform.OS === 'web' ? null : require('../components/UserMarker').default;
import * as Location from 'expo-location';
import { colors, radius, shadow } from '../theme';
import { useApp } from '../context/AppContext';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, getDocFromCache, onSnapshot } from 'firebase/firestore';

export default function ViewLocationsScreen() {
  const { user } = useApp();
  const [myLoc, setMyLoc] = useState(null);
  const [targets, setTargets] = useState([]);
  const [popup, setPopup] = useState({ visible: false, title: '', message: '', confirmText: 'OK', cancelText: 'Cancel', onConfirm: null });
  const mapRef = useRef(null);
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
          setPopup({ visible: true, title: 'Permission required', message: 'Allow location to view your position on the map.', confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setMyLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (!auth.currentUser) return;
        // Load followed list and subscribe to each user doc for live updates
        let list = [];
        try {
          const meSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
          list = meSnap.data()?.followedUsers || [];
        } catch {
          try {
            const csnap = await getDocFromCache(doc(db, 'users', auth.currentUser.uid));
            list = csnap.data()?.followedUsers || [];
          } catch {}
        }
        const unsubs = [];
        list.forEach((uid) => {
          const unsub = onSnapshot(
            doc(db, 'users', uid),
            (snap) => {
              const d = snap.data();
              setTargets((prev) => {
                const next = prev.filter((p) => p.uid !== uid);
                next.push({ uid, data: d });
                return next;
              });
            },
            () => {
              // Ignore offline errors silently
            }
          );
          unsubs.push(unsub);
        });
        return () => unsubs.forEach((u) => u());
      } catch (e) {
        setPopup({ visible: true, title: 'Error', message: String(e.message || e), confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
      }
    };
    load();
  }, []);

  const region = myLoc
    ? { latitude: myLoc.lat, longitude: myLoc.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: 37.78825, longitude: -122.4324, latitudeDelta: 0.0922, longitudeDelta: 0.0421 };

  useEffect(() => {
    if (Platform.OS === 'web' || !mapRef.current) return;
    const coords = [];
    if (myLoc) coords.push({ latitude: myLoc.lat, longitude: myLoc.lng });
    targets.forEach((t) => {
      const d = t.data;
      const allowed = Array.isArray(d?.visibleTo) ? d.visibleTo.includes(auth.currentUser.uid) : false;
      if (d?.sharingEnabled && d?.location && allowed) {
        coords.push({ latitude: d.location.lat, longitude: d.location.lng });
      }
    });
    if (coords.length === 0) return;
    if (coords.length === 1) {
      mapRef.current.animateToRegion({ latitude: coords[0].latitude, longitude: coords[0].longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 800);
    } else {
      mapRef.current.fitToCoordinates(coords, { edgePadding: { top: 80, right: 80, bottom: 80, left: 80 }, animated: true });
    }
  }, [targets, myLoc]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {Platform.OS === 'web' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: '#24283C', padding: 16, borderRadius: 12 }}>
            <Text style={{ color: colors.primaryText }}>Map is not supported on web with your current setup. Please use a device.</Text>
          </View>
        </View>
      ) : (
      <MapViewComp
        ref={mapRef}
        provider={'google'}
        style={{ flex: 1 }}
        initialRegion={region}
        mapType={'hybrid'}
        showsTraffic={true}
        customMapStyle={undefined}
      >
        {myLoc ? (
          <UserMarker coordinate={{ latitude: myLoc.lat, longitude: myLoc.lng }} title={user?.displayName || 'Me'} active={true} avatarUrl={user?.photoURL || user?.avatarUrl} />
        ) : null}
        {targets.map((t) => {
          const d = t.data;
          const allowed = Array.isArray(d?.visibleTo) ? d.visibleTo.includes(auth.currentUser.uid) : false;
          if (d?.location) {
            return (
              <UserMarker
                key={t.uid}
                coordinate={{ latitude: d.location.lat, longitude: d.location.lng }}
                title={d.displayName || d.name || t.uid}
                active={Boolean(d.sharingEnabled && allowed)}
                avatarUrl={d?.photoURL || d?.avatarUrl}
              />
            );
          }
          return null;
        })}
      </MapViewComp>
      )}
      <Popup visible={popup.visible} title={popup.title} message={popup.message} confirmText={popup.confirmText} cancelText={popup.cancelText} onConfirm={popup.onConfirm} onCancel={() => setPopup({ ...popup, visible: false })} />
    </View>
  );
}
