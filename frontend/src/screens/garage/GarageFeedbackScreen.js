import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  FlatList, ActivityIndicator, RefreshControl, TouchableOpacity
} from 'react-native';
import api from '../../utils/api';

const Stars = ({ rating }) => (
  <View style={{ flexDirection: 'row' }}>
    {[1,2,3,4,5].map(s => (
      <Text key={s} style={{ fontSize: 14, color: s <= rating ? '#f59e0b' : '#e5e7eb' }}>★</Text>
    ))}
  </View>
);

export default function GarageFeedbackScreen({ navigation }) {
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
          <Text style={styles.reviewDate}>{item.date}</Text>
        </View>
      </View>
      {item.comment ? <Text style={styles.comment}>"{item.comment}"</Text> : null}
      <Text style={styles.service}>🔧 {item.service}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a1628" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Customer Feedback</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); fetchReviews(); }} />}
          ListHeaderComponent={
            summary ? (
              <View style={styles.summaryBox}>
                <Text style={styles.bigRating}>{summary.avgRating?.toFixed(1) ?? '0.0'}</Text>
                <Stars rating={Math.round(summary.avgRating ?? 0)} />
                <Text style={styles.totalReviews}>{summary.total} reviews total</Text>
                {[5,4,3,2,1].map(r => (
                  <View key={r} style={styles.barRow}>
                    <Text style={styles.barLabel}>{r}★</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${((summary.breakdown?.[r] ?? 0) / (summary.total || 1)) * 100}%` }]} />
                    </View>
                    <Text style={styles.barCount}>{summary.breakdown?.[r] ?? 0}</Text>
                  </View>
                ))}
              </View>
            ) : null
          }
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
  safe:          { flex: 1, backgroundColor: '#f0f4ff' },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   backgroundColor: '#0a1628', paddingHorizontal: 16, paddingVertical: 16 },
  backBtn:       { width: 60 },
  backText:      { color: '#4a90d9', fontWeight: '700', fontSize: 15 },
  title:         { color: '#fff', fontSize: 18, fontWeight: '800' },
  summaryBox:    { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12,
                   alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  bigRating:     { fontSize: 56, fontWeight: '900', color: '#0a1628', lineHeight: 64 },
  totalReviews:  { fontSize: 14, color: '#888', marginTop: 6, marginBottom: 16 },
  barRow:        { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 6 },
  barLabel:      { width: 28, fontSize: 13, color: '#555', fontWeight: '600' },
  barTrack:      { flex: 1, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, marginHorizontal: 8 },
  barFill:       { height: 8, backgroundColor: '#f59e0b', borderRadius: 4 },
  barCount:      { width: 24, fontSize: 12, color: '#888', textAlign: 'right' },
  card:          { backgroundColor: '#fff', borderRadius: 16, padding: 16,
                   shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardTop:       { flexDirection: 'row', marginBottom: 10 },
  avatarCircle:  { width: 42, height: 42, borderRadius: 21, backgroundColor: '#dbeafe',
                   justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarLetter:  { fontSize: 18, fontWeight: '800', color: '#2563eb' },
  cardInfo:      { flex: 1 },
  reviewerName:  { fontSize: 15, fontWeight: '700', color: '#0a1628', marginBottom: 3 },
  reviewDate:    { fontSize: 12, color: '#aaa', marginTop: 2 },
  comment:       { fontSize: 14, color: '#444', fontStyle: 'italic', marginBottom: 8, lineHeight: 20 },
  service:       { fontSize: 13, color: '#2563eb', fontWeight: '600' },
  empty:         { alignItems: 'center', paddingTop: 60 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyText:     { fontSize: 16, color: '#aaa' },
});