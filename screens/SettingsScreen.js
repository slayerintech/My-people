import React, { useEffect, useState } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Popup from '../components/Popup'; // Assuming this component exists
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient

// --- Theme and Spacing Constants ---
const colors = {
    background: '#060818ff',
    card: '#1a1c2aff',
    primaryText: '#FFFFFF',
    secondaryText: '#8E99B0',
    accent: '#e26104ff',
    danger: '#FF4D4D',
    separator: '#2A2F45',
    // Gradient colors for the header (Matching WelcomeScreen)
    gradientStart: '#000000ff',
    gradientEnd: '#ff6a00ae',
};
const radius = 16;
const shadow = {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
};
const SPACING = 24;
const { height } = Dimensions.get('window');

// --- Stylesheet ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        // Removed horizontal padding here so the header can stretch to the edges
        paddingHorizontal: 0,
        paddingBottom: SPACING * 2,
    },
    headerGradient: {
        height: height * 0.35,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: radius * 2,
        borderBottomRightRadius: radius * 2,
        marginBottom: SPACING * 1.5,
    },
    logoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING,
        borderWidth: 5,
        borderColor: colors.primaryText + '55',
        marginBottom: 10,
    },
    nameText: {
        color: colors.primaryText,
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 4,
    },
    emailText: {
        color: colors.primaryText + 'CC',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
    },
    planBadge: {
        backgroundColor: colors.card + '80',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    planText: {
        color: colors.primaryText,
        fontSize: 14,
        fontWeight: '700',
    },
    // --- Section Styles (Adjusted padding to align with header width) ---
    sectionContainer: {
        marginBottom: SPACING * 1.5,
        paddingHorizontal: SPACING, // Added horizontal padding back here
    },
    sectionTitle: {
        color: colors.secondaryText,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        paddingHorizontal: 5,
    },
    settingsGroup: {
        backgroundColor: colors.card,
        borderRadius: radius,
        overflow: 'hidden',
        ...shadow,
        shadowRadius: 8,
    },
    // --- Row Base Styles (Kept identical) ---
    rowBase: {
        paddingHorizontal: 18,
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.separator,
    },
    rowEnd: {
        borderBottomWidth: 0,
    },
    rowContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    rowLabel: {
        color: colors.primaryText,
        fontSize: 16,
    },
});

// --- Component Definitions ---

function SettingsHeader({ name, email, planTitle }) {
    return (
        <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
        >
            <View style={styles.logoPlaceholder}>
                <Ionicons name="person" color={colors.primaryText} size={60} />
            </View>
            <Text style={styles.nameText}>{name}</Text>
            <Text style={styles.emailText}>{email}</Text>
        </LinearGradient>
    );
}

// --- Section, Row Components (Kept identical but uses new styles) ---

function Section({ title, children }) {
    const childrenArray = React.Children.toArray(children);
    const childrenWithProps = childrenArray.map((child, index) => {
        if (index === childrenArray.length - 1) {
            return React.cloneElement(child, { style: styles.rowEnd });
        }
        return child;
    });

    return (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
            <View style={styles.settingsGroup}>
                {childrenWithProps}
            </View>
        </View>
    );
}

function RowBase({ children, onPress, style }) {
    return (
        <TouchableOpacity 
            onPress={onPress} 
            disabled={!onPress} 
            style={[styles.rowBase, style]}
        >
            {children}
        </TouchableOpacity>
    );
}

function RowSwitch({ icon, label, value, onValueChange, style }) {
    return (
        <RowBase style={style}>
            <View style={styles.rowContent}>
                <Ionicons name={icon} color={colors.secondaryText} size={20} />
                <Text style={styles.rowLabel}>{label}</Text>
            </View>
            <Switch 
                value={value} 
                onValueChange={onValueChange} 
                trackColor={{ false: colors.secondaryText + '33', true: colors.accent }} 
                thumbColor={colors.primaryText} 
            />
        </RowBase>
    );
}

function RowNav({ icon, label, onPress, style }) {
    return (
        <RowBase onPress={onPress} style={style}>
            <View style={styles.rowContent}>
                <Ionicons name={icon} color={colors.secondaryText} size={20} />
                <Text style={styles.rowLabel}>{label}</Text>
            </View>
            <Ionicons name="chevron-forward" color={colors.secondaryText} size={20} />
        </RowBase>
    );
}

