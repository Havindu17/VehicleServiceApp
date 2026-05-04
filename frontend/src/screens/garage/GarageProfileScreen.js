import SoundButton from "../../utils/SoundButton";
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, TextInput, ActivityIndicator,
  Alert, Platform, Image, Modal, FlatList,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const COLORS = {
  navy:    '#0B1D3A',
  navyMid: '#132847',
  gold:    '#C9A84C',
  white:   '#FFFFFF',
  gray:    '#8A9BB5',
  cardBg:  '#162040',
  success: '#16A34A',
  error:   '#EF4444',
  info:    '#2563EB',
  bg:      '#0D1829',
};

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DEFAULT_HOURS = DAYS.reduce((o, d) => ({
  ...o,
  [d]: { open: '08:00', close: '18:00', closed: false },
}), {});

const SERVICE_SUGGESTIONS = [
  'Oil Change','Wheel Alignment','Brake Service','Coolant Flush',
  'AC Service','Engine Repair','Tyre Replacement','Battery Service',
  'Body Work','Electrical Repair','Suspension','Transmission',
];

// ── Generate 30-min interval time options (00:00 → 23:30) ─────────────────
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

// ── Section Header ─────────────────────────────────────────────────────────
function SectionCard({ icon, title, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionCardHeader}>
        <Text style={styles.sectionCardIcon}>{icon}</Text>
        <Text style={styles.sectionCardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ── Field ──────────────────────────────────────────────────────────────────
function Field({ label, icon, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        {icon && <Text style={styles.inputIcon}>{icon}</Text>}
        {children}
      </View>
    </View>
  );
}

// ── Helper: get display name from service ─────────────────────────────────
const toServiceString = (s) => {
  if (typeof s === 'string') return s;
  if (typeof s === 'object' && s !== null) return s.name ?? '';
  return String(s);
};

// ── Helper: normalize any service → full schema object ────────────────────
const toServiceObject = (s) => {
  if (typeof s === 'string') {
    return { name: s, description: '', price: 0, duration: 0, category: '' };
  }
  if (typeof s === 'object' && s !== null) {
    return {
      name:        s.name        ?? '',
      description: s.description ?? '',
      price:       s.price       ?? 0,
      duration:    s.duration    ?? 0,
      category:    s.category    ?? '',
      ...(s._id ? { _id: s._id } : {}),
    };
  }
  return { name: String(s), description: '', price: 0, duration: 0, category: '' };
};

// ── Time Dropdown Component ────────────────────────────────────────────────
function TimeDropdown({ value, onChange }) {
  const [visible, setVisible] = useState(false);

  const selectedIndex = TIME_OPTIONS.indexOf(value);

  return (
    <>
      <TouchableOpacity
        style={styles.timeDropBtn}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.timeDropText}>{value || '08:00'}</Text>
        <Text style={{ color: COLORS.gold, fontSize: 10, marginLeft: 4 }}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.timeModalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View
            style={styles.timeModalBox}
            // Prevent closing when tapping inside the modal box
            onStartShouldSetResponder={() => true}
            onTouchEnd={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.timeModalHeader}>
              <Text style={styles.timeModalTitle}>⏰ Select Time</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={{ color: COLORS.error, fontWeight: '700', fontSize: 15 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Time List */}
            <FlatList
              data={TIME_OPTIONS}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              initialScrollIndex={Math.max(0, selectedIndex)}
              getItemLayout={(_, index) => ({
                length: 46,
                offset: 46 * index,
                index,
              })}
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <TouchableOpacity
                    style={[styles.timeOption, selected && styles.timeOptionSelected]}
                    onPress={() => {
                      onChange(item);
                      setVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.timeOptionText, selected && styles.timeOptionTextSelected]}>
                      {item}
                    </Text>
                    {selected && (
                      <Text style={{ color: COLORS.gold, fontSize: 14, fontWeight: '800' }}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────
export default function GarageProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Basic info
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [phone,   setPhone]   = useState('');
  const [address, setAddress] = useState('');
  const [about,   setAbout]   = useState('');
  const [regNo,   setRegNo]   = useState('');
  const [photo,   setPhoto]   = useState(null);

  // Hours
  const [hours, setHours] = useState(DEFAULT_HOURS);

  // Services — always stored as plain strings internally
  const [services,     setServices]     = useState([]);
  const [serviceInput, setServiceInput] = useState('');

  // Location
  const [location, setLocation] = useState(null);
  const [mapModal, setMapModal] = useState(false);
  const [tempLoc,  setTempLoc]  = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/garage/profile');
      const p   = res.data;
      setName(p.name    ?? '');
      setEmail(p.email  ?? '');
      setPhone(p.phone  ?? '');
      setAddress(p.address ?? '');
      setAbout(p.about  ?? '');
      setRegNo(p.businessRegNo ?? '');
      setPhoto(p.profilePhoto  ?? null);

      const raw = p.services ?? [];
      setServices(raw.map(toServiceObject).filter(s => s.name));

      if (p.workingHours) setHours({ ...DEFAULT_HOURS, ...p.workingHours });
      if (p.location?.coordinates) {
        setLocation({
          latitude:  p.location.coordinates[1],
          longitude: p.location.coordinates[0],
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── Photo Picker ─────────────────────────────────────────────────────────
  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed', 'Allow photo access');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true,
    });
    if (!result.canceled) setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
  };

  // ── Get Current Location ─────────────────────────────────────────────────
  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed', 'Allow location access');
    const loc    = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    setTempLoc(coords);
    setMapModal(true);
  };

  // ── Services ─────────────────────────────────────────────────────────────
  const addService = (s) => {
    const trimmed = toServiceString(s).trim();
    if (!trimmed) return;
    const alreadyExists = services.some(x => toServiceString(x) === trimmed);
    if (alreadyExists) return;
    setServices(prev => [...prev, toServiceObject(trimmed)]);
    setServiceInput('');
  };

  const removeService = (s) => {
    const target = toServiceString(s);
    setServices(prev => prev.filter(x => toServiceString(x) !== target));
  };

  // ── Hours ────────────────────────────────────────────────────────────────
  const updateHour = (day, field, value) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      // Backend serviceSchema: { name, description, price, duration, category }
      const servicesPayload = services.map(toServiceObject);
      await api.put('/garage/profile', {
        name, phone, address, about,
        businessRegNo: regNo,
        profilePhoto:  photo,
        services: servicesPayload,
        workingHours:  hours,
        location: location ? {
          type: 'Point',
          coordinates: [location.longitude, location.latitude],
        } : undefined,
      });
      Alert.alert('✅ Saved', 'Profile updated successfully!');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not update profile');
    } finally { setSaving(false); }
  };

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

      {/* ── Header ── */}
      <View style={styles.header}>
        <SoundButton onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </SoundButton>
        <Text style={styles.headerTitle}>Garage Profile</Text>
        <SoundButton onPress={handleSave} disabled={saving} style={styles.saveTopBtn}>
          {saving
            ? <ActivityIndicator size="small" color={COLORS.gold} />
            : <Text style={styles.saveTopText}>Save</Text>
          }
        </SoundButton>
      </View>

      {/* ── Profile Photo + Name ── */}
      <View style={styles.heroSection}>
        <SoundButton onPress={pickPhoto} style={styles.avatarWrap}>
          {photo
            ? <Image source={{ uri: photo }} style={styles.avatarImg} />
            : <View style={styles.avatarRing}>
                <Text style={styles.avatarText}>
                  {name ? name.charAt(0).toUpperCase() : '🏪'}
                </Text>
              </View>
          }
          <View style={styles.cameraBtn}>
            <Text style={{ fontSize: 14 }}>📷</Text>
          </View>
        </SoundButton>
        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text style={styles.heroName}>{name || 'Your Garage'}</Text>
          <Text style={styles.heroEmail}>{email}</Text>
          {regNo ? (
            <View style={styles.regBadge}>
              <Text style={styles.regBadgeText}>🏢 Reg: {regNo}</Text>
            </View>
          ) : null}
          {location && (
            <View style={styles.locBadge}>
              <Text style={styles.locBadgeText}>📍 Location set</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Tab Nav ── */}
      <View style={styles.tabRow}>
        {[
          { key: 'basic',    label: '🏪 Basic'    },
          { key: 'hours',    label: '⏰ Hours'    },
          { key: 'services', label: '🔧 Services' },
          { key: 'location', label: '📍 Location' },
        ].map(t => (
          <SoundButton
            key={t.key}
            style={[styles.tabBtn, activeTab === t.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </SoundButton>
        ))}
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ════════ BASIC TAB ════════ */}
        {activeTab === 'basic' && (
          <SectionCard icon="🏪" title="Basic Information">
            <Field label="GARAGE NAME" icon="🏪">
              <TextInput style={styles.input} value={name} onChangeText={setName}
                placeholder="Garage name" placeholderTextColor={COLORS.gray}
                autoCorrect={false} autoCapitalize="words" />
            </Field>

            <Field label="EMAIL ADDRESS" icon="📧">
              <TextInput style={[styles.input, { color: COLORS.gray }]}
                value={email} editable={false} />
            </Field>

            <Field label="PHONE NUMBER" icon="📱">
              <TextInput style={styles.input} value={phone} onChangeText={setPhone}
                placeholder="07X XXX XXXX" placeholderTextColor={COLORS.gray}
                keyboardType="phone-pad" />
            </Field>

            <Field label="ADDRESS" icon="📍">
              <TextInput style={styles.input} value={address} onChangeText={setAddress}
                placeholder="Street, City" placeholderTextColor={COLORS.gray}
                autoCorrect={false} />
            </Field>

            <Field label="BUSINESS REGISTRATION NO." icon="🏢">
              <TextInput style={styles.input} value={regNo} onChangeText={setRegNo}
                placeholder="e.g. BR/2024/12345" placeholderTextColor={COLORS.gray}
                autoCapitalize="characters" autoCorrect={false} />
            </Field>

            <View style={{ marginBottom: 14 }}>
              <Text style={styles.label}>ABOUT / DESCRIPTION</Text>
              <TextInput
                style={[styles.inputWrap, styles.input, { height: 90, textAlignVertical: 'top', padding: 12 }]}
                value={about} onChangeText={setAbout}
                placeholder="Describe your garage, specialties, experience..."
                placeholderTextColor={COLORS.gray}
                multiline maxLength={300}
              />
              <Text style={{ color: COLORS.gray, fontSize: 11, textAlign: 'right', marginTop: 4 }}>
                {about.length}/300
              </Text>
            </View>
          </SectionCard>
        )}

        {/* ════════ HOURS TAB ════════ */}
        {activeTab === 'hours' && (
          <SectionCard icon="⏰" title="Working Hours">
            {DAYS.map(day => (
              <View key={day} style={styles.hoursRow}>
                <View style={{ width: 90 }}>
                  <Text style={styles.dayLabel}>{day.slice(0, 3)}</Text>
                  <SoundButton
                    style={[styles.closedToggle, hours[day]?.closed && styles.closedToggleOn]}
                    onPress={() => updateHour(day, 'closed', !hours[day]?.closed)}
                  >
                    <Text style={{
                      fontSize: 10,
                      color: hours[day]?.closed ? COLORS.error : COLORS.success,
                      fontWeight: '700',
                    }}>
                      {hours[day]?.closed ? 'CLOSED' : 'OPEN'}
                    </Text>
                  </SoundButton>
                </View>

                {!hours[day]?.closed ? (
                  <View style={styles.hoursInputs}>
                    <TimeDropdown
                      value={hours[day]?.open}
                      onChange={v => updateHour(day, 'open', v)}
                    />
                    <Text style={{ color: COLORS.gray, marginHorizontal: 6 }}>→</Text>
                    <TimeDropdown
                      value={hours[day]?.close}
                      onChange={v => updateHour(day, 'close', v)}
                    />
                  </View>
                ) : (
                  <Text style={{ color: COLORS.error, fontSize: 13, marginLeft: 12 }}>
                    Closed today
                  </Text>
                )}
              </View>
            ))}
          </SectionCard>
        )}

        {/* ════════ SERVICES TAB ════════ */}
        {activeTab === 'services' && (
          <SectionCard icon="🔧" title="Services Offered">
            <View style={styles.tagsWrap}>
              {services.length === 0 && (
                <Text style={{ color: COLORS.gray, fontSize: 13 }}>No services added yet</Text>
              )}
              {services.map((s, i) => {
                const label = toServiceString(s);
                return (
                  <View key={i} style={styles.serviceTag}>
                    <Text style={styles.serviceTagText}>{label}</Text>
                    <SoundButton onPress={() => removeService(s)}>
                      <Text style={{ color: COLORS.error, fontWeight: '900', marginLeft: 6 }}>✕</Text>
                    </SoundButton>
                  </View>
                );
              })}
            </View>

            <View style={styles.addServiceRow}>
              <TextInput
                style={[styles.input, styles.inputWrap, { flex: 1, marginBottom: 0 }]}
                value={serviceInput}
                onChangeText={setServiceInput}
                placeholder="Add custom service..."
                placeholderTextColor={COLORS.gray}
                onSubmitEditing={() => addService(serviceInput)}
              />
              <SoundButton style={styles.addBtn} onPress={() => addService(serviceInput)}>
                <Text style={styles.addBtnText}>+ Add</Text>
              </SoundButton>
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>QUICK ADD</Text>
            <View style={styles.tagsWrap}>
              {SERVICE_SUGGESTIONS.filter(s => !services.some(x => toServiceString(x) === s)).map((s, i) => (
                <SoundButton key={i} style={styles.suggestionTag} onPress={() => addService(s)}>
                  <Text style={styles.suggestionTagText}>+ {s}</Text>
                </SoundButton>
              ))}
            </View>
          </SectionCard>
        )}

        {/* ════════ LOCATION TAB ════════ */}
        {activeTab === 'location' && (
          <SectionCard icon="📍" title="Garage Location">
            {location ? (
              <>
                <View style={styles.mapPreview}>
                  <WebView
                    style={{ flex: 1 }}
                    originWhitelist={['*']}
                    source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0}body,html{width:100%;height:100%}#map{width:100%;height:100vh}</style><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,dragging:false,scrollWheelZoom:false}).setView([${location.latitude},${location.longitude}],16);L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'Esri'}).addTo(map);L.marker([${location.latitude},${location.longitude}]).addTo(map);</script></body></html>` }}
                  />
                </View>
                <Text style={styles.coordText}>
                  📍 {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </Text>
              </>
            ) : (
              <View style={styles.noLocationBox}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>🗺️</Text>
                <Text style={{ color: COLORS.gray, fontSize: 14, textAlign: 'center' }}>
                  No location set yet.{'\n'}Use your device GPS to pin your garage.
                </Text>
              </View>
            )}

            <SoundButton style={styles.gpsBtn} onPress={getCurrentLocation}>
              <Text style={styles.gpsBtnText}>📡 Use Current GPS Location</Text>
            </SoundButton>

            <SoundButton
              style={[styles.gpsBtn, { backgroundColor: COLORS.navyMid, marginTop: 8 }]}
              onPress={() => {
                setTempLoc(location || { latitude: 6.9271, longitude: 79.8612 });
                setMapModal(true);
              }}
            >
              <Text style={[styles.gpsBtnText, { color: COLORS.gold }]}>🗺️ Pick on Map</Text>
            </SoundButton>
          </SectionCard>
        )}

        {/* Save Button */}
        <SoundButton style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color={COLORS.navy} />
            : <Text style={styles.saveBtnText}>✓ Save All Changes</Text>
          }
        </SoundButton>

        {/* Logout */}
        <SoundButton style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </SoundButton>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ════════ MAP PICKER MODAL ════════ */}
      <Modal visible={mapModal} animationType="slide" onRequestClose={() => setMapModal(false)}>
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
          <View style={styles.mapModalHeader}>
            <SoundButton onPress={() => setMapModal(false)}>
              <Text style={{ color: COLORS.error, fontWeight: '700', fontSize: 15 }}>Cancel</Text>
            </SoundButton>
            <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: 16 }}>Pin Your Garage</Text>
            <SoundButton onPress={() => { setLocation(tempLoc); setMapModal(false); }}>
              <Text style={{ color: COLORS.gold, fontWeight: '800', fontSize: 15 }}>Done ✓</Text>
            </SoundButton>
          </View>

          <Text style={styles.mapHint}>📌 Tap on map to move the pin</Text>

          {tempLoc && (
            <View style={{ flex: 1 }}>
              <WebView
                style={{ flex: 1 }}
                originWhitelist={['*']}
                onMessage={e => {
                  try {
                    const d = JSON.parse(e.nativeEvent.data);
                    if (d.lat && d.lng) setTempLoc({ latitude: d.lat, longitude: d.lng });
                  } catch {}
                }}
                source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0}body,html{width:100%;height:100%}#map{width:100%;height:100vh}</style><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script></head><body><div id="map"></div><script>var lat=${tempLoc.latitude},lng=${tempLoc.longitude};var map=L.map('map').setView([lat,lng],16);L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'Esri'}).addTo(map);var marker=L.marker([lat,lng],{draggable:true}).addTo(map);marker.on('dragend',function(e){var p=e.target.getLatLng();window.ReactNativeWebView.postMessage(JSON.stringify({lat:p.lat,lng:p.lng}));});map.on('click',function(e){marker.setLatLng(e.latlng);window.ReactNativeWebView.postMessage(JSON.stringify({lat:e.latlng.lat,lng:e.latlng.lng}));});</script></body></html>` }}
              />
              {/* Coordinate adjust buttons */}
              <View style={styles.coordAdjust}>
                <Text style={styles.coordAdjustTitle}>📍 Pinned Location</Text>
                <Text style={styles.coordAdjustText}>
                  {tempLoc.latitude.toFixed(5)}, {tempLoc.longitude.toFixed(5)}
                </Text>
                <View style={styles.coordBtnRow}>
                  <TouchableOpacity style={styles.coordBtn} onPress={() => setTempLoc(p => ({ ...p, latitude: +(p.latitude + 0.0005).toFixed(6) }))}>
                    <Text style={styles.coordBtnText}>▲ N</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.coordBtn} onPress={() => setTempLoc(p => ({ ...p, latitude: +(p.latitude - 0.0005).toFixed(6) }))}>
                    <Text style={styles.coordBtnText}>▼ S</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.coordBtn} onPress={() => setTempLoc(p => ({ ...p, longitude: +(p.longitude - 0.0005).toFixed(6) }))}>
                    <Text style={styles.coordBtnText}>◄ W</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.coordBtn} onPress={() => setTempLoc(p => ({ ...p, longitude: +(p.longitude + 0.0005).toFixed(6) }))}>
                    <Text style={styles.coordBtnText}>E ►</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.navy,
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.navy },
  scroll: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: COLORS.navy, paddingHorizontal: 20, paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)' },
  backBtn:      { width: 60 },
  backText:     { color: COLORS.gold, fontSize: 18, fontWeight: '700' },
  headerTitle:  { fontSize: 17, fontWeight: '800', color: COLORS.white },
  saveTopBtn:   { width: 60, alignItems: 'flex-end' },
  saveTopText:  { color: COLORS.gold, fontWeight: '800', fontSize: 15 },

  // Hero
  heroSection:  { flexDirection: 'row', alignItems: 'center', padding: 20,
                  backgroundColor: COLORS.navy, borderBottomWidth: 1,
                  borderBottomColor: 'rgba(201,168,76,0.1)' },
  avatarWrap:   { position: 'relative' },
  avatarRing:   { width: 80, height: 80, borderRadius: 40, borderWidth: 2,
                  borderColor: COLORS.gold, backgroundColor: COLORS.cardBg,
                  justifyContent: 'center', alignItems: 'center' },
  avatarImg:    { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: COLORS.gold },
  avatarText:   { fontSize: 32, color: COLORS.gold, fontWeight: '900' },
  cameraBtn:    { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.gold,
                  width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  heroName:     { fontSize: 18, fontWeight: '900', color: COLORS.white, marginBottom: 3 },
  heroEmail:    { fontSize: 12, color: COLORS.gray, marginBottom: 6 },
  regBadge:     { backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 8, paddingHorizontal: 8,
                  paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 4,
                  borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  regBadgeText: { color: COLORS.gold, fontSize: 11, fontWeight: '700' },
  locBadge:     { backgroundColor: 'rgba(22,163,74,0.15)', borderRadius: 8, paddingHorizontal: 8,
                  paddingVertical: 3, alignSelf: 'flex-start',
                  borderWidth: 1, borderColor: 'rgba(22,163,74,0.3)' },
  locBadgeText: { color: COLORS.success, fontSize: 11, fontWeight: '700' },

  // Tabs
  tabRow:        { flexDirection: 'row', backgroundColor: COLORS.navyMid,
                   paddingHorizontal: 12, paddingVertical: 8, gap: 6,
                   borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.08)' },
  tabBtn:        { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 10,
                   backgroundColor: 'rgba(255,255,255,0.04)' },
  tabBtnActive:  { backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1, borderColor: COLORS.gold },
  tabText:       { fontSize: 11, fontWeight: '600', color: COLORS.gray },
  tabTextActive: { color: COLORS.gold, fontWeight: '800' },

  // Section card
  sectionCard:        { margin: 14, backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 18,
                         borderWidth: 1, borderColor: 'rgba(201,168,76,0.12)' },
  sectionCardHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  sectionCardIcon:    { fontSize: 20, marginRight: 10 },
  sectionCardTitle:   { fontSize: 16, fontWeight: '800', color: COLORS.white },

  // Fields
  label:     { fontSize: 11, fontWeight: '700', color: COLORS.gold,
               marginBottom: 7, letterSpacing: 0.8, textTransform: 'uppercase' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.navyMid,
               borderRadius: 12, paddingHorizontal: 12,
               borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input:     { flex: 1, paddingVertical: 12, fontSize: 14, color: COLORS.white },

  // Hours
  hoursRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  dayLabel:       { fontSize: 13, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  closedToggle:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                    backgroundColor: 'rgba(22,163,74,0.1)', borderWidth: 1,
                    borderColor: 'rgba(22,163,74,0.3)' },
  closedToggleOn: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  hoursInputs:    { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 12 },

  // ── Time Dropdown ──────────────────────────────────────────────
  timeDropBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.navyMid,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
  },
  timeDropText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  timeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeModalBox: {
    width: 230,
    maxHeight: 340,
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    overflow: 'hidden',
  },
  timeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: COLORS.navy,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.12)',
  },
  timeModalTitle: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  timeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  timeOptionSelected: {
    backgroundColor: 'rgba(201,168,76,0.13)',
  },
  timeOptionText: {
    color: COLORS.gray,
    fontSize: 15,
    fontWeight: '500',
  },
  timeOptionTextSelected: {
    color: COLORS.gold,
    fontWeight: '800',
  },

  // Services
  tagsWrap:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  serviceTag:       { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(201,168,76,0.15)',
                      borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
                      borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  serviceTagText:   { color: COLORS.gold, fontSize: 13, fontWeight: '600' },
  suggestionTag:    { backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: 20,
                      paddingHorizontal: 12, paddingVertical: 6,
                      borderWidth: 1, borderColor: 'rgba(37,99,235,0.3)' },
  suggestionTagText:{ color: COLORS.info, fontSize: 12, fontWeight: '600' },
  addServiceRow:    { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addBtn:           { backgroundColor: COLORS.gold, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  addBtnText:       { color: COLORS.navy, fontWeight: '800', fontSize: 13 },

  // Location
  mapPreview:    { height: 200, borderRadius: 14, overflow: 'hidden', marginBottom: 10,
                   borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  coordText:     { color: COLORS.gray, fontSize: 12, textAlign: 'center', marginBottom: 12 },
  noLocationBox: { height: 150, justifyContent: 'center', alignItems: 'center',
                   backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14,
                   marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  gpsBtn:        { backgroundColor: COLORS.gold, borderRadius: 13, paddingVertical: 13,
                   alignItems: 'center' },
  gpsBtnText:    { color: COLORS.navy, fontWeight: '800', fontSize: 14 },

  // Map Modal
  mapModalHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                   backgroundColor: COLORS.navy, paddingHorizontal: 20, paddingVertical: 16,
                   borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)' },
  mapHint:       { backgroundColor: COLORS.navyMid, padding: 10, textAlign: 'center',
                   color: COLORS.gray, fontSize: 13 },

  // Save / Logout
  saveBtn:     { marginHorizontal: 14, marginTop: 6, backgroundColor: COLORS.gold,
                 borderRadius: 14, paddingVertical: 16, alignItems: 'center',
                 shadowColor: COLORS.gold, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: COLORS.navy, fontWeight: '900', fontSize: 15 },
  logoutBtn:   { marginHorizontal: 14, marginTop: 10, borderRadius: 13, paddingVertical: 14,
                 alignItems: 'center', borderWidth: 1.5, borderColor: '#EF444466',
                 backgroundColor: 'rgba(239,68,68,0.08)' },
  logoutText:  { color: '#EF4444', fontWeight: '800', fontSize: 15 },

  // Coord adjust panel (map picker)
  coordAdjust:      { backgroundColor: COLORS.navy, padding: 14,
                      borderTopWidth: 1, borderTopColor: 'rgba(201,168,76,0.15)' },
  coordAdjustTitle: { color: COLORS.white, fontWeight: '800', fontSize: 14, marginBottom: 2 },
  coordAdjustText:  { color: COLORS.gray, fontSize: 12, marginBottom: 10 },
  coordBtnRow:      { flexDirection: 'row', gap: 8 },
  coordBtn:         { flex: 1, backgroundColor: COLORS.navyMid, borderRadius: 10,
                      paddingVertical: 10, alignItems: 'center',
                      borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  coordBtnText:     { color: COLORS.gold, fontWeight: '700', fontSize: 13 },
});