<<<<<<< HEAD
=======
import SoundButton from "../../utils/SoundButton";
>>>>>>> dev
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, ActivityIndicator, RefreshControl,
  TextInput, Platform
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const COLORS = {
  navy:    '#0B1D3A',
  navyMid: '#132847',
  gold:    '#C9A84C',
  white:   '#FFFFFF',
  gray:    '#8A9BB5',
  cardBg:  '#162040',
  success: '#16A34A',
  warning: '#F59E0B',
  error:   '#EF4444',
  info:    '#2563EB',
};

const STATUS_COLOR = {
  pending:   COLORS.warning,
  confirmed: COLORS.info,
  completed: COLORS.success,
  cancelled: COLORS.error,
};

export default function CustomerDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [garages,  setGarages]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [refresh,  setRefresh]  = useState(false);
  const [search,   setSearch]   = useState('');

  const fetchData = async () => {
    try {
      const [bRes, gRes] = await Promise.all([
        api.get('/customer/bookings?limit=3'),
        api.get('/customer/garages?limit=6'),
      ]);
      setBookings(bRes.data);
      setGarages(gRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefresh(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerDecor} />
        <View>
          <Text style={styles.greeting}>Hello, 👋</Text>
          <Text style={styles.userName}>{user?.name ?? 'Customer'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
<<<<<<< HEAD
          <TouchableOpacity style={styles.profileBtn}
            onPress={() => navigation.navigate('CustomerProfile')}>
            <Text style={styles.profileBtnText}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Exit</Text>
          </TouchableOpacity>
=======
          <SoundButton style={styles.profileBtn}
            onPress={() => navigation.navigate('CustomerProfile')}>
            <Text style={styles.profileBtnText}>👤</Text>
          </SoundButton>
          <SoundButton onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Exit</Text>
          </SoundButton>
>>>>>>> dev
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refresh}
            onRefresh={() => { setRefresh(true); fetchData(); }}
            tintColor={COLORS.gold} />
        }
      >
        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search garages near you..."
            placeholderTextColor={COLORS.gray}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickRow}>
          {[
<<<<<<< HEAD
            { label: 'My Profile',   icon: '👤', screen: 'CustomerProfile', color: COLORS.success },
            { label: 'Book Service', icon: '📅', screen: 'CustomerBooking',  color: COLORS.gold    },
            { label: 'My History',   icon: '📋', screen: 'ServiceHistory',   color: COLORS.info    },
            { label: 'Feedback',     icon: '⭐', screen: 'CustomerFeedback', color: COLORS.warning },
          ].map((a, i) => (
            <TouchableOpacity key={i} style={styles.quickCard}
=======
{ label: 'My Profile',   icon: '👤', screen: 'CustomerProfile', color: COLORS.success },
{ label: 'Book Service', icon: '📅', screen: 'CustomerBooking',  color: COLORS.gold    },
{ label: 'My History',   icon: '📋', screen: 'ServiceHistory',   color: COLORS.info    },
{ label: 'Feedback',     icon: '⭐', screen: 'CustomerFeedback', color: COLORS.warning },
{ label: 'My Vehicles',  icon: '🚗', screen: 'Vehicle',          color: '#8B5CF6'      },
          ].map((a, i) => (
            <SoundButton key={i} style={styles.quickCard}
>>>>>>> dev
              onPress={() => navigation.navigate(a.screen)}>
              <View style={[styles.quickIconBg, { backgroundColor: a.color + '22' }]}>
                <Text style={styles.quickIcon}>{a.icon}</Text>
              </View>
              <Text style={styles.quickLabel}>{a.label}</Text>
<<<<<<< HEAD
            </TouchableOpacity>
=======
            </SoundButton>
>>>>>>> dev
          ))}
        </View>

        {/* Active Bookings */}
        {bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Active Bookings</Text>
            </View>
            {bookings
              .filter(b => b.status !== 'completed' && b.status !== 'cancelled')
              .map((b, i) => (
                <View key={i} style={styles.bookingCard}>
                  <View style={[styles.bookingAccent,
                    { backgroundColor: STATUS_COLOR[b.status] }]} />
                  <View style={styles.bookingLeft}>
                    <Text style={styles.bookingGarage}>{b.garageName}</Text>
                    <Text style={styles.bookingService}>🔧 {b.service}</Text>
                    <Text style={styles.bookingDate}>📅 {b.date}  🕐 {b.time}</Text>
                  </View>
                  <View style={[styles.statusBadge,
                    { backgroundColor: STATUS_COLOR[b.status] + '22',
                      borderColor: STATUS_COLOR[b.status] + '44' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[b.status] }]}>
                      {b.status}
                    </Text>
                  </View>
                </View>
              ))}
          </>
        )}

        {/* Nearby Garages */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionTitle}>Nearby Garages</Text>
        </View>

        {garages
          .filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()))
          .map((g, i) => (
<<<<<<< HEAD
            <TouchableOpacity key={i} style={styles.garageCard}
=======
            <SoundButton key={i} style={styles.garageCard}
>>>>>>> dev
              onPress={() => navigation.navigate('GarageDetail',
                { garageId: g._id, garageName: g.name })}>
              <View style={styles.garageIconBg}>
                <Text style={styles.garageIcon}>🏪</Text>
              </View>
              <View style={styles.garageInfo}>
                <Text style={styles.garageName}>{g.name}</Text>
                <Text style={styles.garageAddress}>📍 {g.address}</Text>
                <Text style={styles.garageMeta}>⭐ {g.rating ?? '0.0'}  ·  {g.distance ?? '?'} km</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
<<<<<<< HEAD
            </TouchableOpacity>
          ))}

        <TouchableOpacity style={styles.viewAllBtn}
          onPress={() => navigation.navigate('CustomerBooking')}>
          <Text style={styles.viewAllText}>Book a Service Now  →</Text>
        </TouchableOpacity>
