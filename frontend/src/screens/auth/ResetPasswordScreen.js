import SoundButton from "../../utils/SoundButton";
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  ActivityIndicator, SafeAreaView, StatusBar,
  ScrollView, Platform, Animated, KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../utils/api';

const C = {
  navy:      '#08152B',
  navyMid:   '#0F2040',
  navyCard:  '#142035',
  navyLight: '#1A2D4A',
  gold:      '#C9A84C',
  goldDim:   'rgba(201,168,76,0.12)',
  white:     '#FFFFFF',
  gray:      '#6B80A0',
  border:    'rgba(201,168,76,0.18)',
  error:     '#EF4444',
  errorBg:   'rgba(239,68,68,0.1)',
  focusBorder:'rgba(201,168,76,0.7)',
};

function PasswordField({ label, value, onChangeText, placeholder, secureTextEntry, onSubmitEditing, error, rightSlot }) {
  const anim = useRef(new Animated.Value(0)).current;
  const onFocus = () => Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  const onBlur = () => Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  const borderColor = error ? C.error : anim.interpolate({ inputRange: [0, 1], outputRange: [C.border, C.focusBorder] });

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, error && { color: C.error }]}>{label}</Text>
      <Animated.View style={[styles.inputBox, { borderColor }, error && { backgroundColor: C.errorBg }]}> 
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={C.gray}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={onSubmitEditing ? 'next' : 'done'}
        />
        {rightSlot}
      </Animated.View>
      {error ? <Text style={styles.errorText}>⚠ {error}</Text> : null}
    </View>
  );
}

