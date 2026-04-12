import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, SafeAreaView, StatusBar,
  ScrollView, Platform
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const COLORS = {
  navy:     '#0B1D3A',
  navyMid:  '#132847',
  gold:     '#C9A84C',
  goldLight:'#E8C97A',
  white:    '#FFFFFF',
  gray:     '#8A9BB5',
  cardBg:   '#162040',
  error:    '#EF4444',
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter email and password');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      await login(res.data.token, res.data.user.role, res.data.user);
    } catch (err) {
      Alert.alert('Login Failed', err?.response?.data?.message ?? 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerSub}>Sign in to your account</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSub}>Enter your credentials to continue</Text>

          {/* Email */}
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>📧</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={COLORS.gray}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.gray}
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Text style={styles.inputIcon}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color={COLORS.navy} />
              : <Text style={styles.loginBtnText}>Sign In  →</Text>
            }
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerBtnText}>Create New Account</Text>
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
  headerArea:      { alignItems: 'center', paddingTop: 30, paddingBottom: 24 },
  logoRing:        { width: 80, height: 80, borderRadius: 40, borderWidth: 2,
                     borderColor: COLORS.gold, justifyContent: 'center', alignItems: 'center',
                     backgroundColor: COLORS.cardBg, marginBottom: 14 },
  logoEmoji:       { fontSize: 36 },
  brandName:       { fontSize: 24, fontWeight: '900', color: COLORS.white, letterSpacing: 1, marginBottom: 8 },
  goldLine:        { width: 50, height: 2, backgroundColor: COLORS.gold, borderRadius: 2, marginBottom: 10 },
  headerSub:       { fontSize: 13, color: COLORS.gray, letterSpacing: 0.5 },
  card:            { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 24,
                     borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)',
                     shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  cardTitle:       { fontSize: 22, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  cardSub:         { fontSize: 13, color: COLORS.gray, marginBottom: 24 },
  label:           { fontSize: 12, fontWeight: '700', color: COLORS.gold,
                     marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  inputWrap:       { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.navyMid,
                     borderRadius: 12, paddingHorizontal: 14, marginBottom: 18,
                     borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  inputIcon:       { fontSize: 18, marginRight: 8 },
  input:           { flex: 1, paddingVertical: 14, fontSize: 15, color: COLORS.white },
  loginBtn:        { backgroundColor: COLORS.gold, borderRadius: 13, paddingVertical: 16,
                     alignItems: 'center', marginTop: 4, marginBottom: 18,
                     shadowColor: COLORS.gold, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 },
  loginBtnText:    { color: COLORS.navy, fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  dividerRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 10 },
  divider:         { flex: 1, height: 1, backgroundColor: 'rgba(201,168,76,0.15)' },
  dividerText:     { color: COLORS.gray, fontSize: 13 },
  registerBtn:     { borderRadius: 13, paddingVertical: 15, alignItems: 'center',
                     borderWidth: 1.5, borderColor: COLORS.gold },
  registerBtnText: { color: COLORS.gold, fontWeight: '700', fontSize: 15 },
  footer:          { textAlign: 'center', color: COLORS.gray, fontSize: 11, marginTop: 24 },
});