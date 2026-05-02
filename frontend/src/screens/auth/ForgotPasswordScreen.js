import SoundButton from "../../utils/SoundButton";
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  ActivityIndicator, SafeAreaView, StatusBar,
  ScrollView, Platform, Animated, KeyboardAvoidingView,
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

function Field({ label, value, onChangeText, placeholder, error, onSubmitEditing, inputRef }) {
  const anim = useRef(new Animated.Value(0)).current;
  const onFocus = () => Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  const onBlur = () => Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  const borderColor = error ? C.error : anim.interpolate({ inputRange: [0, 1], outputRange: [C.border, C.focusBorder] });

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, error && { color: C.error }]}>{label}</Text>
      <Animated.View style={[styles.inputBox, { borderColor }, error && { backgroundColor: C.errorBg }]}> 
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={C.gray}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={onSubmitEditing ? 'send' : 'done'}
          keyboardType="email-address"
        />
      </Animated.View>
      {error ? <Text style={styles.errorText}>⚠ {error}</Text> : null}
    </View>
  );
}

export default function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSendCode = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      navigation.navigate('ResetPassword', { email: email.trim().toLowerCase() });
    } catch (err) {
      setErrors({ api: err?.response?.data?.message ?? 'Could not send reset email' });
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
              <View style={styles.logoInner}><Text style={{ fontSize: 28 }}>🔐</Text></View>
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a 5-digit reset code.</Text>
          </View>

          <View style={styles.card}>
            {errors.api && <Text style={styles.errorBox}>{errors.api}</Text>}
            <Field
              label="Email Address"
              value={email}
              onChangeText={value => { setEmail(value); setErrors(p => ({ ...p, email: null, api: null })); }}
              placeholder="you@example.com"
              error={errors.email}
              onSubmitEditing={handleSendCode}
              inputRef={emailRef}
            />

            <SoundButton style={[styles.primaryBtn, loading && styles.disabledBtn]} onPress={handleSendCode} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color={C.navy} /> : <Text style={styles.primaryText}>Send Reset Code</Text>}
            </SoundButton>

            <SoundButton style={styles.linkBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
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
  primaryBtn: { backgroundColor: C.gold, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  disabledBtn: { opacity: 0.7 },
  primaryText: { color: C.navy, fontWeight: '800', fontSize: 15 },
  linkBtn: { marginTop: 14, alignItems: 'center' },
  linkText: { color: C.white, fontSize: 14, textDecorationLine: 'underline' },
});
