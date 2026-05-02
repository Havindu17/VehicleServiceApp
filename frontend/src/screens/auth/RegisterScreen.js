<<<<<<< HEAD
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
=======
import SoundButton from "../../utils/SoundButton";
import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, SafeAreaView, StatusBar,
  ScrollView, Platform, Animated, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../utils/api';

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  navy:       '#08152B',
  navyMid:    '#0F2040',
  navyCard:   '#142035',
  navyLight:  '#1A2D4A',
  gold:       '#C9A84C',
  goldDim:    'rgba(201,168,76,0.12)',
  white:      '#FFFFFF',
  offWhite:   '#E8EDF5',
  gray:       '#6B80A0',
  border:     'rgba(201,168,76,0.18)',
  focusBorder:'rgba(201,168,76,0.7)',
  success:    '#22C55E',
  successBg:  'rgba(34,197,94,0.12)',
  error:      '#EF4444',
  errorBg:    'rgba(239,68,68,0.1)',
  errorBrd:   'rgba(239,68,68,0.4)',
  warning:    '#F59E0B',
};

// ── Password strength logic ────────────────────────────────────────────────
const CHECKS = [
  { key: 'len',    label: 'At least 8 characters',         test: p => p.length >= 8            },
  { key: 'upper',  label: 'One uppercase letter (A-Z)',     test: p => /[A-Z]/.test(p)          },
  { key: 'lower',  label: 'One lowercase letter (a-z)',     test: p => /[a-z]/.test(p)          },
  { key: 'number', label: 'One number (0-9)',                test: p => /[0-9]/.test(p)          },
  { key: 'symbol', label: 'One special character (!@#$…)',  test: p => /[^A-Za-z0-9]/.test(p)   },
];

function getStrength(password) {
  const passed = CHECKS.filter(c => c.test(password)).length;
  if (password.length === 0) return { score: 0, label: '',        color: 'transparent' };
  if (passed <= 1)           return { score: 1, label: 'Weak',    color: C.error   };
  if (passed === 2)          return { score: 2, label: 'Fair',    color: C.warning  };
  if (passed === 3)          return { score: 3, label: 'Good',    color: C.gold     };
  if (passed === 4)          return { score: 4, label: 'Strong',  color: C.success  };
  return                            { score: 5, label: 'Excellent', color: C.success };
}

