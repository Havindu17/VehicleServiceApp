import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, SafeAreaView, StatusBar,
  ScrollView, Platform
} from 'react-native';
import api from '../../utils/api';

const COLORS = {
  navy:     '#0B1D3A',
  navyMid:  '#132847',
  gold:     '#C9A84C',
  white:    '#FFFFFF',
  gray:     '#8A9BB5',
  cardBg:   '#162040',
};

export default function RegisterScreen({ navigation }) {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [address,  setAddress]  = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [role,     setRole]     = useState('customer');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Required', 'Please fill in all required fields');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    try {
      setLoading(true);
      await api.post('/auth/register', { name, email, phone, address, password, role });
      Alert.alert('Success ✅', 'Account created! Please sign in.', [
        { text: 'OK', onPress: () => navigation.replace('Login') }
      ]);
    } catch (err) {
      Alert.alert('Registration Failed', err?.response?.data?.message ?? 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, icon, ...props }) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Text style={styles.inputIcon}>{icon}</Text>
        <TextInput style={styles.input} placeholderTextColor={COLORS.gray} {...props} />
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <View style={styles.topDecor} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.headerArea}>
          <View style={styles.logoRing}>
            <Text style={styles.logoEmoji}>🔧</Text>
          </View>
          <Text style={styles.brandName}>AutoServe Pro</Text>
          <View style={styles.goldLine} />
          <Text style={styles.headerSub}>Create your account</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Join Us Today</Text>
          <Text style={styles.cardSub}>Fill in your details to get started</Text>

          {/* Role Selector */}
          <Text style={styles.label}>Account Type</Text>
          <View style={styles.roleRow}>
            {[
              { value: 'customer',     label: 'Customer',      icon: '🧑‍💼' },
              { value: 'garage',       label: 'Garage Owner',  icon: '🔧' },
            ].map(r => (
              <TouchableOpacity
                key={r.value}
                style={[styles.roleBtn, role === r.value && styles.roleBtnActive]}
                onPress={() => setRole(r.value)}
              >
                <Text style={styles.roleIcon}>{r.icon}</Text>
                <Text style={[styles.roleText, role === r.value && styles.roleTextActive]}>
                  {r.label}
                </Text>
                {role === r.value && <View style={styles.roleDot} />}
              </TouchableOpacity>
            ))}
          </View>

          <Field label="Full Name *"      icon="👤" placeholder="Enter your full name"
                 value={name}     onChangeText={setName} />
          <Field label="Email Address *"  icon="📧" placeholder="your@email.com"
                 value={email}    onChangeText={setEmail}
                 keyboardType="email-address" autoCapitalize="none" />
          <Field label="Phone Number"     icon="📱" placeholder="07X XXX XXXX"
                 value={phone}    onChangeText={setPhone} keyboardType="phone-pad" />
          <Field label="Address"          icon="📍" placeholder="Your address"
                 value={address}  onChangeText={setAddress} />

          {/* Password */}
          <Text style={styles.label}>Password *</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput style={styles.input} placeholder="Min. 6 characters"
              placeholderTextColor={COLORS.gray} secureTextEntry={!showPass}
              value={password} onChangeText={setPassword} />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Text style={styles.inputIcon}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm Password *</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput style={styles.input} placeholder="Re-enter password"
              placeholderTextColor={COLORS.gray} secureTextEntry={!showPass}
              value={confirm} onChangeText={setConfirm} />
          </View>

          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color={COLORS.navy} />
              : <Text style={styles.registerBtnText}>Create Account  →</Text>
            }
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.replace('Login')}>
            <Text style={styles.loginBtnText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2024 AutoServe Pro · All Rights Reserved</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: COLORS.navy,
                     paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  topDecor:        { position: 'absolute', top: -60, right: -60, width: 200, height: 200,
                     borderRadius: 100, backgroundColor: COLORS.gold, opacity: 0.07 },
  scroll:          { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 30 },
  headerArea:      { alignItems: 'center', paddingTop: 24, paddingBottom: 20 },
  logoRing:        { width: 72, height: 72, borderRadius: 36, borderWidth: 2,
                     borderColor: COLORS.gold, justifyContent: 'center', alignItems: 'center',
                     backgroundColor: COLORS.cardBg, marginBottom: 12 },
  logoEmoji:       { fontSize: 32 },
  brandName:       { fontSize: 22, fontWeight: '900', color: COLORS.white, letterSpacing: 1, marginBottom: 8 },
  goldLine:        { width: 50, height: 2, backgroundColor: COLORS.gold, borderRadius: 2, marginBottom: 8 },
  headerSub:       { fontSize: 13, color: COLORS.gray },
  card:            { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 24,
                     borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)',
                     shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  cardTitle:       { fontSize: 22, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  cardSub:         { fontSize: 13, color: COLORS.gray, marginBottom: 20 },
  label:           { fontSize: 11, fontWeight: '700', color: COLORS.gold,
                     marginBottom: 7, letterSpacing: 0.8, textTransform: 'uppercase' },
  roleRow:         { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleBtn:         { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
                     borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.2)',
                     backgroundColor: COLORS.navyMid },
  roleBtnActive:   { borderColor: COLORS.gold, backgroundColor: 'rgba(201,168,76,0.1)' },
  roleIcon:        { fontSize: 24, marginBottom: 6 },
  roleText:        { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  roleTextActive:  { color: COLORS.gold, fontWeight: '800' },
  roleDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gold, marginTop: 6 },
  inputWrap:       { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.navyMid,
                     borderRadius: 12, paddingHorizontal: 14, marginBottom: 16,
                     borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  inputIcon:       { fontSize: 17, marginRight: 8 },
  input:           { flex: 1, paddingVertical: 13, fontSize: 15, color: COLORS.white },
  registerBtn:     { backgroundColor: COLORS.gold, borderRadius: 13, paddingVertical: 16,
                     alignItems: 'center', marginTop: 4, marginBottom: 16,
                     shadowColor: COLORS.gold, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 },
  registerBtnText: { color: COLORS.navy, fontWeight: '900', fontSize: 16 },
  dividerRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  divider:         { flex: 1, height: 1, backgroundColor: 'rgba(201,168,76,0.15)' },
  dividerText:     { color: COLORS.gray, fontSize: 13 },
  loginBtn:        { borderRadius: 13, paddingVertical: 15, alignItems: 'center',
                     borderWidth: 1.5, borderColor: COLORS.gold },
  loginBtnText:    { color: COLORS.gold, fontWeight: '700', fontSize: 14 },
  footer:          { textAlign: 'center', color: COLORS.gray, fontSize: 11, marginTop: 24 },
});