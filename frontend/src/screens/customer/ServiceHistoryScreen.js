import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, FlatList, ActivityIndicator, RefreshControl, Platform
} from 'react-native';
import api from '../../utils/api';

const COLORS = {
  navy:    '#0B1D3A', navyMid: '#132847', gold: '#C9A84C',
  white:   '#FFFFFF', gray: '#8A9BB5',    cardBg: '#162040',
  success: '#16A34A', warning: '#F59E0B', error: '#EF4444', info: '#2563EB',
};

const STATUS_COLOR = {
  pending:    { bg: 'rgba(245,158,11,0.15)',  text: COLORS.warning },
  confirmed:  { bg: 'rgba(37,99,235,0.15)',   text: COLORS.info    },
  in_progress:{ bg: 'rgba(37,99,235,0.15)',   text: COLORS.info    },
  completed:  { bg: 'rgba(22,163,74,0.15)',   text: COLORS.success },
  cancelled:  { bg: 'rgba(239,68,68,0.15)',   text: COLORS.error   },
};

export default function ServiceHistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchHistory = async () => {
    try {
      setError(null);
      const res = await api.get('/customer/bookings');   // ✅ fixed route
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('ServiceHistory fetch error:', e);
      setError(e?.response?.data?.message ?? 'Failed to load service history');
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const total     = history.length;
  const completed = history.filter(h => h.status === 'completed').length;
  const active    = history.filter(h =>
    h.status === 'confirmed' || h.status === 'pending' || h.status === 'in_progress'
  ).length;

  const renderItem = ({ item }) => {
    const colors = STATUS_COLOR[item.status] ?? STATUS_COLOR.pending;
    return (
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: colors.text }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={styles.cardLeft}>
              <Text style={styles.garageName}>{item.garageName}</Text>
              <Text style={styles.service}>🔧 {item.service}</Text>
              <Text style={styles.vehicle}>🚗 {item.vehicle ?? 'N/A'}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.badgeText, { color: colors.text }]}>
                {item.status?.replace('_', ' ')}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaRow}>
            <Text style={styles.meta}>📅 {item.date}</Text>
            <Text style={styles.meta}>🕐 {item.time}</Text>
            <Text style={styles.price}>Rs. {item.price}</Text>
          </View>
          {item.status === 'completed' && !item.feedbackGiven && (
            <TouchableOpacity
              style={styles.feedbackBtn}
              onPress={() => navigation.navigate('CustomerFeedback', {
                bookingId:  item._id,
                garageName: item.garageName,
              })}>
              <Text style={styles.feedbackBtnText}>⭐ Leave Feedback</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Service History</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        {[
          { label: 'Total',     value: total,     color: COLORS.gold    },
          { label: 'Completed', value: completed, color: COLORS.success },
          { label: 'Active',    value: active,    color: COLORS.info    },
        ].map((s, i) => (
          <View key={i} style={[styles.summaryCard, { borderTopColor: s.color }]}>
            <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : error ? (
        /* ✅ Error state with retry */
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchHistory(); }}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={h => String(h._id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 40 }}
          style={{ backgroundColor: '#0D1829' }}
          refreshControl={
            <RefreshControl
              refreshing={refresh}
              tintColor={COLORS.gold}
              onRefresh={() => { setRefresh(true); fetchHistory(); }}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔧</Text>
              <Text style={styles.emptyTitle}>No service history yet</Text>
              <Text style={styles.emptyText}>Your completed and upcoming bookings will appear here</Text>
              <TouchableOpacity
                style={styles.bookNowBtn}
                onPress={() => navigation.navigate('CustomerBooking')}>
                <Text style={styles.bookNowText}>Book a Service</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLORS.navy,
                    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: COLORS.navy, paddingHorizontal: 16, paddingVertical: 16,
                    borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)' },
  backBtn:        { width: 60 },
  backText:       { color: COLORS.gold, fontWeight: '700', fontSize: 15 },
  title:          { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  summaryRow:     { flexDirection: 'row', backgroundColor: COLORS.cardBg, paddingVertical: 16,
                    paddingHorizontal: 16, gap: 12,
                    borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.1)' },
  summaryCard:    { flex: 1, alignItems: 'center', borderTopWidth: 3, paddingTop: 10, borderRadius: 2 },
  summaryValue:   { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  summaryLabel:   { fontSize: 11, color: COLORS.gray, textAlign: 'center' },
  card:           { backgroundColor: COLORS.cardBg, borderRadius: 16, flexDirection: 'row',
                    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)' },
  cardAccent:     { width: 4 },
  cardContent:    { flex: 1, padding: 14 },
  cardTop:        { flexDirection: 'row', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 8 },
  cardLeft:       { flex: 1, marginRight: 8 },
  garageName:     { fontSize: 16, fontWeight: '800', color: COLORS.white, marginBottom: 3 },
  service:        { fontSize: 13, color: COLORS.gold, marginBottom: 2, fontWeight: '600' },
  vehicle:        { fontSize: 13, color: COLORS.gray },
  badge:          { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText:      { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  divider:        { height: 1, backgroundColor: 'rgba(201,168,76,0.08)', marginVertical: 10 },
  metaRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta:           { fontSize: 12, color: COLORS.gray },
  price:          { fontSize: 15, fontWeight: '800', color: COLORS.success },
  feedbackBtn:    { marginTop: 12, backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: 10,
                    paddingVertical: 10, alignItems: 'center',
                    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  feedbackBtnText:{ color: COLORS.gold, fontWeight: '700', fontSize: 13 },
  empty:          { alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 },
  emptyIcon:      { fontSize: 48, marginBottom: 12 },
  emptyTitle:     { fontSize: 18, fontWeight: '800', color: COLORS.white, marginBottom: 6 },
  emptyText:      { fontSize: 14, color: COLORS.gray, marginBottom: 20, textAlign: 'center' },
  bookNowBtn:     { backgroundColor: COLORS.gold, borderRadius: 12,
                    paddingHorizontal: 24, paddingVertical: 12 },
  bookNowText:    { color: COLORS.navy, fontWeight: '800' },
  errorIcon:      { fontSize: 40, marginBottom: 12 },
  errorText:      { fontSize: 14, color: COLORS.error, marginBottom: 20,
                    textAlign: 'center', paddingHorizontal: 30 },
  retryBtn:       { backgroundColor: COLORS.gold, borderRadius: 12,
                    paddingHorizontal: 28, paddingVertical: 12 },
  retryBtnText:   { color: COLORS.navy, fontWeight: '800', fontSize: 14 },
});