// ── Password strength bar ──────────────────────────────────────────────────
function StrengthBar({ password }) {
  const s = getStrength(password);
  if (!password) return null;
  return (
    <View style={sbStyles.wrap}>
      <View style={sbStyles.bars}>
        {[1,2,3,4,5].map(i => (
          <View
            key={i}
            style={[sbStyles.segment, {
              backgroundColor: i <= s.score ? s.color : 'rgba(255,255,255,0.07)',
            }]}
          />
        ))}
      </View>
      <Text style={[sbStyles.label, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

const sbStyles = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 4 },
  bars:    { flex: 1, flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  label:   { fontSize: 12, fontWeight: '700', width: 60, textAlign: 'right' },
});

// ── Password checklist ─────────────────────────────────────────────────────
function PasswordChecklist({ password }) {
  if (!password) return null;
  return (
    <View style={clStyles.wrap}>
      {CHECKS.map(c => {
        const ok = c.test(password);
        return (
          <View key={c.key} style={clStyles.row}>
            <View style={[clStyles.dot, { backgroundColor: ok ? C.success : 'rgba(255,255,255,0.1)' }]}>
              {ok && <Text style={clStyles.check}>✓</Text>}
            </View>
            <Text style={[clStyles.text, ok && clStyles.textOk]}>{c.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const clStyles = StyleSheet.create({
  wrap:    { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 14, marginTop: 4, gap: 8 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:     { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  check:   { color: C.navy, fontSize: 10, fontWeight: '900' },
  text:    { fontSize: 12, color: C.gray },
  textOk:  { color: C.offWhite },
});

// ── Animated input field ───────────────────────────────────────────────────
function Field({
  label, icon, value, onChangeText, placeholder,
  keyboardType, secureTextEntry, rightSlot, error,
  autoCapitalize = 'none', onSubmitEditing, inputRef,
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const onFocus = () => Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  const onBlur  = () => Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  const borderColor = error
    ? C.errorBrd
    : anim.interpolate({ inputRange: [0, 1], outputRange: [C.border, C.focusBorder] });

  return (
    <View style={fStyles.wrap}>
      <Text style={[fStyles.label, error && { color: C.error }]}>{label}</Text>
      <Animated.View style={[fStyles.box, { borderColor }, error && { backgroundColor: C.errorBg }]}>
        <Text style={fStyles.icon}>{icon}</Text>
        <TextInput
          ref={inputRef}
          style={fStyles.input}
          placeholder={placeholder}
          placeholderTextColor={C.gray}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType ?? 'default'}
          secureTextEntry={secureTextEntry ?? false}
          autoCapitalize={autoCapitalize}
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
      {error ? <Text style={fStyles.error}>⚠ {error}</Text> : null}
    </View>
  );
}

const fStyles = StyleSheet.create({
  wrap:  { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', color: C.gold, marginBottom: 7, letterSpacing: 0.9, textTransform: 'uppercase' },
  box:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.navyLight, borderRadius: 13, paddingHorizontal: 14, borderWidth: 1.5 },
  icon:  { fontSize: 17, marginRight: 9 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: C.white },
  error: { color: C.error, fontSize: 11, fontWeight: '600', marginTop: 5 },
});

const EyeBtn = ({ show, onPress }) => (
  <SoundButton onPress={onPress} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
    <Text style={{ fontSize: 17 }}>{show ? '🙈' : '👁️'}</Text>
  </SoundButton>
);

// ── Main screen ────────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [role,     setRole]     = useState('customer');
>>>>>>> dev
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [address,  setAddress]  = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
<<<<<<< HEAD
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
=======
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  // input refs for keyboard navigation
  const emailRef   = useRef(null);
  const phoneRef   = useRef(null);
  const addressRef = useRef(null);
  const passRef    = useRef(null);
  const confRef    = useRef(null);

  const strength = useMemo(() => getStrength(password), [password]);

  const isPasswordValid = strength.score >= 3; // Good or above

  const validate = () => {
    const e = {};
    if (!name.trim())                             e.name     = 'Full name is required';
    if (!email.trim())                            e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email))         e.email    = 'Enter a valid email address';
    if (!password)                                e.password = 'Password is required';
    else if (!isPasswordValid)                    e.password = 'Password is too weak';
    if (!confirm)                                 e.confirm  = 'Please confirm your password';
    else if (password !== confirm)                e.confirm  = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await api.post('/auth/register', {
        name:    name.trim(),
        email:   email.trim().toLowerCase(),
        phone:   phone.trim(),
        address: address.trim(),
        password,
        role,
      });
      Alert.alert(
        '✅ Account Created',
        'Your account has been set up successfully. Please sign in to continue.',
        [{ text: 'Sign In', onPress: () => navigation.replace('Login') }],
      );
    } catch (err) {
      setErrors({ api: err?.response?.data?.message ?? 'Could not create account. Please try again.' });
>>>>>>> dev
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
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
=======
  const clearErr = key => setErrors(p => ({ ...p, [key]: null, api: null }));

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: 0 }]} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      <View style={styles.decor1} />
      <View style={styles.decor2} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand header ── */}
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <View style={styles.logoInner}>
                <Text style={{ fontSize: 26 }}>🔧</Text>
              </View>
              <View style={styles.logoRing} />
            </View>
            <Text style={styles.brandName}>AutoServe Pro</Text>
            <View style={styles.goldLine} />
            <Text style={styles.brandTag}>Create your service account</Text>
          </View>

          {/* ── Card ── */}
          <View style={styles.card}>
            <View style={styles.cardAccent} />

            <Text style={styles.cardTitle}>Get Started</Text>
            <Text style={styles.cardSub}>Set up your profile in a few steps</Text>

            {/* API error */}
            {errors.api && (
              <View style={styles.alertBox}>
                <Text style={{ fontSize: 16 }}>🚫</Text>
                <Text style={styles.alertText}>{errors.api}</Text>
              </View>
            )}

            {/* ── Account type ── */}
            <Text style={styles.roleLabel}>Account Type</Text>
            <View style={styles.roleRow}>
              {[
                { value: 'customer', label: 'Customer',     sub: 'Book services',    icon: '🧑‍💼' },
                { value: 'garage',   label: 'Garage Owner', sub: 'Manage your garage', icon: '🏪' },
              ].map(r => (
                <SoundButton
                  key={r.value}
                  style={[styles.roleCard, role === r.value && styles.roleCardActive]}
                  onPress={() => setRole(r.value)}
                  activeOpacity={0.8}
                >
                  {role === r.value && <View style={styles.roleCheck}><Text style={{ fontSize: 10, color: C.navy }}>✓</Text></View>}
                  <Text style={styles.roleEmoji}>{r.icon}</Text>
                  <Text style={[styles.roleTitle, role === r.value && styles.roleTitleActive]}>{r.label}</Text>
                  <Text style={styles.roleSub}>{r.sub}</Text>
                </SoundButton>
              ))}
            </View>

            {/* ── Step 1: Personal info ── */}
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>1</Text></View>
              <Text style={styles.stepTitle}>Personal Information</Text>
            </View>

            <Field label="Full Name *"     icon="👤" placeholder="Enter your full name"
                   value={name}    onChangeText={v => { setName(v);    clearErr('name');    }}
                   autoCapitalize="words" error={errors.name}
                   onSubmitEditing={() => emailRef.current?.focus()} />

            <Field label="Email Address *" icon="📧" placeholder="you@example.com"
                   value={email}   onChangeText={v => { setEmail(v);   clearErr('email');   }}
                   keyboardType="email-address" error={errors.email}
                   inputRef={emailRef}
                   onSubmitEditing={() => phoneRef.current?.focus()} />

            <Field label="Phone Number"    icon="📱" placeholder="07X XXX XXXX"
                   value={phone}   onChangeText={setPhone}
                   keyboardType="phone-pad"
                   inputRef={phoneRef}
                   onSubmitEditing={() => addressRef.current?.focus()} />

            <Field label="Address"         icon="📍" placeholder="Your service address"
                   value={address} onChangeText={setAddress}
                   autoCapitalize="sentences"
                   inputRef={addressRef}
                   onSubmitEditing={() => passRef.current?.focus()} />

            {/* ── Step 2: Security ── */}
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>2</Text></View>
              <Text style={styles.stepTitle}>Account Security</Text>
            </View>

            {/* Password with strength */}
            <Text style={fStyles.label}>Password *</Text>
            <Animated.View style={[fStyles.box, {
              borderColor: errors.password ? C.errorBrd : C.border,
              backgroundColor: errors.password ? C.errorBg : C.navyLight,
            }]}>
              <Text style={fStyles.icon}>🔒</Text>
              <TextInput
                ref={passRef}
                style={fStyles.input}
                placeholder="Create a strong password"
                placeholderTextColor={C.gray}
                secureTextEntry={!showPass}
                value={password}
                onChangeText={v => { setPassword(v); clearErr('password'); }}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                spellCheck={false}
                onSubmitEditing={() => confRef.current?.focus()}
              />
              <EyeBtn show={showPass} onPress={() => setShowPass(s => !s)} />
            </Animated.View>

            {/* strength bar */}
            <StrengthBar password={password} />

            {/* checklist */}
            <PasswordChecklist password={password} />

            {errors.password && <Text style={[fStyles.error, { marginTop: 6 }]}>⚠ {errors.password}</Text>}

            {/* Confirm password with match indicator */}
            <View style={{ marginTop: 14 }}>
              <Text style={[fStyles.label, errors.confirm && { color: C.error }]}>Confirm Password *</Text>
              <Animated.View style={[fStyles.box, {
                borderColor: errors.confirm
                  ? C.errorBrd
                  : confirm && confirm === password
                    ? 'rgba(34,197,94,0.6)'
                    : C.border,
                backgroundColor: errors.confirm ? C.errorBg : C.navyLight,
              }]}>
                <Text style={fStyles.icon}>🔒</Text>
                <TextInput
                  ref={confRef}
                  style={fStyles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor={C.gray}
                  secureTextEntry={!showConf}
                  value={confirm}
                  onChangeText={v => { setConfirm(v); clearErr('confirm'); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  spellCheck={false}
                />
                <EyeBtn show={showConf} onPress={() => setShowConf(s => !s)} />
                {confirm.length > 0 && (
                  <Text style={{ fontSize: 14, marginLeft: 4 }}>
                    {confirm === password ? '✅' : '❌'}
                  </Text>
                )}
              </Animated.View>
              {errors.confirm && <Text style={fStyles.error}>⚠ {errors.confirm}</Text>}
              {!errors.confirm && confirm && confirm === password && (
                <Text style={{ color: C.success, fontSize: 11, fontWeight: '600', marginTop: 5 }}>✓ Passwords match</Text>
              )}
            </View>

            {/* ── Submit ── */}
            <SoundButton
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={C.navy} />
                : <Text style={styles.primaryBtnText}>Create Account  →</Text>
              }
            </SoundButton>

            {/* security badges */}
            <View style={styles.securityBadges}>
              {[
                { icon: '🔐', text: '256-bit SSL' },
                { icon: '🛡️', text: 'Data Protected' },
                { icon: '🔏', text: 'Encrypted' },
              ].map((b, i) => (
                <View key={i} style={styles.badge}>
                  <Text style={styles.badgeIcon}>{b.icon}</Text>
                  <Text style={styles.badgeText}>{b.text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <SoundButton
              style={styles.outlineBtn}
              onPress={() => navigation.replace('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineBtnText}>Already have an account? Sign In</Text>
            </SoundButton>
          </View>

          <Text style={styles.footer}>© 2026 AutoServe Pro · All Rights Reserved</Text>
        </ScrollView>
      </KeyboardAvoidingView>
>>>>>>> dev
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
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
=======
  safe:      { flex: 1, backgroundColor: C.navy },
  decor1:    { position: 'absolute', top: -70, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: C.gold, opacity: 0.05 },
  decor2:    { position: 'absolute', top: 120, left: -70,  width: 170, height: 170, borderRadius: 85,  backgroundColor: C.gold, opacity: 0.03 },
  scroll:    { paddingHorizontal: 20, paddingBottom: 36 },

  // Brand
  brand:     { alignItems: 'center', marginBottom: 24 },
  logoWrap:  { width: 80, height: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 12, position: 'relative' },
  logoInner: { width: 64, height: 64, borderRadius: 20, backgroundColor: C.navyCard, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: C.gold },
  logoRing:  { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)', borderStyle: 'dashed' },
  brandName: { fontSize: 22, fontWeight: '900', color: C.white, letterSpacing: 1.2, marginBottom: 7 },
  goldLine:  { width: 40, height: 2.5, backgroundColor: C.gold, borderRadius: 2, marginBottom: 8 },
  brandTag:  { fontSize: 12, color: C.gray },

  // Card
  card:      { backgroundColor: C.navyCard, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardAccent:{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: C.gold },
  cardTitle: { fontSize: 22, fontWeight: '800', color: C.white, marginTop: 4, marginBottom: 4 },
  cardSub:   { fontSize: 13, color: C.gray, marginBottom: 20 },

  // Alert
  alertBox:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  alertText: { color: C.error, fontSize: 13, fontWeight: '600', flex: 1 },

  // Role
  roleLabel: { fontSize: 11, fontWeight: '700', color: C.gold, marginBottom: 10, letterSpacing: 0.9, textTransform: 'uppercase' },
  roleRow:   { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleCard:  { flex: 1, backgroundColor: C.navyLight, borderRadius: 16, padding: 14, alignItems: 'center',
                borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.15)', position: 'relative' },
  roleCardActive: { borderColor: C.gold, backgroundColor: C.goldDim },
  roleCheck: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: C.gold, justifyContent: 'center', alignItems: 'center' },
  roleEmoji: { fontSize: 22, marginBottom: 7 },
  roleTitle: { fontSize: 13, fontWeight: '700', color: C.gray, marginBottom: 3 },
  roleTitleActive: { color: C.gold },
  roleSub:   { fontSize: 10, color: C.gray, textAlign: 'center' },

  // Step
  stepHeader:{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 6 },
  stepBadge: { width: 26, height: 26, borderRadius: 8, backgroundColor: C.gold, justifyContent: 'center', alignItems: 'center' },
  stepNum:   { color: C.navy, fontWeight: '900', fontSize: 13 },
  stepTitle: { fontSize: 14, fontWeight: '800', color: C.white },

  // Buttons
  primaryBtn:        { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20, marginBottom: 14 },
  primaryBtnDisabled:{ opacity: 0.6 },
  primaryBtnText:    { color: C.navy, fontWeight: '900', fontSize: 16, letterSpacing: 0.4 },

  // Security badges
  securityBadges: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 18 },
  badge:          { flexDirection: 'row', alignItems: 'center', gap: 5 },
  badgeIcon:      { fontSize: 12 },
  badgeText:      { fontSize: 10, color: C.gray },

  // Divider
  divider:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerLabel:{ color: C.gray, fontSize: 13 },

  outlineBtn:     { borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1.5, borderColor: C.gold },
  outlineBtnText: { color: C.gold, fontWeight: '700', fontSize: 14 },

  footer: { textAlign: 'center', color: C.gray, fontSize: 11, marginTop: 24 },
>>>>>>> dev
});