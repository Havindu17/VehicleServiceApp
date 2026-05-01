import SoundButton from "../../utils/SoundButton";
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, FlatList, ActivityIndicator, Alert, RefreshControl,
  Platform, Modal, TextInput,
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

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'];

const STATUS_COLOR = {
  pending:     { bg: '#F59E0B22', text: '#F59E0B', border: '#F59E0B44' },
  confirmed:   { bg: '#2563EB22', text: '#2563EB', border: '#2563EB44' },
  completed:   { bg: '#16A34A22', text: '#16A34A', border: '#16A34A44' },
  cancelled:   { bg: '#EF444422', text: '#EF4444', border: '#EF444444' },
  rejected:    { bg: '#EF444422', text: '#EF4444', border: '#EF444444' },
  in_progress: { bg: '#2563EB22', text: '#2563EB', border: '#2563EB44' },
};

export default function GarageBookingScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [filter,   setFilter]   = useState('all');
  const [loading,  setLoading]  = useState(true);
  const [refresh,  setRefresh]  = useState(false);

  const [invoiceModal,   setInvoiceModal]   = useState(false);
  const [activeBooking,  setActiveBooking]  = useState(null);
  const [invoiceItems,   setInvoiceItems]   = useState([{ label: '', amount: '' }]);
  const [invoiceNotes,   setInvoiceNotes]   = useState('');
  const [sendingInvoice, setSendingInvoice] = useState(false);

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

  useEffect(() => {
    fetchBookings();
    const unsubscribe = navigation.addListener('focus', fetchBookings);
    return unsubscribe;
  }, [navigation]);

  const normalizeStatus = (s) => (s === 'in_progress' ? 'confirmed' : s);

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => normalizeStatus(b.status) === filter);

  const openInvoiceModal = (booking) => {
    setActiveBooking(booking);
    setInvoiceNotes(booking.garageNotes ?? '');
    setInvoiceItems(
      booking.costBreakdown?.length > 0
        ? booking.costBreakdown.map(i => ({ label: i.item || '', amount: String(i.amount ?? '') }))
        : [{ label: '', amount: '' }]
    );
    setInvoiceModal(true);
  };

  const updateInvoiceItem = (index, field, value) =>
    setInvoiceItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const addInvoiceItem    = () => setInvoiceItems(prev => [...prev, { label: '', amount: '' }]);
  const removeInvoiceItem = (index) =>
    setInvoiceItems(prev => { const n = prev.filter((_, i) => i !== index); return n.length > 0 ? n : [{ label: '', amount: '' }]; });

  const saveInvoice = async (sendEmail = false) => {
    if (!activeBooking) return;
    const valid = invoiceItems.map(i => ({ label: i.label?.trim(), amount: i.amount })).filter(i => i.label && i.amount !== '');
    if (valid.length === 0) return Alert.alert('Error', 'Add at least one invoice item.');
    setSendingInvoice(true);
    try {
      await api.post('/garage/invoice', {
        bookingId: activeBooking._id,
        items: valid.map(i => ({ label: i.label, amount: Number(i.amount) || 0 })),
        notes: invoiceNotes, sendEmail,
      });
      Alert.alert('Success', 'Booking completed and invoice saved.');
      setInvoiceModal(false); setActiveBooking(null);
      setInvoiceItems([{ label: '', amount: '' }]); setInvoiceNotes('');
      fetchBookings();
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed to save invoice'); }
    finally { setSendingInvoice(false); }
  };

  const goToCustomer = (item) => {
    const id = item.customerId?.toString?.() ?? null;
    if (!id) { Alert.alert('Error', 'Customer info not available'); return; }
    navigation.navigate('CustomerDetail', { customerId: id, customerName: item.customerName });
  };

  const renderItem = ({ item }) => {
    const displayStatus = normalizeStatus(item.status);
    const colors = STATUS_COLOR[displayStatus] ?? STATUS_COLOR.pending;
    return (
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: colors.text }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <SoundButton onPress={() => goToCustomer(item)} activeOpacity={0.7}>
                <Text style={styles.customerName}>
                  {item.customerName}<Text style={styles.viewProfile}> · View Profile ›</Text>
                </Text>
              </SoundButton>
              <Text style={styles.vehicleText}>🚗 {item.vehicle || 'N/A'}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <Text style={[styles.badgeText, { color: colors.text }]}>{displayStatus}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.service}>🔧 {item.service}</Text>
          <Text style={styles.meta}>📅 {item.date}  🕐 {item.time}</Text>
          <Text style={styles.meta}>💰 Rs. {item.price}</Text>
          {item.notes ? <Text style={styles.notes}>📝 {item.notes}</Text> : null}

          {displayStatus === 'pending' && (
            <SoundButton
              style={styles.reviewBtn}
              onPress={() => navigation.navigate('GarageBookingDetail', { bookingId: item._id })}
            >
              <Text style={styles.reviewBtnText}>👁 Review &amp; Respond →</Text>
            </SoundButton>
          )}
          {displayStatus === 'confirmed' && (
            <SoundButton style={styles.completeBtn} onPress={() => openInvoiceModal(item)}>
              <Text style={styles.completeBtnText}>✓ Complete &amp; Invoice</Text>
            </SoundButton>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <View style={styles.header}>
        <SoundButton onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </SoundButton>
        <Text style={styles.title}>Bookings</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.filterWrap}>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false} data={FILTERS} keyExtractor={f => f}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}
          renderItem={({ item: f }) => (
            <SoundButton style={[styles.filterTab, filter === f && styles.filterTabActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </SoundButton>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.gold} /></View>
      ) : (
        <>
          <FlatList
            data={filtered} keyExtractor={b => b._id} renderItem={renderItem}
            contentContainerStyle={{ padding: 14, gap: 12 }}
            refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); fetchBookings(); }} tintColor={COLORS.gold} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No {filter === 'all' ? '' : filter} bookings</Text>
              </View>
            }
          />

          {/* Invoice Modal */}
          <Modal visible={invoiceModal} transparent animationType="slide" onRequestClose={() => setInvoiceModal(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Complete Booking</Text>
                <Text style={styles.modalSubtitle}>{activeBooking?.service ?? ''}</Text>
                <Text style={styles.modalLabel}>Service / parts / details</Text>
                {invoiceItems.map((item, index) => (
                  <View key={index} style={styles.invoiceRow}>
                    <TextInput style={[styles.invoiceInput, { flex: 2 }]} placeholder="Item description" placeholderTextColor={COLORS.gray} value={item.label} onChangeText={t => updateInvoiceItem(index, 'label', t)} />
                    <TextInput style={[styles.invoiceInput, { flex: 1, marginLeft: 10 }]} placeholder="Amount" placeholderTextColor={COLORS.gray} keyboardType="numeric" value={item.amount} onChangeText={t => updateInvoiceItem(index, 'amount', t)} />
                    <SoundButton style={styles.removeItemBtn} onPress={() => removeInvoiceItem(index)} disabled={invoiceItems.length === 1}>
                      <Text style={styles.removeItemText}>✕</Text>
                    </SoundButton>
                  </View>
                ))}
                <SoundButton style={styles.addItemBtn} onPress={addInvoiceItem}>
                  <Text style={styles.addItemText}>+ Add another item</Text>
                </SoundButton>
                <Text style={styles.modalLabel}>Job notes / brand / size</Text>
                <TextInput style={styles.modalNotes} placeholder="Enter any service notes or custom details" placeholderTextColor={COLORS.gray} multiline value={invoiceNotes} onChangeText={setInvoiceNotes} />
                <View style={styles.modalActions}>
                  <SoundButton style={[styles.iBtn, styles.iCancelBtn, { flex: 1, marginRight: 8 }]} onPress={() => setInvoiceModal(false)}>
                    <Text style={styles.iCancelText}>Cancel</Text>
                  </SoundButton>
                  <SoundButton style={[styles.iBtn, styles.iSaveBtn, { flex: 1 }]} onPress={() => saveInvoice(false)} disabled={sendingInvoice}>
                    <Text style={styles.iSaveText}>{sendingInvoice ? 'Saving…' : 'Save'}</Text>
                  </SoundButton>
                </View>
                <SoundButton style={[styles.iBtn, styles.iEmailBtn]} onPress={() => saveInvoice(true)} disabled={sendingInvoice}>
                  <Text style={styles.iEmailText}>{sendingInvoice ? 'Sending…' : 'Save & Email'}</Text>
                </SoundButton>
              </View>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.navy, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.navy, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)' },
  backBtn: { width: 60 }, backText: { color: COLORS.gold, fontWeight: '700', fontSize: 18 },
  title:   { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  filterWrap: { backgroundColor: COLORS.navyMid, borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.1)' },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)' },
  filterTabActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  filterTextActive: { color: COLORS.navy, fontWeight: '800' },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 16, flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)', overflow: 'hidden', elevation: 3 },
  cardAccent: { width: 4 }, cardBody: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  customerName: { fontSize: 15, fontWeight: '800', color: COLORS.white, marginBottom: 3 },
  viewProfile:  { fontSize: 12, fontWeight: '600', color: COLORS.gold },
  vehicleText:  { fontSize: 13, color: COLORS.gray },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  divider: { height: 1, backgroundColor: 'rgba(201,168,76,0.1)', marginVertical: 10 },
  service: { fontSize: 14, fontWeight: '600', color: COLORS.gold, marginBottom: 4 },
  meta:    { fontSize: 13, color: COLORS.gray, marginBottom: 2 },
  notes:   { fontSize: 13, color: COLORS.gray, marginTop: 4, fontStyle: 'italic' },
  reviewBtn: { marginTop: 12, borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: 'rgba(201,168,76,0.12)', borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.35)' },
  reviewBtnText: { color: COLORS.gold, fontWeight: '800', fontSize: 14 },
  completeBtn: { marginTop: 12, borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: 'rgba(22,163,74,0.1)', borderWidth: 1, borderColor: '#16A34A66' },
  completeBtnText: { color: COLORS.success, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(201,168,76,0.18)' },
  modalTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  modalSubtitle: { color: COLORS.gray, fontSize: 13, marginBottom: 14 },
  modalLabel: { color: COLORS.gray, fontSize: 12, marginBottom: 8, fontWeight: '700' },
  invoiceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  invoiceInput: { backgroundColor: COLORS.navyMid, color: COLORS.white, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)', fontSize: 13 },
  removeItemBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 10, backgroundColor: 'rgba(239,68,68,0.12)' },
  removeItemText: { color: COLORS.error, fontWeight: '800' },
  addItemBtn: { marginBottom: 14, paddingVertical: 10, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)', backgroundColor: 'rgba(201,168,76,0.08)' },
  addItemText: { color: COLORS.gold, fontWeight: '700' },
  modalNotes: { minHeight: 80, backgroundColor: COLORS.navyMid, color: COLORS.white, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)', textAlignVertical: 'top', marginBottom: 16 },
  modalActions: { flexDirection: 'row', marginBottom: 12 },
  iBtn: { borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  iCancelBtn: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: '#EF444466' },
  iCancelText: { color: COLORS.error, fontWeight: '700' },
  iSaveBtn: { backgroundColor: COLORS.info },
  iSaveText: { color: COLORS.white, fontWeight: '700' },
  iEmailBtn: { backgroundColor: COLORS.info, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  iEmailText: { color: COLORS.white, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: COLORS.gray },
});