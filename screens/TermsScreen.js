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

export default function TermsScreen() {
  const lastUpdated = new Date().toLocaleDateString();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Terms & Conditions</Text>
          <Text style={styles.subtitle}>Last updated: {lastUpdated}</Text>

          <Text style={styles.sectionTitle}>Introduction</Text>
          <Text style={styles.text}>These Terms & Conditions govern your use of My People, a location sharing application. By creating an account or using the app, you agree to these Terms.</Text>

          <Text style={styles.sectionTitle}>Eligibility</Text>
          <Text style={styles.text}>You must be at least 13 years old, or the minimum age required in your jurisdiction. If you are under the age of majority, you must have consent from a parent or legal guardian.</Text>

          <Text style={styles.sectionTitle}>Account and Security</Text>
          <Text style={styles.text}>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Notify us immediately if you suspect unauthorized access.</Text>

          <Text style={styles.sectionTitle}>Location Sharing</Text>
          <Text style={styles.text}>The app allows you to broadcast your location and view locations of users who grant you permission. You control whether your location is shared and who can see it. You agree to share only with users you trust and to use location data responsibly.</Text>

          <Text style={styles.sectionTitle}>Permissions</Text>
          <Text style={styles.text}>The app requires foreground and, optionally, background location permissions to provide continuous updates. You can disable sharing at any time within the app settings.</Text>

          <Text style={styles.sectionTitle}>User Conduct</Text>
          <Text style={styles.text}>You agree not to misuse the service, including but not limited to stalking, harassment, endangering others, reverse engineering, interfering with app operation, or violating laws and third‑party rights.</Text>

          <Text style={styles.sectionTitle}>Subscription and Billing</Text>
          <Text style={styles.text}>Certain features may require a paid subscription. All fees are displayed in the app or store listing. Subscriptions are managed through the store’s billing system and are subject to its policies. Taxes may apply.</Text>

          <Text style={styles.sectionTitle}>Privacy</Text>
          <Text style={styles.text}>Our handling of personal data, including location information, is described in the Privacy Policy. By using the app, you acknowledge and agree to the Privacy Policy.</Text>

          <Text style={styles.sectionTitle}>Termination</Text>
          <Text style={styles.text}>You may stop using the app at any time and delete your account in settings. We may suspend or terminate access for violations of these Terms or misuse of the service.</Text>

          <Text style={styles.sectionTitle}>Disclaimers</Text>
          <Text style={styles.text}>The service is provided on an “as is” and “as available” basis. We do not guarantee continuous accuracy of location data, uninterrupted service, or fitness for a particular purpose.</Text>

          <Text style={styles.sectionTitle}>Limitation of Liability</Text>
          <Text style={styles.text}>To the maximum extent allowed by law, we are not liable for indirect, incidental, consequential, or punitive damages arising from your use of the app. In no event will our aggregate liability exceed the amount you paid for the service in the twelve months preceding the claim.</Text>

          <Text style={styles.sectionTitle}>Changes to Terms</Text>
          <Text style={styles.text}>We may update these Terms to reflect changes in features, laws, or policies. Continued use after changes become effective constitutes acceptance of the updated Terms.</Text>

          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.text}>For questions or concerns, contact support via the details provided in the store listing.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

