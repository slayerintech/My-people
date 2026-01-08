import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Switch, ScrollView, StyleSheet, FlatList, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Popup from '../components/Popup';
import { auth, db } from '../firebaseConfig';
import { arrayUnion, arrayRemove, doc, getDoc, getDocFromCache, updateDoc, setDoc, onSnapshot, enableNetwork, collection, deleteDoc } from 'firebase/firestore';
import { useApp } from '../context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';

// --- Theme Imports ---
const colors = {
    background: '#060818ff',
    card: '#1a1c2aff',
    primaryText: '#FFFFFF',
    secondaryText: '#8E99B0',
    accent: '#e26104ff',
    // Gradient colors for the header
    gradientStart: '#000000ff',
    gradientEnd: '#ff6a00ae',
};

const shadow = {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
};

const radius = 20;
const inputBackground = '#333852';
const SPACING = 24;
const { height } = Dimensions.get('window');

// --- Stylesheet using the provided Theme ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerGradient: {
        height: height * 0.35,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: radius * 2,
        borderBottomRightRadius: radius * 2,
        paddingBottom: SPACING * 2, // Space for content inside gradient
    },
    contentWrapper: {
        flex: 1,
        marginTop: -radius * 3, // Overlap the gradient
    },
    scrollContent: {
        paddingBottom: SPACING * 4,
    },
    greetingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    headerGreeting: {
        color: colors.primaryText,
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 5,
        textAlign: 'center',
    },
    headerSubtext: {
        color: colors.primaryText + 'CC',
        fontSize: 14,
        textAlign: 'center',
    },
    notificationButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    
    // --- KEY CHANGE: Toggle Container as Overlapping Card ---
    headerSharingToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card,
        borderRadius: radius,
        padding: 20,
        marginHorizontal: SPACING,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.primaryText + '11',
        ...shadow,
    },
    toggleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    toggleStatusLabel: {
        color: colors.primaryText,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    toggleStatusText: {
        color: colors.secondaryText,
        fontSize: 13,
    },
    toggleStatusValue: {
        color: colors.accent,
        fontWeight: '700',
    },

    // --- UID Display ---
    uidDisplay: {
        backgroundColor: colors.card,
        borderRadius: radius,
        padding: 20,
        marginHorizontal: SPACING,
        marginBottom: 20,
        alignItems: 'center',
        ...shadow,
    },
    uidTextLabel: {
        color: colors.secondaryText,
        fontSize: 13,
        marginBottom: 8
    },
    uidText: {
        color: colors.primaryText,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 15,
        textAlign: 'center',
        letterSpacing: 1,
    },
    copyButton: {
        backgroundColor: colors.accent + '20', // Low opacity accent bg
        borderRadius: radius * 0.5,
        paddingVertical: 10,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    copyButtonText: {
        color: colors.accent,
        fontWeight: '700',
        fontSize: 14,
    },
    
    // --- Card & Section Styles ---
    card: {
        backgroundColor: colors.card,
        borderRadius: radius,
        padding: 20,
        marginBottom: 20,
        marginHorizontal: SPACING,
        ...shadow,
    },
    sectionTitle: {
        color: colors.primaryText,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 15,
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

// --- Home Header Removed (Logic Inlined) ---

// -----------------------------------------------------------------------------------

export default function HomeScreen({ navigation }) {
    const { user, updateLocation, setSharingEnabled, preFollowed, preTargets, profilesById } = useApp();
    const [sharing, setSharing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isLinking, setIsLinking] = useState(false);
    const watcherRef = useRef(null);
    const linkingTimerRef = useRef(null);
    const [code, setCode] = useState('');
    const [followed, setFollowed] = useState([]);
    const [targets, setTargets] = useState([]);
    const [planTitle, setPlanTitle] = useState(null);
    const [createdAt, setCreatedAt] = useState(null);
    const [popup, setPopup] = useState({ visible: false, title: '', message: '', confirmText: 'OK', cancelText: 'Cancel', onConfirm: null });
    const [requests, setRequests] = useState([]);
    const [requestsVisible, setRequestsVisible] = useState(false);
    const TASK_NAME = 'BACKGROUND_LOCATION_TASK';

    // --- Functionality (Unchanged logic) ---
    useEffect(() => {
        if (Array.isArray(preFollowed) && preFollowed.length > 0) {
            setFollowed(preFollowed);
        }
        if (Array.isArray(preTargets) && preTargets.length > 0) {
            setTargets(preTargets);
        }
    }, [preFollowed, preTargets]);
    useEffect(() => {
        setSharing(Boolean(user?.sharingEnabled));
        if (user?.location?.lastUpdated) setLastUpdated(new Date(user.location.lastUpdated));

        const loadFollowed = async () => {
            // ... (Your existing loadFollowed logic)
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
                for (const uid of followedList) {
                    let usnap = null;
                    try {
                        const csnap = await getDocFromCache(doc(db, 'users', uid));
                        if (csnap?.exists()) usnap = csnap;
                    } catch {}
                    if (!usnap) {
                        try {
                            const timeout = new Promise((resolve) => setTimeout(() => resolve('timeout'), 4000));
                            const result = await Promise.race([getDoc(doc(db, 'users', uid)), timeout]);
                            if (result !== 'timeout') usnap = result;
                        } catch {}
                    }
                    if (usnap?.exists()) {
                        const d = usnap.data();
                        setTargets((prev) => {
                            const next = prev.filter((p) => p.uid !== uid);
                            next.push({ uid, data: d });
                            return next;
                        });
                    }
                }
                
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
    }, [user?.uid]);

    useEffect(() => {
        if (!auth.currentUser) return;
        const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), async (snap) => {
            const data = snap.data() || {};
            const remote = Array.isArray(data.followedUsers) ? data.followedUsers : [];
            let local = [];
            try {
                const s = await AsyncStorage.getItem(`followed:${auth.currentUser.uid}`);
                local = s ? JSON.parse(s) : [];
            } catch {}
            const set = new Set([...(remote || []), ...(local || [])]);
            setFollowed(Array.from(set));
        }, () => {});
        return () => unsub();
    }, [auth.currentUser?.uid]);

    useEffect(() => {
        if (!auth.currentUser) return;
        const ref = collection(db, 'users', auth.currentUser.uid, 'requests');
        const unsub = onSnapshot(ref, async (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setRequests(list.filter((r) => r.status !== 'accepted'));
            try {
                for (const d of snap.docs) {
                    const data = d.data() || {};
                    if (data.status === 'accepted') {
                        try {
                            await setDoc(doc(db, 'users', auth.currentUser.uid), { followedUsers: arrayUnion(d.id), visibleTo: arrayUnion(d.id) }, { merge: true });
                        } catch {}
                        // Keep the request doc to permit read of target until mutual linking fully completes
                    }
                }
            } catch {}
        }, () => {});
        return () => unsub();
    }, [auth.currentUser?.uid]);

    const startSharing = async () => {
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

    const verifyLink = async (uid) => {
        try {
            if (!auth.currentUser || !uid) return;
            const meRef = doc(db, 'users', auth.currentUser.uid);
            const timeout = new Promise((resolve) => setTimeout(() => resolve('timeout'), 5000));
            const res = await Promise.race([getDoc(meRef), timeout]);
            if (res === 'timeout' || !res?.exists()) return;
            const list = res.data()?.followedUsers || [];
            if (!list.includes(uid)) {
                setPopup({ visible: true, title: 'Link Not Saved', message: 'Connection did not save to your account. Please try again with internet.', confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
                return;
            }
            const tsnap = await getDoc(doc(db, 'users', uid));
            if (tsnap?.exists()) {
                const d = tsnap.data();
                setTargets((prev) => {
                    const next = prev.filter((p) => p.uid !== uid);
                    next.push({ uid, data: d });
                    return next;
                });
            }
        } catch {}
    };

    const requestDisconnect = (uid) => {
        setPopup({
            visible: true,
            title: 'Disconnect User',
            message: 'Are you sure you want to disconnect this user?',
            confirmText: 'Disconnect',
            cancelText: 'Cancel',
            onConfirm: () => { setPopup({ ...popup, visible: false }); performDisconnect(uid); }
        });
    };

    const performDisconnect = async (uid) => {
        try {
            if (!auth.currentUser || !uid) return;
            try {
                await updateDoc(doc(db, 'users', auth.currentUser.uid), { followedUsers: arrayRemove(uid), visibleTo: arrayRemove(uid) });
            } catch (err1) {
                const m1 = String(err1?.message || err1 || '').toLowerCase();
                if (!(m1.includes('insufficient') || m1.includes('permission') || m1.includes('offline'))) {
                    throw err1;
                }
            }
            const nextList = followed.filter((f) => f !== uid);
            setFollowed(nextList);
            try { await AsyncStorage.setItem(`followed:${auth.currentUser.uid}`, JSON.stringify(nextList)); } catch {}
            setTargets((prev) => prev.filter((t) => t.uid !== uid));
            try {
                await updateDoc(doc(db, 'users', uid), { followedUsers: arrayRemove(auth.currentUser.uid), visibleTo: arrayRemove(auth.currentUser.uid) });
            } catch (err) {
                const msg = String(err?.message || err || '').toLowerCase();
                if (msg.includes('insufficient') || msg.includes('permission')) {
                    // Ignore permission error on target doc; self removal is already done
                } else {
                    throw err;
                }
            }
            setPopup({ visible: true, title: 'Disconnected', message: 'User disconnected. If they still see you, they can remove you from their side.', confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
        } catch (e) {
            setPopup({ visible: true, title: 'Error', message: String(e.message || e), confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
        }
    };

    const onAddFollow = async () => {
        if (isLinking) return;

        try {
            setIsLinking(true);
            try { if (linkingTimerRef.current) clearTimeout(linkingTimerRef.current); } catch {}
            linkingTimerRef.current = setTimeout(() => setIsLinking(false), 8000);
            
            if (!code.trim()) {
                setPopup({ visible: true, title: 'Missing Code', message: 'Please enter a user ID to follow.', confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
                setIsLinking(false);
                return;
            }
            const targetUid = code.trim();
            
            if (targetUid === auth.currentUser.uid) {
                setPopup({ visible: true, title: 'Error', message: 'You cannot follow yourself.', confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
                setIsLinking(false);
                return;
            }
            if (followed.includes(targetUid)) {
                setPopup({ visible: true, title: 'Already Following', message: 'You are already following this user.', confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
                setCode('');
                setIsLinking(false);
                return;
            }
            try {
                await setDoc(doc(db, 'users', targetUid, 'requests', auth.currentUser.uid), {
                    from: auth.currentUser.uid,
                    createdAt: Date.now(),
                    status: 'pending'
                }, { merge: true });
                setPopup({ visible: true, title: 'Request Sent', message: 'Connection request has been sent. They can accept or deny it.', confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
                setCode('');
                const updated = followed.includes(targetUid) ? followed : [...followed, targetUid];
                setFollowed(updated);
                try { await AsyncStorage.setItem(`followed:${auth.currentUser.uid}`, JSON.stringify(updated)); } catch {}
                try {
                    const targetRef = doc(db, 'users', targetUid);
                    const unsub = onSnapshot(targetRef, (snap) => {
                        const d = snap.data();
                        setTargets((prev) => {
                            const next = prev.filter((p) => p.uid !== targetUid);
                            if (d) next.push({ uid: targetUid, data: d });
                            return next;
                        });
                    }, () => {});
                } catch {}
                // Seed my last location so receiver can see a 'Last Seen' immediately after acceptance
                try {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === 'granted') {
                        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                            location: { lat: pos.coords.latitude, lng: pos.coords.longitude, lastUpdated: Date.now() }
                        });
                    }
                } catch {}
            } catch (err) {
                const msg = String(err?.message || err || '');
                setPopup({ visible: true, title: 'Error', message: msg, confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
            }
            
        } catch (e) {
            const msg = String(e?.message || e || '');
            setPopup({ visible: true, title: 'Error', message: msg, confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
        } finally {
            try { if (linkingTimerRef.current) clearTimeout(linkingTimerRef.current); } catch {}
            setIsLinking(false);
        }
    };

    const acceptRequest = async (fromUid) => {
        try {
            if (!auth.currentUser || !fromUid) return;
            // 1. Update my doc (always allowed)
            try {
                await setDoc(doc(db, 'users', auth.currentUser.uid), { followedUsers: arrayUnion(fromUid), visibleTo: arrayUnion(fromUid) }, { merge: true });
            } catch (err0) {
                const m0 = String(err0?.message || err0 || '').toLowerCase();
                if (!(m0.includes('insufficient') || m0.includes('permission') || m0.includes('offline'))) {
                    throw err0;
                }
            }

            // 2. Update target doc only if my uid not already present
            try {
                const tsnap = await getDoc(doc(db, 'users', fromUid));
                const tdata = tsnap?.data() || {};
                const needFollow = !Array.isArray(tdata.followedUsers) || !tdata.followedUsers.includes(auth.currentUser.uid);
                const needVisible = !Array.isArray(tdata.visibleTo) || !tdata.visibleTo.includes(auth.currentUser.uid);
                if (needFollow || needVisible) {
                    const payload = {};
                    if (needFollow) payload.followedUsers = arrayUnion(auth.currentUser.uid);
                    if (needVisible) payload.visibleTo = arrayUnion(auth.currentUser.uid);
                    await setDoc(doc(db, 'users', fromUid), payload, { merge: true });
                }
            } catch (err) {
                const msg = String(err?.message || err || '').toLowerCase();
                if (!(msg.includes('insufficient') || msg.includes('permission') || msg.includes('offline'))) {
                    throw err;
                }
            }

            // 3. Mark request as accepted (keep doc to permit reads), hide from UI list
            try { await setDoc(doc(db, 'users', auth.currentUser.uid, 'requests', fromUid), { status: 'accepted' }, { merge: true }); } catch {}
            setRequests((prev) => prev.filter((r) => r.id !== fromUid));

            // 4. Update UI and start sharing
            const updatedList = followed.includes(fromUid) ? followed : [...followed, fromUid];
            setFollowed(updatedList);
            try { await AsyncStorage.setItem(`followed:${auth.currentUser.uid}`, JSON.stringify(updatedList)); } catch {}
            try { startSharing(); } catch {}
            // One-shot current position write to ensure last location is available even if sharing stays off
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                        location: { lat: pos.coords.latitude, lng: pos.coords.longitude, lastUpdated: Date.now() }
                    });
                }
            } catch {}
            try {
                const targetRef = doc(db, 'users', fromUid);
                const unsub = onSnapshot(targetRef, (snap) => {
                    const d = snap.data();
                    setTargets((prev) => {
                        const next = prev.filter((p) => p.uid !== fromUid);
                        if (d) next.push({ uid: fromUid, data: d });
                        return next;
                    });
                }, () => {});
            } catch {}
        } catch (e) {
            setPopup({ visible: true, title: 'Error', message: String(e?.message || e), confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
        }
    };

    const denyRequest = async (fromUid) => {
        try {
            await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'requests', fromUid));
            setRequests((prev) => prev.filter((r) => r.id !== fromUid));
        } catch (e) {
            setPopup({ visible: true, title: 'Error', message: String(e?.message || e), confirmText: 'OK', cancelText: 'Cancel', onConfirm: () => setPopup({ ...popup, visible: false }) });
        }
    };

    const allFollowed = followed.map((uid) => {
        const found = targets.find((t) => t.uid === uid);
        const d = found?.data || null;
        const prof = profilesById[uid] || {};
        const name = prof.displayName || d?.displayName || d?.name || d?.username || (uid ? ('User ID: ' + uid.substring(0, 8) + '...') : 'Unknown');
        const active = Boolean(d?.sharingEnabled);
        const lastUpdated = d?.location?.lastUpdated || null;
        return { uid, name, active, lastUpdated };
    });

    const allFollowedSorted = [...allFollowed].sort((a, b) => {
        if (a.active !== b.active) return b.active ? 1 : -1;
        return (b.lastUpdated || 0) - (a.lastUpdated || 0);
    });

    const renderFollowedItem = ({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate('View', { focusUid: item.uid })}>
            <View style={styles.followedUserItem}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.active ? '#2ecc71' : '#ff3b30', marginRight: 10 }} />
                <View style={styles.followedUserInfo}>
                    <Text style={styles.followedUserName}>{item.name}</Text>
                    {item.lastUpdated ? (
                        <Text style={styles.followedUserTime}>Last Seen: {new Date(item.lastUpdated).toLocaleTimeString()}</Text>
                    ) : (
                        <Text style={styles.followedUserTime}>No last location yet</Text>
                    )}
                </View>
                <TouchableOpacity onPress={() => requestDisconnect(item.uid)} style={{ paddingHorizontal: 4, paddingVertical: 4 }}>
                    <Ionicons name="close-circle" size={20} color="#ff3b30" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    // --- UI Rendering ---
    return (
        <View style={styles.container}>
            {/* 1. Gradient Header with Greeting */}
            <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.greetingContainer}>
                     <Text style={styles.headerGreeting}>
                        Hi, {user?.displayName || 'Traveler'}! 🚀
                    </Text>
                    <Text style={styles.headerSubtext}>
                        Manage your location sharing
                    </Text>
                </View>
                
                <TouchableOpacity onPress={() => setRequestsVisible(true)} style={styles.notificationButton}>
                    <View style={{ position: 'relative' }}>
                        <MaterialIcons name="notifications" size={26} color={colors.primaryText} />
                        {!!requests.length && (
                            <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#ff3b30', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{requests.length}</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </LinearGradient>

            {/* 2. Overlapping Content */}
            <SafeAreaView style={styles.contentWrapper} edges={['bottom', 'left', 'right']}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* Toggle Card (Overlapping) */}
                    <View style={styles.headerSharingToggleContainer}>
                        <View style={styles.toggleInfo}>
                            <Ionicons 
                                name={sharing ? "radio-button-on" : "radio-button-off"} 
                                size={24} 
                                color={colors.primaryText} 
                            />
                            <View>
                                <Text style={styles.toggleStatusLabel}>
                                   Share Live Location 
                                </Text>
                                <Text style={styles.toggleStatusText}>
                                    Status: <Text style={styles.toggleStatusValue}>
                                        {sharing ? 'ACTIVE' : 'INACTIVE'}
                                    </Text>
                                    {lastUpdated ? ` · ${lastUpdated.toLocaleTimeString()}` : ''}
                                </Text>
                            </View>
                        </View>
                        <Switch 
                            value={sharing} 
                            onValueChange={(v) => (v ? startSharing() : stopSharing())} 
                            trackColor={{ false: colors.secondaryText + '33', true: colors.primaryText + 'CC' }} 
                            thumbColor={colors.primaryText} 
                        />
                    </View>

                    {/* UID Display (if active) */}
                    {sharing && (
                        <View style={styles.uidDisplay}>
                            <Text style={styles.uidTextLabel}>Your Unique Share Code</Text>
                            <Text style={styles.uidText} selectable={true}>
                                {user?.uid}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => Clipboard.setStringAsync(user.uid).then(() => Alert.alert('Copied', 'Code copied to clipboard.'))} 
                                style={styles.copyButton}
                            >
                                <Ionicons name="copy" color={colors.accent} size={16} />
                                <Text style={styles.copyButtonText}>
                                    Copy Code
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Pairing / Linking Card */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>
                            <Ionicons name="person-add" size={20} color={colors.primaryText} /> Connect People
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
                            editable={!isLinking}
                        />
                        
                        <TouchableOpacity 
                            onPress={onAddFollow} 
                            style={[styles.addButton, { opacity: isLinking ? 0.7 : 1 }]}
                            disabled={isLinking}
                        >
                            {isLinking ? (
                                <ActivityIndicator color={colors.primaryText} size="small" />
                            ) : (
                                <Text style={styles.addButtonText}>Connect</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    
                    {/* Connected Users Status Card */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>
                            <MaterialIcons name="groups" size={22} color={colors.primaryText} /> Connected Users
                        </Text>
                        <Text style={{ color: colors.secondaryText, marginBottom: 10 }}>Connected: {allFollowed.length}</Text>
                        
                        {allFollowed.length === 0 && (
                            <View style={{ padding: 10, backgroundColor: inputBackground, borderRadius: radius * 0.5 }}>
                                <Text style={styles.statusText}>
                                    No user connected
                                </Text>
                            </View>
                        )}
                        {allFollowed.length > 0 && (
                            <FlatList
                                data={allFollowedSorted}
                                renderItem={renderFollowedItem}
                                keyExtractor={(item) => item.uid}
                                scrollEnabled={false}
                                contentContainerStyle={{ marginBottom: 10 }}
                            />
                        )}
                    </View>

                </ScrollView>
            </SafeAreaView>
            <Modal visible={requestsVisible} transparent animationType="slide" onRequestClose={() => setRequestsVisible(false)}>
                <View style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: colors.card, padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ color: colors.primaryText, fontSize: 18, fontWeight: '700' }}>Pending Requests</Text>
                            <TouchableOpacity onPress={() => setRequestsVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.primaryText} />
                            </TouchableOpacity>
                        </View>
                        {requests.length === 0 ? (
                            <Text style={{ color: colors.secondaryText }}>No pending requests</Text>
                        ) : (
                            <FlatList
                                data={requests}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.secondaryText + '1A' }}>
                                        <View style={{ flex: 1, marginRight: 12 }}>
                                            <Text style={{ color: colors.primaryText, fontWeight: '600' }}>{item.id}</Text>
                                            <Text style={{ color: colors.secondaryText, fontSize: 12 }}>Requested at {new Date(item.createdAt || Date.now()).toLocaleString()}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            <TouchableOpacity onPress={() => acceptRequest(item.id)} style={{ backgroundColor: colors.accent, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}>
                                                <Text style={{ color: '#fff', fontWeight: '700' }}>Accept</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => denyRequest(item.id)} style={{ backgroundColor: '#ff3b30', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}>
                                                <Text style={{ color: '#fff', fontWeight: '700' }}>Deny</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
            <Popup
                visible={popup.visible}
                title={popup.title}
                message={popup.message}
                confirmText={popup.confirmText}
                cancelText={popup.cancelText}
                onConfirm={popup.onConfirm}
                onCancel={() => setPopup({ ...popup, visible: false })}
            />
        </View>
    );
}