function RowAction({ icon, label, onPress, accent, style }) {
    const iconColor = accent ? colors.accent : colors.danger;
    const textColor = accent ? colors.accent : colors.danger;
    
    return (
        <RowBase onPress={onPress} style={style}>
            <View style={styles.rowContent}>
                <Ionicons name={icon} color={iconColor} size={20} />
                <Text style={[styles.rowLabel, { color: textColor }]}>{label}</Text>
            </View>
        </RowBase>
    );
}

// --- Main Settings Component ---

export default function SettingsScreen() {
    const { user, logout } = useApp();
    const navigation = useNavigation();
    const [profile, setProfile] = useState(null);
    const [allow, setAllow] = useState(true);
    const [confirm, setConfirm] = useState({ visible: false, type: null });
    const [notice, setNotice] = useState(null);

    // Load profile data on mount
    useEffect(() => {
        const load = async () => {
            try {
                const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
                const data = snap.data();
                setProfile(data);
                setAllow(Boolean(data?.allowFollow));
            } catch (e) {
                setProfile({ name: auth.currentUser?.displayName || 'Your Name', email: auth.currentUser?.email || 'email@example.com' });
            }
        };
        if (auth.currentUser) {
            load();
        }
    }, [user]);

    const toggleAllow = async (value) => {
        setAllow(value);
        try {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), { allowFollow: value });
        } catch (e) {
            Alert.alert("Error", "Could not update setting.");
            setAllow(!value);
        }
    };

    const onDeleteAccount = () => setConfirm({ visible: true, type: 'delete' });

    const onLogout = async () => {
        try {
            try {
                await Location.stopLocationUpdatesAsync('BACKGROUND_LOCATION_TASK');
            } catch {} 
            await logout();
        } catch (e) {
            setNotice(String(e.message || 'Logout failed.'));
        }
    };

    const handleConfirmAction = async () => {
        if (confirm.type === 'delete') {
            try {
                await deleteDoc(doc(db, 'users', auth.currentUser.uid));
                await deleteUser(auth.currentUser);
                await logout();
            } catch (e) {
                setNotice("Account deletion failed. Try logging in again.");
            }
        }
        setConfirm({ visible: false, type: null });
    };

    return (
        <View style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollView}>
                
                {/* 1. Gradient Header (Theme Type) */}
                <SettingsHeader 
                    name={profile?.name ?? user?.displayName ?? 'Your Account'} 
                    email={profile?.email ?? user?.email ?? 'Not Available'} 
                    planTitle={profile?.planTitle} 
                />
                
                {/* 2. Privacy Section */}
                <Section title="Privacy">
                    <RowSwitch 
                        icon="lock-closed" 
                        label="Allow follow via code" 
                        value={allow} 
                        onValueChange={toggleAllow} 
                    />
                </Section>
                
                {/* 3. General Section */}
                <Section title="General">
                    <RowNav icon="document-text" label="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
                    <RowNav icon="document" label="Terms & Conditions" onPress={() => navigation.navigate('Terms')} />
                </Section>
                
                {/* 4. Actions Section */}
                <Section title="Actions">
                    <RowAction icon="log-out" label="Log Out" onPress={onLogout} accent />
                    <RowAction icon="trash" label="Delete Account" onPress={onDeleteAccount} />
                </Section>
            </ScrollView>

            {/* Confirmation Popup */}
            <Popup
                visible={confirm.visible}
                title={'Confirm ' + (confirm.type === 'delete' ? 'Deletion' : '')}
                message={confirm.type === 'delete' ? 'WARNING: This will permanently delete your account and all associated data. This action cannot be undone.' : ''}
                confirmText={confirm.type === 'delete' ? 'DELETE' : 'OK'}
                cancelText={'Cancel'}
                onConfirm={handleConfirmAction}
                onCancel={() => setConfirm({ visible: false, type: null })}
            />
            
            {/* Error Popup */}
            <Popup
                visible={!!notice}
                title={'Error'}
                message={notice || ''}
                confirmText={'OK'}
                onConfirm={() => setNotice(null)}
                onCancel={() => setNotice(null)} 
            />
        </View>
    );
}
