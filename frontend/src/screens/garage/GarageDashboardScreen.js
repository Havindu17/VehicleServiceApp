import SoundButton from "../../utils/SoundButton";
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, ActivityIndicator, RefreshControl,
  Platform, Animated, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Design tokens ─────────────────────────────────────────────────────────
const C = {
  navy:      '#08152B',
  navyMid:   '#0F2040',
  navyCard:  '#142035',
  navyLight: '#1A2D4A',
  gold:      '#C9A84C',
  goldLight: '#E2C06E',
  goldDim:   'rgba(201,168,76,0.12)',
  white:     '#FFFFFF',
  offWhite:  '#E8EDF5',
  gray:      '#6B80A0',
  grayLight: '#8A9BB5',
  border:    'rgba(201,168,76,0.14)',
  success:   '#22C55E',
  successBg: 'rgba(34,197,94,0.12)',
  warning:   '#F59E0B',
  warningBg: 'rgba(245,158,11,0.12)',
  error:     '#EF4444',
  errorBg:   'rgba(239,68,68,0.12)',
  info:      '#3B82F6',
  infoBg:    'rgba(59,130,246,0.12)',
  purple:    '#A855F7',
  purpleBg:  'rgba(168,85,247,0.12)',
};

const STATUS = {
  pending:   { bg: C.warningBg, fg: C.warning, label: 'Pending'   },
  confirmed: { bg: C.infoBg,    fg: C.info,    label: 'Confirmed' },
  completed: { bg: C.successBg, fg: C.success,  label: 'Completed' },
  cancelled: { bg: C.errorBg,   fg: C.error,   label: 'Cancelled' },
};

