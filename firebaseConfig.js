import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCKJQCrjOdHYGRQqJSBYBB_BeHUZB29CqI",
  authDomain: "my-people-e78f6.firebaseapp.com",
  projectId: "my-people-e78f6",
  storageBucket: "my-people-e78f6.firebasestorage.app",
  messagingSenderId: "280250473688",
  appId: "1:280250473688:web:a311f2a25ecd5271898bad",
  measurementId: "G-W9W6FR9V6Z"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
export const db = getFirestore(app);
