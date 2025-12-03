import React, { createContext, useContext, useMemo, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [usersById, setUsersById] = useState({});

  const signup = (name, email) => {
    const uid = Math.random().toString(36).slice(2);
    const profile = { uid, name, email, sharingEnabled: false, location: null, visibleTo: [], followedUsers: [], allowFollow: true };
    setUsersById((prev) => ({ ...prev, [uid]: profile }));
    setUser(profile);
  };

  const login = (email, password) => {
    const uid = Math.random().toString(36).slice(2);
    const profile = { uid, name: '', email, sharingEnabled: false, location: null, visibleTo: [], followedUsers: [], allowFollow: true };
    setUsersById((prev) => ({ ...prev, [uid]: profile }));
    setUser(profile);
  };

  const logout = () => setUser(null);

  const updateLocation = (lat, lng) => {
    if (!user) return;
    setUsersById((prev) => ({
      ...prev,
      [user.uid]: { ...(prev[user.uid] || user), sharingEnabled: true, location: { lat, lng, lastUpdated: Date.now() } }
    }));
  };

  const setSharingEnabled = (val) => {
    if (!user) return;
    setUsersById((prev) => ({
      ...prev,
      [user.uid]: { ...(prev[user.uid] || user), sharingEnabled: val }
    }));
  };

  const addFollow = (uid) => {
    if (!user || !uid) return;
    setUsersById((prev) => {
      const u = prev[user.uid] || user;
      const followed = new Set(u.followedUsers || []);
      followed.add(uid);
      const copy = { ...prev };
      copy[user.uid] = { ...u, followedUsers: Array.from(followed) };
      if (!copy[uid]) {
        copy[uid] = { uid, name: uid, email: '', sharingEnabled: false, location: null, visibleTo: [], followedUsers: [], allowFollow: true };
      }
      return copy;
    });
  };

  const getUser = (uid) => usersById[uid];

  const toggleAllowFollow = (val) => {
    if (!user) return;
    setUsersById((prev) => ({
      ...prev,
      [user.uid]: { ...(prev[user.uid] || user), allowFollow: val }
    }));
  };

  const deleteAccount = () => {
    if (!user) return;
    setUsersById((prev) => {
      const copy = { ...prev };
      delete copy[user.uid];
      return copy;
    });
    setUser(null);
  };

  const value = useMemo(() => ({ user, usersById, signup, login, logout, updateLocation, setSharingEnabled, addFollow, getUser, toggleAllowFollow, deleteAccount }), [user, usersById]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}