// ── Tiny animated stat card ───────────────────────────────────────────────
function StatCard({ icon, label, value, color, trend, trendUp }) {
  const scale = useRef(new Animated.Value(0.92)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
  }, []);
  return (
    <Animated.View style={[styles.statCard, { transform: [{ scale }] }]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '1A' }]}>
        <Text style={styles.statEmoji}>{icon}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {trend != null && (
        <View style={[styles.trendBadge, { backgroundColor: trendUp ? C.successBg : C.errorBg }]}>
          <Text style={[styles.trendText, { color: trendUp ? C.success : C.error }]}>
            {trendUp ? '↑' : '↓'} {trend}%
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

// ── Mini bar chart ────────────────────────────────────────────────────────
function MiniBarChart({ data = [] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={styles.barChart}>
      {data.map((d, i) => (
        <View key={i} style={styles.barCol}>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { height: `${(d.value / max) * 100}%` }]} />
          </View>
          <Text style={styles.barLabel}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function GarageDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [stats,    setStats]    = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [refresh,  setRefresh]  = useState(false);

  // Header fade-in
  const headerAnim = useRef(new Animated.Value(0)).current;

  const fetchData = async () => {
    try {
      const [sRes, bRes] = await Promise.all([
        api.get('/garage/stats'),
        api.get('/garage/bookings?limit=5'),
      ]);
      setStats(sRes.data);
      setBookings(bRes.data);
    } catch (e) { console.error(e); }
    finally {
      setLoading(false);
      setRefresh(false);
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <View style={[styles.loadWrap, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={styles.loadText}>Loading dashboard…</Text>
      </View>
    );
  }

  // Sample weekly revenue chart data (replace with real data from stats)
  const weekData = stats?.weeklyRevenue ?? [
    { label: 'M', value: 12000 },
    { label: 'T', value: 8500  },
    { label: 'W', value: 19000 },
    { label: 'T', value: 15000 },
    { label: 'F', value: 22000 },
    { label: 'S', value: 9000  },
    { label: 'S', value: 4500  },
  ];

  const QUICK_ACTIONS = [
    { label: 'Bookings',  icon: '📋', screen: 'GarageBooking',     color: C.info    },
    { label: 'Services',  icon: '🔧', screen: 'ServiceManagement', color: C.gold    },
    { label: 'Finance',   icon: '💵', screen: 'Finance',           color: C.success },
    { label: 'Profile',   icon: '🏪', screen: 'GarageProfile',     color: C.purple  },
    { label: 'Feedback',  icon: '⭐', screen: 'GarageFeedback',    color: C.warning },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 16, opacity: headerAnim }]}>
        {/* decorative circles */}
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />

        <View style={styles.headerLeft}>
          <View style={styles.brandDot} />
          <View>
            <Text style={styles.headerSub}>Good {getGreeting()},</Text>
            <Text style={styles.headerName} numberOfLines={1}>{user?.name ?? 'Garage Owner'}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* notification bell */}
          <SoundButton style={styles.iconBtn} onPress={() => {}}>
            <Text style={{ fontSize: 16 }}>🔔</Text>
            {(stats?.pendingBookings ?? 0) > 0 && (
              <View style={styles.notifDot}>
                <Text style={styles.notifCount}>{stats.pendingBookings}</Text>
              </View>
            )}
          </SoundButton>
          <SoundButton style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Sign out</Text>
          </SoundButton>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refresh}
            onRefresh={() => { setRefresh(true); fetchData(); }}
            tintColor={C.gold}
          />
        }
      >
        {/* ── Stats grid ──────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <StatCard icon="📅" label="Today's Bookings" value={stats?.todayBookings ?? 0}   color={C.info}    trend={stats?.bookingsTrend}   trendUp={true}  />
          <StatCard icon="💰" label="Total Revenue"    value={`Rs.${formatNum(stats?.totalRevenue ?? 0)}`} color={C.success} trend={stats?.revenueTrend} trendUp={true} />
          <StatCard icon="👥" label="Customers"        value={stats?.totalCustomers ?? 0}  color={C.purple}  trend={null}                              />
          <StatCard icon="⏳" label="Pending"          value={stats?.pendingBookings ?? 0} color={C.warning} trend={null}                              />
        </View>

        {/* ── Revenue chart card ───────────────────────────────────── */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Weekly Revenue</Text>
              <Text style={styles.chartSub}>This week's performance</Text>
            </View>
            <View style={styles.chartBadge}>
              <Text style={styles.chartBadgeText}>Rs. {formatNum(weekData.reduce((a, d) => a + d.value, 0))}</Text>
            </View>
          </View>
          <MiniBarChart data={weekData} />
        </View>

        {/* ── Quick Actions ────────────────────────────────────────── */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsRow}>
          {QUICK_ACTIONS.map((a, i) => (
            <SoundButton
              key={i}
              style={styles.actionBtn}
              onPress={() => navigation.navigate(a.screen)}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: a.color + '1A', borderColor: a.color + '33' }]}>
                <Text style={styles.actionEmoji}>{a.icon}</Text>
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </SoundButton>
          ))}
        </View>

        {/* ── Recent Bookings ──────────────────────────────────────── */}
        <SectionHeader title="Recent Bookings" onPress={() => navigation.navigate('GarageBooking')} actionLabel="View all" />

        {bookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptySub}>Bookings will appear here once customers start scheduling.</Text>
          </View>
        ) : (
          bookings.map((b, i) => <BookingRow key={i} booking={b} />)
        )}

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Booking row ───────────────────────────────────────────────────────────
function BookingRow({ booking: b }) {
  const s = STATUS[b.status] ?? STATUS.pending;
  return (
    <View style={styles.bookingRow}>
      {/* avatar */}
      <View style={styles.bookingAvatar}>
        <Text style={styles.bookingAvatarText}>{b.customerName?.[0]?.toUpperCase() ?? '?'}</Text>
      </View>
      {/* info */}
      <View style={styles.bookingInfo}>
        <Text style={styles.bookingName}>{b.customerName}</Text>
        <Text style={styles.bookingService}>{b.service}</Text>
        <Text style={styles.bookingMeta}>📅 {b.date}  ·  🕐 {b.time}</Text>
      </View>
      {/* status */}
      <View style={[styles.statusPill, { backgroundColor: s.bg, borderColor: s.fg + '44' }]}>
        <View style={[styles.statusDot, { backgroundColor: s.fg }]} />
        <Text style={[styles.statusText, { color: s.fg }]}>{s.label}</Text>
      </View>
    </View>
  );
}

