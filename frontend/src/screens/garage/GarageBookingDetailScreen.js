import SoundButton from "../../utils/SoundButton";
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, ActivityIndicator, Alert, Platform,
} from 'react-native';
import api from '../../utils/api';

const C = {
  navy:      '#0B1D3A',
  navyCard:  '#162040',
  gold:      '#C9A84C',
  goldDim:   'rgba(201,168,76,0.12)',
  goldBorder:'rgba(201,168,76,0.28)',
  white:     '#FFFFFF',
  offWhite:  '#D8E0EE',
  gray:      '#8A9BB5',
  grayLight: '#5A6E8C',
  error:     '#EF4444',
  info:      '#2563EB',
  border:    'rgba(201,168,76,0.15)',
};

function SectionHeader({ icon, title }) {
  return (
    <View style={s.sectionHead}>
      <Text style={s.sectionIcon}>{icon}</Text>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={s.infoRow}>
      <Text style={s.infoIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function GarageBookingDetailScreen({ navigation, route }) {
  const { bookingId } = route.params;

  const [booking,          setBooking]          = useState(null);
  const [garageServices,   setGarageServices]   = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [confirming,       setConfirming]       = useState(false);
  const [rejecting,        setRejecting]        = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // ── Fetch booking detail + garage's own service list in parallel ──
        const [bRes, sRes] = await Promise.all([
          api.get(`/garage/bookings/${bookingId}`),   // garageRoutes — GET /garage/bookings/:id
          api.get('/garage/services'),                // garageRoutes — GET /garage/services
        ]);

        const b = bRes.data;
        setBooking(b);

        // Normalize garage's service list
        const rawServices = sRes.data ?? [];
        const normalized = rawServices.map((sv, i) => ({
          _id:      sv._id?.toString() ?? String(i),
          name:     sv.name ?? 'Service',
          price:    sv.price ?? 0,
          category: sv.category ?? '',
        }));
        setGarageServices(normalized);

        // Pre-select services the customer requested (match by name)
        const requestedNames = (b.costBreakdown ?? []).map(c =>
          (c.item ?? '').toLowerCase()
        );
        if (requestedNames.length > 0) {
          setSelectedServices(
            normalized.filter(sv => requestedNames.includes(sv.name.toLowerCase()))
          );
        }
      } catch (e) {
        console.error('GarageBookingDetail fetch error:', e);
        Alert.alert('Error', 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  const toggleService = (service) => {
    setSelectedServices(prev => {
      const exists = prev.some(s => s._id === service._id);
      return exists
        ? prev.filter(s => s._id !== service._id)
        : [...prev, service];
    });
  };

  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.price ?? 0), 0);

  // ── Confirm ──────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    Alert.alert(
      'Confirm Booking',
      `Confirm this booking${selectedServices.length > 0
        ? ` with ${selectedServices.length} service(s)?` : '?'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setConfirming(true);
            try {
              await api.patch(`/garage/bookings/${bookingId}/status`, {
                status:   'confirmed',
                services: selectedServices.map(s => ({ name: s.name, price: s.price })),
              });
              Alert.alert('Confirmed! ✅', 'Booking confirmed.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message ?? 'Failed to confirm');
            } finally {
              setConfirming(false);
            }
          },
        },
      ]
    );
  };

  // ── Reject ───────────────────────────────────────────────────────────────
  const handleReject = () => {
    Alert.alert(
      'Reject Booking',
      'Reject this booking? The customer will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setRejecting(true);
            try {
              await api.patch(`/garage/bookings/${bookingId}/status`, {
                status: 'rejected',
              });
              Alert.alert('Rejected', 'Booking has been rejected.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message ?? 'Failed to reject');
            } finally {
              setRejecting(false);
            }
          },
        },
      ]
    );
  };

  // ── Complete & Invoice ───────────────────────────────────────────────────
  const handleComplete = () => {
    Alert.alert(
      'Complete Booking',
      'Mark this booking as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setConfirming(true);
            try {
              await api.patch(`/garage/bookings/${bookingId}/status`, {
                status: 'completed',
              });
              Alert.alert('Completed! ✅', 'Booking marked as completed.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message ?? 'Failed to complete');
            } finally {
              setConfirming(false);
            }
          },
        },
      ]
    );
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.gold} />
          <Text style={s.loadText}>Loading booking details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={{ color: C.gray, fontSize: 16 }}>Booking not found.</Text>
          <SoundButton onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={{ color: C.gold, fontWeight: '700' }}>← Go Back</Text>
          </SoundButton>
        </View>
      </SafeAreaView>
    );
  }

  // Parse data from Booking model structure
  const customerName  = booking.customerName  ?? booking.customer?.name  ?? 'N/A';
  const customerPhone = booking.customerPhone ?? booking.customer?.phone ?? null;
  const customerEmail = booking.customerEmail ?? booking.customer?.email ?? null;

  const vehicleStr  = booking.vehicle
    ? typeof booking.vehicle === 'string'
      ? booking.vehicle
      : `${booking.vehicle.make ?? ''} ${booking.vehicle.model ?? ''}`.trim() || 'N/A'
    : 'N/A';
  const licensePlate = booking.vehicle?.licensePlate ?? null;
  const vehicleColor = booking.vehicle?.color        ?? null;

  const requestedServices = booking.costBreakdown ?? [];
  const status            = booking.jobStatus ?? booking.status ?? 'pending';
  const isPending         = status === 'pending';
  const isConfirmed       = status === 'confirmed';

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* Header */}
      <View style={s.header}>
        <SoundButton onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </SoundButton>
        <Text style={s.title}>Booking Review</Text>
        <View style={[s.statusBadge, { backgroundColor: statusBg(status) }]}>
          <Text style={[s.statusText, { color: statusColor(status) }]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >

        {/* 1. Customer */}
        <SectionHeader icon="👤" title="Customer" />
        <View style={s.card}>
          <InfoRow icon="🙍" label="Name"  value={customerName} />
          <InfoRow icon="📞" label="Phone" value={customerPhone} />
          <InfoRow icon="✉️"  label="Email" value={customerEmail} />
        </View>

        {/* 2. Vehicle */}
        <SectionHeader icon="🚗" title="Vehicle" />
        <View style={s.card}>
          <InfoRow icon="🚘" label="Vehicle"       value={vehicleStr} />
          <InfoRow icon="🪪" label="License Plate" value={licensePlate} />
          <InfoRow icon="🎨" label="Color"         value={vehicleColor} />
        </View>

        {/* 3. Appointment */}
        <SectionHeader icon="📅" title="Appointment" />
        <View style={s.card}>
          <InfoRow icon="📅" label="Date"           value={booking.date} />
          <InfoRow icon="🕐" label="Time"           value={booking.time} />
          <InfoRow icon="📝" label="Customer Notes" value={booking.notes ?? booking.customerNotes} />
        </View>

        {/* 4. Requested Services */}
        {requestedServices.length > 0 && (
          <>
            <SectionHeader icon="📋" title="Requested Services" />
            <View style={s.card}>
              {requestedServices.map((sv, i) => (
                <View key={i} style={s.reqRow}>
                  <View style={s.reqDot} />
                  <Text style={s.reqName}>{sv.item ?? sv.name ?? sv}</Text>
                  {sv.amount != null && (
                    <Text style={s.reqPrice}>Rs. {sv.amount}</Text>
                  )}
                </View>
              ))}
              {booking.totalAmount > 0 && (
                <View style={[s.reqRow, { marginTop: 4, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 }]}>
                  <Text style={[s.reqName, { color: C.gold, fontWeight: '800' }]}>Total</Text>
                  <Text style={s.reqPrice}>Rs. {booking.totalAmount}</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* 5. Select Services (only for pending/confirmed) */}
        {(isPending || isConfirmed) && (
          <>
            <SectionHeader icon="🔧" title="Select Services to Perform" />
            <Text style={s.serviceHint}>
              Choose services from your list to add to this booking.
            </Text>

            {garageServices.length === 0 ? (
              <View style={s.emptyServices}>
                <Text style={s.emptyServicesText}>
                  No services added to your garage yet.
                </Text>
              </View>
            ) : (
              garageServices.map((sv) => {
                const selected = selectedServices.some(s => s._id === sv._id);
                return (
                  <SoundButton
                    key={sv._id}
                    style={[s.serviceItem, selected && s.serviceItemActive]}
                    onPress={() => toggleService(sv)}
                    activeOpacity={0.75}
                  >
                    <View style={[s.checkbox, selected && s.checkboxActive]}>
                      {selected && <Text style={s.checkmark}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.serviceName, selected && s.serviceNameActive]}>
                        {sv.name}
                      </Text>
                      {sv.category ? <Text style={s.serviceCat}>{sv.category}</Text> : null}
                    </View>
                    <Text style={[s.servicePrice, selected && s.servicePriceActive]}>
                      Rs. {sv.price}
                    </Text>
                  </SoundButton>
                );
              })
            )}

            {selectedServices.length > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Estimated Total</Text>
                <Text style={s.totalValue}>Rs. {totalPrice}</Text>
              </View>
            )}
          </>
        )}

        {/* 6. Action Buttons */}
        <View style={s.actionRow}>
          {isPending && (
            <>
              <SoundButton
                style={[s.btn, s.rejectBtn, { flex: 1 }]}
                onPress={handleReject}
                disabled={rejecting || confirming}
              >
                {rejecting
                  ? <ActivityIndicator color={C.error} size="small" />
                  : <Text style={s.rejectBtnText}>✕ Reject</Text>
                }
              </SoundButton>

              <SoundButton
                style={[s.btn, s.confirmBtn, { flex: 2 }]}
                onPress={handleConfirm}
                disabled={confirming || rejecting}
              >
                {confirming
                  ? <ActivityIndicator color={C.white} size="small" />
                  : <Text style={s.confirmBtnText}>✓ Confirm Booking</Text>
                }
              </SoundButton>
            </>
          )}

          {isConfirmed && (
            <SoundButton
              style={[s.btn, s.completeBtn, { flex: 1 }]}
              onPress={handleComplete}
              disabled={confirming}
            >
              {confirming
                ? <ActivityIndicator color={C.white} size="small" />
                : <Text style={s.confirmBtnText}>✔ Complete & Invoice</Text>
              }
            </SoundButton>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Status color helpers ──────────────────────────────────────────────────────
function statusColor(status) {
  switch (status) {
    case 'pending':   return '#F5A623';
    case 'confirmed': return '#4A90E2';
    case 'completed': return '#4CAF50';
    case 'rejected':  return '#EF4444';
    default:          return C.gray;
  }
}
function statusBg(status) {
  switch (status) {
    case 'pending':   return 'rgba(245,166,35,0.15)';
    case 'confirmed': return 'rgba(74,144,226,0.15)';
    case 'completed': return 'rgba(76,175,80,0.15)';
    case 'rejected':  return 'rgba(239,68,68,0.15)';
    default:          return 'rgba(138,155,181,0.15)';
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.navy,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  center:   { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.navy },
  loadText: { color: C.gray, marginTop: 12, fontSize: 14 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn:     { width: 70 },
  backText:    { color: C.gold, fontWeight: '700', fontSize: 16 },
  title:       { color: C.white, fontSize: 17, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:  { fontSize: 12, fontWeight: '800' },

  sectionHead:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 20 },
  sectionIcon:  { fontSize: 17, marginRight: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: C.white, letterSpacing: 0.3 },

  card: {
    backgroundColor: C.navyCard, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  infoRow:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  infoIcon:  { fontSize: 15, marginRight: 10, marginTop: 2 },
  infoLabel: { fontSize: 10, color: C.gray, fontWeight: '700', letterSpacing: 0.6, marginBottom: 2 },
  infoValue: { fontSize: 14, color: C.offWhite, fontWeight: '600' },

  reqRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reqDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold, marginRight: 10 },
  reqName:  { flex: 1, fontSize: 14, color: C.offWhite, fontWeight: '600' },
  reqPrice: { fontSize: 13, color: C.gold, fontWeight: '700' },

  serviceHint:       { fontSize: 12, color: C.gray, marginBottom: 10, lineHeight: 18 },
  emptyServices:     { backgroundColor: C.navyCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  emptyServicesText: { color: C.gray, fontSize: 13, textAlign: 'center', lineHeight: 20 },

  serviceItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.navyCard, borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1.5, borderColor: C.border,
  },
  serviceItemActive:  { borderColor: C.gold, backgroundColor: C.goldDim },
  checkbox:           { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.grayLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkboxActive:     { backgroundColor: C.gold, borderColor: C.gold },
  checkmark:          { color: C.navy, fontSize: 13, fontWeight: '900' },
  serviceName:        { fontSize: 14, color: C.offWhite, fontWeight: '700', marginBottom: 2 },
  serviceNameActive:  { color: C.gold },
  serviceCat:         { fontSize: 11, color: C.gray },
  servicePrice:       { fontSize: 13, color: C.gray, fontWeight: '700' },
  servicePriceActive: { color: C.gold },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.goldDim, borderRadius: 12, padding: 14, marginTop: 4,
    borderWidth: 1, borderColor: C.goldBorder,
  },
  totalLabel: { fontSize: 13, color: C.gold, fontWeight: '700' },
  totalValue: { fontSize: 18, color: C.gold, fontWeight: '900' },

  actionRow:      { flexDirection: 'row', gap: 12, marginTop: 28 },
  btn:            { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  rejectBtn:      { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.4)' },
  rejectBtnText:  { color: C.error, fontWeight: '900', fontSize: 15 },
  confirmBtn:     { backgroundColor: C.info },
  completeBtn:    { backgroundColor: '#16A34A' },
  confirmBtnText: { color: C.white, fontWeight: '900', fontSize: 15 },
});