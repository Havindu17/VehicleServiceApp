import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  FlatList, ActivityIndicator, RefreshControl, TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../utils/api';

// ── Shared colour palette (matches GarageDashboardScreen) ──────────────────
const COLORS = {
  navy:    '#0B1D3A',
  navyMid: '#132847',
  gold:    '#C9A84C',
  white:   '#FFFFFF',
  gray:    '#8A9BB5',
  cardBg:  '#162040',
  success: '#16A34A',
  warning: '#F59E0B',
  info:    '#2563EB',
  bg:      '#0D1829',
};

const Stars = ({ rating }) => (
  <View style={{ flexDirection: 'row' }}>
    {[1,2,3,4,5].map(s => (
      <Text key={s} style={{ fontSize: 14, color: s <= rating ? COLORS.gold : 'rgba(201,168,76,0.2)' }}>★</Text>
    ))}
  </View>
);

export default function GarageFeedbackScreen({ navigation }) {
  const insets = useSafeAreaInsets();          // ← notch / Dynamic-Island fix
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/garage/feedback');
      setReviews(res.data.reviews);
      setSummary(res.data.summary);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefresh(false); }
  };

  useEffect(() => { fetchReviews(); }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>{item.customerName?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.reviewerName}>{item.customerName}</Text>
          <Stars rating={item.rating} />
          <Text style={styles.reviewDate}>📅 {item.date}</Text>
        </View>
      </View>
      {item.comment ? (
        <Text style={styles.comment}>"{item.comment}"</Text>
      ) : null}
      <Text style={styles.service}>🔧 {item.service}</Text>
    </View>
  );

  const ListHeader = () =>
    summary ? (
      <View style={styles.summaryBox}>
        <Text style={styles.bigRating}>{summary.avgRating?.toFixed(1) ?? '0.0'}</Text>
        <Stars rating={Math.round(summary.avgRating ?? 0)} />
        <Text style={styles.totalReviews}>{summary.total} reviews total</Text>
        {[5,4,3,2,1].map(r => (
          <View key={r} style={styles.barRow}>
            <Text style={styles.barLabel}>{r}★</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${((summary.breakdown?.[r] ?? 0) / (summary.total || 1)) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.barCount}>{summary.breakdown?.[r] ?? 0}</Text>
          </View>
        ))}
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* ── Header (respects notch / Dynamic Island) ── */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerDecor} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Customer Feedback</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={{ padding: 14, gap: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={refresh}
              onRefresh={() => { setRefresh(true); fetchReviews(); }}
              tintColor={COLORS.gold}
            />
          }
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>⭐</Text>
              <Text style={styles.emptyText}>No reviews yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.navy },
  list:         { flex: 1, backgroundColor: COLORS.bg },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },

  // Header
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: COLORS.navy, paddingHorizontal: 16, paddingBottom: 16,
                  borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)',
                  overflow: 'hidden' },
  headerDecor:  { position: 'absolute', top: -30, right: 80, width: 100, height: 100,
                  borderRadius: 50, backgroundColor: COLORS.gold, opacity: 0.06 },
  backBtn:      { width: 60 },
  backText:     { color: COLORS.gold, fontWeight: '700', fontSize: 15 },
  title:        { color: COLORS.white, fontSize: 18, fontWeight: '800' },

  // Summary box
  summaryBox:   { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 20, marginBottom: 14,
                  alignItems: 'center',
                  borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)', elevation: 4 },
  bigRating:    { fontSize: 56, fontWeight: '900', color: COLORS.gold, lineHeight: 64 },
  totalReviews: { fontSize: 13, color: COLORS.gray, marginTop: 6, marginBottom: 16 },
  barRow:       { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 6 },
  barLabel:     { width: 28, fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  barTrack:     { flex: 1, height: 7, backgroundColor: 'rgba(255,255,255,0.06)',
                  borderRadius: 4, marginHorizontal: 8 },
  barFill:      { height: 7, backgroundColor: COLORS.gold, borderRadius: 4 },
  barCount:     { width: 24, fontSize: 12, color: COLORS.gray, textAlign: 'right' },

  // Review cards
  card:         { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16,
                  borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)', elevation: 3 },
  cardTop:      { flexDirection: 'row', marginBottom: 10 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22,
                  backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1.5,
                  borderColor: 'rgba(201,168,76,0.3)',
                  justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarLetter: { fontSize: 18, fontWeight: '800', color: COLORS.gold },
  cardInfo:     { flex: 1 },
  reviewerName: { fontSize: 15, fontWeight: '700', color: COLORS.white, marginBottom: 3 },
  reviewDate:   { fontSize: 12, color: COLORS.gray, marginTop: 3 },
  comment:      { fontSize: 14, color: COLORS.gray, fontStyle: 'italic',
                  marginBottom: 8, lineHeight: 20 },
  service:      { fontSize: 13, color: COLORS.gold, fontWeight: '600' },

  // Empty
  empty:        { alignItems: 'center', paddingTop: 60 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyText:    { fontSize: 16, color: COLORS.gray, fontWeight: '600' },
});