// ── Section header ────────────────────────────────────────────────────────
function SectionHeader({ title, onPress, actionLabel }) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionLeft}>
        <View style={styles.sectionBar} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {onPress && (
        <SoundButton onPress={onPress}>
          <Text style={styles.sectionAction}>{actionLabel} →</Text>
        </SoundButton>
      )}
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: C.navy },
  scroll:   { flex: 1, backgroundColor: '#0A1624' },

  // Loading
  loadWrap: { flex: 1, backgroundColor: C.navy, justifyContent: 'center', alignItems: 'center' },
  loadText: { color: C.gray, marginTop: 14, fontSize: 14, fontWeight: '500' },

  // ── Header
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute', top: -20, right: 60,
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: C.gold, opacity: 0.05,
  },
  headerCircle2: {
    position: 'absolute', bottom: -40, right: -20,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: C.info, opacity: 0.04,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  brandDot:    { width: 4, height: 32, backgroundColor: C.gold, borderRadius: 2, marginRight: 12 },
  headerSub:   { fontSize: 11, color: C.gray, letterSpacing: 0.8, textTransform: 'uppercase' },
  headerName:  { fontSize: 19, fontWeight: '800', color: C.white, marginTop: 1, maxWidth: 180 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn:     { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)',
                  justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  notifDot:    { position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8,
                  backgroundColor: C.error, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  notifCount:  { color: C.white, fontSize: 9, fontWeight: '800' },
  logoutBtn:   { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
                  backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  logoutText:  { color: C.error, fontWeight: '700', fontSize: 12 },

  // ── Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: {
    width: (SCREEN_W - 44) / 2,
    backgroundColor: C.navyCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  statIconWrap: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statEmoji:    { fontSize: 20 },
  statValue:    { fontSize: 24, fontWeight: '900', marginBottom: 3 },
  statLabel:    { fontSize: 11, color: C.gray, fontWeight: '600', letterSpacing: 0.3 },
  trendBadge:   { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  trendText:    { fontSize: 11, fontWeight: '700' },

  // ── Chart
  chartCard: {
    marginHorizontal: 16, marginBottom: 6,
    backgroundColor: C.navyCard,
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: C.border,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  chartTitle:  { fontSize: 15, fontWeight: '800', color: C.white },
  chartSub:    { fontSize: 11, color: C.gray, marginTop: 2 },
  chartBadge:  { backgroundColor: C.goldDim, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.border },
  chartBadgeText: { color: C.gold, fontWeight: '800', fontSize: 13 },
  barChart:    { flexDirection: 'row', height: 80, gap: 6, alignItems: 'flex-end' },
  barCol:      { flex: 1, alignItems: 'center', gap: 4 },
  barTrack:    { flex: 1, width: '100%', justifyContent: 'flex-end', borderRadius: 6, overflow: 'hidden',
                  backgroundColor: 'rgba(255,255,255,0.04)' },
  barFill:     { width: '100%', backgroundColor: C.gold, borderRadius: 6, opacity: 0.85 },
  barLabel:    { fontSize: 10, color: C.gray, fontWeight: '600' },

  // ── Section header
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                   marginHorizontal: 16, marginTop: 20, marginBottom: 12 },
  sectionLeft:  { flexDirection: 'row', alignItems: 'center' },
  sectionBar:   { width: 4, height: 17, backgroundColor: C.gold, borderRadius: 2, marginRight: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: C.white },
  sectionAction:{ fontSize: 12, color: C.gold, fontWeight: '700' },

  // ── Quick actions
  actionsRow: { flexDirection: 'row', paddingHorizontal: 14, gap: 8, marginBottom: 4 },
  actionBtn:  { flex: 1, alignItems: 'center', backgroundColor: C.navyCard,
                 borderRadius: 16, paddingVertical: 14,
                 borderWidth: 1, borderColor: C.border },
  actionIconWrap: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center',
                     alignItems: 'center', marginBottom: 8, borderWidth: 1 },
  actionEmoji:    { fontSize: 22 },
  actionLabel:    { fontSize: 10, fontWeight: '700', color: C.offWhite, textAlign: 'center' },

  // ── Bookings
  bookingRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: C.navyCard,
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  bookingAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: C.goldDim, borderWidth: 1.5, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  bookingAvatarText: { fontSize: 17, fontWeight: '800', color: C.gold },
  bookingInfo:       { flex: 1 },
  bookingName:       { fontSize: 14, fontWeight: '800', color: C.white, marginBottom: 2 },
  bookingService:    { fontSize: 12, color: C.gold, fontWeight: '600', marginBottom: 3 },
  bookingMeta:       { fontSize: 11, color: C.gray },
  statusPill:        { flexDirection: 'row', alignItems: 'center', gap: 5,
                        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  statusDot:         { width: 6, height: 6, borderRadius: 3 },
  statusText:        { fontSize: 11, fontWeight: '800' },

  // ── Empty
  emptyCard: {
    marginHorizontal: 16, backgroundColor: C.navyCard, borderRadius: 20,
    padding: 40, alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },
  emptyEmoji: { fontSize: 42, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: C.white, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: C.gray, textAlign: 'center', lineHeight: 19 },
});