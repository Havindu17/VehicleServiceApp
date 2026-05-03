import SoundButton from "../../utils/SoundButton";
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView, StatusBar,
  ScrollView, Platform, Animated, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  navy:        '#08152B',
  navyMid:     '#0F2040',
  navyCard:    '#142035',
  navyLight:   '#1A2D4A',
  gold:        '#C9A84C',
  goldDim:     'rgba(201,168,76,0.12)',
  white:       '#FFFFFF',
  offWhite:    '#E8EDF5',
  gray:        '#6B80A0',
  border:      'rgba(201,168,76,0.18)',
  focusBorder: 'rgba(201,168,76,0.7)',
  success:     '#22C55E',
  error:       '#EF4444',
  errorBg:     'rgba(239,68,68,0.06)',
  errorBrd:    'rgba(239,68,68,0.2)',
};

// ── Premium Alert Banner ───────────────────────────────────────────────────
function AlertBanner({ type = 'error', title, message, onDismiss }) {
  const slideAnim = useRef(new Animated.Value(-8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim,   { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(scaleAnim,   { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }),
    ]).start();
  }, []);

  const cfg = {
    error: {
      accent:     '#EF4444',
      iconBg:     'rgba(239,68,68,0.14)',
      iconBorder: 'rgba(239,68,68,0.25)',
      titleColor: '#FF6B6B',
      msgColor:   '#F5A5A5',
      bg:         'rgba(239,68,68,0.06)',
      border:     'rgba(239,68,68,0.2)',
      icon:       '⚠',
    },
    warning: {
      accent:     '#F59E0B',
      iconBg:     'rgba(245,158,11,0.14)',
      iconBorder: 'rgba(245,158,11,0.25)',
      titleColor: '#FCD34D',
      msgColor:   '#FDE68A',
      bg:         'rgba(245,158,11,0.06)',
      border:     'rgba(245,158,11,0.2)',
      icon:       '🕐',
    },
    info: {
      accent:     '#3B82F6',
      iconBg:     'rgba(59,130,246,0.14)',
      iconBorder: 'rgba(59,130,246,0.25)',
      titleColor: '#93C5FD',
      msgColor:   '#BFDBFE',
      bg:         'rgba(59,130,246,0.06)',
      border:     'rgba(59,130,246,0.2)',
      icon:       'ℹ',
    },
  };

  const s = cfg[type] || cfg.error;

  return (
    <Animated.View
      style={[
        styles.alertBox,
        {
          backgroundColor: s.bg,
          borderColor:     s.border,
          transform:       [{ translateY: slideAnim }, { scale: scaleAnim }],
          opacity:         opacityAnim,
        },
      ]}
    >
      {/* left accent bar */}
      <View style={[styles.alertAccentBar, { backgroundColor: s.accent }]} />

      {/* icon circle */}
      <View style={[styles.alertIconWrap, { backgroundColor: s.iconBg, borderColor: s.iconBorder }]}>
        <Text style={[styles.alertIconText, { color: s.accent }]}>{s.icon}</Text>
      </View>

      {/* text content */}
      <View style={{ flex: 1 }}>
        <Text style={[styles.alertTitle, { color: s.titleColor }]}>{title}</Text>
        <Text style={[styles.alertMessage, { color: s.msgColor }]}>{message}</Text>
      </View>

      {/* dismiss button */}
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.alertDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.alertDismissText, { color: s.accent }]}>✕</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ── Helper: detect error type from message ─────────────────────────────────
function classifyError(msg = '') {
  const m = msg.toLowerCase();
  if (
    m.includes('pending') ||
    m.includes('approval') ||
    m.includes('verify') ||
    m.includes('not verified') ||
    m.includes('not approved')
  ) {
    return {
      type:  'warning',
      title: 'ACCOUNT PENDING',
    };
  }
  if (
    m.includes('invalid') ||
    m.includes('incorrect') ||
    m.includes('wrong') ||
    m.includes('not found') ||
    m.includes('unauthorized')
  ) {
    return {
      type:  'error',
      title: 'AUTHENTICATION FAILED',
    };
  }
  if (
    m.includes('network') ||
    m.includes('timeout') ||
    m.includes('connection') ||
    m.includes('server')
  ) {
    return {
      type:  'info',
      title: 'CONNECTION ERROR',
    };
  }
  return {
    type:  'error',
    title: 'ACCESS RESTRICTED',
  };
}

