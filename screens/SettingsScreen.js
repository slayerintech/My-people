import React, { useEffect, useState } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Popup from '../components/Popup';
import * as Location from 'expo-location';
import { colors, radius, shadow } from '../theme';
import { useApp } from '../context/AppContext';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { user, logout } = useApp();
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [allow, setAllow] = useState(true);
  const [confirm, setConfirm] = useState({ visible: false, type: null });

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const data = snap.data();
        setProfile(data);
        setAllow(Boolean(data?.allowFollow));
      } catch (e) {
        setProfile({ name: auth.currentUser?.displayName || '', email: auth.currentUser?.email || '', photoURL: auth.currentUser?.photoURL || '' });
      }
    };
    load();
  }, []);

  const toggleAllow = async (value) => {
    setAllow(value);
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { allowFollow: value });
  };

  const onDeleteAccount = async () => setConfirm({ visible: true, type: 'delete' });

  const onLogout = async () => {
    try {
      try {
        await Location.stopLocationUpdatesAsync('BACKGROUND_LOCATION_TASK');
      } catch {}
      await logout();
    } catch (e) {
      Alert.alert('Logout failed', e.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 24, gap: 16 }}>
      <ProfileCard name={profile?.name ?? user?.displayName ?? 'Unknown'} email={profile?.email ?? user?.email ?? ''} planTitle={profile?.planTitle} />
      <Section title="Privacy">
        <RowSwitch icon="lock-closed" label="Allow follow via code" value={allow} onValueChange={toggleAllow} />
      </Section>
      <Section title="General">
        <RowNav icon="document-text" label="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
        <RowNav icon="document" label="Terms & Conditions" onPress={() => navigation.navigate('Terms')} />
        <RowNav icon="card" label="Subscription" onPress={() => navigation.navigate('Subscription')} />
      </Section>
      <Section title="Actions">
        <RowAction icon="log-out" label="Log Out" onPress={onLogout} accent />
        <RowAction icon="trash" label="Delete Account" onPress={onDeleteAccount} />
      </Section>
      <Popup
        visible={confirm.visible}
        title={confirm.type === 'delete' ? 'Delete account' : ''}
        message={confirm.type === 'delete' ? 'This will permanently delete your account and data.' : ''}
        confirmText={confirm.type === 'delete' ? 'Delete' : 'OK'}
        cancelText={'Cancel'}
        onConfirm={async () => {
          if (confirm.type === 'delete') {
            try {
              await deleteDoc(doc(db, 'users', auth.currentUser.uid));
              await deleteUser(auth.currentUser);
            } catch (e) {}
          }
          setConfirm({ visible: false, type: null });
        }}
        onCancel={() => setConfirm({ visible: false, type: null })}
      />
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: colors.secondaryText, fontSize: 14 }}>{title}</Text>
      <View style={{ backgroundColor: colors.card, borderRadius: radius, overflow: 'visible', ...shadow }}>
        {children}
      </View>
    </View>
  );
}

function RowBase({ children, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={{ paddingHorizontal: 18, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#2A2F45' }}>
      {children}
    </TouchableOpacity>
  );
}

function RowValue({ icon, label, value }) {
  return (
    <RowBase>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ionicons name={icon} color={colors.secondaryText} size={20} />
        <Text style={{ color: colors.primaryText, fontSize: 16 }}>{label}</Text>
      </View>
      <Text style={{ color: colors.secondaryText, fontSize: 16 }}>{value}</Text>
    </RowBase>
  );
}

function RowSwitch({ icon, label, value, onValueChange }) {
  return (
    <RowBase>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ionicons name={icon} color={colors.secondaryText} size={20} />
        <Text style={{ color: colors.primaryText, fontSize: 16 }}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#777', true: colors.accent }} thumbColor={colors.primaryText} />
    </RowBase>
  );
}

function RowNav({ icon, label, onPress }) {
  return (
    <RowBase onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ionicons name={icon} color={colors.secondaryText} size={20} />
        <Text style={{ color: colors.primaryText, fontSize: 16 }}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" color={colors.secondaryText} size={20} />
    </RowBase>
  );
}

function RowAction({ icon, label, onPress, accent }) {
  return (
    <RowBase onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ionicons name={icon} color={accent ? colors.accent : colors.secondaryText} size={20} />
        <Text style={{ color: accent ? colors.accent : colors.secondaryText, fontSize: 16 }}>{label}</Text>
      </View>
    </RowBase>
  );
}

function ProfileCard({ name, email, planTitle }) {
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: radius, padding: 20, alignItems: 'center', gap: 10, ...shadow }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#1F2234', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="person" color={colors.accent} size={30} />
      </View>
      <Text style={{ color: colors.primaryText, fontSize: 18, fontWeight: '600', textAlign: 'center' }}>{name}</Text>
      <Text style={{ color: colors.secondaryText, fontSize: 14, textAlign: 'center' }}>{planTitle ? planTitle : 'Free User'}</Text>
      <Text style={{ color: colors.secondaryText, fontSize: 14, textAlign: 'center' }}>{email}</Text>
    </View>
  );
}
