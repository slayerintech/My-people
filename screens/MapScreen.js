import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
 
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { colors, radius, shadow } from '../theme'; // Assuming radius and shadow are available from your theme
import { useApp } from '../context/AppContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

// Dynamically import MapView components
const MapViewComp = Platform.OS === 'web' ? null : require('react-native-maps').default;
const UserMarker = Platform.OS === 'web' ? null : require('../components/UserMarker').default;
const AnimatedMapView = Platform.OS === 'web' ? null : require('react-native-maps').Animated;
const { width, height } = Dimensions.get('window');

// Order fix: define inputBackground first
const inputBackground = '#333852';
// --- Custom Dark Map Style (Professional/Minimal Look) ---
const DARK_MAP_STYLE = [
  {"elementType": "geometry", "stylers": [{"color": colors.card}]},
  {"elementType": "labels.icon", "stylers": [{"visibility": "off"}]},
  {"elementType": "labels.text.fill", "stylers": [{"color": colors.secondaryText}]},
  {"elementType": "labels.text.stroke", "stylers": [{"color": colors.card}]},
  {"featureType": "administrative", "elementType": "geometry", "stylers": [{"color": colors.card}]},
  {"featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{"color": "#B4C4D4"}]},
  {"featureType": "road", "elementType": "geometry", "stylers": [{"color": inputBackground}]},
  {"featureType": "road", "elementType": "geometry.stroke", "stylers": [{"color": colors.card}]},
  {"featureType": "road", "elementType": "labels.text.fill", "stylers": [{"color": colors.secondaryText}]},
  {"featureType": "road.highway", "elementType": "geometry", "stylers": [{"color": colors.accent + '33'}]},
  {"featureType": "poi", "elementType": "labels.text.fill", "stylers": [{"color": colors.secondaryText + 'AA'}]},
  {"featureType": "transit", "stylers": [{"visibility": "off"}]},
  {"featureType": "water", "elementType": "geometry", "stylers": [{"color": "#1A2E3D"}]},
  {"featureType": "water", "elementType": "labels.text.fill", "stylers": [{"color": "#5A7080"}]}
];

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomLeftRadius: radius,
    borderBottomRightRadius: radius,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    ...shadow,
    shadowOpacity: 0.2,
    elevation: 5,
  },
  headerText: {
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
    flexShrink: 1,
  },
  subText: {
    color: colors.secondaryText,
    fontSize: 12,
  },
  map: {
    flex: 1,
    width: width,
    height: height,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    padding: 20,
    borderTopLeftRadius: radius,
    borderTopRightRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
    shadowOpacity: 0.4,
    elevation: 10,
  },
  statusMessage: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
  },
  lastUpdated: {
    color: colors.secondaryText,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  }
});

export default function MapScreen({ route, navigation }) {
  const { uid } = route.params;
  const [target, setTarget] = useState(null);
  const { mapMode } = useApp();
  const mapRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'users', uid),
      (snap) => setTarget(snap.data() || null),
      () => {
        // Ignore offline snapshot errors; screen will show status panels
      }
    );
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    // 2. Animate map to new location when target data updates
    if (target?.location && mapRef.current) {
      const newRegion = {
        latitude: target.location.lat,
        longitude: target.location.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      
      // Use animateToRegion for smooth movement (like Rapido/Uber)
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  }, [target?.location]);

  const allowed = target?.visibleTo?.includes(auth.currentUser?.uid);
  const targetName = target?.displayName || target?.name || 'Linked User';
  
  // Force hybrid map regardless of mode
  const mapStyleProp = undefined;
  const mapType = 'hybrid';
  const showsTraffic = true;

  // Initial region (used only once on mount)
  const initialRegion = target?.location
    ? {
        latitude: target.location.lat,
        longitude: target.location.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : {
        latitude: 37.78825, // Default SF location
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

  // --- Web Fallback (Unchanged functionality) ---
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{ backgroundColor: colors.card, padding: 16, borderRadius: radius }}>
          <Text style={{ color: colors.primaryText }}>Map is not supported on web with your current setup. Please use a mobile device.</Text>
        </View>
      </View>
    );
  }

  // --- Main Mobile Rendering ---
  if (!MapViewComp || !AnimatedMapView) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.secondaryText, marginTop: 10 }}>Loading map components...</Text>
      </SafeAreaView>
    );
  }

  const isLocationAvailable = target?.sharingEnabled && target?.location && allowed;
  
  return (
    <View style={styles.container}>
      {/* Map View */}
      <AnimatedMapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        mapType={mapType}
        showsTraffic={showsTraffic}
        customMapStyle={mapStyleProp}
        key={'hybrid'}
      >
        {/* User Marker */}
        {isLocationAvailable && UserMarker && (
          <UserMarker 
            coordinate={{ 
              latitude: target.location.lat, 
              longitude: target.location.lng 
            }} 
            // Marker title can be used for pop-up bubble
            title={targetName} 
            description={`Last seen: ${new Date(target.location.lastUpdated).toLocaleTimeString()}`}
          />
        )}
      </AnimatedMapView>

      {/* --- Top Header (Professional Title Bar) --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerText} numberOfLines={1}>
            Tracking: {targetName}
          </Text>
        </View>
        <MaterialIcons name="person-pin" size={28} color={isLocationAvailable ? colors.accent : colors.secondaryText} />
      </View>


      {/* --- Bottom Info Panel (Consolidated Status) --- */}
      <View style={styles.infoPanel}>
        {/* Status Message */}
        {!allowed ? (
          <Text style={[styles.statusMessage, { color: colors.danger }]}>
            Permission Denied: You do not have access to view this location.
          </Text>
        ) : !target?.sharingEnabled || !target?.location ? (
          <Text style={styles.statusMessage}>
            <Ionicons name="alert-circle" size={16} color={colors.secondaryText} /> This user is currently not sharing their location.
          </Text>
        ) : (
          <Text style={styles.statusMessage}>
            <Ionicons name="locate" size={16} color={colors.accent} /> Live Location Feed Active
          </Text>
        )}
        
        {/* Last Updated Time */}
        {target?.location?.lastUpdated ? (
          <Text style={styles.lastUpdated}>
            Updated: {new Date(target.location.lastUpdated).toLocaleString()}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
