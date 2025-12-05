import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, deleteUser } from 'firebase/auth';
import { arrayUnion, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [usersById, setUsersById] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, 'users', u.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            uid: u.uid,
            name: u.displayName || '',
            email: u.email || '',
            sharingEnabled: false,
            location: null,
            visibleTo: [],
            followedUsers: [],
            allowFollow: true
          });
        } else {
          setUsersById((prev) => ({ ...prev, [u.uid]: snap.data() }));
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
      allowFollow: true
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
    // Add to current user's followed list
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { followedUsers: arrayUnion(uid) });
    // Also add current user to target's visibleTo if allowed
    const targetRef = doc(db, 'users', uid);
    const targetSnap = await getDoc(targetRef);
    if (targetSnap.exists()) {
      const t = targetSnap.data();
      if (t.allowFollow !== false) {
        await updateDoc(targetRef, { visibleTo: arrayUnion(auth.currentUser.uid) });
      }
    }
    const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
    const data = snap.data();
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

  const value = useMemo(() => ({ user, usersById, signup, login, logout, updateLocation, setSharingEnabled, addFollow, getUser, toggleAllowFollow, deleteAccount }), [user, usersById]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
