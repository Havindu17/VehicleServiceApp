import React, { useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Share, Dimensions, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');

const COLORS = {
  navy:    '#0B1D3A',
  navyMid: '#132847',
  navyLight:'#1A3360',
  gold:    '#C9A84C',
  goldLight:'#E8C96A',
  white:   '#FFFFFF',
  gray:    '#8A9BB5',
  cardBg:  '#162040',
  success: '#16A34A',
  warning: '#F59E0B',
  error:   '#EF4444',
  info:    '#2563EB',
  purple:  '#7C3AED',
  bg:      '#0D1829',
  cash:    '#16A34A',
  card:    '#2563EB',
  divider: 'rgba(201,168,76,0.15)',
};

const PIE_COLORS = ['#C9A84C','#2563EB','#7C3AED','#16A34A','#F59E0B','#EF4444'];

// ── Mini bar for service breakdown ──────────────────────────────────────────
function MiniBar({ pct, color }) {
  return (
    <View style={miniBarStyles.wrap}>
      <View style={[miniBarStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}
const miniBarStyles = StyleSheet.create({
  wrap: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});

// ── Section divider ──────────────────────────────────────────────────────────
function SectionDivider({ title }) {
  return (
    <View style={divStyles.row}>
      <View style={divStyles.line} />
      <View style={divStyles.badge}>
        <Text style={divStyles.text}>{title}</Text>
      </View>
      <View style={divStyles.line} />
    </View>
  );
}
const divStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginVertical: 20, marginHorizontal: 20 },
  line:  { flex: 1, height: 1, backgroundColor: COLORS.divider },
  badge: { backgroundColor: 'rgba(201,168,76,0.12)', paddingHorizontal: 14, paddingVertical: 4,
           borderRadius: 20, marginHorizontal: 10, borderWidth: 1, borderColor: COLORS.divider },
  text:  { color: COLORS.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
});

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, sub }) {
  return (
    <View style={[cardStyles.card, { borderTopColor: color }]}>
      <Text style={cardStyles.icon}>{icon}</Text>
      <Text style={[cardStyles.value, { color }]}>{value}</Text>
      <Text style={cardStyles.label}>{label}</Text>
      {sub ? <Text style={cardStyles.sub}>{sub}</Text> : null}
    </View>
  );
}
const cardStyles = StyleSheet.create({
  card:  { width: (SCREEN_W - 52) / 2, backgroundColor: COLORS.cardBg, borderRadius: 18,
           padding: 16, alignItems: 'center', borderTopWidth: 3,
           borderWidth: 1, borderColor: COLORS.divider, elevation: 4 },
  icon:  { fontSize: 28, marginBottom: 8 },
  value: { fontSize: 20, fontWeight: '900', marginBottom: 3, textAlign: 'center' },
  label: { fontSize: 11, color: COLORS.gray, textAlign: 'center', fontWeight: '600' },
  sub:   { fontSize: 10, color: COLORS.gray, marginTop: 2 },
});

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════
export default function FinanceReportScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Data passed from FinanceScreen via navigation
  const { data, period } = route.params ?? {};

  const totalRevenue  = data?.totalRevenue  ?? 0;
  const completedJobs = data?.completedJobs ?? 0;
  const avgPerJob     = data?.avgPerJob     ?? 0;
  const pendingValue  = data?.pendingValue  ?? 0;
  const byService     = data?.byService     ?? [];
  const transactions  = data?.transactions  ?? [];

  // Payment split
  const cashTotal = transactions
    .filter(t => (t.paymentMethod ?? 'Cash').toLowerCase() === 'cash')
    .reduce((s, t) => s + (t.amount ?? 0), 0);
  const cardTotal = transactions
    .filter(t => t.paymentMethod?.toLowerCase() === 'card')
    .reduce((s, t) => s + (t.amount ?? 0), 0);
  const cashPct = (cashTotal + cardTotal) > 0
    ? Math.round((cashTotal / (cashTotal + cardTotal)) * 100) : 0;
  const cardPct = 100 - cashPct;

  const generatedAt = new Date().toLocaleString('en-LK', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // Header parallax
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  const handleShare = async () => {
    const lines = [
      `╔══════════════════════════════╗`,
      `║     FINANCE REPORT — ${period.toUpperCase().padEnd(6)}  ║`,
      `╚══════════════════════════════╝`,
      `Generated: ${generatedAt}`,
      ``,
      `SUMMARY`,
      `────────────────────────────────`,
      `Total Revenue  : Rs. ${totalRevenue.toLocaleString()}`,
      `Completed Jobs : ${completedJobs}`,
      `Avg per Job    : Rs. ${avgPerJob.toLocaleString()}`,
      `Pending Value  : Rs. ${pendingValue.toLocaleString()}`,
      ``,
      `PAYMENT SPLIT`,
      `────────────────────────────────`,
      `💵 Cash  : Rs. ${cashTotal.toLocaleString()} (${cashPct}%)`,
      `💳 Card  : Rs. ${cardTotal.toLocaleString()} (${cardPct}%)`,
      ``,
      `REVENUE BY SERVICE`,
      `────────────────────────────────`,
      ...byService.map((r, i) =>
        `${String(i + 1).padStart(2)}. ${r.name.substring(0, 22).padEnd(22)} ${r.count} jobs   Rs. ${r.revenue.toLocaleString()}`
      ),
      ``,
      `TRANSACTION HISTORY`,
      `────────────────────────────────`,
      ...transactions.map((t, i) =>
        `${String(i + 1).padStart(2)}. ${t.date}  ${(t.customerName ?? '').padEnd(16)} Rs. ${(t.amount ?? 0).toLocaleString()}  [${t.paymentMethod ?? 'Cash'}]`
      ),
      ``,
      `— Generated by GarageApp —`,
    ].join('\n');

    await Share.share({ message: lines, title: `Finance Report – ${period}` });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Finance Report</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareText}>📤 Share</Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={styles.scroll}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero Header ───────────────────────────────────────────────── */}
        <Animated.View style={[styles.hero, {
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslate }],
        }]}>
          {/* Decorative circles */}
          <View style={[styles.decor, { width: 180, height: 180, top: -60, right: -40, opacity: 0.06 }]} />
          <View style={[styles.decor, { width: 100, height: 100, top: 20, left: -20, opacity: 0.04 }]} />

          <View style={styles.heroInner}>
            <View style={styles.heroIconWrap}>
              <Text style={styles.heroIcon}>📊</Text>
            </View>
            <View>
              <Text style={styles.heroLabel}>FINANCE REPORT</Text>
              <Text style={styles.heroPeriod}>{period}</Text>
            </View>
          </View>
          <Text style={styles.heroDate}>Generated {generatedAt}</Text>

          {/* Gold accent line */}
          <View style={styles.heroAccentLine} />
        </Animated.View>

        {/* ── Summary Cards ─────────────────────────────────────────────── */}
        <SectionDivider title="Summary" />

        <View style={styles.cardGrid}>
          <StatCard
            icon="💰" label="Total Revenue"
            value={`Rs. ${totalRevenue.toLocaleString()}`}
            color={COLORS.success}
          />
          <StatCard
            icon="✅" label="Completed Jobs"
            value={completedJobs}
            color={COLORS.info}
          />
          <StatCard
            icon="📊" label="Avg per Job"
            value={`Rs. ${avgPerJob.toLocaleString()}`}
            color={COLORS.purple}
          />
          <StatCard
            icon="⏳" label="Pending Value"
            value={`Rs. ${pendingValue.toLocaleString()}`}
            color={COLORS.warning}
          />
        </View>

        {/* ── Payment Split ─────────────────────────────────────────────── */}
        <SectionDivider title="Payment Split" />

        <View style={styles.payRow}>
          <View style={[styles.payCard, { borderTopColor: COLORS.cash }]}>
            <Text style={styles.payIcon}>💵</Text>
            <Text style={[styles.payAmt, { color: COLORS.cash }]}>Rs. {cashTotal.toLocaleString()}</Text>
            <Text style={styles.payLabel}>Cash</Text>
            <View style={[styles.payPctBadge, { backgroundColor: 'rgba(22,163,74,0.15)' }]}>
              <Text style={[styles.payPct, { color: COLORS.cash }]}>{cashPct}%</Text>
            </View>
          </View>
          <View style={[styles.payCard, { borderTopColor: COLORS.card }]}>
            <Text style={styles.payIcon}>💳</Text>
            <Text style={[styles.payAmt, { color: COLORS.card }]}>Rs. {cardTotal.toLocaleString()}</Text>
            <Text style={styles.payLabel}>Card</Text>
            <View style={[styles.payPctBadge, { backgroundColor: 'rgba(37,99,235,0.15)' }]}>
              <Text style={[styles.payPct, { color: COLORS.card }]}>{cardPct}%</Text>
            </View>
          </View>
        </View>

        {/* Split bar */}
        {(cashTotal + cardTotal) > 0 && (
          <View style={styles.splitWrap}>
            <View style={styles.splitBar}>
              <View style={[styles.splitFill, { flex: cashPct, backgroundColor: COLORS.cash }]} />
              <View style={[styles.splitFill, { flex: cardPct, backgroundColor: COLORS.card }]} />
            </View>
            <View style={styles.splitLabels}>
              <Text style={[styles.splitLabel, { color: COLORS.cash }]}>💵 Cash {cashPct}%</Text>
              <Text style={[styles.splitLabel, { color: COLORS.card }]}>💳 Card {cardPct}%</Text>
            </View>
          </View>
        )}

        {/* ── Revenue by Service ────────────────────────────────────────── */}
        <SectionDivider title="Revenue by Service" />

        <View style={styles.tableBox}>
          {/* Header */}
          <View style={styles.tableHead}>
            <Text style={[styles.thCell, { flex: 3 }]}>#  Service</Text>
            <Text style={[styles.thCell, { width: 44, textAlign: 'center' }]}>Jobs</Text>
            <Text style={[styles.thCell, { width: 90, textAlign: 'right' }]}>Revenue</Text>
          </View>

          {byService.length === 0 && (
            <Text style={styles.emptyText}>No service data for this period</Text>
          )}

          {byService.map((row, i) => {
            const pct = Math.round((row.revenue / (totalRevenue || 1)) * 100);
            const color = PIE_COLORS[i % PIE_COLORS.length];
            return (
              <View key={i}>
                <View style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                  <View style={[styles.rowNum, { backgroundColor: color + '22' }]}>
                    <Text style={[styles.rowNumText, { color }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 3, paddingRight: 8 }}>
                    <Text style={styles.rowName} numberOfLines={2}>{row.name}</Text>
                    <MiniBar pct={pct} color={color} />
                  </View>
                  <Text style={[styles.rowJobs]}>{row.count}</Text>
                  <Text style={[styles.rowRevenue, { color: COLORS.success }]}>
                    Rs. {row.revenue.toLocaleString()}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Total row */}
          {byService.length > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={[styles.totalValue, { color: COLORS.success }]}>
                Rs. {totalRevenue.toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* ── Transactions ─────────────────────────────────────────────── */}
        <SectionDivider title={`Transactions (${transactions.length})`} />

        {transactions.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>💵</Text>
            <Text style={styles.emptyText}>No transactions this period</Text>
          </View>
        )}

        {transactions.map((t, i) => {
          const isCash = (t.paymentMethod ?? 'Cash').toLowerCase() === 'cash';
          return (
            <View key={i} style={styles.txRow}>
              {/* Left accent */}
              <View style={[styles.txAccent, { backgroundColor: isCash ? COLORS.cash : COLORS.card }]} />

              <View style={styles.txMeta}>
                <Text style={styles.txIdx}>#{String(i + 1).padStart(2, '0')}</Text>
                <View style={[styles.txBadge, {
                  backgroundColor: isCash ? 'rgba(22,163,74,0.12)' : 'rgba(37,99,235,0.12)',
                }]}>
                  <Text style={[styles.txBadgeTxt, { color: isCash ? COLORS.cash : COLORS.card }]}>
                    {isCash ? '💵' : '💳'}
                  </Text>
                </View>
              </View>

              <View style={styles.txBody}>
                <Text style={styles.txName}>{t.customerName}</Text>
                <Text style={styles.txService} numberOfLines={1}>{t.service}</Text>
                <Text style={styles.txDate}>📅 {t.date}</Text>
              </View>

              <Text style={styles.txAmt}>+ Rs. {(t.amount ?? 0).toLocaleString()}</Text>
            </View>
          );
        })}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>GarageApp · Finance Report</Text>
          <Text style={styles.footerSub}>{generatedAt}</Text>
          <View style={{ height: 30 }} />
        </View>

      </Animated.ScrollView>

    </SafeAreaView>
  );
}

// ── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.navy },
  scroll: { flex: 1, backgroundColor: COLORS.bg },

  // Top bar
  topBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
               backgroundColor: COLORS.navy, paddingHorizontal: 16, paddingBottom: 14,
               borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  backBtn:   { width: 60 },
  backText:  { color: COLORS.gold, fontWeight: '700', fontSize: 15 },
  topTitle:  { color: COLORS.white, fontSize: 17, fontWeight: '800' },
  shareBtn:  { width: 80, alignItems: 'flex-end' },
  shareText: { color: COLORS.gold, fontWeight: '700', fontSize: 13 },

  // Hero
  hero:          { backgroundColor: COLORS.navyMid, marginHorizontal: 16, marginTop: 20,
                   borderRadius: 24, padding: 22, overflow: 'hidden',
                   borderWidth: 1, borderColor: COLORS.divider, elevation: 6 },
  decor:         { position: 'absolute', borderRadius: 999, backgroundColor: COLORS.gold },
  heroInner:     { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  heroIconWrap:  { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(201,168,76,0.15)',
                   alignItems: 'center', justifyContent: 'center',
                   borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  heroIcon:      { fontSize: 28 },
  heroLabel:     { color: COLORS.gray, fontSize: 10, fontWeight: '800', letterSpacing: 2,
                   textTransform: 'uppercase', marginBottom: 4 },
  heroPeriod:    { color: COLORS.white, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  heroDate:      { color: COLORS.gray, fontSize: 12, fontWeight: '500' },
  heroAccentLine:{ position: 'absolute', bottom: 0, left: 22, right: 22, height: 2,
                   backgroundColor: COLORS.gold, borderRadius: 1, opacity: 0.4 },

  // Cards grid
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, justifyContent: 'space-between' },

  // Payment
  payRow:        { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  payCard:       { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 18,
                   alignItems: 'center', borderTopWidth: 3,
                   borderWidth: 1, borderColor: COLORS.divider, elevation: 3 },
  payIcon:       { fontSize: 30, marginBottom: 8 },
  payAmt:        { fontSize: 20, fontWeight: '900', marginBottom: 2 },
  payLabel:      { fontSize: 12, color: COLORS.gray, fontWeight: '600', marginBottom: 8 },
  payPctBadge:   { paddingHorizontal: 12, paddingVertical: 3, borderRadius: 20 },
  payPct:        { fontSize: 13, fontWeight: '800' },
  splitWrap:     { paddingHorizontal: 16, marginTop: 12 },
  splitBar:      { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden',
                   backgroundColor: 'rgba(255,255,255,0.05)' },
  splitFill:     { height: '100%' },
  splitLabels:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  splitLabel:    { fontSize: 12, fontWeight: '700' },

  // Service table
  tableBox:    { marginHorizontal: 16, backgroundColor: COLORS.cardBg, borderRadius: 20,
                 overflow: 'hidden', borderWidth: 1, borderColor: COLORS.divider, elevation: 3 },
  tableHead:   { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.navyMid,
                 paddingHorizontal: 14, paddingVertical: 12 },
  thCell:      { color: COLORS.gold, fontSize: 11, fontWeight: '800',
                 textTransform: 'uppercase', letterSpacing: 0.8 },
  tableRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
                 paddingVertical: 12, gap: 8 },
  tableRowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  rowNum:      { width: 26, height: 26, borderRadius: 8, alignItems: 'center',
                 justifyContent: 'center', marginRight: 8 },
  rowNumText:  { fontSize: 12, fontWeight: '800' },
  rowName:     { fontSize: 13, color: COLORS.white, fontWeight: '600', marginBottom: 4 },
  rowJobs:     { width: 44, textAlign: 'center', color: COLORS.gray, fontSize: 13, fontWeight: '600' },
  rowRevenue:  { width: 90, textAlign: 'right', fontSize: 13, fontWeight: '800' },
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                 backgroundColor: 'rgba(22,163,74,0.1)', paddingHorizontal: 16, paddingVertical: 13,
                 borderTopWidth: 1, borderTopColor: 'rgba(22,163,74,0.2)' },
  totalLabel:  { color: COLORS.white, fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  totalValue:  { fontSize: 18, fontWeight: '900' },

  // Transactions
  txRow:    { marginHorizontal: 16, marginBottom: 8, backgroundColor: COLORS.cardBg,
              borderRadius: 16, flexDirection: 'row', alignItems: 'center',
              borderWidth: 1, borderColor: COLORS.divider, overflow: 'hidden' },
  txAccent: { width: 4, alignSelf: 'stretch' },
  txMeta:   { width: 48, alignItems: 'center', paddingVertical: 14, gap: 8 },
  txIdx:    { color: COLORS.gray, fontSize: 10, fontWeight: '700' },
  txBadge:  { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  txBadgeTxt:{ fontSize: 14 },
  txBody:   { flex: 1, paddingVertical: 12, gap: 2 },
  txName:   { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  txService:{ color: COLORS.gold, fontWeight: '600', fontSize: 12 },
  txDate:   { color: COLORS.gray, fontSize: 11 },
  txAmt:    { color: COLORS.success, fontWeight: '900', fontSize: 14, paddingRight: 14 },

  // Empty & footer
  emptyBox:  { marginHorizontal: 16, backgroundColor: COLORS.cardBg, borderRadius: 16,
               padding: 32, alignItems: 'center', borderWidth: 1, borderColor: COLORS.divider },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { color: COLORS.gray, fontSize: 14, fontWeight: '600', textAlign: 'center', padding: 16 },
  footer:    { alignItems: 'center', paddingTop: 24 },
  footerLine:{ width: 60, height: 2, backgroundColor: COLORS.divider, borderRadius: 1, marginBottom: 12 },
  footerText:{ color: COLORS.gray, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  footerSub: { color: 'rgba(138,155,181,0.5)', fontSize: 11, marginTop: 4 },
});