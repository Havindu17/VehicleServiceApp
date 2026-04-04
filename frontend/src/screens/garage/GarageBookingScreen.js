import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, FlatList, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import api from '../../utils/api';

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];
const STATUS_COLOR = {
  pending:   { bg: '#fef3c7', text: '#d97706' },
  confirmed: { bg: '#dbeafe', text: '#2563eb' },
  completed: { bg: '#dcfce7', text: '#16a34a' },
  cancelled: { bg: '#fee2e2', text: '#ef4444' },
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  const updateStatus = async (id, newStatus) => {
    Alert.alert(
      'Update Booking',
      `Are you sure you want to mark this as "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes', onPress: async () => {
            try {
              await api.patch(`/garage/bookings/${id}/status`, { status: newStatus });
              setBookings(prev => prev.map(b => b._id === id ? { ...b, status: newStatus } : b));
            } catch (e) {
              Alert.alert('Error', 'Failed to update status');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const colors = STATUS_COLOR[item.status] ?? STATUS_COLOR.pending;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.vehicleText}>🚗 {item.vehicle}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.service}>🔧 {item.service}</Text>
        <Text style={styles.meta}>📅 {item.date}  🕐 {item.time}</Text>
        <Text style={styles.meta}>💰 Rs. {item.price}</Text>
        {item.notes ? <Text style={styles.notes}>📝 {item.notes}</Text> : null}

        {/* Action buttons based on status */}
        {item.status === 'pending' && (
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.confirmBtn]}
              onPress={() => updateStatus(item._id, 'confirmed')}
            >
              <Text style={styles.confirmBtnText}>✓ Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={() => updateStatus(item._id, 'cancelled')}
            >
              <Text style={styles.cancelBtnText}>✕ Reject</Text>
            </TouchableOpacity>
          </View>
        )}
        {item.status === 'confirmed' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.completeBtn]}
            onPress={() => updateStatus(item._id, 'completed')}
          >
            <Text style={styles.completeBtnText}>✓ Mark as Completed</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a1628" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bookings</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={f => f}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={b => b._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); fetchBookings(); }} />}
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
  safe:             { flex: 1, backgroundColor: '#f0f4ff' },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: '#0a1628', paddingHorizontal: 16, paddingVertical: 16 },
  backBtn:          { paddingHorizontal: 8, paddingVertical: 4 },
  backText:         { color: '#4a90d9', fontWeight: '700', fontSize: 15 },
  title:            { color: '#fff', fontSize: 18, fontWeight: '800' },
  filterWrap:       { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e8e8e8' },
  filterTab:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                      backgroundColor: '#f5f7fa', borderWidth: 1, borderColor: '#e8e8e8' },
  filterTabActive:  { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterText:       { fontSize: 13, fontWeight: '600', color: '#888' },
  filterTextActive: { color: '#fff' },
  card:             { backgroundColor: '#fff', borderRadius: 16, padding: 16,
                      shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  customerName:     { fontSize: 16, fontWeight: '800', color: '#0a1628' },
  vehicleText:      { fontSize: 13, color: '#888', marginTop: 2 },
  badge:            { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:        { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  divider:          { height: 1, backgroundColor: '#f0f0f0', marginVertical: 10 },
  service:          { fontSize: 14, fontWeight: '600', color: '#2563eb', marginBottom: 4 },
  meta:             { fontSize: 13, color: '#555', marginBottom: 2 },
  notes:            { fontSize: 13, color: '#888', marginTop: 4, fontStyle: 'italic' },
  btnRow:           { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn:        { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  confirmBtn:       { backgroundColor: '#2563eb' },
  confirmBtnText:   { color: '#fff', fontWeight: '700' },
  cancelBtn:        { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#ef4444' },
  cancelBtnText:    { color: '#ef4444', fontWeight: '700' },
  completeBtn:      { marginTop: 12, backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#16a34a' },
  completeBtnText:  { color: '#16a34a', fontWeight: '700' },
  empty:            { alignItems: 'center', paddingTop: 60 },
  emptyIcon:        { fontSize: 48, marginBottom: 12 },
  emptyText:        { fontSize: 16, color: '#aaa' },
});