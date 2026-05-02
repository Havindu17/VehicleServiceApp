<<<<<<< HEAD
=======
import SoundButton from "../../utils/SoundButton";
>>>>>>> dev
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Platform, Dimensions
} from 'react-native';

const { width, height } = Dimensions.get('window');

const COLORS = {
  navy:    '#0B1D3A',
  navyMid: '#132847',
  gold:    '#C9A84C',
  goldLight:'#E8C97A',
  white:   '#FFFFFF',
  gray:    '#8A9BB5',
  cardBg:  '#162040',
};

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Top Decoration */}
      <View style={styles.topDecor} />
      <View style={styles.topDecor2} />

      <View style={styles.container}>

        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Text style={styles.logoEmoji}>🔧</Text>
            </View>
          </View>
          <View style={styles.goldLine} />
<<<<<<< HEAD
          <Text style={styles.brandName}>AutoServe Pro</Text>
=======
          <Text style={styles.brandName}>AUTO SERVE PRO</Text>
>>>>>>> dev
          <Text style={styles.brandTagline}>VEHICLE SERVICE CENTER</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresBox}>
          {[
            { icon: '🛡️', text: 'Trusted Service Professionals' },
            { icon: '⚡', text: 'Fast & Reliable Repairs' },
            { icon: '📊', text: 'Real-Time Booking Tracking' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconBg}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.btnArea}>
<<<<<<< HEAD
          <TouchableOpacity
=======
          <SoundButton
>>>>>>> dev
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.primaryBtnText}>Sign In to Account</Text>
            <Text style={styles.btnArrow}>→</Text>
<<<<<<< HEAD
          </TouchableOpacity>

          <TouchableOpacity
=======
          </SoundButton>

          <SoundButton
>>>>>>> dev
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.secondaryBtnText}>Create New Account</Text>
<<<<<<< HEAD
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2024 AutoServe Pro · All Rights Reserved</Text>
=======
          </SoundButton>
        </View>

        <Text style={styles.footer}>© 2026 AutoServe Pro · All Rights Reserved</Text>
>>>>>>> dev
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLORS.navy,
                    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  topDecor:       { position: 'absolute', top: -80, right: -80, width: 260, height: 260,
                    borderRadius: 130, backgroundColor: COLORS.gold, opacity: 0.07 },
  topDecor2:      { position: 'absolute', top: 60, right: -40, width: 160, height: 160,
                    borderRadius: 80, backgroundColor: COLORS.gold, opacity: 0.05 },
  container:      { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between', paddingVertical: 30 },
  logoArea:       { alignItems: 'center', marginTop: 20 },
  logoRing:       { width: 120, height: 120, borderRadius: 60, borderWidth: 2,
                    borderColor: COLORS.gold, justifyContent: 'center', alignItems: 'center',
                    marginBottom: 20, backgroundColor: COLORS.cardBg },
  logoInner:      { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.navyMid,
                    justifyContent: 'center', alignItems: 'center' },
  logoEmoji:      { fontSize: 44 },
  goldLine:       { width: 60, height: 2, backgroundColor: COLORS.gold, marginBottom: 16, borderRadius: 2 },
  brandName:      { fontSize: 32, fontWeight: '900', color: COLORS.white, letterSpacing: 1, marginBottom: 6 },
  brandTagline:   { fontSize: 11, color: COLORS.gold, letterSpacing: 3, fontWeight: '700' },
  featuresBox:    { backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 20,
                    borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  featureRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  featureIconBg:  { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(201,168,76,0.12)',
                    justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  featureIcon:    { fontSize: 20 },
  featureText:    { fontSize: 14, color: COLORS.white, fontWeight: '600', flex: 1 },
  btnArea:        { gap: 12 },
  primaryBtn:     { backgroundColor: COLORS.gold, borderRadius: 14, paddingVertical: 17,
                    paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'center',
                    alignItems: 'center', gap: 8,
                    shadowColor: COLORS.gold, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  primaryBtnText: { color: COLORS.navy, fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  btnArrow:       { color: COLORS.navy, fontSize: 18, fontWeight: '900' },
  secondaryBtn:   { borderRadius: 14, paddingVertical: 16, alignItems: 'center',
                    borderWidth: 1.5, borderColor: COLORS.gold, backgroundColor: 'transparent' },
  secondaryBtnText:{ color: COLORS.gold, fontWeight: '700', fontSize: 15 },
  footer:         { textAlign: 'center', color: COLORS.gray, fontSize: 11 },
});