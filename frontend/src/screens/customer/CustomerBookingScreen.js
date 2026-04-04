import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, ActivityIndicator, Alert, Platform
} from 'react-native';
import api from '../../utils/api';

const COLORS = {
  navy:    '#0B1D3A', navyMid: '#132847', gold: '#C9A84C',
  white:   '#FFFFFF', gray: '#8A9BB5',    cardBg: '#162040',
};

export default function CustomerBookingScreen({ navigation, route }) {
  const preselectedGarageId   = route.params?.garageId ?? null;
  const preselectedGarageName = route.params?.garageName ?? null;

  const [garages,         setGarages]         = useState([]);
  const [services,        setServices]        = useState([]);
  const [vehicles,        setVehicles]        = useState([]);
  const [selectedGarage,  setSelectedGarage]  = useState(preselectedGarageId ?? '');
  const [selectedService, setSelectedService] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [date,    setDate]    = useState('');
  const [time,    setTime]    = useState('');
  const [notes,   setNotes]   = useState('');
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

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

  const handleGarageSelect = async (id) => {
    setSelectedGarage(id);
    setSelectedService('');
    if (!id) { setServices([]); return; }
    try {
      const res = await api.get(`/customer/garages/${id}/services`);
      setServices(res.data);
    } catch { setServices([]); }
  };

  const handleBook = async () => {
    if (!selectedGarage || !selectedService || !date || !time) {
      Alert.alert('Required', 'Please fill in all required fields');
      return;
    }
    try {
      setSaving(true);
      await api.post('/customer/bookings', {
        garageId: selectedGarage, serviceId: selectedService,
        vehicleId: selectedVehicle, date, time, notes,
      });
      Alert.alert('Booking Confirmed! 🎉', 'Your booking has been submitted. The garage will confirm shortly.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Booking failed');
    } finally { setSaving(false); }
  };

  const SelectorRow = ({ label, items, selected, onSelect, displayKey = 'name', required }) => (
    <View style={styles.selectorBox}>
      <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
        {items.map((item, i) => {
          const id = item._id ?? item.id;
          const isSelected = selected === id;
          return (
            <TouchableOpacity key={i}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => onSelect(id)}>
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {item[displayKey]}
              </Text>
              {item.price ? (
                <Text style={[styles.chipSub, isSelected && styles.chipSubActive]}>
                  Rs. {item.price}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Book a Service</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll}
        contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">

        {!preselectedGarageId ? (
          <SelectorRow label="Select Garage" items={garages} selected={selectedGarage}
            onSelect={handleGarageSelect} required />
        ) : (
          <View style={styles.preselectedBox}>
            <Text style={styles.label}>Garage</Text>
            <View style={styles.preselectedCard}>
              <Text style={styles.preselectedName}>🏪 {preselectedGarageName}</Text>
            </View>
          </View>
        )}

        {services.length > 0 && (
          <SelectorRow label="Select Service" items={services} selected={selectedService}
            onSelect={setSelectedService} required />
        )}

        {vehicles.length > 0 && (
          <SelectorRow label="Select Vehicle" items={vehicles} selected={selectedVehicle}
            onSelect={setSelectedVehicle} displayKey="model" />
        )}

        <Text style={styles.label}>Date *</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>📅</Text>
          <TextInput style={styles.input} placeholder="YYYY-MM-DD  (e.g. 2024-07-15)"
            placeholderTextColor={COLORS.gray} value={date} onChangeText={setDate} />
        </View>

        <Text style={styles.label}>Time *</Text>
        <View style={styles.timeRow}>
          {['8:00 AM','9:00 AM','10:00 AM','11:00 AM','1:00 PM','2:00 PM','3:00 PM','4:00 PM'].map(t => (
            <TouchableOpacity key={t}
              style={[styles.timeChip, time === t && styles.timeChipActive]}
              onPress={() => setTime(t)}>
              <Text style={[styles.timeText, time === t && styles.timeTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Additional Notes</Text>
        <View style={[styles.inputWrap, { alignItems: 'flex-start', paddingTop: 12 }]}>
          <Text style={[styles.inputIcon, { marginTop: 2 }]}>📝</Text>
          <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Any specific issues or requests..."
            placeholderTextColor={COLORS.gray} value={notes}
            onChangeText={setNotes} multiline />
        </View>

        <TouchableOpacity style={styles.bookBtn} onPress={handleBook} disabled={saving}>
          {saving
            ? <ActivityIndicator color={COLORS.navy} />
            : <Text style={styles.bookBtnText}>Confirm Booking  →</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: COLORS.navy,
                      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.navy },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: COLORS.navy, paddingHorizontal: 16, paddingVertical: 16,
                      borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)' },
  backBtn:          { width: 60 },
  backText:         { color: COLORS.gold, fontWeight: '700', fontSize: 15 },
  title:            { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  scroll:           { flex: 1, backgroundColor: '#0D1829' },
  label:            { fontSize: 11, fontWeight: '700', color: COLORS.gold,
                      marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase' },
  selectorBox:      { marginBottom: 20 },
  chip:             { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
                      borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.2)',
                      backgroundColor: COLORS.cardBg, minWidth: 100 },
  chipActive:       { borderColor: COLORS.gold, backgroundColor: 'rgba(201,168,76,0.1)' },
  chipText:         { fontSize: 13, fontWeight: '600', color: COLORS.gray, textAlign: 'center' },
  chipTextActive:   { color: COLORS.gold },
  chipSub:          { fontSize: 12, color: COLORS.gray, textAlign: 'center', marginTop: 2 },
  chipSubActive:    { color: COLORS.gold },
  preselectedBox:   { marginBottom: 20 },
  preselectedCard:  { backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 14,
                      borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  preselectedName:  { fontSize: 15, fontWeight: '700', color: COLORS.gold },
  inputWrap:        { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg,
                      borderRadius: 12, paddingHorizontal: 14, marginBottom: 16,
                      borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  inputIcon:        { fontSize: 18, marginRight: 8 },
  input:            { flex: 1, paddingVertical: 14, fontSize: 15, color: COLORS.white },
  timeRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  timeChip:         { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
                      borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.2)',
                      backgroundColor: COLORS.cardBg },
  timeChipActive:   { borderColor: COLORS.gold, backgroundColor: 'rgba(201,168,76,0.1)' },
  timeText:         { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  timeTextActive:   { color: COLORS.gold, fontWeight: '800' },
  bookBtn:          { backgroundColor: COLORS.gold, borderRadius: 14, paddingVertical: 17,
                      alignItems: 'center', marginTop: 8,
                      shadowColor: COLORS.gold, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 },
  bookBtnText:      { color: COLORS.navy, fontWeight: '900', fontSize: 17 },
});