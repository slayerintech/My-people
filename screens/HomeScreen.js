import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Switch, ScrollView, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Popup from '../components/Popup';
import { auth, db } from '../firebaseConfig';
import { arrayUnion, doc, getDoc, getDocFromCache, updateDoc, onSnapshot } from 'firebase/firestore';
import { useApp } from '../context/AppContext';

// --- Theme Imports ---
const colors = {
  background: '#1A1D2E',
  card: '#24283C',
  primaryText: '#FFFFFF',
  secondaryText: '#8E99B0',
  accent: '#e26104ff',
  gradientStart: '#FF6A00',
  gradientEnd: '#FF6A00'
};

const shadow = {
  shadowColor: colors.accent,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.35,
  shadowRadius: 20,
  elevation: 12
};

const radius = 20;
const inputBackground = '#333852';

// --- Stylesheet using the provided Theme ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    padding: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 20,
    marginBottom: 20,
    ...shadow,
  },
  sectionTitle: {
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondaryText + '33',
    paddingBottom: 8,
  },
  sharingToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  statusText: {
    color: colors.secondaryText,
    fontSize: 14,
  },
  uidDisplay: {
    backgroundColor: inputBackground,
    borderRadius: radius * 0.5,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.accent + '33',
  },
  uidTextLabel: {
    color: colors.secondaryText, 
    fontSize: 13, 
    marginBottom: 5
  },
  uidText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10, // Increased spacing
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  copyButton: {
    backgroundColor: colors.accent,
    borderRadius: radius * 0.3,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowColor: colors.accent,
    elevation: 5,
  },
  copyButtonText: {
    color: colors.primaryText,
    fontWeight: '600',
  },
  textInput: {
    color: colors.primaryText,
    backgroundColor: inputBackground,
    borderRadius: radius * 0.5,
    padding: 14,
    marginBottom: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: inputBackground,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: radius * 0.5,
    padding: 14,
    alignItems: 'center',
    marginTop: 5,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowColor: colors.accent,
    elevation: 5,
  },
  addButtonText: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 16,
  },
  followedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondaryText + '1A',
  },
  followedUserInfo: {
    marginLeft: 10,
    flex: 1,
  },
  followedUserName: {
    color: colors.primaryText,
    fontWeight: '600',
    fontSize: 15,
  },
  followedUserTime: {
    color: colors.secondaryText,
    fontSize: 13,
  }
});

// -----------------------------------------------------------------------------------

