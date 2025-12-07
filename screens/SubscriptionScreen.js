import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { colors, radius, shadow } from '../theme';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

const UPI_ID = '9981946965-2@axl';
const PAYEE_NAME = 'My People';

export default function SubscriptionScreen() {
  const plans = useMemo(() => ([
    { id: 'month', title: 'Monthly', subtitle: 'Access for 1 month', amount: 49 },
    { id: 'year', title: 'Yearly', subtitle: 'Access for 1 year', amount: 499 },
    { id: 'lifetime', title: 'Lifetime', subtitle: 'One-time, lifetime access', amount: 3499 }
  ]), []);

 

  const upiParams = (amt, note) => new URLSearchParams({ pa: UPI_ID, pn: PAYEE_NAME, am: String(amt), cu: 'INR', tn: note }).toString();

  const setUserPlan = async (plan) => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      await updateDoc(doc(db, 'users', uid), { plan: plan.id, planTitle: plan.title, planAmount: plan.amount, planUpdatedAt: Date.now() });
    } catch {}
  };

  const payWith = async (plan) => {
    try {
      if (!plan) return;
      await setUserPlan(plan);
      const params = upiParams(plan.amount, `${plan.title} subscription`);
      const url = `upi://pay?${params}`;
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('UPI not available', 'No supported UPI app found. Please install a UPI app.');
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Payment error', e.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 24 }}>
      <Text style={{ color: colors.primaryText, fontSize: 22, fontWeight: '600', marginBottom: 12 }}>Professional Subscription</Text>
      <View style={{ gap: 14 }}>
        {plans.map((p) => (
          <View key={p.id} style={{ backgroundColor: colors.card, borderRadius: radius, padding: 16, ...shadow }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: colors.primaryText, fontSize: 18, fontWeight: '600' }}>{p.title}</Text>
                <Text style={{ color: colors.secondaryText, marginTop: 4 }}>{p.subtitle}</Text>
              </View>
              <Text style={{ color: colors.accent, fontSize: 18, fontWeight: '600' }}>₹{p.amount}</Text>
            </View>
            <TouchableOpacity onPress={() => payWith(p)} style={{ backgroundColor: colors.accent, borderRadius: radius, paddingVertical: 10, alignItems: 'center', marginTop: 12, ...shadow }}>
              <Text style={{ color: colors.primaryText, fontWeight: '600' }}>Pay</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}