// ── Animated input field ───────────────────────────────────────────────────
function SecureField({
  label, icon, value, onChangeText, placeholder,
  keyboardType, secureTextEntry, rightSlot, error,
  autoCapitalize = 'none', onSubmitEditing, inputRef,
}) {
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () =>
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  const onBlur = () =>
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();

  const borderColor = error
    ? C.errorBrd
    : borderAnim.interpolate({ inputRange: [0, 1], outputRange: [C.border, C.focusBorder] });

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, error && { color: C.error }]}>{label}</Text>
      <Animated.View style={[styles.inputBox, { borderColor }, error && { backgroundColor: C.errorBg }]}>
        <Text style={styles.inputEmoji}>{icon}</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
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
      {error ? <Text style={styles.fieldError}>⚠ {error}</Text> : null}
    </View>
  );
}

// ── Eye toggle button ──────────────────────────────────────────────────────
const EyeBtn = ({ show, onPress }) => (
  <SoundButton onPress={onPress} style={styles.eyeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
    <Text style={styles.eyeIcon}>{show ? '🙈' : '👁️'}</Text>
  </SoundButton>
);

// ── Main screen ────────────────────────────────────────────────────────────
export default function LoginScreen({ navigation }) {
  const insets      = useSafeAreaInsets();
  const { login }   = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  const passRef = useRef(null);

  const validate = () => {
    const e = {};
    if (!email.trim())                    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email    = 'Enter a valid email address';
    if (!password)                        e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
      await login(res.data.token, res.data.user.role, res.data.user);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Invalid email or password';
      setErrors({ api: msg });
    } finally {
      setLoading(false);
    }
  };

  // Classify the API error for proper banner styling
  const apiError    = errors.api ? classifyError(errors.api) : null;

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: 0 }]} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* decorative rings */}
      <View style={styles.decor1} />
      <View style={styles.decor2} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand header ── */}
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <View style={styles.logoInner}>
                <Text style={{ fontSize: 28 }}>🔧</Text>
              </View>
              <View style={styles.logoRing} />
            </View>
            <Text style={styles.brandName}>AutoServe Pro</Text>
            <View style={styles.goldLine} />
            <Text style={styles.brandTag}>Professional Service Management</Text>
          </View>

          {/* ── Card ── */}
          <View style={styles.card}>
            {/* card top accent */}
            <View style={styles.cardAccent} />

            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSub}>Sign in to manage your service center</Text>

            {/* ── Premium API error banner ── */}
            {errors.api && (
              <AlertBanner
                key={errors.api}
                type={apiError.type}
                title={apiError.title}
                message={errors.api}
                onDismiss={() => setErrors(p => ({ ...p, api: null }))}
              />
            )}

            <SecureField
              label="Email Address"
              icon="📧"
              placeholder="you@example.com"
              value={email}
              onChangeText={v => { setEmail(v); setErrors(p => ({ ...p, email: null, api: null })); }}
              keyboardType="email-address"
              error={errors.email}
              onSubmitEditing={() => passRef.current?.focus()}
              inputRef={null}
            />

            <SecureField
              label="Password"
              icon="🔒"
              placeholder="Enter your password"
              value={password}
              onChangeText={v => { setPassword(v); setErrors(p => ({ ...p, password: null, api: null })); }}
              secureTextEntry={!showPass}
              error={errors.password}
              inputRef={passRef}
              onSubmitEditing={handleLogin}
              rightSlot={<EyeBtn show={showPass} onPress={() => setShowPass(s => !s)} />}
            />

            {/* forgot password */}
            <SoundButton style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </SoundButton>

            {/* sign in */}
            <SoundButton
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={C.navy} />
                : <Text style={styles.primaryBtnText}>Sign In  →</Text>
              }
            </SoundButton>

            {/* security note */}
            <View style={styles.secureNote}>
              <Text style={styles.secureIcon}>🔐</Text>
              <Text style={styles.secureText}>256-bit encrypted · Your data is safe</Text>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <SoundButton
              style={styles.outlineBtn}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineBtnText}>Create New Account</Text>
            </SoundButton>
          </View>

          <Text style={styles.footer}>© 2026 AutoServe Pro · All Rights Reserved</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: C.navy },

  // Decorative
  decor1: { position: 'absolute', top: -70, right: -50,  width: 200, height: 200, borderRadius: 100, backgroundColor: C.gold, opacity: 0.05 },
  decor2: { position: 'absolute', top: 80,  left: -60,   width: 160, height: 160, borderRadius: 80,  backgroundColor: C.gold, opacity: 0.03 },

  scroll: { paddingHorizontal: 22, paddingBottom: 36 },

  // Brand
  brand:     { alignItems: 'center', marginBottom: 28 },
  logoWrap:  { width: 84, height: 84, justifyContent: 'center', alignItems: 'center', marginBottom: 14, position: 'relative' },
  logoInner: { width: 68, height: 68, borderRadius: 22, backgroundColor: C.navyCard,
                justifyContent: 'center', alignItems: 'center',
                borderWidth: 2, borderColor: C.gold },
  logoRing:  { position: 'absolute', width: 84, height: 84, borderRadius: 42,
                borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)', borderStyle: 'dashed' },
  brandName: { fontSize: 24, fontWeight: '900', color: C.white, letterSpacing: 1.2, marginBottom: 8 },
  goldLine:  { width: 44, height: 2.5, backgroundColor: C.gold, borderRadius: 2, marginBottom: 9 },
  brandTag:  { fontSize: 12, color: C.gray, letterSpacing: 0.5 },

  // Card
  card:       { backgroundColor: C.navyCard, borderRadius: 24, padding: 24,
                 borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: C.gold },
  cardTitle:  { fontSize: 22, fontWeight: '800', color: C.white, marginTop: 4, marginBottom: 4 },
  cardSub:    { fontSize: 13, color: C.gray, marginBottom: 22 },

  // ── Premium Alert Banner ──────────────────────────────────────────────
  alertBox: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            12,
    borderRadius:   16,
    paddingVertical: 13,
    paddingRight:   14,
    paddingLeft:    18,   // room for the accent bar
    marginBottom:   20,
    borderWidth:    1,
    overflow:       'hidden',
  },
  alertAccentBar: {
    position: 'absolute',
    left:     0,
    top:      0,
    bottom:   0,
    width:    3,
  },
  alertIconWrap: {
    width:        34,
    height:       34,
    borderRadius: 17,
    borderWidth:  1,
    justifyContent: 'center',
    alignItems:   'center',
    flexShrink:   0,
  },
  alertIconText:  { fontSize: 15, fontWeight: '700' },
  alertTitle:     { fontSize: 10, fontWeight: '800', letterSpacing: 1.0, marginBottom: 3 },
  alertMessage:   { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  alertDismiss:   {
    width:          22,
    height:         22,
    borderRadius:   11,
    backgroundColor:'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems:     'center',
    flexShrink:     0,
  },
  alertDismissText: { fontSize: 11, fontWeight: '700' },

  // Field
  fieldWrap:  { marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: C.gold, marginBottom: 7,
                 letterSpacing: 0.9, textTransform: 'uppercase' },
  inputBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.navyLight,
                 borderRadius: 13, paddingHorizontal: 14, borderWidth: 1.5 },
  inputEmoji: { fontSize: 17, marginRight: 9 },
  input:      { flex: 1, paddingVertical: 14, fontSize: 15, color: C.white },
  fieldError: { color: '#EF4444', fontSize: 11, fontWeight: '600', marginTop: 5 },
  eyeBtn:     { paddingLeft: 6 },
  eyeIcon:    { fontSize: 17 },

  // Buttons
  forgotBtn:          { alignSelf: 'flex-end', marginBottom: 20, marginTop: -6 },
  forgotText:         { color: C.gold, fontSize: 13, fontWeight: '600' },
  primaryBtn:         { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 16,
                         alignItems: 'center', marginBottom: 16 },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText:     { color: C.navy, fontWeight: '900', fontSize: 16, letterSpacing: 0.4 },

  // Security note
  secureNote: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
                 gap: 6, marginBottom: 20 },
  secureIcon: { fontSize: 13 },
  secureText: { fontSize: 11, color: C.gray },

  // Divider
  divider:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: C.border },
  dividerLabel: { color: C.gray, fontSize: 13 },

  outlineBtn:     { borderRadius: 14, paddingVertical: 15, alignItems: 'center',
                     borderWidth: 1.5, borderColor: C.gold },
  outlineBtnText: { color: C.gold, fontWeight: '700', fontSize: 14 },

  footer: { textAlign: 'center', color: C.gray, fontSize: 11, marginTop: 26 },
});