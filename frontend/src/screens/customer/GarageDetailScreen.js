import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, ActivityIndicator, Platform
} from 'react-native';
import api from '../../utils/api';

const COLORS = {
  navy:    '#0B1D3A', navyMid: '#132847', gold: '#C9A84C',
  white:   '#FFFFFF', gray: '#8A9BB5',    cardBg: '#162040',
  success: '#16A34A',
};

const Stars = ({ rating }) => (
  <View style={{ flexDirection: 'row' }}>
    {[1,2,3,4,5].map(s => (
      <Text key={s} style={{ fontSize: 16, color: s <= Math.round(rating) ? COLORS.gold : 'rgba(201,168,76,0.2)' }}>★</Text>
    ))}
  </View>
);

export default function GarageDetailScreen({ navigation, route }) {
  const { garageId, garageName } = route.params;
  const [garage,  setGarage]  = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [gRes, rRes] = await Promise.all([
          api.get(`/customer/garages/${garageId}`),
          api.get(`/customer/garages/${garageId}/reviews`),
        ]);
        setGarage(gRes.data);
        setReviews(rRes.data.slice(0, 3));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.gold} /></View>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{garageName}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll}>
        {/* Hero */}
        <View style={styles.heroBox}>
          <View style={styles.heroIconBg}>
            <Text style={{ fontSize: 52 }}>🏪</Text>
          </View>
          <Text style={styles.heroName}>{garage?.name}</Text>
          <View style={styles.ratingRow}>
            <Stars rating={garage?.rating ?? 0} />
            <Text style={styles.ratingNum}>{garage?.rating ?? '0.0'} ({garage?.reviewCount ?? 0})</Text>
          </View>
          <Text style={styles.heroAddress}>📍 {garage?.address}</Text>
          <View style={styles.tagsRow}>
            {garage?.openWeekends && (
              <View style={styles.tag}><Text style={styles.tagText}>Open Weekends</Text></View>
            )}
            <View style={styles.tag}>
              <Text style={styles.tagText}>⏱ {garage?.openTime} - {garage?.closeTime}</Text>
            </View>
          </View>
        </View>

        {/* About */}
        {garage?.description && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>About</Text>
            </View>
            <Text style={styles.aboutText}>{garage.description}</Text>
          </View>
        )}

        {/* Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>Services Offered</Text>
          </View>
          {(garage?.services ?? []).map((s, i) => (
            <View key={i} style={styles.serviceRow}>
              <View style={styles.serviceLeft}>
                <Text style={styles.serviceName}>{s.name}</Text>
                {s.duration ? <Text style={styles.serviceMeta}>⏱ {s.duration} mins</Text> : null}
              </View>
              <Text style={styles.servicePrice}>Rs. {s.price}</Text>
            </View>
          ))}
          {(!garage?.services || garage.services.length === 0) && (
            <Text style={styles.noItems}>No services listed</Text>
          )}
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>Contact</Text>
          </View>
          <Text style={styles.contactItem}>📞 {garage?.phone ?? '—'}</Text>
          <Text style={styles.contactItem}>📧 {garage?.email ?? '—'}</Text>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
          </View>
          {reviews.map((r, i) => (
            <View key={i} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <Text style={styles.reviewerName}>{r.customerName}</Text>
                <Stars rating={r.rating} />
              </View>
              {r.comment ? <Text style={styles.reviewComment}>"{r.comment}"</Text> : null}
              <Text style={styles.reviewDate}>{r.date}</Text>
            </View>
          ))}
          {reviews.length === 0 && <Text style={styles.noItems}>No reviews yet</Text>}
        </View>

        <TouchableOpacity style={styles.bookBtn}
          onPress={() => navigation.navigate('CustomerBooking', { garageId, garageName: garage?.name })}>
          <Text style={styles.bookBtnText}>📅  Book This Garage</Text>
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
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   backgroundColor: COLORS.navy, paddingHorizontal: 16, paddingVertical: 16,
                   borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)' },
  backBtn:       { width: 60 },
  backText:      { color: COLORS.gold, fontWeight: '700', fontSize: 15 },
  title:         { color: COLORS.white, fontSize: 16, fontWeight: '800', flex: 1, textAlign: 'center' },
  scroll:        { flex: 1, backgroundColor: '#0D1829' },
  heroBox:       { backgroundColor: COLORS.navy, paddingVertical: 28, paddingHorizontal: 20,
                   alignItems: 'center', borderBottomWidth: 1,
                   borderBottomColor: 'rgba(201,168,76,0.15)' },
  heroIconBg:    { width: 90, height: 90, borderRadius: 22, backgroundColor: COLORS.cardBg,
                   justifyContent: 'center', alignItems: 'center', marginBottom: 12,
                   borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  heroName:      { fontSize: 22, fontWeight: '800', color: COLORS.white, marginBottom: 8, textAlign: 'center' },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  ratingNum:     { color: COLORS.gray, fontSize: 14 },
  heroAddress:   { color: COLORS.gray, fontSize: 14, marginBottom: 10 },
  tagsRow:       { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  tag:           { backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: 10,
                   paddingHorizontal: 12, paddingVertical: 5,
                   borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  tagText:       { color: COLORS.gold, fontSize: 12, fontWeight: '600' },
  section:       { backgroundColor: COLORS.cardBg, margin: 14, marginBottom: 0,
                   borderRadius: 16, padding: 16,
                   borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionAccent: { width: 4, height: 16, backgroundColor: COLORS.gold, borderRadius: 2, marginRight: 10 },
  sectionTitle:  { fontSize: 15, fontWeight: '800', color: COLORS.white },
  aboutText:     { fontSize: 14, color: COLORS.gray, lineHeight: 22 },
  serviceRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                   paddingVertical: 12, borderBottomWidth: 1,
                   borderBottomColor: 'rgba(201,168,76,0.06)' },
  serviceLeft:   { flex: 1 },
  serviceName:   { fontSize: 14, fontWeight: '700', color: COLORS.white },
  serviceMeta:   { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  servicePrice:  { fontSize: 15, fontWeight: '800', color: COLORS.success },
  noItems:       { fontSize: 14, color: COLORS.gray, textAlign: 'center', paddingVertical: 10 },
  contactItem:   { fontSize: 14, color: COLORS.gray, marginBottom: 8 },
  reviewCard:    { borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.06)', paddingVertical: 12 },
  reviewTop:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewerName:  { fontSize: 14, fontWeight: '700', color: COLORS.white },
  reviewComment: { fontSize: 13, color: COLORS.gray, fontStyle: 'italic', marginBottom: 4 },
  reviewDate:    { fontSize: 12, color: 'rgba(138,155,181,0.6)' },
  bookBtn:       { margin: 16, backgroundColor: COLORS.gold, borderRadius: 16,
                   paddingVertical: 18, alignItems: 'center',
                   shadowColor: COLORS.gold, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  bookBtnText:   { color: COLORS.navy, fontWeight: '900', fontSize: 17 },
});