export default function ResetPasswordScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState(route?.params?.email ?? '');
  const [codes, setCodes] = useState(Array(5).fill(''));
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [timer, setTimer] = useState(300);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (timer <= 0) return undefined;
    const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTimer = () => {
    const minutes = Math.floor(timer / 60).toString().padStart(2, '0');
    const seconds = (timer % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleCodeChange = (index, value) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const updated = [...codes];
    updated[index] = digit;
    setCodes(updated);
    if (digit && index < 4) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index, event) => {
    if (event.nativeEvent.key === 'Backspace' && !codes[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
      const updated = [...codes];
      updated[index - 1] = '';
      setCodes(updated);
    }
  };

  const resetCode = codes.join('');

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address';
    if (resetCode.length !== 5) e.code = 'Enter the 5-digit code';
    if (!password) e.password = 'New password is required';
    if (!confirm) e.confirm = 'Confirm your new password';
    else if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        code: resetCode,
        password,
        confirmPassword: confirm,
      });
      Alert.alert('Password Updated', 'Your password has been reset. Please sign in.', [
        { text: 'OK', onPress: () => navigation.replace('Login') },
      ]);
    } catch (err) {
      setErrors({ api: err?.response?.data?.message ?? 'Could not reset password' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Email is required to resend code' });
      return;
    }
    try {
      setLoading(true);
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setTimer(300);
      setCodes(Array(5).fill(''));
      otpRefs.current[0]?.focus();
      Alert.alert('Code Sent', 'A fresh 5-digit code has been emailed to you.');
    } catch (err) {
      setErrors({ api: err?.response?.data?.message ?? 'Could not resend code' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: 0 }]} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 24 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <View style={styles.logoInner}><Text style={{ fontSize: 28 }}>🔑</Text></View>
            </View>
            <Text style={styles.title}>Enter Reset Code</Text>
            <Text style={styles.subtitle}>Type the 5-digit code from your email and choose a new password.</Text>
          </View>

          <View style={styles.card}>
            {errors.api && <Text style={styles.errorBox}>{errors.api}</Text>}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email Address</Text>
              <Animated.View style={[styles.inputBox, { borderColor: errors.email ? C.error : C.border }]}> 
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={C.gray}
                  value={email}
                  onChangeText={value => { setEmail(value); setErrors(p => ({ ...p, email: null, api: null })); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  spellCheck={false}
                  keyboardType="email-address"
                  returnKeyType="done"
                />
              </Animated.View>
              {errors.email && <Text style={styles.errorText}>⚠ {errors.email}</Text>}
            </View>

            <Text style={[styles.label, { marginBottom: 12 }]}>OTP Code</Text>
            <View style={styles.otpRow}>
              {codes.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => (otpRefs.current[index] = ref)}
                  style={[styles.otpInput, errors.code && { borderColor: C.error }]}
                  value={digit}
                  onChangeText={value => handleCodeChange(index, value)}
                  onKeyPress={event => handleKeyPress(index, event)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  returnKeyType={index === 4 ? 'next' : 'next'}
                />
              ))}
            </View>
            {errors.code ? <Text style={styles.errorText}>⚠ {errors.code}</Text> : null}

            <Text style={styles.timer}>{timer > 0 ? `Expires in ${formatTimer()}` : 'Code expired'}</Text>
            <SoundButton style={styles.resendBtn} onPress={handleResend} activeOpacity={0.85}>
              <Text style={styles.resendText}>{timer > 0 ? 'Resend Code' : 'Send New Code'}</Text>
            </SoundButton>

            <PasswordField
              label="New Password"
              value={password}
              onChangeText={value => { setPassword(value); setErrors(p => ({ ...p, password: null, api: null })); }}
              placeholder="Enter new password"
              secureTextEntry={!showPass}
              onSubmitEditing={() => null}
              error={errors.password}
              rightSlot={<SoundButton onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}><Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text></SoundButton>}
            />
            <PasswordField
              label="Confirm Password"
              value={confirm}
              onChangeText={value => { setConfirm(value); setErrors(p => ({ ...p, confirm: null, api: null })); }}
              placeholder="Confirm new password"
              secureTextEntry={!showConfirm}
              onSubmitEditing={handleReset}
              error={errors.confirm}
              rightSlot={<SoundButton onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}><Text style={styles.eyeText}>{showConfirm ? '🙈' : '👁️'}</Text></SoundButton>}
            />

            <SoundButton style={[styles.primaryBtn, loading && styles.disabledBtn]} onPress={handleReset} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color={C.navy} /> : <Text style={styles.primaryText}>Reset Password</Text>}
            </SoundButton>

            <SoundButton style={styles.linkBtn} onPress={() => navigation.replace('Login')} activeOpacity={0.85}>
              <Text style={styles.linkText}>Back to login</Text>
            </SoundButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
  container: { paddingHorizontal: 22, paddingBottom: 36 },
  brand: { alignItems: 'center', marginBottom: 28 },
  logoWrap: { width: 84, height: 84, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  logoInner: { width: 68, height: 68, borderRadius: 22, backgroundColor: C.navyCard, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: C.gold },
  title: { fontSize: 24, fontWeight: '900', color: C.white, marginBottom: 8 },
  subtitle: { fontSize: 13, color: C.gray, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  card: { backgroundColor: C.navyCard, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: C.border },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', color: C.gold, marginBottom: 7, letterSpacing: 0.9, textTransform: 'uppercase' },
  inputBox: { backgroundColor: C.navyLight, borderRadius: 13, borderWidth: 1.5, paddingHorizontal: 14 },
  input: { height: 50, fontSize: 15, color: C.white },
  errorText: { color: C.error, fontSize: 11, fontWeight: '600', marginTop: 5 },
  errorBox: { color: C.error, backgroundColor: C.errorBg, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  otpInput: { width: 56, height: 56, borderRadius: 16, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.navyLight, color: C.white, fontSize: 24, fontWeight: '700' },
  timer: { color: C.gray, marginBottom: 10, textAlign: 'center' },
  resendBtn: { alignSelf: 'center', marginBottom: 18 },
  resendText: { color: C.gold, fontSize: 14 },
  fieldWrap: { marginBottom: 16 },
  inputBox: { backgroundColor: C.navyLight, borderRadius: 13, borderWidth: 1.5, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, height: 50, fontSize: 15, color: C.white },
  eyeBtn: { padding: 10 },
  eyeText: { fontSize: 16 },
  primaryBtn: { backgroundColor: C.gold, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  disabledBtn: { opacity: 0.7 },
  primaryText: { color: C.navy, fontWeight: '800', fontSize: 15 },
  linkBtn: { marginTop: 14, alignItems: 'center' },
  linkText: { color: C.white, fontSize: 14, textDecorationLine: 'underline' },
});
