import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, ActivityIndicator, Alert, Platform, Animated, Dimensions,
} from 'react-native';
import api from '../../utils/api';

const { width: SW } = Dimensions.get('window');

const C = {
  navy:     '#080F1E',
  navyMid:  '#0D1A30',
  navyCard: '#111E35',
  navyLight:'#162540',
  gold:     '#C9A84C',
  goldDim:  'rgba(201,168,76,0.12)',
  goldBorder:'rgba(201,168,76,0.25)',
  white:    '#FFFFFF',
  offWhite: '#D8E0EE',
  gray:     '#5A6E8C',
  grayLight:'#8A9BB5',
  success:  '#22C55E',
  error:    '#EF4444',
  border:   'rgba(201,168,76,0.15)',
};

const TIMES = [
  '8:00 AM','9:00 AM','10:00 AM','11:00 AM',
  '1:00 PM','2:00 PM', '3:00 PM', '4:00 PM',
];

// ── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ step }) {
  const steps = ['Garage','Service','Schedule','Confirm'];
  return (
    <View style={sb.wrap}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <View style={sb.stepCol}>
            <View style={[sb.dot, i < step && sb.dotDone, i === step && sb.dotActive]}>
              {i < step
                ? <Text style={sb.check}>✓</Text>
                : <Text style={[sb.num, i === step && sb.numActive]}>{i + 1}</Text>}
            </View>
            <Text style={[sb.label, i === step && sb.labelActive]}>{s}</Text>
          </View>
          {i < 3 && <View style={[sb.line, i < step && sb.lineDone]} />}
        </React.Fragment>
      ))}
    </View>
  );
}

