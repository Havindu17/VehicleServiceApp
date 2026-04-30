import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, FlatList, ActivityIndicator, Alert, RefreshControl, Platform
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
};

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];
const STATUS_COLOR = {
  pending:   { bg: '#F59E0B22', text: '#F59E0B', border: '#F59E0B44' },
  confirmed: { bg: '#2563EB22', text: '#2563EB', border: '#2563EB44' },
  completed: { bg: '#16A34A22', text: '#16A34A', border: '#16A34A44' },
  cancelled: { bg: '#EF444422', text: '#EF4444', border: '#EF444444' },
};

export default function GarageBookingScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [filter,   setFilter]   = useState('all');
  const [loading,  setLoading]  = useState(true);
  const [refresh,  setRefresh]  = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/garage/bookings');
      setBookings(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefresh(false); }
  };

  useEffect(() => { fetchBookings(); }, []);

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  const updateStatus = async (id, newStatus) => {
    Alert.alert('Update Booking', `Mark as "${newStatus}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: async () => {
        try {
          await api.patch(`/garage/bookings/${id}/status`, { status: newStatus });
          setBookings(prev => prev.map(b => b._id === id ? { ...b, status: newStatus } : b));
        } catch { Alert.alert('Error', 'Failed to update status'); }
      }}
    ]);
  };

  // ✅ CustomerDetailScreen එකට navigate කරන function
  const goToCustomer = (item) => {
    if (!item.customerId) {
      Alert.alert('Error', 'Customer info not available');
      return;
    }
    navigation.navigate('CustomerDetail', {
      customerId:   item.customerId,
      customerName: item.customerName,
    });
  };

  const renderItem = ({ item }) => {
    const colors = STATUS_COLOR[item.status] ?? STATUS_COLOR.pending;
    return (
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: colors.text }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>

              {/* ✅ Customer name press කරනකොට CustomerDetailScreen එකට යනවා */}
              <TouchableOpacity onPress={() => goToCustomer(item)} activeOpacity={0.7}>
                <Text style={styles.customerName}>
                  {item.customerName}
                  <Text style={styles.viewProfile}> · View Profile ›</Text>
                </Text>
              </TouchableOpacity>

              <Text style={styles.vehicleText}>🚗 {item.vehicle || 'N/A'}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <Text style={[styles.badgeText, { color: colors.text }]}>{item.status}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.service}>🔧 {item.service}</Text>
          <Text style={styles.meta}>📅 {item.date}  🕐 {item.time}</Text>
          <Text style={styles.meta}>💰 Rs. {item.price}</Text>
          {item.notes ? <Text style={styles.notes}>📝 {item.notes}</Text> : null}

          {item.status === 'pending' && (
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.confirmBtn]}
                onPress={() => updateStatus(item._id, 'confirmed')}>
                <Text style={styles.confirmBtnText}>✓ Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]}
                onPress={() => updateStatus(item._id, 'cancelled')}>
                <Text style={styles.cancelBtnText}>✕ Reject</Text>
              </TouchableOpacity>
            </View>
          )}
          {item.status === 'confirmed' && (
            <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]}
              onPress={() => updateStatus(item._id, 'completed')}>
              <Text style={styles.completeBtnText}>✓ Mark as Completed</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bookings</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.filterWrap}>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={FILTERS} keyExtractor={f => f}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.gold} /></View>
      ) : (
        <FlatList
          data={filtered} keyExtractor={b => b._id} renderItem={renderItem}
          contentContainerStyle={{ padding: 14, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refresh}
            onRefresh={() => { setRefresh(true); fetchBookings(); }} tintColor={COLORS.gold} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No {filter === 'all' ? '' : filter} bookings</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: COLORS.navy,
                      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1829' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: COLORS.navy, paddingHorizontal: 20, paddingVertical: 16,
                      borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)' },
  backBtn:          { width: 60 },
  backText:         { color: COLORS.gold, fontWeight: '700', fontSize: 18 },
  title:            { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  filterWrap:       { backgroundColor: COLORS.navyMid, borderBottomWidth: 1,
                      borderBottomColor: 'rgba(201,168,76,0.1)' },
  filterTab:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                      backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1,
                      borderColor: 'rgba(201,168,76,0.15)' },
  filterTabActive:  { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  filterText:       { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  filterTextActive: { color: COLORS.navy, fontWeight: '800' },
  card:             { backgroundColor: COLORS.cardBg, borderRadius: 16, flexDirection: 'row',
                      borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)', overflow: 'hidden', elevation: 3 },
  cardAccent:       { width: 4 },
  cardBody:         { flex: 1, padding: 14 },
  cardHeader:       { flexDirection: 'row', justifyContent: 'space-between',
                      alignItems: 'flex-start', marginBottom: 8 },
  customerName:     { fontSize: 15, fontWeight: '800', color: COLORS.white, marginBottom: 3 },
  viewProfile:      { fontSize: 12, fontWeight: '600', color: COLORS.gold },  // ✅ "View Profile ›" style
  vehicleText:      { fontSize: 13, color: COLORS.gray },
  badge:            { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  badgeText:        { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  divider:          { height: 1, backgroundColor: 'rgba(201,168,76,0.1)', marginVertical: 10 },
  service:          { fontSize: 14, fontWeight: '600', color: COLORS.gold, marginBottom: 4 },
  meta:             { fontSize: 13, color: COLORS.gray, marginBottom: 2 },
  notes:            { fontSize: 13, color: COLORS.gray, marginTop: 4, fontStyle: 'italic' },
  btnRow:           { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn:        { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  confirmBtn:       { backgroundColor: COLORS.info },
  confirmBtnText:   { color: COLORS.white, fontWeight: '700' },
  cancelBtn:        { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: '#EF444466' },
  cancelBtnText:    { color: COLORS.error, fontWeight: '700' },
  completeBtn:      { marginTop: 12, backgroundColor: 'rgba(22,163,74,0.1)',
                      borderWidth: 1, borderColor: '#16A34A66' },
  completeBtnText:  { color: COLORS.success, fontWeight: '700' },
  empty:            { alignItems: 'center', paddingTop: 80 },
  emptyIcon:        { fontSize: 48, marginBottom: 12 },
  emptyText:        { fontSize: 16, color: COLORS.gray },
});