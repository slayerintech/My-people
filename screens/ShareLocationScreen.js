import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useApp } from '../context/AppContext';
import { colors, radius, shadow } from '../theme';
import * as TaskManager from 'expo-task-manager';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

export default function ShareLocationScreen() {
  const { user, updateLocation, setSharingEnabled } = useApp();
  const [sharing, setSharing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const watcherRef = useRef(null);
  const TASK_NAME = 'BACKGROUND_LOCATION_TASK';

  useEffect(() => {
    setSharing(Boolean(user?.sharingEnabled));
    if (user?.location?.lastUpdated) setLastUpdated(new Date(user.location.lastUpdated));
    return () => {
      if (watcherRef.current) {
        watcherRef.current.remove();
      }
    };
  }, []);

  const startSharing = async () => {
    try {
      // Request location permission (foreground)
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is needed to share your live location.');
        if (!canAskAgain) {
          Alert.alert('Permission denied', 'Open system settings to grant location access.');
        }
        return;
      }

      // Try background permission for continuous updates
      const bg = await Location.requestBackgroundPermissionsAsync();
      if (bg.status !== 'granted') {
        // Still proceed with foreground sharing; background may be unavailable
      }

      // Start watching position with high accuracy and regular updates
      watcherRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10
        },
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          updateLocation(latitude, longitude);
          setLastUpdated(new Date());
          setSharing(true);
        }
      );

      // Start background updates if permission granted
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 24, gap: 16 }}>
      <View style={{ backgroundColor: colors.card, borderRadius: radius, padding: 16, gap: 12, ...shadow }}>
        <Text style={{ color: colors.primaryText, fontSize: 18, fontWeight: '600' }}>Share My Location</Text>
        <Text style={{ color: colors.secondaryText }}>
          Status: {sharing ? 'Sharing' : 'Not sharing'}{lastUpdated ? ` · Last updated: ${lastUpdated.toLocaleTimeString()}` : ''}
        </Text>
        {sharing ? (
          <TouchableOpacity onPress={stopSharing} style={{ backgroundColor: '#1F2234', borderRadius: radius, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: colors.primaryText, fontWeight: '600' }}>Stop Sharing My Location</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={startSharing} style={{ backgroundColor: colors.accent, borderRadius: radius, padding: 14, alignItems: 'center', ...shadow }}>
            <Text style={{ color: colors.primaryText, fontWeight: '600' }}>Start Sharing My Location</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{ backgroundColor: colors.card, borderRadius: radius, padding: 16 }}>
        <Text style={{ color: colors.secondaryText }}>
          Location is only shared when you turn it ON. You can stop anytime.
        </Text>
      </View>
    </SafeAreaView>
  );
}

TaskManager.defineTask('BACKGROUND_LOCATION_TASK', async ({ data, error }) => {
  if (error) return;
  const { locations } = data || {};
  const loc = locations?.[0];
  if (!loc || !auth.currentUser) return;
  try {
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      sharingEnabled: true,
      location: { lat: loc.coords.latitude, lng: loc.coords.longitude, lastUpdated: Date.now() }
    });
  } catch {}
});
