import SoundButton from "../../utils/SoundButton";
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, ActivityIndicator, RefreshControl,
  Animated, Dimensions, Platform,
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
  teal:      '#14B8A6',
  tealBg:    'rgba(20,184,166,0.12)',
};

const STATUS = {
  pending:   { bg: C.warningBg, fg: C.warning, label: 'Pending'   },
  confirmed: { bg: C.infoBg,    fg: C.info,    label: 'Confirmed' },
  completed: { bg: C.successBg, fg: C.success,  label: 'Completed' },
  cancelled: { bg: C.errorBg,   fg: C.error,   label: 'Cancelled' },
};

// ── Animated Stat Card ────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, trend, trendUp, subtitle }) {
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.statCard, { transform: [{ scale }], opacity }]}>
      <View style={styles.statCardTop}>
        <View style={[styles.statIconWrap, { backgroundColor: color + '22' }]}>
          <Text style={styles.statEmoji}>{icon}</Text>
        </View>
        {trend != null && (
          <View style={[styles.trendBadge, { backgroundColor: trendUp ? C.successBg : C.errorBg }]}>
            <Text style={[styles.trendText, { color: trendUp ? C.success : C.error }]}>
              {trendUp ? '▲' : '▼'} {trend}%
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subtitle ? <Text style={styles.statSub}>{subtitle}</Text> : null}
    </Animated.View>
  );
}

