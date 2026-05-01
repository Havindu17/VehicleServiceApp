import SoundButton from "../../utils/SoundButton";
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, ActivityIndicator, RefreshControl,
  Platform, Image,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
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
  bg:      '#0D1829',
};

const TABS = [
  { key: 'basic',    label: '🏪 Basic'    },
  { key: 'hours',    label: '⏰ Hours'    },
  { key: 'services', label: '🔧 Services' },
  { key: 'location', label: '📍 Location' },
];

const normalizeService = (service, index) => {
  if (!service) return { _id: String(index), name: 'Service', price: 0, category: '', description: '', duration: null };
  if (typeof service === 'string') {
    return { _id: String(index), name: service, price: 0, category: '', description: '', duration: null };
  }
  return {
    _id:         service._id?.toString?.() ?? String(index),
    name:        service.name        ?? 'Service',
    price:       service.price       ?? 0,
    category:    service.category    ?? '',
    description: service.description ?? '',
    duration:    service.duration    ?? null,
  };
};

const formatHour = (hour) => {
  if (!hour) return 'Closed';
  if (hour.closed) return 'Closed';
  return `${hour.open || '--:--'} → ${hour.close || '--:--'}`;
};

export default function GarageDetailScreen({ route, navigation }) {
  const { garageId, garageName } = route.params ?? {};

  const [garage,    setGarage]    = useState(null);
  const [reviews,   setReviews]   = useState([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading,   setLoading]   = useState(true);
  const [refresh,   setRefresh]   = useState(false);

  const fetchGarage = async () => {
    try {
      const [garageRes, reviewsRes] = await Promise.all([
        api.get(`/customer/garages/${garageId}`),
        api.get(`/customer/garages/${garageId}/reviews`),
      ]);
      const data = garageRes.data;
      setGarage({
        ...data,
        services: (data.services ?? []).map(normalizeService),
      });
      setReviews(reviewsRes.data ?? []);
    } catch (e) {
      console.error('GarageDetail fetch error:', e);
      setGarage(null);
      setReviews([]);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useEffect(() => { fetchGarage(); }, [garageId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (!garage) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Garage not found</Text>
      </View>
    );
  }

  const rating       = garage.rating ?? 0;
  const totalReviews = reviews.length;
  const hours        = garage.workingHours || {};
  const coords       = garage.location?.coordinates;
  const hasLocation  = Array.isArray(coords) && coords.length === 2;
  const mapRegion    = hasLocation ? {
    latitude:       coords[1],
    longitude:      coords[0],
    latitudeDelta:  0.005,
    longitudeDelta: 0.005,
  } : null;

  // ─── Tab Content ────────────────────────────────────────────────────────
  const renderTab = () => {

    // ── BASIC ──
    if (activeTab === 'basic') {
      return (
        <View style={styles.tabContent}>
          <InfoRow label="Email"       value={garage.email   || 'Not available'} />
          <InfoRow label="Phone"       value={garage.phone   || 'Not available'} />
          <InfoRow label="Address"     value={garage.address || 'Not available'} />
          {garage.businessRegNo ? (
            <InfoRow label="Reg. No." value={garage.businessRegNo} />
          ) : null}
          <View style={{ marginTop: 4 }}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>{garage.about || 'No description added.'}</Text>
          </View>
        </View>
      );
    }

    // ── HOURS ──
    if (activeTab === 'hours') {
      return (
        <View style={styles.tabContent}>
          {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((day) => {
            const closed = hours[day]?.closed;
            return (
              <View key={day} style={styles.hourRow}>
                <Text style={styles.hourDay}>{day.slice(0, 3)}</Text>
                <View style={[styles.statusPill, closed ? styles.statusClosed : styles.statusOpen]}>
                  <Text style={[styles.statusPillText, { color: closed ? COLORS.error : COLORS.success }]}>
                    {closed ? 'Closed' : 'Open'}
                  </Text>
                </View>
                <Text style={styles.hourTime}>{formatHour(hours[day])}</Text>
              </View>
            );
          })}
        </View>
      );
    }

    // ── SERVICES ──
    if (activeTab === 'services') {
      const serviceList = garage.services ?? [];
      if (serviceList.length === 0) {
        return (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🔧</Text>
            <Text style={styles.emptyText}>This garage has not listed services yet.</Text>
          </View>
        );
      }
      return (
        <View style={styles.tabContent}>
          {serviceList.map((service) => (
            <View key={service._id} style={styles.serviceCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceTitle}>{service.name}</Text>
                {service.category ? (
                  <Text style={styles.serviceMeta}>{service.category}</Text>
                ) : null}
                {service.duration ? (
                  <Text style={styles.serviceMeta}>⏱ {service.duration} min</Text>
                ) : null}
              </View>
              <Text style={styles.servicePrice}>Rs. {service.price ?? 0}</Text>
            </View>
          ))}
        </View>
      );
    }

    // ── LOCATION ──
    return (
      <View style={styles.tabContent}>
        {hasLocation ? (
          <>
            <View style={styles.mapPreview}>
              <MapView
                style={{ flex: 1 }}
                initialRegion={mapRegion}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{ latitude: coords[1], longitude: coords[0] }}
                  title={garage.name}
                />
              </MapView>
            </View>
            <View style={styles.coordRow}>
              <Text style={styles.coordLabel}>📍 Coordinates</Text>
              <Text style={styles.coordText}>
                {coords[1].toFixed(5)}, {coords[0].toFixed(5)}
              </Text>
            </View>
            {garage.address ? (
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>🏠 Address</Text>
                <Text style={styles.coordText}>{garage.address}</Text>
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🗺️</Text>
            <Text style={styles.emptyText}>Location is not available for this garage.</Text>
          </View>
        )}
      </View>
    );
  };

  // ─── Main Render ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Header */}
      <View style={styles.header}>
        <SoundButton onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </SoundButton>
        <Text style={styles.title} numberOfLines={1}>
          {garage.name || garageName || 'Garage Profile'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refresh}
            onRefresh={() => { setRefresh(true); fetchGarage(); }}
            tintColor={COLORS.gold}
          />
        }
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* ── Hero Card ── */}
        <View style={styles.heroCard}>

          {/* Avatar + Info Row */}
          <View style={styles.heroTop}>
            <View style={styles.avatarWrap}>
              {garage.profilePhoto ? (
                <Image source={{ uri: garage.profilePhoto }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarRing}>
                  <Text style={styles.avatarText}>
                    {(garage.name || 'G').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{garage.name || garageName || 'Garage'}</Text>
              <Text style={styles.heroSub}>{garage.email || 'Email unavailable'}</Text>

              {/* Badges */}
              <View style={styles.badgeRow}>
                {garage.businessRegNo ? (
                  <View style={styles.regBadge}>
                    <Text style={styles.regBadgeText}>🏢 Reg: {garage.businessRegNo}</Text>
                  </View>
                ) : null}
                {hasLocation ? (
                  <View style={styles.locBadge}>
                    <Text style={styles.locBadgeText}>📍 Location set</Text>
                  </View>
                ) : null}
              </View>

              {/* Meta */}
              <View style={styles.metaRow}>
                {garage.address ? (
                  <Text style={styles.metaBadge} numberOfLines={1}>📍 {garage.address}</Text>
                ) : null}
                {garage.phone ? (
                  <Text style={styles.metaBadge}>📞 {garage.phone}</Text>
                ) : null}
              </View>

              {/* Rating */}
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingBadgeText}>
                  ⭐ {rating.toFixed(1)}  •  {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Tab Strip */}
          <View style={styles.tabStrip}>
            {TABS.map((tab) => (
              <SoundButton
                key={tab.key}
                style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabButtonText, activeTab === tab.key && styles.tabButtonTextActive]}>
                  {tab.label}
                </Text>
              </SoundButton>
            ))}
          </View>

          {/* Tab Body */}
          {renderTab()}

          {/* Book Button */}
          <SoundButton
            style={styles.bookBtn}
            onPress={() =>
              navigation.navigate('CustomerBooking', {
                garageId:   garage._id,
                garageName: garage.name,
              })
            }
          >
            <Text style={styles.bookBtnText}>Book a Service Now</Text>
          </SoundButton>
        </View>

        {/* ── Reviews Section ── */}
        <View style={styles.reviewsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>Customer Reviews</Text>
            <Text style={styles.sectionHeaderSub}>{totalReviews} review{totalReviews !== 1 ? 's' : ''}</Text>
          </View>

          {reviews.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>💬</Text>
              <Text style={styles.emptyText}>No reviews yet for this garage.</Text>
            </View>
          ) : (
            reviews.map((review, index) => (
              <View key={index} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewRating}>⭐ {review.rating}</Text>
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.reviewComment}>
                  {review.comment || 'No comment provided.'}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Reusable InfoRow ────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.navy,
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.navy },
  scroll: { flex: 1, backgroundColor: COLORS.bg },

  // ── Header ──
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
               paddingHorizontal: 18, paddingVertical: 16,
               borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)',
               backgroundColor: COLORS.navy },
  backBtn:  { width: 60 },
  backText: { color: COLORS.gold, fontWeight: '700', fontSize: 16 },
  title:    { color: COLORS.white, fontSize: 17, fontWeight: '800', flex: 1, textAlign: 'center' },

  // ── Hero Card ──
  heroCard: { backgroundColor: COLORS.navyMid, margin: 14, borderRadius: 24, padding: 20,
               borderWidth: 1, borderColor: 'rgba(201,168,76,0.16)' },

  heroTop:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },

  // Avatar
  avatarWrap: { marginRight: 16 },
  avatarRing: { width: 74, height: 74, borderRadius: 22, backgroundColor: COLORS.gold,
                justifyContent: 'center', alignItems: 'center',
                borderWidth: 2, borderColor: 'rgba(201,168,76,0.5)' },
  avatarImg:  { width: 74, height: 74, borderRadius: 22,
                borderWidth: 2, borderColor: COLORS.gold },
  avatarText: { fontSize: 30, color: COLORS.navy, fontWeight: '900' },

  // Hero info
  heroInfo:  { flex: 1 },
  heroName:  { color: COLORS.white, fontSize: 20, fontWeight: '900', marginBottom: 4 },
  heroSub:   { color: COLORS.gray,  fontSize: 13, marginBottom: 8 },

  badgeRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  regBadge:  { backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 8,
               paddingHorizontal: 8, paddingVertical: 3,
               borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  regBadgeText: { color: COLORS.gold, fontSize: 11, fontWeight: '700' },
  locBadge:  { backgroundColor: 'rgba(22,163,74,0.15)', borderRadius: 8,
               paddingHorizontal: 8, paddingVertical: 3,
               borderWidth: 1, borderColor: 'rgba(22,163,74,0.3)' },
  locBadgeText: { color: COLORS.success, fontSize: 11, fontWeight: '700' },

  metaRow:   { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  metaBadge: { color: COLORS.gray, fontSize: 12, marginRight: 10, marginBottom: 4 },

  ratingBadge: { backgroundColor: 'rgba(201,168,76,0.12)', paddingVertical: 8,
                 paddingHorizontal: 12, borderRadius: 14, alignSelf: 'flex-start' },
  ratingBadgeText: { color: COLORS.gold, fontSize: 12, fontWeight: '700' },

  // ── Tab Strip ──
  tabStrip:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  tabButton:          { flex: 1, minWidth: '22%', backgroundColor: COLORS.cardBg,
                        paddingVertical: 10, borderRadius: 14,
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
                        alignItems: 'center' },
  tabButtonActive:    { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  tabButtonText:      { textAlign: 'center', color: COLORS.gray, fontSize: 11, fontWeight: '700' },
  tabButtonTextActive:{ color: COLORS.navy },

  // ── Tab Content ──
  tabContent: { backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 16, marginBottom: 18 },

  // Info rows
  infoRow:   { marginBottom: 16 },
  infoLabel: { color: COLORS.gold, fontSize: 11, fontWeight: '700', marginBottom: 5, letterSpacing: 0.8 },
  infoValue: { color: COLORS.white, fontSize: 14, lineHeight: 20 },

  // Hours
  hourRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingVertical: 12, borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255,255,255,0.05)' },
  hourDay:        { color: COLORS.white, fontSize: 13, fontWeight: '800', width: 44 },
  statusPill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 8 },
  statusOpen:     { backgroundColor: 'rgba(22,163,74,0.12)', borderWidth: 1, borderColor: 'rgba(22,163,74,0.3)' },
  statusClosed:   { backgroundColor: 'rgba(239,68,68,0.1)',  borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  hourTime:       { color: COLORS.gray, fontSize: 12, flex: 1, textAlign: 'right' },

  // Services
  serviceCard:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingVertical: 14, borderBottomWidth: 1,
                  borderBottomColor: 'rgba(255,255,255,0.06)' },
  serviceTitle: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  serviceMeta:  { color: COLORS.gray,  fontSize: 11, marginTop: 4 },
  servicePrice: { color: COLORS.success, fontSize: 14, fontWeight: '900', marginLeft: 12 },

  // Location
  mapPreview: { height: 200, borderRadius: 14, overflow: 'hidden', marginBottom: 12,
                borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  coordRow:   { flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 8 },
  coordLabel: { color: COLORS.gold,  fontSize: 12, fontWeight: '700' },
  coordText:  { color: COLORS.white, fontSize: 12 },

  // Book button
  bookBtn:     { backgroundColor: COLORS.gold, borderRadius: 16, paddingVertical: 16,
                 alignItems: 'center', marginTop: 8 },
  bookBtnText: { color: COLORS.navy, fontSize: 16, fontWeight: '900' },

  // Reviews
  reviewsSection:    { marginHorizontal: 14, marginTop: 10 },
  sectionHeader:     { flexDirection: 'row', justifyContent: 'space-between',
                       alignItems: 'center', marginBottom: 12 },
  sectionHeaderTitle:{ color: COLORS.white, fontSize: 15, fontWeight: '900' },
  sectionHeaderSub:  { color: COLORS.gray,  fontSize: 12 },

  reviewCard:    { backgroundColor: COLORS.navyMid, borderRadius: 20, padding: 16,
                   marginBottom: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.12)' },
  reviewHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  reviewRating:  { color: COLORS.gold,  fontSize: 14, fontWeight: '800' },
  reviewDate:    { color: COLORS.gray,  fontSize: 12 },
  reviewComment: { color: COLORS.white, fontSize: 13, lineHeight: 20 },

  // Empty / Error
  emptyBox:  { backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 24,
               alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyText: { color: COLORS.gray, fontSize: 14, textAlign: 'center' },
  errorText: { color: COLORS.error, fontSize: 16, fontWeight: '700' },
});