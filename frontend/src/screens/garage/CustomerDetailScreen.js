import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
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
  purple:  '#7C3AED',
  bg:      '#0D1829',
};

const PAY_COLOR = {
  unpaid:           COLORS.gray,
  pending_approval: COLORS.warning,
  paid:             COLORS.success,
  overdue:          COLORS.error,
};

const STATUS_COLOR = {
  pending:    COLORS.warning,
  confirmed:  COLORS.info,
  completed:  COLORS.success,
  cancelled:  COLORS.error,
  in_progress:COLORS.purple,
};

export default function CustomerDetailScreen({ route, navigation }) {
  const { customerId, customerName } = route.params ?? {};

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [tab,     setTab]     = useState('overview');

  const fetchCustomer = async () => {
    try {
      const res = await api.get(`/garage/customers/${customerId}`);
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefresh(false); }
  };

  useEffect(() => { fetchCustomer(); }, [customerId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  const customer  = data?.customer  ?? {};
  const bookings  = data?.bookings  ?? [];
  const summary   = data?.summary   ?? {};

  const initials = (customer.name ?? customerName ?? '?')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* ── Hero Card ── */}
      <View style={styles.hero}>
        <View style={styles.heroDecor} />
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{customer.name ?? customerName}</Text>
          {customer.email && <Text style={styles.heroMeta}>📧 {customer.email}</Text>}
          {customer.phone && <Text style={styles.heroMeta}>📱 {customer.phone}</Text>}
        </View>
      </View>

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total Jobs',  value: summary.totalJobs    ?? 0,         color: COLORS.info    },
          { label: 'Total Spent', value: `Rs.${summary.totalSpent ?? 0}`,   color: COLORS.success },
          { label: 'Overdue',     value: `Rs.${summary.totalOverdue ?? 0}`, color: COLORS.error   },
          { label: 'Pending',     value: `Rs.${summary.totalPending ?? 0}`, color: COLORS.warning },
        ].map((s, i) => (
          <View key={i} style={[styles.statCard, { borderTopColor: s.color }]}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Tab Nav ── */}
      <View style={styles.tabRow}>
        {[
          { key: 'overview', label: '👤 Info'     },
          { key: 'bookings', label: '📋 Bookings' },
          { key: 'payments', label: '💳 Payments' },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refresh}
            onRefresh={() => { setRefresh(true); fetchCustomer(); }}
            tintColor={COLORS.gold} />
        }
      >
        {/* ════════ OVERVIEW TAB ════════ */}
        {tab === 'overview' && (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>👤 Personal Details</Text>
              {[
                { label: 'Full Name', value: customer.name,  icon: '👤' },
                { label: 'Email',     value: customer.email, icon: '📧' },
                { label: 'Phone',     value: customer.phone, icon: '📱' },
              ].map((r, i) => r.value ? (
                <View key={i} style={styles.infoRow}>
                  <Text style={styles.infoIcon}>{r.icon}</Text>
                  <View>
                    <Text style={styles.infoLabel}>{r.label}</Text>
                    <Text style={styles.infoValue}>{r.value}</Text>
                  </View>
                </View>
              ) : null)}
            </View>

            {(data?.vehicles ?? []).length > 0 && (
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>🚗 Vehicles</Text>
                {data.vehicles.map((v, i) => (
                  <View key={i} style={styles.vehicleRow}>
                    <View style={styles.vehicleIcon}>
                      <Text style={{ fontSize: 22 }}>🚗</Text>
                    </View>
                    <View>
                      <Text style={styles.vehicleName}>
                        {v.make} {v.model} {v.year ? `(${v.year})` : ''}
                      </Text>
                      {v.licensePlate && (
                        <Text style={styles.vehiclePlate}>🔢 {v.licensePlate}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>📊 Summary</Text>
              {[
                { label: 'Total Bookings',   value: summary.totalJobs     ?? 0 },
                { label: 'Completed Jobs',   value: summary.completedJobs ?? 0 },
                { label: 'Total Revenue',    value: `Rs. ${summary.totalSpent   ?? 0}` },
                { label: 'Overdue Amount',   value: `Rs. ${summary.totalOverdue ?? 0}` },
                { label: 'Pending Approval', value: `Rs. ${summary.totalPending ?? 0}` },
              ].map((r, i) => (
                <View key={i} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{r.label}</Text>
                  <Text style={styles.summaryValue}>{r.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ════════ BOOKINGS TAB ════════ */}
        {tab === 'bookings' && (
          <>
            {bookings.length === 0 && (
              <View style={styles.empty}>
                <Text style={{ fontSize: 40 }}>📋</Text>
                <Text style={styles.emptyText}>No bookings found</Text>
              </View>
            )}
            {bookings.map((b, i) => {
              const sc = STATUS_COLOR[b.jobStatus?.toLowerCase()] ?? COLORS.gray;
              return (
                <View key={i} style={styles.bookingCard}>
                  <View style={[styles.bookingAccent, { backgroundColor: sc }]} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={styles.bookingService}>{b.service}</Text>
                      <View style={[styles.badge, { backgroundColor: sc + '22', borderColor: sc + '55' }]}>
                        <Text style={[styles.badgeText, { color: sc }]}>{b.jobStatus}</Text>
                      </View>
                    </View>
                    <Text style={styles.bookingMeta}>
                      📅 {b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString() : 'N/A'}
                    </Text>
                    {b.vehicle?.make && (
                      <Text style={styles.bookingMeta}>🚗 {b.vehicle.make} {b.vehicle.model}</Text>
                    )}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                      <Text style={styles.bookingAmount}>Rs. {b.totalAmount ?? 0}</Text>
                      <View style={[styles.payBadge, {
                        backgroundColor: (PAY_COLOR[b.paymentStatus] ?? COLORS.gray) + '22',
                        borderColor:     (PAY_COLOR[b.paymentStatus] ?? COLORS.gray) + '55',
                      }]}>
                        <Text style={[styles.payBadgeText, { color: PAY_COLOR[b.paymentStatus] ?? COLORS.gray }]}>
                          {b.paymentStatus === 'paid'             ? '✅ Paid'             :
                           b.paymentStatus === 'pending_approval' ? '⏳ Pending Approval' :
                           b.paymentStatus === 'overdue'          ? '🚨 Overdue'          :
                                                                    '⭕ Unpaid'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* ════════ PAYMENTS TAB ════════ */}
        {tab === 'payments' && (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>💳 Payment Summary</Text>
              {[
                { label: '✅ Total Paid',      value: `Rs. ${summary.totalSpent   ?? 0}`, color: COLORS.success },
                { label: '⏳ Pending Approval', value: `Rs. ${summary.totalPending ?? 0}`, color: COLORS.warning },
                { label: '🚨 Overdue',          value: `Rs. ${summary.totalOverdue ?? 0}`, color: COLORS.error   },
                { label: '⭕ Unpaid',           value: `Rs. ${summary.totalUnpaid  ?? 0}`, color: COLORS.gray    },
              ].map((r, i) => (
                <View key={i} style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: r.color }]}>{r.label}</Text>
                  <Text style={[styles.summaryValue, { color: r.color }]}>{r.value}</Text>
                </View>
              ))}
            </View>

            {bookings.filter(b => b.totalAmount > 0).map((b, i) => (
              <View key={i} style={styles.payCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payCardService}>{b.service}</Text>
                  <Text style={styles.payCardDate}>
                    {b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString() : ''}
                  </Text>
                  {b.paymentMethod && (
                    <Text style={styles.payCardMethod}>
                      {b.paymentMethod === 'cash' ? '💵 Cash' : '💳 Card'}
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.payCardAmount}>Rs. {b.totalAmount}</Text>
                  <View style={[styles.payBadge, {
                    backgroundColor: (PAY_COLOR[b.paymentStatus] ?? COLORS.gray) + '22',
                    borderColor:     (PAY_COLOR[b.paymentStatus] ?? COLORS.gray) + '55',
                    marginTop: 6,
                  }]}>
                    <Text style={[styles.payBadgeText, { color: PAY_COLOR[b.paymentStatus] ?? COLORS.gray }]}>
                      {b.paymentStatus === 'paid'             ? '✅ Paid'    :
                       b.paymentStatus === 'pending_approval' ? '⏳ Pending' :
                       b.paymentStatus === 'overdue'          ? '🚨 Overdue' : '⭕ Unpaid'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.navy,
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  scroll: { flex: 1, backgroundColor: COLORS.bg },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                 backgroundColor: COLORS.navy, paddingHorizontal: 20, paddingVertical: 14,
                 borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)' },
  backBtn:     { width: 60 },
  backText:    { color: COLORS.gold, fontSize: 18, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.white },

  hero:         { backgroundColor: COLORS.navy, padding: 20, flexDirection: 'row',
                  alignItems: 'center', overflow: 'hidden',
                  borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.1)' },
  heroDecor:    { position: 'absolute', top: -30, right: -30, width: 120, height: 120,
                  borderRadius: 60, backgroundColor: COLORS.gold, opacity: 0.06 },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.gold,
                  justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText:   { fontSize: 26, fontWeight: '900', color: COLORS.navy },
  heroInfo:     { flex: 1 },
  heroName:     { fontSize: 20, fontWeight: '900', color: COLORS.white, marginBottom: 4 },
  heroMeta:     { fontSize: 13, color: COLORS.gray, marginBottom: 2 },

  statsRow:   { flexDirection: 'row', backgroundColor: COLORS.navyMid, paddingHorizontal: 12,
                paddingVertical: 10, gap: 8,
                borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.08)' },
  statCard:   { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 10,
                alignItems: 'center', borderTopWidth: 2,
                borderWidth: 1, borderColor: 'rgba(201,168,76,0.08)' },
  statValue:  { fontSize: 13, fontWeight: '900', marginBottom: 2 },
  statLabel:  { fontSize: 9, color: COLORS.gray, fontWeight: '600', textAlign: 'center' },

  tabRow:       { flexDirection: 'row', backgroundColor: COLORS.navyMid,
                  paddingHorizontal: 14, paddingVertical: 8, gap: 8,
                  borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.08)' },
  tabBtn:       { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.04)' },
  tabBtnActive: { backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1, borderColor: COLORS.gold },
  tabText:      { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  tabTextActive:{ color: COLORS.gold, fontWeight: '800' },

  infoCard:      { margin: 14, marginBottom: 0, backgroundColor: COLORS.cardBg, borderRadius: 16,
                   padding: 16, borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)' },
  infoCardTitle: { fontSize: 14, fontWeight: '800', color: COLORS.white, marginBottom: 14 },
  infoRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoIcon:      { fontSize: 20, marginRight: 12, width: 28 },
  infoLabel:     { fontSize: 11, color: COLORS.gray, fontWeight: '600', marginBottom: 2 },
  infoValue:     { fontSize: 14, color: COLORS.white, fontWeight: '600' },

  vehicleRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  vehicleIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(201,168,76,0.1)',
                 justifyContent: 'center', alignItems: 'center', marginRight: 12,
                 borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  vehicleName: { fontSize: 14, color: COLORS.white, fontWeight: '700' },
  vehiclePlate:{ fontSize: 12, color: COLORS.gold, marginTop: 2 },

  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between',
                  paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  summaryLabel: { fontSize: 13, color: COLORS.gray },
  summaryValue: { fontSize: 13, color: COLORS.white, fontWeight: '700' },

  bookingCard:   { marginHorizontal: 14, marginBottom: 10, backgroundColor: COLORS.cardBg,
                   borderRadius: 14, padding: 14, flexDirection: 'row',
                   borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)' },
  bookingAccent: { width: 4, borderRadius: 2, marginRight: 12, alignSelf: 'stretch' },
  bookingService:{ fontSize: 14, fontWeight: '700', color: COLORS.white },
  bookingMeta:   { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  bookingAmount: { fontSize: 15, fontWeight: '800', color: COLORS.success },
  badge:         { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  badgeText:     { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },

  payCard:        { marginHorizontal: 14, marginBottom: 10, backgroundColor: COLORS.cardBg,
                    borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center',
                    borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)' },
  payCardService: { fontSize: 14, fontWeight: '700', color: COLORS.white, marginBottom: 2 },
  payCardDate:    { fontSize: 12, color: COLORS.gray },
  payCardMethod:  { fontSize: 12, color: COLORS.gold, marginTop: 2, fontWeight: '600' },
  payCardAmount:  { fontSize: 16, fontWeight: '900', color: COLORS.success },
  payBadge:       { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  payBadgeText:   { fontSize: 10, fontWeight: '800' },

  empty:     { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.gray, fontSize: 15, marginTop: 10 },
});