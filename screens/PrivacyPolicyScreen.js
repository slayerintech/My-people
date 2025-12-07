import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, radius, shadow } from '../theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24 },
  card: { backgroundColor: colors.card, borderRadius: radius, padding: 16, ...shadow },
  title: { color: colors.primaryText, fontSize: 20, fontWeight: '700' },
  subtitle: { color: colors.secondaryText, marginTop: 6, fontSize: 12 },
  sectionTitle: { color: colors.primaryText, fontSize: 16, fontWeight: '700', marginTop: 16 },
  text: { color: colors.secondaryText, marginTop: 8, lineHeight: 20 },
  listItem: { color: colors.secondaryText, marginTop: 6, lineHeight: 20 },
});

export default function PrivacyPolicyScreen() {
  const lastUpdated = new Date().toLocaleDateString();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>Last updated: {lastUpdated}</Text>

          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.text}>This Privacy Policy explains how My People collects, uses, and shares personal information, including location data, when you use the app. By using the app, you agree to the practices described here.</Text>

          <Text style={styles.sectionTitle}>Information We Collect</Text>
          <Text style={styles.listItem}>• Account information: name, email, and app identifiers.</Text>
          <Text style={styles.listItem}>• Location information: precise latitude/longitude when you enable sharing and optional background updates.</Text>
          <Text style={styles.listItem}>• Device information: app version, device type, and diagnostics to maintain service quality.</Text>

          <Text style={styles.sectionTitle}>How We Use Information</Text>
          <Text style={styles.listItem}>• Provide location sharing features and show linked users on the map.</Text>
          <Text style={styles.listItem}>• Maintain account settings and user permissions (who can view your location).</Text>
          <Text style={styles.listItem}>• Improve reliability, performance, and security of the service.</Text>

          <Text style={styles.sectionTitle}>Location Sharing Controls</Text>
          <Text style={styles.text}>You control whether your location is shared and who can view it. You can toggle sharing on or off at any time inside the app. Background sharing requires additional permission and can be disabled in the app or device settings.</Text>

          <Text style={styles.sectionTitle}>Sharing and Disclosure</Text>
          <Text style={styles.listItem}>• With users you approve: your location is visible only to users you link and allow.</Text>
          <Text style={styles.listItem}>• Service providers: we use trusted providers (e.g., Firebase) to store and process data.</Text>
          <Text style={styles.listItem}>• Legal requirements: we may disclose data if required to comply with law or enforce policies.</Text>

          <Text style={styles.sectionTitle}>Data Retention</Text>
          <Text style={styles.text}>We retain account and sharing records for as long as your account is active. Location points are stored as part of your current status and last updated time, not as continuous history, unless required to deliver specific features.</Text>

          <Text style={styles.sectionTitle}>Security</Text>
          <Text style={styles.text}>We implement technical and organizational measures to protect your data. No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.</Text>

          <Text style={styles.sectionTitle}>Children’s Privacy</Text>
          <Text style={styles.text}>The app is not directed to children under 13, or the minimum age required in your jurisdiction. If you are under the age of majority, use requires consent from a parent or guardian.</Text>

          <Text style={styles.sectionTitle}>Your Choices and Rights</Text>
          <Text style={styles.listItem}>• Toggle location sharing on or off at any time.</Text>
          <Text style={styles.listItem}>• Manage who can view your location by linking or removing users.</Text>
          <Text style={styles.listItem}>• Delete your account in Settings to remove stored data.</Text>

          <Text style={styles.sectionTitle}>Third‑Party Services</Text>
          <Text style={styles.text}>We rely on third‑party services such as Firebase (authentication, database, storage) and mapping providers for displaying locations. These services have their own privacy policies and may process data on our behalf.</Text>

          <Text style={styles.sectionTitle}>International Transfers</Text>
          <Text style={styles.text}>Your information may be processed and stored in locations outside your country. We take steps to ensure an adequate level of protection in accordance with applicable laws.</Text>

          <Text style={styles.sectionTitle}>Changes to This Policy</Text>
          <Text style={styles.text}>We may update this Privacy Policy from time to time to reflect changes to the app or legal requirements. Continued use after an update indicates acceptance of the revised policy.</Text>

          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.text}>For questions or requests related to privacy, contact support through the details provided in the store listing.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