// ── Period Selector ───────────────────────────────────────────────────────
function PeriodSelector({ value, onChange }) {
  const options = ['Week', 'Month', 'Year'];
  return (
    <View style={styles.periodWrap}>
      {options.map(o => (
        <TouchableOpacity
          key={o}
          style={[styles.periodBtn, value === o && styles.periodBtnActive]}
          onPress={() => onChange(o)}
          activeOpacity={0.75}
        >
          <Text style={[styles.periodText, value === o && styles.periodTextActive]}>{o}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Enhanced Bar Chart with Labels ────────────────────────────────────────
function RevenueBarChart({ data = [], period }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const total = data.reduce((a, d) => a + d.value, 0);
  const avg   = total / data.length;

  return (
    <View>
      {/* Summary row */}
      <View style={styles.chartSummaryRow}>
        <View style={styles.chartSummaryItem}>
          <Text style={styles.chartSummaryLabel}>Total</Text>
          <Text style={styles.chartSummaryValue}>Rs.{formatNum(total)}</Text>
        </View>
        <View style={styles.chartDivider} />
        <View style={styles.chartSummaryItem}>
          <Text style={styles.chartSummaryLabel}>Avg / {period === 'Year' ? 'mo' : 'd'}</Text>
          <Text style={styles.chartSummaryValue}>Rs.{formatNum(Math.round(avg))}</Text>
        </View>
        <View style={styles.chartDivider} />
        <View style={styles.chartSummaryItem}>
          <Text style={styles.chartSummaryLabel}>Peak</Text>
          <Text style={[styles.chartSummaryValue, { color: C.gold }]}>
            Rs.{formatNum(Math.max(...data.map(d => d.value)))}
          </Text>
        </View>
      </View>

      {/* Bars */}
      <View style={styles.barChart}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          const isMax = d.value === Math.max(...data.map(x => x.value));
          return (
            <View key={i} style={styles.barCol}>
              {isMax && <Text style={styles.barPeak}>★</Text>}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${pct}%`, backgroundColor: isMax ? C.gold : C.gold + '66' },
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, isMax && { color: C.gold }]}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Donut Chart (Status Breakdown) ───────────────────────────────────────
function StatusDonut({ data }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  if (total === 0) return null;

  return (
    <View style={styles.donutWrap}>
      {/* Visual donut using stacked segments */}
      <View style={styles.donutCircle}>
        <View style={styles.donutInner}>
          <Text style={styles.donutTotal}>{total}</Text>
          <Text style={styles.donutTotalLabel}>Total</Text>
        </View>
      </View>
      {/* Legend */}
      <View style={styles.donutLegend}>
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <View key={i} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: d.color }]} />
              <View style={styles.legendInfo}>
                <Text style={styles.legendLabel}>{d.label}</Text>
                <View style={styles.legendBarTrack}>
                  <View style={[styles.legendBarFill, { width: `${pct}%`, backgroundColor: d.color }]} />
                </View>
              </View>
              <View style={styles.legendRight}>
                <Text style={[styles.legendValue, { color: d.color }]}>{d.value}</Text>
                <Text style={styles.legendPct}>{pct}%</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Service Popularity Chart ──────────────────────────────────────────────
function ServicePopularityChart({ data = [] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <View style={styles.serviceList}>
      {data.map((d, i) => {
        const pct = (d.count / max) * 100;
        return (
          <View key={i} style={styles.serviceRow}>
            <View style={styles.serviceRankWrap}>
              <Text style={styles.serviceRank}>#{i + 1}</Text>
            </View>
            <View style={styles.serviceInfo}>
              <View style={styles.serviceTopRow}>
                <Text style={styles.serviceName}>{d.name}</Text>
                <Text style={styles.serviceCount}>{d.count} jobs</Text>
              </View>
              <View style={styles.serviceBarTrack}>
                <View
                  style={[
                    styles.serviceBarFill,
                    { width: `${pct}%`, backgroundColor: d.color ?? C.gold },
                  ]}
                />
              </View>
              <Text style={styles.serviceRevenue}>Rs.{formatNum(d.revenue)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Customer Growth Sparkline ─────────────────────────────────────────────
function GrowthSparkline({ data = [], color = C.teal }) {
  if (data.length < 2) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);
  const range = max - min || 1;
  const W = SCREEN_W - 80;
  const H = 50;
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((d.value - min) / range) * H,
  }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <View style={{ height: H + 20, marginTop: 8 }}>
      <View style={[styles.sparklineTrack, { height: H }]}>
        {pts.map((p, i) => (
          <View
            key={i}
            style={[
              styles.sparklineDot,
              {
                left: p.x - 3,
                bottom: H - p.y - 3,
                backgroundColor: i === pts.length - 1 ? color : color + '88',
                width: i === pts.length - 1 ? 8 : 5,
                height: i === pts.length - 1 ? 8 : 5,
                borderRadius: i === pts.length - 1 ? 4 : 2.5,
              },
            ]}
          />
        ))}
        {/* Lines between dots */}
        {pts.slice(1).map((p, i) => {
          const prev = pts[i];
          const dx = p.x - prev.x;
          const dy = p.y - prev.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={i}
              style={[
                styles.sparklineLine,
                {
                  left: prev.x,
                  bottom: H - prev.y - 1,
                  width: len,
                  backgroundColor: color + '55',
                  transform: [{ rotate: `${angle}deg` }],
                  transformOrigin: '0 50%',
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.sparklineLabels}>
        {data.map((d, i) => (
          <Text key={i} style={styles.sparklineLabel}>{d.label}</Text>
        ))}
      </View>
    </View>
  );
}

// ── KPI Row ───────────────────────────────────────────────────────────────
function KpiRow({ items }) {
  return (
    <View style={styles.kpiRow}>
      {items.map((k, i) => (
        <View key={i} style={[styles.kpiItem, i < items.length - 1 && styles.kpiDivider]}>
          <Text style={styles.kpiEmoji}>{k.icon}</Text>
          <Text style={[styles.kpiValue, { color: k.color ?? C.gold }]}>{k.value}</Text>
          <Text style={styles.kpiLabel}>{k.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function GarageDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const [stats,    setStats]    = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [refresh,  setRefresh]  = useState(false);
  const [period,   setPeriod]   = useState('Week');

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
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <View style={[styles.loadWrap, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={styles.loadText}>Loading analytics…</Text>
      </View>
    );
  }

  // ── Chart data per period ─────────────────────────────────────────────
  const revenueData = {
    Week: stats?.weeklyRevenue ?? [
      { label: 'Mon', value: 12000 }, { label: 'Tue', value: 8500 },
      { label: 'Wed', value: 19000 }, { label: 'Thu', value: 15000 },
      { label: 'Fri', value: 22000 }, { label: 'Sat', value: 9000 },
      { label: 'Sun', value: 4500  },
    ],
    Month: stats?.monthlyRevenue ?? [
      { label: 'W1', value: 52000 }, { label: 'W2', value: 61000 },
      { label: 'W3', value: 47000 }, { label: 'W4', value: 78000 },
    ],
    Year: stats?.yearlyRevenue ?? [
      { label: 'Jan', value: 120000 }, { label: 'Feb', value: 98000  },
      { label: 'Mar', value: 145000 }, { label: 'Apr', value: 132000 },
      { label: 'May', value: 160000 }, { label: 'Jun', value: 89000  },
      { label: 'Jul', value: 174000 }, { label: 'Aug', value: 155000 },
      { label: 'Sep', value: 143000 }, { label: 'Oct', value: 168000 },
      { label: 'Nov', value: 190000 }, { label: 'Dec', value: 210000 },
    ],
  };

  const statusBreakdown = stats?.statusBreakdown ?? [
    { label: 'Completed', value: stats?.completedBookings ?? 24, color: C.success },
    { label: 'Confirmed', value: stats?.confirmedBookings ?? 8,  color: C.info    },
    { label: 'Pending',   value: stats?.pendingBookings   ?? 5,  color: C.warning },
    { label: 'Cancelled', value: stats?.cancelledBookings ?? 3,  color: C.error   },
  ];

  const servicePopularity = stats?.servicePopularity ?? [
    { name: 'Oil Change',        count: 34, revenue: 85000,  color: C.gold    },
    { name: 'Brake Service',     count: 22, revenue: 132000, color: C.info    },
    { name: 'AC Repair',         count: 18, revenue: 162000, color: C.purple  },
    { name: 'Tyre Replacement',  count: 15, revenue: 75000,  color: C.success },
    { name: 'Full Service',      count: 12, revenue: 180000, color: C.warning },
  ];

  const customerGrowth = stats?.customerGrowth ?? [
    { label: 'Jul', value: 12 }, { label: 'Aug', value: 18 },
    { label: 'Sep', value: 15 }, { label: 'Oct', value: 24 },
    { label: 'Nov', value: 30 }, { label: 'Dec', value: 28 },
    { label: 'Jan', value: 35 },
  ];

  const QUICK_ACTIONS = [
    { label: 'Bookings', icon: '📋', screen: 'GarageBooking',     color: C.info    },
    { label: 'Services', icon: '🔧', screen: 'ServiceManagement', color: C.gold    },
    { label: 'Finance',  icon: '💵', screen: 'Finance',           color: C.success },
    { label: 'Profile',  icon: '🏪', screen: 'GarageProfile',     color: C.purple  },
    { label: 'Feedback', icon: '⭐', screen: 'GarageFeedback',    color: C.warning },
  ];

  const currentRevData = revenueData[period];
  const totalRevenue   = currentRevData.reduce((a, d) => a + d.value, 0);
  const conversionRate = statusBreakdown[0].value /
    (statusBreakdown.reduce((a, d) => a + d.value, 0) || 1) * 100;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ── Header ───────────────────────────────────────────────────── */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 14, opacity: headerAnim }]}>
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
        {/* ── Top KPI Strip ──────────────────────────────────────────── */}
        <View style={styles.kpiCard}>
          <KpiRow items={[
            { icon: '📅', label: "Today's Jobs",    value: stats?.todayBookings   ?? 0,  color: C.info    },
            { icon: '⏳', label: 'Pending',          value: stats?.pendingBookings ?? 0,  color: C.warning },
            { icon: '✅', label: 'Completed',        value: stats?.completedBookings ?? 0, color: C.success },
            { icon: '🔄', label: 'Conversion',       value: `${conversionRate.toFixed(0)}%`, color: C.teal },
          ]} />
        </View>

        {/* ── Quick Actions ──────────────────────────────────────────── */}
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

        {/* ── Main Stats Grid ────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="💰" label="Total Revenue" color={C.success}
            value={`Rs.${formatNum(stats?.totalRevenue ?? 0)}`}
            trend={stats?.revenueTrend ?? 12} trendUp={true}
            subtitle="vs last period"
          />
          <StatCard
            icon="👥" label="Customers" color={C.purple}
            value={stats?.totalCustomers ?? 0}
            trend={stats?.customersTrend ?? 8} trendUp={true}
            subtitle="total registered"
          />
          <StatCard
            icon="⭐" label="Avg Rating" color={C.gold}
            value={(stats?.avgRating ?? 4.7).toFixed(1)}
            trend={null}
            subtitle={`${stats?.totalReviews ?? 38} reviews`}
          />
          <StatCard
            icon="🔧" label="Services" color={C.teal}
            value={stats?.totalServices ?? 0}
            trend={null}
            subtitle="active listings"
          />
        </View>

        {/* ── Revenue Analytics Card ─────────────────────────────────── */}
        <SectionHeader title="Revenue Analytics" />
        <View style={styles.analyticsCard}>
          <PeriodSelector value={period} onChange={setPeriod} />
          <RevenueBarChart data={currentRevData} period={period} />
        </View>

        {/* ── Booking Status Breakdown ───────────────────────────────── */}
        <SectionHeader title="Booking Breakdown" />
        <View style={styles.analyticsCard}>
          <StatusDonut data={statusBreakdown} />
        </View>

        {/* ── Service Popularity ─────────────────────────────────────── */}
        <SectionHeader title="Top Services" onPress={() => navigation.navigate('ServiceManagement')} actionLabel="Manage" />
        <View style={styles.analyticsCard}>
          <ServicePopularityChart data={servicePopularity} />
        </View>

        {/* ── Customer Growth ────────────────────────────────────────── */}
        <SectionHeader title="Customer Growth" />
        <View style={styles.analyticsCard}>
          <View style={styles.growthHeader}>
            <View>
              <Text style={styles.growthTotal}>{stats?.totalCustomers ?? 35}</Text>
              <Text style={styles.growthSub}>Total Customers</Text>
            </View>
            <View style={[styles.trendBadge, { backgroundColor: C.successBg }]}>
              <Text style={[styles.trendText, { color: C.success }]}>▲ {stats?.customersTrend ?? 17}% growth</Text>
            </View>
          </View>
          <GrowthSparkline data={customerGrowth} color={C.teal} />
        </View>

        {/* ── Performance Metrics ────────────────────────────────────── */}
        <SectionHeader title="Performance" />
        <View style={styles.analyticsCard}>
          <View style={styles.metricsGrid}>
            {[
              { label: 'Avg Job Duration',  value: `${stats?.avgJobDuration ?? 2.4}h`,     icon: '⏱️', color: C.info    },
              { label: 'Repeat Customers',  value: `${stats?.repeatRate      ?? 62}%`,     icon: '🔁', color: C.purple  },
              { label: 'On-time Rate',      value: `${stats?.onTimeRate      ?? 88}%`,     icon: '🎯', color: C.success },
              { label: 'Avg Ticket',        value: `Rs.${formatNum(stats?.avgTicket ?? 4800)}`, icon: '🧾', color: C.gold },
              { label: 'Revenue/Customer',  value: `Rs.${formatNum(stats?.revenuePerCustomer ?? 8200)}`, icon: '💎', color: C.teal },
              { label: 'New This Month',    value: stats?.newThisMonth ?? 7,               icon: '🆕', color: C.warning },
            ].map((m, i) => (
              <View key={i} style={styles.metricItem}>
                <Text style={styles.metricIcon}>{m.icon}</Text>
                <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
                <Text style={styles.metricLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <SectionHeader
          title="Recent Bookings"
          onPress={() => navigation.navigate('GarageBooking')}
          actionLabel="View all"
        />

        {bookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptySub}>Bookings will appear here once customers start scheduling.</Text>
          </View>
        ) : (
          bookings.map((b, i) => <BookingRow key={i} booking={b} />)
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Booking Row ───────────────────────────────────────────────────────────
function BookingRow({ booking: b }) {
  const s = STATUS[b.status] ?? STATUS.pending;
  return (
    <View style={styles.bookingRow}>
      <View style={styles.bookingAvatar}>
        <Text style={styles.bookingAvatarText}>{b.customerName?.[0]?.toUpperCase() ?? '?'}</Text>
      </View>
      <View style={styles.bookingInfo}>
        <Text style={styles.bookingName}>{b.customerName}</Text>
        <Text style={styles.bookingService} numberOfLines={1}>{b.service}</Text>
        <Text style={styles.bookingMeta}>📅 {b.date}  ·  🕐 {b.time}</Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: s.bg, borderColor: s.fg + '44' }]}>
        <View style={[styles.statusDot, { backgroundColor: s.fg }]} />
        <Text style={[styles.statusText, { color: s.fg }]}>{s.label}</Text>
      </View>
    </View>
  );
}

// ── Section Header ────────────────────────────────────────────────────────
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
  safe:   { flex: 1, backgroundColor: C.navy },
  scroll: { flex: 1, backgroundColor: '#0A1624' },

  loadWrap: { flex: 1, backgroundColor: C.navy, justifyContent: 'center', alignItems: 'center' },
  loadText: { color: C.gray, marginTop: 14, fontSize: 14, fontWeight: '500' },

  // ── Header
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    overflow: 'hidden',
  },
  headerCircle1: { position: 'absolute', top: -20, right: 60, width: 110, height: 110, borderRadius: 55, backgroundColor: C.gold, opacity: 0.05 },
  headerCircle2: { position: 'absolute', bottom: -40, right: -20, width: 130, height: 130, borderRadius: 65, backgroundColor: C.info, opacity: 0.04 },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', flex: 1 },
  brandDot:      { width: 4, height: 32, backgroundColor: C.gold, borderRadius: 2, marginRight: 12 },
  headerSub:     { fontSize: 11, color: C.gray, letterSpacing: 0.8, textTransform: 'uppercase' },
  headerName:    { fontSize: 19, fontWeight: '800', color: C.white, marginTop: 1, maxWidth: 180 },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn:       { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  notifDot:      { position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.error, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  notifCount:    { color: C.white, fontSize: 9, fontWeight: '800' },
  logoutBtn:     { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  logoutText:    { color: C.error, fontWeight: '700', fontSize: 12 },

  // ── KPI Strip
  kpiCard:       { marginHorizontal: 16, marginTop: 16, marginBottom: 4, backgroundColor: C.navyCard, borderRadius: 18, borderWidth: 1, borderColor: C.border, paddingVertical: 16 },
  kpiRow:        { flexDirection: 'row' },
  kpiItem:       { flex: 1, alignItems: 'center', gap: 4 },
  kpiDivider:    { borderRightWidth: 1, borderRightColor: C.border },
  kpiEmoji:      { fontSize: 20 },
  kpiValue:      { fontSize: 20, fontWeight: '900', color: C.gold },
  kpiLabel:      { fontSize: 10, color: C.gray, fontWeight: '600', textAlign: 'center' },

  // ── Stats grid
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  statCard:     { width: (SCREEN_W - 44) / 2, backgroundColor: C.navyCard, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border },
  statCardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  statIconWrap: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  statEmoji:    { fontSize: 20 },
  statValue:    { fontSize: 22, fontWeight: '900', marginBottom: 3 },
  statLabel:    { fontSize: 11, color: C.gray, fontWeight: '600', letterSpacing: 0.3 },
  statSub:      { fontSize: 10, color: C.gray + 'AA', marginTop: 2 },
  trendBadge:   { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  trendText:    { fontSize: 10, fontWeight: '700' },

  // ── Analytics card wrapper
  analyticsCard: { marginHorizontal: 16, marginBottom: 4, backgroundColor: C.navyCard, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border },

  // ── Period selector
  periodWrap:       { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 3, marginBottom: 18, alignSelf: 'flex-start' },
  periodBtn:        { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10 },
  periodBtnActive:  { backgroundColor: C.gold },
  periodText:       { fontSize: 12, fontWeight: '700', color: C.gray },
  periodTextActive: { color: C.navy },

  // ── Revenue bar chart
  chartSummaryRow:  { flexDirection: 'row', marginBottom: 16 },
  chartSummaryItem: { flex: 1, alignItems: 'center' },
  chartDivider:     { width: 1, backgroundColor: C.border },
  chartSummaryLabel:{ fontSize: 10, color: C.gray, fontWeight: '600', marginBottom: 4 },
  chartSummaryValue:{ fontSize: 14, fontWeight: '800', color: C.white },
  barChart:         { flexDirection: 'row', height: 90, gap: 4, alignItems: 'flex-end' },
  barCol:           { flex: 1, alignItems: 'center', gap: 4 },
  barPeak:          { fontSize: 8, color: C.gold, marginBottom: 2 },
  barTrack:         { flex: 1, width: '100%', justifyContent: 'flex-end', borderRadius: 6, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)' },
  barFill:          { width: '100%', borderRadius: 6 },
  barLabel:         { fontSize: 9, color: C.gray, fontWeight: '600' },

  // ── Status donut
  donutWrap:        { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutCircle:      { width: 90, height: 90, borderRadius: 45, borderWidth: 10, borderColor: C.gold, justifyContent: 'center', alignItems: 'center', backgroundColor: C.goldDim },
  donutInner:       { alignItems: 'center' },
  donutTotal:       { fontSize: 22, fontWeight: '900', color: C.white },
  donutTotalLabel:  { fontSize: 9, color: C.gray, fontWeight: '600' },
  donutLegend:      { flex: 1, gap: 10 },
  legendRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot:        { width: 8, height: 8, borderRadius: 4 },
  legendInfo:       { flex: 1, gap: 3 },
  legendLabel:      { fontSize: 11, color: C.offWhite, fontWeight: '600' },
  legendBarTrack:   { height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  legendBarFill:    { height: '100%', borderRadius: 2, opacity: 0.85 },
  legendRight:      { alignItems: 'flex-end' },
  legendValue:      { fontSize: 13, fontWeight: '800' },
  legendPct:        { fontSize: 9, color: C.gray, fontWeight: '600' },

  // ── Service popularity
  serviceList:      { gap: 14 },
  serviceRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  serviceRankWrap:  { width: 28, height: 28, borderRadius: 8, backgroundColor: C.goldDim, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  serviceRank:      { fontSize: 11, fontWeight: '800', color: C.gold },
  serviceInfo:      { flex: 1, gap: 4 },
  serviceTopRow:    { flexDirection: 'row', justifyContent: 'space-between' },
  serviceName:      { fontSize: 13, fontWeight: '700', color: C.white },
  serviceCount:     { fontSize: 11, color: C.gray, fontWeight: '600' },
  serviceBarTrack:  { height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  serviceBarFill:   { height: '100%', borderRadius: 3, opacity: 0.85 },
  serviceRevenue:   { fontSize: 11, color: C.gray },

  // ── Customer growth sparkline
  growthHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  growthTotal:      { fontSize: 28, fontWeight: '900', color: C.teal },
  growthSub:        { fontSize: 11, color: C.gray, fontWeight: '600' },
  sparklineTrack:   { position: 'relative', width: '100%' },
  sparklineDot:     { position: 'absolute', borderRadius: 4 },
  sparklineLine:    { position: 'absolute', height: 2, borderRadius: 1 },
  sparklineLabels:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sparklineLabel:   { fontSize: 9, color: C.gray, fontWeight: '600' },

  // ── Performance metrics
  metricsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricItem:       { width: (SCREEN_W - 76) / 3, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.border },
  metricIcon:       { fontSize: 22 },
  metricValue:      { fontSize: 15, fontWeight: '900' },
  metricLabel:      { fontSize: 9, color: C.gray, fontWeight: '600', textAlign: 'center' },

  // ── Section header
  sectionRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  sectionLeft:   { flexDirection: 'row', alignItems: 'center' },
  sectionBar:    { width: 4, height: 17, backgroundColor: C.gold, borderRadius: 2, marginRight: 10 },
  sectionTitle:  { fontSize: 15, fontWeight: '800', color: C.white },
  sectionAction: { fontSize: 12, color: C.gold, fontWeight: '700' },

  // ── Quick actions
  actionsRow:    { flexDirection: 'row', paddingHorizontal: 14, gap: 8, marginBottom: 4 },
  actionBtn:     { flex: 1, alignItems: 'center', backgroundColor: C.navyCard, borderRadius: 16, paddingVertical: 14, borderWidth: 1, borderColor: C.border },
  actionIconWrap:{ width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1 },
  actionEmoji:   { fontSize: 22 },
  actionLabel:   { fontSize: 10, fontWeight: '700', color: C.offWhite, textAlign: 'center' },

  // ── Bookings
  bookingRow:        { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, backgroundColor: C.navyCard, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  bookingAvatar:     { width: 44, height: 44, borderRadius: 14, backgroundColor: C.goldDim, borderWidth: 1.5, borderColor: C.border, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  bookingAvatarText: { fontSize: 17, fontWeight: '800', color: C.gold },
  bookingInfo:       { flex: 1 },
  bookingName:       { fontSize: 14, fontWeight: '800', color: C.white, marginBottom: 2 },
  bookingService:    { fontSize: 12, color: C.gold, fontWeight: '600', marginBottom: 3 },
  bookingMeta:       { fontSize: 11, color: C.gray },
  statusPill:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  statusDot:         { width: 6, height: 6, borderRadius: 3 },
  statusText:        { fontSize: 11, fontWeight: '800' },

  // ── Empty
  emptyCard:  { marginHorizontal: 16, backgroundColor: C.navyCard, borderRadius: 20, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  emptyEmoji: { fontSize: 42, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: C.white, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: C.gray, textAlign: 'center', lineHeight: 19 },
});