import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Theme Imports (Keeping the consistent theme structure) ---
const colors = {
    background: '#060818ff',
    card: '#1a1c2aff',
    primaryText: '#FFFFFF',
    secondaryText: '#8E99B0',
    accent: '#e26104ff',
    gradientStart: '#000000ff',
    gradientEnd: '#ff6a00ae', 
};
const radius = 20;
const shadow = {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
};

const { height } = Dimensions.get('window');

// --- Custom Stylesheet with Consistent Spacing ---
const SPACING = 24; // Base spacing unit

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    // The gradient occupies the top part of the full screen height
    headerGradient: {
        height: height * 0.35, 
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: radius * 2,
        borderBottomRightRadius: radius * 2,
    },
    logoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 5,
        borderColor: colors.primaryText + '55',
        ...shadow,
    },
    // SafeAreaView for the main content to ensure proper use of the screen area
    contentWrapper: {
        flex: 1,
        paddingHorizontal: SPACING,
        marginTop: -radius * 2, // Pulls the content up over the gradient edge
    },
    titleSection: {
        marginBottom: SPACING * 1.5, // Increased spacing after title
        alignItems: 'center',
        paddingTop: 10,
    },
    mainTitle: {
        color: colors.primaryText,
        fontSize: 34,
        fontWeight: '900',
        marginBottom: 8,
        marginTop: 10,
        letterSpacing: 1,
    },
    subTitle: {
        color: colors.secondaryText,
        fontSize: 16,
        textAlign: 'center',
    },
    featuresCard: {
        backgroundColor: colors.card,
        borderRadius: radius,
        paddingHorizontal: SPACING,
        paddingVertical: SPACING,
        marginBottom: SPACING * 1.5, // Space before CTA
        ...shadow,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING * 0.8,
        paddingVertical: 6,
    },
    featureText: {
        color: colors.primaryText,
        fontSize: 16,
        marginLeft: SPACING * 0.6,
        flex: 1,
        flexWrap: 'wrap',
        fontWeight: '600',
    },
    ctaButton: {
        borderRadius: radius,
        paddingVertical: 18,
        alignItems: 'center',
        marginBottom: SPACING, // Space at the bottom of the screen
        ...shadow,
    },
    ctaText: {
        color: colors.primaryText,
        fontSize: 18,
        fontWeight: '700',
    },
});

export default function WelcomeScreen({ navigation }) {
    
    // Detailed list of features
    const features = [
        { icon: 'shield-checkmark', text: 'Military-Grade Privacy & Security' },
        { icon: 'time', text: 'Start and Stop Sharing Instantly' },
        { icon: 'link', text: 'Secure User Pairing with Unique Codes' },
        { icon: 'map', text: 'Real-time Updates on Live Map' },
    ];
    
    const FeatureItem = ({ icon, text }) => (
        <View style={styles.featureItem}>
            <Ionicons name={icon} size={24} color={colors.accent} />
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* 1. Gradient Header & Logo/Image */}
            <LinearGradient 
                colors={[colors.gradientStart, colors.gradientEnd]} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }} 
                style={styles.headerGradient}
            >
                <View style={styles.logoPlaceholder}>
                    <Ionicons name="location-sharp" size={60} color={colors.primaryText} />
                </View>
                
            </LinearGradient>

            {/* 2. Main Content Area inside SafeAreaView */}
            <SafeAreaView style={styles.contentWrapper}>
                
                {/* Scrollable content area */}
                <View style={{ flex: 1 }}>
                    <View style={styles.titleSection}>
                        <Text style={styles.mainTitle}>
                            My People
                        </Text>
                        <Text style={styles.subTitle}>
                            Secure. Private. Connected. The final word in location control.
                        </Text>
                    </View>

                    {/* Features Card */}
                    <View style={styles.featuresCard}>
                        {features.map((item, index) => (
                            <FeatureItem key={index} icon={item.icon} text={item.text} />
                        ))}
                    </View>
                    
                    {/* CTA Button - Aligned to the bottom of the safe area */}
                    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <LinearGradient
                                colors={[colors.accent, colors.gradientEnd]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.ctaButton}
                            >
                                <Text style={styles.ctaText}>Join the Safe Circle →</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

            </SafeAreaView>
        </View>
    );
}