=======
            </SoundButton>
          ))}

        <SoundButton style={styles.viewAllBtn}
          onPress={() => navigation.navigate('CustomerBooking')}>
          <Text style={styles.viewAllText}>Book a Service Now  →</Text>
        </SoundButton>
>>>>>>> dev

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: COLORS.navy,
                   paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.navy },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                   backgroundColor: COLORS.navy, paddingHorizontal: 20, paddingVertical: 18,
                   borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)', overflow: 'hidden' },
  headerDecor:   { position: 'absolute', top: -30, left: 80, width: 100, height: 100,
                   borderRadius: 50, backgroundColor: COLORS.gold, opacity: 0.06 },
  greeting:      { fontSize: 12, color: COLORS.gray, letterSpacing: 0.5 },
  userName:      { fontSize: 20, fontWeight: '900', color: COLORS.white },
  profileBtn:    { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(201,168,76,0.15)',
                   justifyContent: 'center', alignItems: 'center',
                   borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  profileBtnText:{ fontSize: 18 },
  logoutBtn:     { borderWidth: 1, borderColor: '#EF444466', borderRadius: 10,
                   paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(239,68,68,0.08)' },
  logoutText:    { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  scroll:        { flex: 1, backgroundColor: '#0D1829' },
  searchWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg,
                   margin: 14, borderRadius: 14, paddingHorizontal: 14,
                   borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)', elevation: 3 },
  searchIcon:    { fontSize: 18, marginRight: 8 },
  searchInput:   { flex: 1, paddingVertical: 13, fontSize: 15, color: COLORS.white },
  quickRow:      { flexDirection: 'row', paddingHorizontal: 12, gap: 10, marginBottom: 6 },
  quickCard:     { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 12,
                   alignItems: 'center', borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)', elevation: 2 },
  quickIconBg:   { width: 46, height: 46, borderRadius: 14, justifyContent: 'center',
                   alignItems: 'center', marginBottom: 6 },
  quickIcon:     { fontSize: 22 },
  quickLabel:    { fontSize: 10, fontWeight: '700', color: COLORS.white, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 14,
                   marginTop: 14, marginBottom: 10 },
  sectionAccent: { width: 4, height: 18, backgroundColor: COLORS.gold, borderRadius: 2, marginRight: 10 },
  sectionTitle:  { fontSize: 16, fontWeight: '800', color: COLORS.white },
  bookingCard:   { backgroundColor: COLORS.cardBg, marginHorizontal: 14, marginBottom: 10,
                   borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center',
                   borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)', elevation: 2 },
  bookingAccent: { width: 4, borderRadius: 2, marginRight: 12, minHeight: 50 },
  bookingLeft:   { flex: 1 },
  bookingGarage: { fontSize: 15, fontWeight: '700', color: COLORS.white, marginBottom: 3 },
  bookingService:{ fontSize: 13, color: COLORS.gold, marginBottom: 4, fontWeight: '600' },
  bookingDate:   { fontSize: 12, color: COLORS.gray },
  statusBadge:   { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  statusText:    { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  garageCard:    { backgroundColor: COLORS.cardBg, marginHorizontal: 14, marginBottom: 10,
                   borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center',
                   borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)', elevation: 2 },
  garageIconBg:  { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(201,168,76,0.1)',
                   justifyContent: 'center', alignItems: 'center', marginRight: 12,
                   borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  garageIcon:    { fontSize: 26 },
  garageInfo:    { flex: 1 },
  garageName:    { fontSize: 15, fontWeight: '700', color: COLORS.white, marginBottom: 3 },
  garageAddress: { fontSize: 13, color: COLORS.gray, marginBottom: 3 },
  garageMeta:    { fontSize: 12, color: COLORS.gold, fontWeight: '600' },
  chevron:       { fontSize: 26, color: COLORS.gold },
  viewAllBtn:    { marginHorizontal: 14, marginTop: 6, borderRadius: 14, paddingVertical: 16,
                   alignItems: 'center', backgroundColor: COLORS.gold,
                   shadowColor: COLORS.gold, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  viewAllText:   { color: COLORS.navy, fontWeight: '900', fontSize: 15 },
});