const sb = StyleSheet.create({
  wrap:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  stepCol:     { alignItems: 'center' },
  dot:         { width: 28, height: 28, borderRadius: 14, backgroundColor: C.navyLight,
                  borderWidth: 1.5, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  dotDone:     { backgroundColor: C.gold, borderColor: C.gold },
  dotActive:   { borderColor: C.gold, backgroundColor: 'rgba(201,168,76,0.15)' },
  num:         { fontSize: 11, color: C.gray, fontWeight: '700' },
  numActive:   { color: C.gold },
  check:       { fontSize: 12, color: C.navy, fontWeight: '900' },
  label:       { fontSize: 9, color: C.gray, marginTop: 4, fontWeight: '600', letterSpacing: 0.5 },
  labelActive: { color: C.gold },
  line:        { flex: 1, height: 1.5, backgroundColor: C.border, marginBottom: 14 },
  lineDone:    { backgroundColor: C.gold },
});

// ── Mini calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({ selected, onSelect }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: firstDay }, () => null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const isSelected = (d) => {
    if (!d || !selected) return false;
    const s = new Date(selected);
    return s.getFullYear() === year && s.getMonth() === month && s.getDate() === d;
  };
  const isPast = (d) => {
    if (!d) return false;
    return new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  return (
    <View style={cal.wrap}>
      <View style={cal.header}>
        <TouchableOpacity onPress={() => setViewDate(new Date(year, month - 1, 1))} style={cal.navBtn}>
          <Text style={cal.navText}>‹</Text>
        </TouchableOpacity>
        <Text style={cal.monthText}>{monthName}</Text>
        <TouchableOpacity onPress={() => setViewDate(new Date(year, month + 1, 1))} style={cal.navBtn}>
          <Text style={cal.navText}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={cal.dayNames}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <Text key={d} style={cal.dayName}>{d}</Text>
        ))}
      </View>
      <View style={cal.grid}>
        {days.map((d, i) => (
          <TouchableOpacity
            key={i}
            style={[cal.cell, isSelected(d) && cal.cellSelected, (!d || isPast(d)) && cal.cellDisabled]}
            onPress={() => {
              if (!d || isPast(d)) return;
              const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              onSelect(dateStr);
            }}
            disabled={!d || isPast(d)}
          >
            <Text style={[
              cal.cellText,
              isSelected(d) && cal.cellTextSelected,
              (!d || isPast(d)) && cal.cellTextDisabled,
            ]}>{d ?? ''}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  wrap:             { backgroundColor: C.navyCard, borderRadius: 16, padding: 16,
                       borderWidth: 1, borderColor: C.border, marginBottom: 20 },
  header:           { flexDirection: 'row', justifyContent: 'space-between',
                       alignItems: 'center', marginBottom: 12 },
  navBtn:           { width: 32, height: 32, borderRadius: 10, backgroundColor: C.navyLight,
                       justifyContent: 'center', alignItems: 'center' },
  navText:          { color: C.gold, fontSize: 20, fontWeight: '700' },
  monthText:        { color: C.white, fontSize: 14, fontWeight: '800' },
  dayNames:         { flexDirection: 'row', marginBottom: 6 },
  dayName:          { flex: 1, textAlign: 'center', fontSize: 10, color: C.gray,
                       fontWeight: '700', letterSpacing: 0.5 },
  grid:             { flexDirection: 'row', flexWrap: 'wrap' },
  cell:             { width: `${100/7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  cellSelected:     { backgroundColor: C.gold, borderRadius: 10 },
  cellDisabled:     { opacity: 0.3 },
  cellText:         { fontSize: 13, color: C.offWhite, fontWeight: '600' },
  cellTextSelected: { color: C.navy, fontWeight: '900' },
  cellTextDisabled: { color: C.gray },
});

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ icon, title }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function CustomerBookingScreen({ navigation, route }) {
  const preselectedGarageId   = route.params?.garageId   ?? null;
  const preselectedGarageName = route.params?.garageName ?? null;

  const [step,            setStep]           = useState(preselectedGarageId ? 1 : 0);
  const [garages,         setGarages]        = useState([]);
  const [services,        setServices]       = useState([]);
  const [vehicles,        setVehicles]       = useState([]);
  const [selectedGarage,  setSelectedGarage] = useState(preselectedGarageId ?? '');
  const [selectedGarageName, setSelectedGarageName] = useState(preselectedGarageName ?? '');
  const [selectedService, setSelectedService]= useState(null); // full object
  const [selectedVehicle, setSelectedVehicle]= useState(null); // full object
  const [date,   setDate]  = useState('');
  const [time,   setTime]  = useState('');
  const [notes,  setNotes] = useState('');
  const [loading,setLoading]= useState(true);
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [step]);

  useEffect(() => {
    (async () => {
      try {
        const [gRes, vRes] = await Promise.all([
          api.get('/customer/garages'),
          api.get('/customer/vehicles'),
        ]);
        setGarages(gRes.data);
        setVehicles(vRes.data);
        if (preselectedGarageId) {
          const sRes = await api.get(`/customer/garages/${preselectedGarageId}/services`);
          setServices(sRes.data);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleGarageSelect = async (garage) => {
    setSelectedGarage(garage._id);
    setSelectedGarageName(garage.name);
    setSelectedService(null);
    try {
      const res = await api.get(`/customer/garages/${garage._id}/services`);
      setServices(res.data);
    } catch { setServices([]); }
    fadeAnim.setValue(0);
    setStep(1);
  };

  const handleServiceSelect = (svc) => {
    setSelectedService(svc);
    fadeAnim.setValue(0);
    setStep(2);
  };

  const handleBook = async () => {
    try {
      setSaving(true);
      await api.post('/customer/bookings', {
        garageId:  selectedGarage,
        serviceId: selectedService?._id,
        vehicleId: selectedVehicle?._id ?? null,
        date, time, notes,
      });
      Alert.alert('Booking Confirmed! 🎉',
        `Your booking at ${selectedGarageName} has been submitted.\nThe garage will confirm shortly.`,
        [{ text: 'Great!', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Booking failed');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={styles.loadText}>Loading…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(s => s - 1) : navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Book a Service</Text>
        <View style={{ width: 60 }} />
      </View>

      <StepBar step={step} />

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ── STEP 0: Select Garage ── */}
          {step === 0 && (
            <>
              <SectionHeader icon="🏪" title="Choose a Garage" />
              {garages.map((g, i) => (
                <TouchableOpacity key={i} style={styles.garageCard}
                  onPress={() => handleGarageSelect(g)} activeOpacity={0.75}>
                  <View style={styles.garageIconWrap}>
                    <Text style={{ fontSize: 24 }}>🏪</Text>
                  </View>
                  <View style={styles.garageInfo}>
                    <Text style={styles.garageName}>{g.name}</Text>
                    <Text style={styles.garageAddr}>📍 {g.address || 'No address'}</Text>
                    <Text style={styles.garageRating}>⭐ {g.rating ?? '0.0'}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
              {garages.length === 0 && (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No garages available</Text>
                </View>
              )}
            </>
          )}

          {/* ── STEP 1: Select Service ── */}
          {step === 1 && (
            <>
              {/* Selected garage badge */}
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeLabel}>GARAGE</Text>
                <Text style={styles.selectedBadgeValue}>🏪 {selectedGarageName}</Text>
              </View>

              <SectionHeader icon="🔧" title="Select Service" />

              {services.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No services listed for this garage</Text>
                </View>
              ) : (
                services.map((s, i) => (
                  <TouchableOpacity key={i} style={styles.serviceCard}
                    onPress={() => handleServiceSelect(s)} activeOpacity={0.75}>
                    <View style={styles.serviceLeft}>
                      <Text style={styles.serviceName}>{s.name}</Text>
                      {s.category && <Text style={styles.serviceCategory}>{s.category}</Text>}
                      {s.description && <Text style={styles.serviceDesc}>{s.description}</Text>}
                      {s.duration && (
                        <View style={styles.durationBadge}>
                          <Text style={styles.durationText}>⏱ {s.duration} mins</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.serviceRight}>
                      <Text style={styles.servicePrice}>Rs.{s.price}</Text>
                      <Text style={styles.selectArrow}>›</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {/* ── STEP 2: Schedule ── */}
          {step === 2 && (
            <>
              {/* Summary so far */}
              <View style={styles.summaryMini}>
                <Text style={styles.summaryMiniRow}>🏪 {selectedGarageName}</Text>
                <Text style={styles.summaryMiniRow}>🔧 {selectedService?.name}  ·  Rs.{selectedService?.price}</Text>
              </View>

              <SectionHeader icon="📅" title="Pick a Date" />
              <MiniCalendar selected={date} onSelect={setDate} />

              <SectionHeader icon="🕐" title="Pick a Time" />
              <View style={styles.timeGrid}>
                {TIMES.map(t => (
                  <TouchableOpacity key={t}
                    style={[styles.timeChip, time === t && styles.timeChipActive]}
                    onPress={() => setTime(t)}>
                    <Text style={[styles.timeText, time === t && styles.timeTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Vehicle select */}
              {vehicles.length > 0 && (
                <>
                  <SectionHeader icon="🚗" title="Select Vehicle (Optional)" />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 10, paddingBottom: 4, marginBottom: 20 }}>
                    <TouchableOpacity
                      style={[styles.vehicleChip, !selectedVehicle && styles.vehicleChipActive]}
                      onPress={() => setSelectedVehicle(null)}>
                      <Text style={[styles.vehicleChipText, !selectedVehicle && styles.vehicleChipTextActive]}>None</Text>
                    </TouchableOpacity>
                    {vehicles.map((v, i) => (
                      <TouchableOpacity key={i}
                        style={[styles.vehicleChip, selectedVehicle?._id === v._id && styles.vehicleChipActive]}
                        onPress={() => setSelectedVehicle(v)}>
                        <Text style={[styles.vehicleChipText, selectedVehicle?._id === v._id && styles.vehicleChipTextActive]}>
                          🚗 {v.make} {v.model}
                        </Text>
                        <Text style={styles.vehiclePlate}>{v.licensePlate}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <SectionHeader icon="📝" title="Additional Notes" />
              <View style={styles.notesWrap}>
                <TextInput style={styles.notesInput}
                  placeholder="Any specific issues or special requests..."
                  placeholderTextColor={C.gray}
                  value={notes} onChangeText={setNotes}
                  multiline numberOfLines={3}
                  textAlignVertical="top" />
              </View>

              <TouchableOpacity
                style={[styles.nextBtn, (!date || !time) && styles.nextBtnDisabled]}
                onPress={() => {
                  if (!date || !time) { Alert.alert('Required', 'Please select a date and time'); return; }
                  fadeAnim.setValue(0);
                  setStep(3);
                }}
                disabled={!date || !time}>
                <Text style={styles.nextBtnText}>Review Booking →</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── STEP 3: Confirm ── */}
          {step === 3 && (
            <>
              <SectionHeader icon="✅" title="Booking Summary" />

              <View style={styles.summaryCard}>
                {/* Garage */}
                <View style={styles.summaryRow}>
                  <View style={styles.summaryIconWrap}>
                    <Text>🏪</Text>
                  </View>
                  <View style={styles.summaryRowInfo}>
                    <Text style={styles.summaryRowLabel}>Garage</Text>
                    <Text style={styles.summaryRowValue}>{selectedGarageName}</Text>
                  </View>
                </View>
                <View style={styles.summaryDivider} />

                {/* Service */}
                <View style={styles.summaryRow}>
                  <View style={styles.summaryIconWrap}>
                    <Text>🔧</Text>
                  </View>
                  <View style={styles.summaryRowInfo}>
                    <Text style={styles.summaryRowLabel}>Service</Text>
                    <Text style={styles.summaryRowValue}>{selectedService?.name}</Text>
                    {selectedService?.duration && (
                      <Text style={styles.summaryRowSub}>⏱ {selectedService.duration} mins</Text>
                    )}
                  </View>
                  <Text style={styles.summaryPrice}>Rs.{selectedService?.price}</Text>
                </View>
                <View style={styles.summaryDivider} />

                {/* Date & Time */}
                <View style={styles.summaryRow}>
                  <View style={styles.summaryIconWrap}>
                    <Text>📅</Text>
                  </View>
                  <View style={styles.summaryRowInfo}>
                    <Text style={styles.summaryRowLabel}>Date & Time</Text>
                    <Text style={styles.summaryRowValue}>{date}</Text>
                    <Text style={styles.summaryRowSub}>🕐 {time}</Text>
                  </View>
                </View>

                {/* Vehicle */}
                {selectedVehicle && (
                  <>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryIconWrap}>
                        <Text>🚗</Text>
                      </View>
                      <View style={styles.summaryRowInfo}>
                        <Text style={styles.summaryRowLabel}>Vehicle</Text>
                        <Text style={styles.summaryRowValue}>{selectedVehicle.make} {selectedVehicle.model}</Text>
                        <Text style={styles.summaryRowSub}>{selectedVehicle.licensePlate}</Text>
                      </View>
                    </View>
                  </>
                )}

                {/* Notes */}
                {notes.trim().length > 0 && (
                  <>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryIconWrap}><Text>📝</Text></View>
                      <View style={styles.summaryRowInfo}>
                        <Text style={styles.summaryRowLabel}>Notes</Text>
                        <Text style={styles.summaryRowValue}>{notes}</Text>
                      </View>
                    </View>
                  </>
                )}

                {/* Total */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>Rs. {selectedService?.price ?? 0}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.confirmBtn} onPress={handleBook} disabled={saving}>
                {saving
                  ? <ActivityIndicator color={C.navy} />
                  : <Text style={styles.confirmBtnText}>✓ Confirm Booking</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.editBtn} onPress={() => setStep(2)}>
                <Text style={styles.editBtnText}>← Edit Details</Text>
              </TouchableOpacity>
            </>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.navy,
                  paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.navy },
  loadText:    { color: C.gray, marginTop: 12, fontSize: 14 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: C.navy, paddingHorizontal: 16, paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:     { width: 60 },
  backText:    { color: C.gold, fontWeight: '700', fontSize: 16 },
  title:       { color: C.white, fontSize: 17, fontWeight: '800' },
  scroll:      { flex: 1, backgroundColor: '#080F1E' },

  // Section header
  sectionHead:  { flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginTop: 4 },
  sectionIcon:  { fontSize: 18, marginRight: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: C.white },

  // Garage cards
  garageCard:   { backgroundColor: C.navyCard, borderRadius: 16, padding: 14,
                   flexDirection: 'row', alignItems: 'center', marginBottom: 10,
                   borderWidth: 1, borderColor: C.border },
  garageIconWrap:{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.goldDim,
                   justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  garageInfo:   { flex: 1 },
  garageName:   { fontSize: 15, fontWeight: '800', color: C.white, marginBottom: 3 },
  garageAddr:   { fontSize: 12, color: C.grayLight, marginBottom: 3 },
  garageRating: { fontSize: 12, color: C.gold, fontWeight: '600' },
  chevron:      { fontSize: 24, color: C.gold },

  // Service cards
  serviceCard:  { backgroundColor: C.navyCard, borderRadius: 16, padding: 16, marginBottom: 10,
                   flexDirection: 'row', alignItems: 'center',
                   borderWidth: 1, borderColor: C.border },
  serviceLeft:  { flex: 1, marginRight: 10 },
  serviceName:  { fontSize: 15, fontWeight: '800', color: C.white, marginBottom: 3 },
  serviceCategory:{ fontSize: 11, color: C.gold, fontWeight: '700', marginBottom: 4,
                    textTransform: 'uppercase', letterSpacing: 0.5 },
  serviceDesc:  { fontSize: 12, color: C.grayLight, marginBottom: 6, lineHeight: 17 },
  durationBadge:{ alignSelf: 'flex-start', backgroundColor: C.goldDim, borderRadius: 8,
                   paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: C.goldBorder },
  durationText: { fontSize: 11, color: C.gold, fontWeight: '600' },
  serviceRight: { alignItems: 'flex-end' },
  servicePrice: { fontSize: 17, fontWeight: '900', color: C.success, marginBottom: 8 },
  selectArrow:  { fontSize: 22, color: C.gold },

  // Selected badge
  selectedBadge:{ backgroundColor: C.goldDim, borderRadius: 12, padding: 12, marginBottom: 18,
                   borderWidth: 1, borderColor: C.goldBorder },
  selectedBadgeLabel:{ fontSize: 10, color: C.gold, fontWeight: '700', letterSpacing: 1,
                        textTransform: 'uppercase', marginBottom: 3 },
  selectedBadgeValue:{ fontSize: 14, color: C.white, fontWeight: '700' },

  // Summary mini
  summaryMini:  { backgroundColor: C.navyCard, borderRadius: 12, padding: 12, marginBottom: 18,
                   borderWidth: 1, borderColor: C.border },
  summaryMiniRow:{ fontSize: 13, color: C.grayLight, marginBottom: 2 },

  // Time grid
  timeGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  timeChip:     { width: (SW - 52) / 4, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                   backgroundColor: C.navyCard, borderWidth: 1.5, borderColor: C.border },
  timeChipActive:{ borderColor: C.gold, backgroundColor: C.goldDim },
  timeText:     { fontSize: 12, color: C.grayLight, fontWeight: '600' },
  timeTextActive:{ color: C.gold, fontWeight: '800' },

  // Vehicle chips
  vehicleChip:      { backgroundColor: C.navyCard, borderRadius: 12, paddingHorizontal: 14,
                       paddingVertical: 10, borderWidth: 1.5, borderColor: C.border },
  vehicleChipActive: { borderColor: C.gold, backgroundColor: C.goldDim },
  vehicleChipText:   { fontSize: 13, color: C.grayLight, fontWeight: '600' },
  vehicleChipTextActive:{ color: C.gold, fontWeight: '700' },
  vehiclePlate:      { fontSize: 11, color: C.gray, marginTop: 2 },

  // Notes
  notesWrap:    { backgroundColor: C.navyCard, borderRadius: 14, padding: 14, marginBottom: 20,
                   borderWidth: 1, borderColor: C.border },
  notesInput:   { fontSize: 14, color: C.white, minHeight: 70 },

  // Next button
  nextBtn:        { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 16,
                     alignItems: 'center', marginBottom: 10 },
  nextBtnDisabled:{ opacity: 0.4 },
  nextBtnText:    { color: C.navy, fontWeight: '900', fontSize: 16 },

  // Summary card
  summaryCard:    { backgroundColor: C.navyCard, borderRadius: 18, padding: 18, marginBottom: 16,
                     borderWidth: 1, borderColor: C.border },
  summaryRow:     { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  summaryIconWrap:{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.goldDim,
                     justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  summaryRowInfo: { flex: 1 },
  summaryRowLabel:{ fontSize: 10, color: C.gold, fontWeight: '700', textTransform: 'uppercase',
                     letterSpacing: 0.8, marginBottom: 2 },
  summaryRowValue:{ fontSize: 14, color: C.white, fontWeight: '700' },
  summaryRowSub:  { fontSize: 12, color: C.grayLight, marginTop: 1 },
  summaryPrice:   { fontSize: 16, fontWeight: '800', color: C.success },
  summaryDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 4 },
  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                     marginTop: 14, paddingTop: 14,
                     borderTopWidth: 1.5, borderTopColor: C.goldBorder },
  totalLabel:     { fontSize: 13, color: C.grayLight, fontWeight: '700' },
  totalValue:     { fontSize: 20, fontWeight: '900', color: C.gold },

  // Confirm button
  confirmBtn:   { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 18,
                   alignItems: 'center', marginBottom: 12,
                   shadowColor: C.gold, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  confirmBtnText:{ color: C.navy, fontWeight: '900', fontSize: 17 },
  editBtn:      { borderRadius: 14, paddingVertical: 14, alignItems: 'center',
                   borderWidth: 1.5, borderColor: C.goldBorder },
  editBtnText:  { color: C.grayLight, fontWeight: '700', fontSize: 14 },

  // Empty
  empty:        { alignItems: 'center', paddingVertical: 40 },
  emptyText:    { color: C.gray, fontSize: 14 },
});