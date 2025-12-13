import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, deleteUser } from 'firebase/auth';
import { arrayUnion, doc, getDoc, getDocFromCache, setDoc, updateDoc, deleteDoc, enableNetwork } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [usersById, setUsersById] = useState({});
  const [mapMode, setMapMode] = useState('traffic');
  const [preFollowed, setPreFollowed] = useState([]);
  const [preTargets, setPreTargets] = useState([]);
  const [profilesById, setProfilesById] = useState({});

  useEffect(() => {
    enableNetwork(db).catch(() => {});
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const ref = doc(db, 'users', u.uid);
      let snap;
      try {
        snap = await getDoc(ref);
      } catch (e) {
        try {
          snap = await getDocFromCache(ref);
        } catch {
          snap = null;
        }
      }
      if (!snap || !snap.exists()) {
            await setDoc(ref, {
              uid: u.uid,
              name: u.displayName || '',
              email: u.email || '',
              sharingEnabled: false,
              location: null,
              visibleTo: [],
              followedUsers: [],
              allowFollow: true,
              createdAt: Date.now()
            });
          } else {
            setUsersById((prev) => ({ ...prev, [u.uid]: snap.data() }));
            const d = snap.data();
            if (!d.createdAt) {
              const meta = u.metadata?.creationTime ? Date.parse(u.metadata.creationTime) : Date.now();
              await updateDoc(ref, { createdAt: meta });
            }
            try {
              const profName = d.displayName || d.name || u.displayName || null;
              const profPhoto = d.photoURL || u.photoURL || null;
              await setDoc(doc(db, 'profiles', u.uid), { displayName: profName, photoURL: profPhoto }, { merge: true });
              setProfilesById((prev) => ({ ...prev, [u.uid]: { displayName: profName, photoURL: profPhoto } }));
            } catch {}
            try {
              let followedList = Array.isArray(d.followedUsers) ? d.followedUsers : [];
              try {
                const local = await AsyncStorage.getItem(`followed:${u.uid}`);
                const localList = local ? JSON.parse(local) : [];
                const set = new Set([...(followedList || []), ...(localList || [])]);
                followedList = Array.from(set);
              } catch {}
              setPreFollowed(followedList);
              const targets = [];
              for (const uid2 of followedList) {
                let usnap = null;
                try {
                  const csnap = await getDocFromCache(doc(db, 'users', uid2));
                  if (csnap?.exists()) usnap = csnap;
                } catch {}
                if (!usnap) {
                  try {
                    const timeout = new Promise((resolve) => setTimeout(() => resolve('timeout'), 4000));
                    const result = await Promise.race([getDoc(doc(db, 'users', uid2)), timeout]);
                    if (result !== 'timeout') usnap = result;
                  } catch {}
                }
                if (usnap?.exists()) {
                  targets.push({ uid: uid2, data: usnap.data() });
                }
                try {
                  let psnap = null;
                  try { psnap = await getDocFromCache(doc(db, 'profiles', uid2)); } catch {}
                  if (!psnap) {
                    try {
                      const timeout = new Promise((resolve) => setTimeout(() => resolve('timeout'), 4000));
                      const result = await Promise.race([getDoc(doc(db, 'profiles', uid2)), timeout]);
                      if (result !== 'timeout') psnap = result;
                    } catch {}
                  }
                  if (psnap?.exists()) {
                    const pd = psnap.data();
                    setProfilesById((prev) => ({ ...prev, [uid2]: { displayName: pd.displayName || null, photoURL: pd.photoURL || null } }));
                  }
                } catch {}
              }
              setPreTargets(targets);
            } catch {}
          }
        } catch (e) {
          setUsersById((prev) => ({
            ...prev,
            [u.uid]: {
              uid: u.uid,
              name: u.displayName || '',
              email: u.email || '',
              sharingEnabled: false
            }
          }));
        }
      }
    });
    return () => unsub();
  }, []);

  const signup = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      name,
      email: cred.user.email,
      sharingEnabled: false,
      location: null,
      visibleTo: [],
      followedUsers: [],
      allowFollow: true,
      createdAt: Date.now()
    });
  };

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const updateLocation = async (lat, lng) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      sharingEnabled: true,
      location: { lat, lng, lastUpdated: Date.now() }
    });
    setUsersById((prev) => ({
      ...prev,
      [auth.currentUser.uid]: {
        ...(prev[auth.currentUser.uid] || {}),
        sharingEnabled: true,
        location: { lat, lng, lastUpdated: Date.now() }
      }
    }));
  };

  const setSharingEnabled = async (val) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { sharingEnabled: val });
    setUsersById((prev) => ({
      ...prev,
      [auth.currentUser.uid]: { ...(prev[auth.currentUser.uid] || {}), sharingEnabled: val }
    }));
  };

  const addFollow = async (uid) => {
    if (!auth.currentUser || !uid) return;
    await setDoc(doc(db, 'users', auth.currentUser.uid), { followedUsers: arrayUnion(uid) }, { merge: true });
    // Also add current user to target's visibleTo if allowed
    const targetRef = doc(db, 'users', uid);
    let targetSnap;
    try {
      targetSnap = await getDoc(targetRef);
    } catch (e) {
      try {
        targetSnap = await getDocFromCache(targetRef);
      } catch {
        targetSnap = null;
      }
    }
    if (targetSnap && targetSnap.exists()) {
      const t = targetSnap.data();
      if (t.allowFollow !== false) {
        await setDoc(targetRef, { visibleTo: arrayUnion(auth.currentUser.uid) }, { merge: true });
      }
    }
    let snap;
    try {
      snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
    } catch (e) {
      try {
        snap = await getDocFromCache(doc(db, 'users', auth.currentUser.uid));
      } catch {
        snap = null;
      }
    }
    const data = snap?.data?.() || (snap && snap.data ? snap.data() : null);
    setUsersById((prev) => ({ ...prev, [auth.currentUser.uid]: data }));
  };

  const getUser = async (uid) => {
    const s = await getDoc(doc(db, 'users', uid));
    return s.data();
  };

  const toggleAllowFollow = async (val) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { allowFollow: val });
    setUsersById((prev) => ({
      ...prev,
      [auth.currentUser.uid]: { ...(prev[auth.currentUser.uid] || {}), allowFollow: val }
    }));
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, 'users', auth.currentUser.uid));
    await deleteUser(auth.currentUser);
    setUser(null);
  };

  const value = useMemo(() => ({ user, usersById, profilesById, mapMode, setMapMode, preFollowed, preTargets, signup, login, logout, updateLocation, setSharingEnabled, addFollow, getUser, toggleAllowFollow, deleteAccount }), [user, usersById, profilesById, mapMode, preFollowed, preTargets]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
