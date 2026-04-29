import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, ActivityIndicator, RefreshControl, Platform
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

export default function GarageDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats,    setStats]    = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [refresh,  setRefresh]  = useState(false);

  const fetchData = async () => {
    try {
      const [sRes, bRes] = await Promise.all([
        api.get('/garage/stats'),
        api.get('/garage/bookings?limit=5'),
      ]);
      setStats(sRes.data);
      setBookings(bRes.data);
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
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name ?? 'Garage Owner'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refresh}
            onRefresh={() => { setRefresh(true); fetchData(); }}
            tintColor={COLORS.gold} />
        }
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Today's Bookings", value: stats?.todayBookings ?? 0,   icon: '📅', color: COLORS.info    },
            { label: 'Total Revenue',    value: `Rs.${stats?.totalRevenue ?? 0}`, icon: '💰', color: COLORS.success },
            { label: 'Customers',        value: stats?.totalCustomers ?? 0,  icon: '👥', color: COLORS.gold    },
            { label: 'Pending',          value: stats?.pendingBookings ?? 0, icon: '⏳', color: COLORS.warning },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, { borderTopColor: s.color }]}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.actionsGrid}>
          {[
            { label: 'Bookings',  icon: '📋', screen: 'GarageBooking' },
            { label: 'Services',  icon: '🔧', screen: 'ServiceManagement' },
            { label: 'Finance',   icon: '💵', screen: 'Finance' },
            { label: 'Profile',   icon: '🏪', screen: 'GarageProfile' },
            { label: 'Feedback',  icon: '⭐', screen: 'GarageFeedback' },
          ].map((a, i) => (
            <TouchableOpacity key={i} style={styles.actionCard}
              onPress={() => navigation.navigate(a.screen)}>
              <View style={styles.actionIconBg}>
                <Text style={styles.actionIcon}>{a.icon}</Text>
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Bookings */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
        </View>

        {bookings.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No bookings yet</Text>
          </View>
        ) : (
          bookings.map((b, i) => (
            <View key={i} style={styles.bookingCard}>
              <View style={[styles.bookingAccent, { backgroundColor: STATUS_COLOR[b.status] }]} />
              <View style={styles.bookingLeft}>
                <Text style={styles.bookingName}>{b.customerName}</Text>
                <Text style={styles.bookingService}>{b.service}</Text>
                <Text style={styles.bookingDate}>📅 {b.date}  🕐 {b.time}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[b.status] + '22',
                borderColor: STATUS_COLOR[b.status] + '44' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[b.status] }]}>{b.status}</Text>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.viewAllBtn}
          onPress={() => navigation.navigate('GarageBooking')}>
          <Text style={styles.viewAllText}>View All Bookings  →</Text>
        </TouchableOpacity>

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
  headerDecor:   { position: 'absolute', top: -30, right: 80, width: 100, height: 100,
                   borderRadius: 50, backgroundColor: COLORS.gold, opacity: 0.06 },
  greeting:      { fontSize: 12, color: COLORS.gray, letterSpacing: 0.5 },
  userName:      { fontSize: 20, fontWeight: '900', color: COLORS.white },
  logoutBtn:     { borderWidth: 1, borderColor: '#EF444466', borderRadius: 10,
                   paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(239,68,68,0.08)' },
  logoutText:    { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  scroll:        { flex: 1, backgroundColor: '#0D1829' },
  statsRow:      { flexDirection: 'row', flexWrap: 'wrap', padding: 14, gap: 10 },
  statCard:      { width: '47%', backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16,
                   alignItems: 'center', borderTopWidth: 3,
                   borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)', elevation: 4 },
  statIcon:      { fontSize: 26, marginBottom: 8 },
  statValue:     { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  statLabel:     { fontSize: 11, color: COLORS.gray, textAlign: 'center', fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16,
                   marginTop: 10, marginBottom: 12 },
  sectionAccent: { width: 4, height: 18, backgroundColor: COLORS.gold, borderRadius: 2, marginRight: 10 },
  sectionTitle:  { fontSize: 16, fontWeight: '800', color: COLORS.white },
  actionsGrid:   { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, marginBottom: 6 },
  actionCard:    { width: '30%', backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16,
                   alignItems: 'center', borderWidth: 1, borderColor: 'rgba(201,168,76,0.12)', elevation: 3 },
  actionIconBg:  { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(201,168,76,0.1)',
                   justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionIcon:    { fontSize: 24 },
  actionLabel:   { fontSize: 11, fontWeight: '700', color: COLORS.white, textAlign: 'center' },
  bookingCard:   { backgroundColor: COLORS.cardBg, marginHorizontal: 14, marginBottom: 10,
                   borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center',
                   borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)', elevation: 2 },
  bookingAccent: { width: 4, height: '100%', borderRadius: 2, marginRight: 12, minHeight: 50 },
  bookingLeft:   { flex: 1 },
  bookingName:   { fontSize: 15, fontWeight: '700', color: COLORS.white, marginBottom: 3 },
  bookingService:{ fontSize: 13, color: COLORS.gold, marginBottom: 4, fontWeight: '600' },
  bookingDate:   { fontSize: 12, color: COLORS.gray },
  statusBadge:   { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  statusText:    { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  emptyBox:      { marginHorizontal: 14, backgroundColor: COLORS.cardBg, borderRadius: 16,
                   padding: 36, alignItems: 'center', borderWidth: 1,
                   borderColor: 'rgba(201,168,76,0.1)' },
  emptyIcon:     { fontSize: 40, marginBottom: 10 },
  emptyText:     { color: COLORS.gray, fontSize: 14, fontWeight: '600' },
  viewAllBtn:    { marginHorizontal: 14, marginTop: 4, borderRadius: 14, paddingVertical: 15,
                   alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.gold,
                   backgroundColor: 'rgba(201,168,76,0.08)' },
  viewAllText:   { color: COLORS.gold, fontWeight: '800', fontSize: 14 },
});