export default function HomeScreen({ navigation }) {
  const { user, updateLocation, setSharingEnabled } = useApp();
  const [sharing, setSharing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLinking, setIsLinking] = useState(false); // New loading state for linking
  const watcherRef = useRef(null);
  const [code, setCode] = useState('');
  const [followed, setFollowed] = useState([]);
  const [targets, setTargets] = useState([]);
  const [planTitle, setPlanTitle] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [popup, setPopup] = useState({ visible: false, title: '', message: '', confirmText: 'OK', cancelText: 'Cancel', onConfirm: null });
  const TASK_NAME = 'BACKGROUND_LOCATION_TASK';

  // --- Functionality (Unchanged logic) ---
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
          } catch { /* Ignore cache error */ }
        }
        
        data = data || {};
        const followedList = data.followedUsers || [];
        setFollowed(followedList);
        setPlanTitle(data.planTitle || null);
        setCreatedAt(data.createdAt || null);
        
        const unsubs = [];
        
        followedList.forEach((uid) => {
          const unsub = onSnapshot(
            doc(db, 'users', uid),
            (snap) => {
              const d = snap.data();
              setTargets((prev) => {
                const next = prev.filter((p) => p.uid !== uid);
                if (d) next.push({ uid, data: d });
                return next;
              });
            },
            () => {
              // Ignore offline errors quietly; UI will reflect last cached state
            }
          );
          unsubs.push(unsub);
        });
        return () => unsubs.forEach((u) => u());
      } catch { /* Ignore data loading error */ }
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
      setPopup({ visible: true, title: 'Subscription Required', message: 'Please subscribe to continue using live location sharing.', confirmText: 'Subscribe', cancelText: 'Cancel', onConfirm: () => { setPopup({ ...popup, visible: false }); navigation.navigate('Subscription'); } });
      return;
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPopup({ visible: true, title: 'Permission Needed', message: 'Location permission is required to share your live location.', confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
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
      setPopup({ visible: true, title: 'Error Starting Sharing', message: String(e.message || e), confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
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
      } catch { /* Ignore stop error */ }
      
      setSharingEnabled(false);
      setSharing(false);
      setLastUpdated(null);
    } catch (e) {
      setPopup({ visible: true, title: 'Error Stopping Sharing', message: String(e.message || e), confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
    }
  };

  const copyCode = async () => {
    try {
      if (!user?.uid) return;
      await Clipboard.setStringAsync(user.uid);
      setPopup({ visible: true, title: 'Copied', message: 'Your unique sharing code has been copied.', confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
    } catch {}
  };

  const onAddFollow = async () => {
    if (isLinking) return; // Prevent double tap

    try {
      setIsLinking(true);
      const signupTime = createdAt || (auth.currentUser?.metadata?.creationTime ? Date.parse(auth.currentUser.metadata.creationTime) : null);
      const withinTrial = signupTime ? (Date.now() - signupTime) < (3 * 24 * 60 * 60 * 1000) : false;
      if (!planTitle && !withinTrial) {
        setPopup({ visible: true, title: 'Subscription Required', message: 'Please subscribe to link and follow users.', confirmText: 'Subscribe', cancelText: 'Cancel', onConfirm: () => { setPopup({ ...popup, visible: false }); navigation.navigate('Subscription'); } });
        return;
      }

      if (!code.trim()) {
        setPopup({ visible: true, title: 'Missing Code', message: 'Please enter a user ID to follow.', confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
        return;
      }
      const targetUid = code.trim();
      
      if (targetUid === auth.currentUser.uid) {
        setPopup({ visible: true, title: 'Error', message: 'You cannot follow yourself.', confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
        return;
      }
      if (followed.includes(targetUid)) {
        setPopup({ visible: true, title: 'Already Following', message: 'You are already following this user.', confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
        setCode('');
        return;
      }

      const targetRef = doc(db, 'users', targetUid);
      const targetSnap = await getDoc(targetRef);
      
      if (!targetSnap.exists()) {
         setPopup({ visible: true, title: 'Error', message: 'User ID not found. Check the code and try again.', confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
         setCode('');
         return;
      }

      // 1. Update current user's followed list
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { followedUsers: arrayUnion(targetUid) });
      
      // 2. Update target user's visibility list
      const t = targetSnap.data();
      if (t.allowFollow !== false) {
        await updateDoc(targetRef, { visibleTo: arrayUnion(auth.currentUser.uid) });
      }

      setCode('');
      setPopup({ visible: true, title: 'Success', message: 'User linked successfully. You will see their location when they share.', confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
      
      // Re-fetch followed list to update UI
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      setFollowed(snap.data()?.followedUsers || []);
      
    } catch (e) {
      setPopup({ visible: true, title: 'Error', message: String(e.message || e), confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
    } finally {
      setIsLinking(false);
    }
  };

  const activeTargets = targets
    .filter((t) => t.data?.sharingEnabled && t.data?.location)
    .sort((a, b) => (b.data?.location?.lastUpdated || 0) - (a.data?.location?.lastUpdated || 0));

  const inactiveFollowedCount = followed.length - activeTargets.length;
  const isFollowingAnyone = followed.length > 0;
  
  const renderActiveTarget = ({ item }) => (
    <View style={styles.followedUserItem}>
      <Ionicons name="map" size={24} color={colors.accent} />
      <View style={styles.followedUserInfo}>
        <Text style={styles.followedUserName}>
          {item.data?.displayName || `User ID: ${item.uid.substring(0, 8)}...`}
        </Text>
        <Text style={styles.followedUserTime}>
          Last Seen: {new Date(item.data.location.lastUpdated).toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );

  // --- UI Rendering ---
  return (
    <>
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollView}>

        {/* 1. Location Sharing Control Card */}
        <View style={styles.card}>
          <Text style={{ color: colors.primaryText, fontSize: 22, fontWeight: '800', marginBottom: 15 }}>
            Hi, {user?.displayName || 'Traveler'}! 🗺️
          </Text>
          
          <View style={styles.sharingToggleContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons 
                    name={sharing ? "radio-button-on" : "radio-button-off"} 
                    size={24} 
                    color={sharing ? colors.accent : colors.secondaryText} 
                />
                <View>
                    <Text style={{ color: colors.primaryText, fontSize: 16, fontWeight: '600' }}>
                        Live Location Broadcast
                    </Text>
                    <Text style={styles.statusText}>
                        Status: <Text style={{ color: sharing ? colors.accent : colors.secondaryText, fontWeight: '700' }}>
                            {sharing ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                        {lastUpdated ? ` · ${lastUpdated.toLocaleTimeString()}` : ''}
                    </Text>
                </View>
            </View>
            <Switch 
              value={sharing} 
              onValueChange={(v) => (v ? startSharing() : stopSharing())} 
              trackColor={{ false: colors.secondaryText + '33', true: colors.accent }} 
              thumbColor={colors.primaryText} 
            />
          </View>
          
          {sharing ? (
            <View style={styles.uidDisplay}>
                <Text style={styles.uidTextLabel}>Your Unique Share Code:</Text>
                {/* Made UID selectable but kept it visually distinct */}
                <Text style={styles.uidText} selectable={true}>
                    {user?.uid}
                </Text>
                <TouchableOpacity onPress={copyCode} style={styles.copyButton}>
                    <Ionicons name="copy" color={colors.primaryText} size={16} />
                    <Text style={styles.copyButtonText}>
                        Copy Code
                    </Text>
                </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.statusText, { marginTop: 10, paddingLeft: 34 }]}>
                Toggle the switch to begin broadcasting your live location to your linked users.
            </Text>
          )}
        </View>

        {/* 2. Pairing / Linking Card */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>
                <Ionicons name="person-add" size={20} color={colors.primaryText} /> Link New User
            </Text>
            
            <Text style={{ color: colors.secondaryText, marginBottom: 10 }}>
                Paste the other user's share code (UID) here to start following them:
            </Text>
            
            <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="Enter 28-character UID to follow"
                placeholderTextColor={colors.secondaryText + '99'}
                style={styles.textInput}
                autoCapitalize="none"
                keyboardAppearance="dark"
                editable={!isLinking} // Disable input while linking
            />
            
            <TouchableOpacity 
              onPress={onAddFollow} 
              style={[styles.addButton, { opacity: isLinking ? 0.7 : 1 }]}
              disabled={isLinking}
            >
                {isLinking ? (
                    <ActivityIndicator color={colors.primaryText} size="small" />
                ) : (
                    <Text style={styles.addButtonText}>Link & Follow</Text>
                )}
            </TouchableOpacity>
        </View>
        
        {/* 3. Followed Users Status Card */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>
                <MaterialIcons name="groups" size={22} color={colors.primaryText} /> Live Followed Users
            </Text>
            
            {activeTargets.length > 0 && (
                <FlatList
                    data={activeTargets}
                    renderItem={renderActiveTarget}
                    keyExtractor={(item) => item.uid}
                    scrollEnabled={false}
                    contentContainerStyle={{ marginBottom: 10 }}
                />
            )}
            
            {isFollowingAnyone && inactiveFollowedCount > 0 && (
                <View style={{ padding: 10, backgroundColor: inputBackground, borderRadius: radius * 0.5, marginBottom: 10 }}>
                    <Text style={styles.statusText}>
                        ⚠️ {inactiveFollowedCount} linked user(s) are not currently broadcasting their location.
                    </Text>
                </View>
            )}

            {activeTargets.length === 0 && !isFollowingAnyone && (
                <View style={{ padding: 10, backgroundColor: inputBackground, borderRadius: radius * 0.5 }}>
                    <Text style={styles.statusText}>
                        No users are linked yet. Use the "Link New User" section above to begin following someone.
                    </Text>
                </View>
            )}
            
            {activeTargets.length === 0 && isFollowingAnyone && inactiveFollowedCount === followed.length && (
                 <View style={{ padding: 10, backgroundColor: inputBackground, borderRadius: radius * 0.5 }}>
                    <Text style={styles.statusText}>
                        No linked users are currently sharing their live location.
                    </Text>
                </View>
            )}
        </View>

      </ScrollView>
    </SafeAreaView>
    <Popup
      visible={popup.visible}
      title={popup.title}
      message={popup.message}
      confirmText={popup.confirmText}
      cancelText={popup.cancelText}
      onConfirm={popup.onConfirm}
      onCancel={() => setPopup({ ...popup, visible: false })}
    />
    </>
  );
}
