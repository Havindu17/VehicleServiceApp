import SoundButton from "../../utils/SoundButton";
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, ActivityIndicator, Alert, Platform,
  Animated, Dimensions, Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import * as ImagePicker from 'expo-image-picker';

const { width: SW } = Dimensions.get('window');

const C = {
  navy:       '#080F1E',
  navyMid:    '#0D1829',
  navyCard:   '#111E35',
  navyLight:  '#162540',
  gold:       '#C9A84C',
  goldDim:    'rgba(201,168,76,0.12)',
  goldBorder: 'rgba(201,168,76,0.25)',
  white:      '#FFFFFF',
  offWhite:   '#D8E0EE',
  gray:       '#5A6E8C',
  grayLight:  '#8A9BB5',
  error:      '#EF4444',
  errorDim:   'rgba(239,68,68,0.12)',
  success:    '#22C55E',
  successDim: 'rgba(34,197,94,0.12)',
  border:     'rgba(201,168,76,0.15)',
};

const VEHICLE_TYPE_ICONS = { Car:'🚗', Van:'🚐', Bus:'🚌', Truck:'🚚', Motorcycle:'🏍️', SUV:'🚙' };
const COLOR_MAP = {
  White:'#F5F5F5', Black:'#1A1A1A', Silver:'#C0C0C0', Blue:'#3B82F6',
  Red:'#EF4444', Grey:'#6B7280', Green:'#22C55E', Brown:'#92400E',
  Orange:'#F97316', Yellow:'#EAB308',
};

const DOC_TYPES = [
  { key: 'nic',       label: 'NIC / Passport',  icon: '🪪', apiKey: 'nicPassport'    },
  { key: 'license',   label: 'Driving License',  icon: '🚘', apiKey: 'drivingLicense' },
  { key: 'revenue',   label: 'Revenue License',  icon: '📋', apiKey: 'revenueLicense' },
  { key: 'insurance', label: 'Insurance',         icon: '🛡️', apiKey: 'insurance'      },
];

// ── Image helpers ─────────────────────────────────────────────────────────────
async function pickImage(options = {}) {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please allow photo library access in settings.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
    ...options,
  });
  if (result.canceled) return null;
  return result.assets[0];
}

async function pickDocument() {
  return new Promise(resolve => {
    Alert.alert('Upload Document', 'Choose source', [
      {
        text: 'Camera', onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access required.'); resolve(null); return; }
          const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85 });
          resolve(r.canceled ? null : r.assets[0]);
        },
      },
      {
        text: 'Gallery', onPress: async () => {
          const asset = await pickImage({ allowsEditing: false });
          resolve(asset);
        },
      },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

// ── VehicleCard ───────────────────────────────────────────────────────────────
function VehicleCard({ vehicle, onEdit, onDelete, index }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, delay: index * 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);
  const dotColor = COLOR_MAP[vehicle.color] ?? C.gray;
  const icon     = VEHICLE_TYPE_ICONS[vehicle.vehicleType] ?? '🚗';
  return (
    <Animated.View style={[vc.wrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={vc.iconBox}><Text style={{ fontSize: 26 }}>{icon}</Text></View>
      <View style={vc.info}>
        <View style={vc.topRow}>
          <Text style={vc.name}>{vehicle.make} {vehicle.model}</Text>
          <View style={[vc.colorDot, { backgroundColor: dotColor,
            borderColor: vehicle.color === 'White' ? C.gray : dotColor }]} />
        </View>
        <Text style={vc.plate}>{vehicle.licensePlate}</Text>
        <View style={vc.tags}>
          {vehicle.year        && <View style={vc.tag}><Text style={vc.tagText}>{vehicle.year}</Text></View>}
          {vehicle.color       && <View style={vc.tag}><Text style={vc.tagText}>{vehicle.color}</Text></View>}
          {vehicle.vehicleType && <View style={[vc.tag, vc.tagGold]}><Text style={[vc.tagText, vc.tagTextGold]}>{vehicle.vehicleType}</Text></View>}
        </View>
      </View>
      <View style={vc.actionRow}>
        <SoundButton onPress={onEdit} style={vc.editBtn} activeOpacity={0.7}>
          <Text style={{ fontSize: 14 }}>✏️</Text>
        </SoundButton>
        <SoundButton onPress={onDelete} style={vc.deleteBtn} activeOpacity={0.7}>
          <Text style={{ fontSize: 14 }}>🗑</Text>
        </SoundButton>
      </View>
    </Animated.View>
  );
}
const vc = StyleSheet.create({
  wrap:        { flexDirection: 'row', alignItems: 'center', backgroundColor: C.navyLight,
                  borderRadius: 18, padding: 14, marginBottom: 10,
                  borderWidth: 1, borderColor: C.border },
  iconBox:     { width: 54, height: 54, borderRadius: 16, backgroundColor: C.goldDim,
                  justifyContent: 'center', alignItems: 'center', marginRight: 12,
                  borderWidth: 1, borderColor: C.goldBorder },
  info:        { flex: 1 },
  topRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  name:        { fontSize: 15, fontWeight: '800', color: C.white, flex: 1 },
  colorDot:    { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, marginLeft: 8 },
  plate:       { fontSize: 13, color: C.gold, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  tags:        { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag:         { backgroundColor: C.navyCard, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
                  borderWidth: 1, borderColor: C.border },
  tagText:     { fontSize: 11, color: C.grayLight, fontWeight: '600' },
  tagGold:     { borderColor: C.goldBorder, backgroundColor: C.goldDim },
  tagTextGold: { color: C.gold },
  actionRow:   { flexDirection: 'row', gap: 10, marginTop: 12 },
  editBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: C.goldDim,
                  justifyContent: 'center', alignItems: 'center',
                  borderWidth: 1, borderColor: C.goldBorder },
  deleteBtn:   { width: 36, height: 36, borderRadius: 10, backgroundColor: C.errorDim,
                  justifyContent: 'center', alignItems: 'center',
                  borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
});

// ── DocumentCard ──────────────────────────────────────────────────────────────
function DocumentCard({ doc, uri, uploading, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  const uploaded = !!uri;
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: (SW - 32 - 14) / 2 }}>
      <SoundButton
        style={[dc.card, uploaded && dc.cardUploaded]}
        activeOpacity={0.85}
        onPress={press}
        disabled={uploading}
      >
        <View style={dc.previewBox}>
          {uploading ? (
            <ActivityIndicator color={C.gold} />
          ) : uploaded ? (
            <Image source={{ uri }} style={dc.previewImg} />
          ) : (
            <>
              <Text style={dc.plus}>＋</Text>
              <Text style={dc.uploadHint}>Tap to upload</Text>
            </>
          )}
          {uploaded && (
            <View style={dc.checkBadge}><Text style={{ fontSize: 10, color: C.white }}>✓</Text></View>
          )}
        </View>
        <Text style={dc.docName}>{doc.icon}  {doc.label}</Text>
        <Text style={[dc.docStatus, uploaded && dc.docStatusOk]}>
          {uploaded ? 'Uploaded' : 'Not uploaded'}
        </Text>
      </SoundButton>
    </Animated.View>
  );
}
const dc = StyleSheet.create({
  card:         { backgroundColor: C.navyLight, borderRadius: 16, padding: 12,
                   borderWidth: 1, borderColor: C.border },
  cardUploaded: { borderColor: C.goldBorder, backgroundColor: C.goldDim },
  previewBox:   { width: '100%', height: 80, borderRadius: 10,
                   backgroundColor: 'rgba(201,168,76,0.06)',
                   borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(201,168,76,0.3)',
                   justifyContent: 'center', alignItems: 'center',
                   marginBottom: 8, overflow: 'hidden', position: 'relative' },
  previewImg:   { width: '100%', height: '100%', borderRadius: 9 },
  plus:         { fontSize: 22, color: 'rgba(201,168,76,0.4)', marginBottom: 2 },
  uploadHint:   { fontSize: 9, color: C.gray, textAlign: 'center' },
  checkBadge:   { position: 'absolute', top: 6, right: 6, width: 18, height: 18,
                   borderRadius: 9, backgroundColor: C.success,
                   justifyContent: 'center', alignItems: 'center' },
  docName:      { fontSize: 11, fontWeight: '700', color: C.gold, marginBottom: 2 },
  docStatus:    { fontSize: 10, color: C.gray },
  docStatusOk:  { color: C.success },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function CustomerProfileScreen({ navigation }) {
  const { logout, user } = useAuth();

  const [profile,  setProfile]  = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({});

  const [avatarUri,       setAvatarUri]       = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [docUris,      setDocUris]      = useState({ nic: null, license: null, revenue: null, insurance: null });
  const [docUploading, setDocUploading] = useState({ nic: false, license: false, revenue: false, insurance: false });

  const headerAnim = useRef(new Animated.Value(0)).current;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      const [pRes, vRes] = await Promise.all([
        api.get('/customer/profile'),
        api.get('/customer/vehicles'),
      ]);
      setProfile(pRes.data);
      setForm(pRes.data);
      setVehicles(vRes.data);

      if (pRes.data?.documents) {
        setDocUris({
          nic:       pRes.data.documents.nicPassport    ?? null,
          license:   pRes.data.documents.drivingLicense ?? null,
          revenue:   pRes.data.documents.revenueLicense ?? null,
          insurance: pRes.data.documents.insurance      ?? null,
        });
      }
      if (pRes.data?.avatarUrl) setAvatarUri(pRes.data.avatarUrl);

    } catch (e) {
      console.log('Profile fetch error:', e?.response?.data ?? e.message);
    } finally {
      setLoading(false);
      Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/customer/profile', form);
      setProfile(form);
      setEditing(false);
      Alert.alert('Updated!', 'Profile saved successfully.');
    } catch { Alert.alert('Error', 'Could not update profile'); }
    finally { setSaving(false); }
  };

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarPress = async () => {
    const asset = await pickImage({ allowsEditing: true, aspect: [1, 1] });
    if (!asset) return;
    try {
      setAvatarUploading(true);
      setAvatarUri(asset.uri);
      const fd = new FormData();
      fd.append('avatar', { uri: asset.uri, name: 'avatar.jpg', type: 'image/jpeg' });
      await api.post('/customer/profile/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch {
      Alert.alert('Error', 'Could not upload profile photo');
      setAvatarUri(null);
    } finally { setAvatarUploading(false); }
  };

  // ── Document upload ────────────────────────────────────────────────────────
  const handleDocUpload = async (docKey, apiKey) => {
    const asset = await pickDocument();
    if (!asset) return;
    try {
      setDocUploading(p => ({ ...p, [docKey]: true }));
      setDocUris(p => ({ ...p, [docKey]: asset.uri }));
      const fd = new FormData();
      fd.append('document', { uri: asset.uri, name: `${docKey}.jpg`, type: 'image/jpeg' });
      fd.append('type', apiKey);
      await api.post('/customer/profile/documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch {
      Alert.alert('Error', 'Could not upload document');
      setDocUris(p => ({ ...p, [docKey]: null }));
    } finally {
      setDocUploading(p => ({ ...p, [docKey]: false }));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={{ color: C.gray, marginTop: 12, fontSize: 14 }}>Loading profile…</Text>
      </View>
    );
  }

  const initials     = profile?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '?';
  const uploadedDocs = Object.values(docUris).filter(Boolean).length;

  // ✅ FIX: profile එකේ ID නැති නිසා email pass කරනවා
  const handleOpenVehicleFleet = () => {
    navigation.navigate('Vehicle', {
      preselectedCustomerEmail: profile?.email,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* Header */}
      <View style={styles.header}>
        <SoundButton onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </SoundButton>
        <Text style={styles.headerTitle}>My Profile</Text>
        <SoundButton
          onPress={editing ? handleSave : () => setEditing(true)}
          style={[styles.editBtn, editing && styles.saveBtnStyle]}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={C.navy} size="small" />
            : <Text style={[styles.editBtnText, editing && { color: C.navy }]}>
                {editing ? 'Save' : 'Edit'}
              </Text>
          }
        </SoundButton>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <Animated.View style={[styles.hero, { opacity: headerAnim }]}>
          <View style={styles.ringOuter} />
          <View style={styles.ringInner} />
          <SoundButton style={styles.avatarWrap} onPress={handleAvatarPress} activeOpacity={0.85}>
            <View style={styles.avatar}>
              {avatarUploading ? (
                <ActivityIndicator color={C.gold} size="large" />
              ) : avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
              <View style={styles.cameraOverlay}>
                <Text style={{ fontSize: 18 }}>📷</Text>
              </View>
            </View>
            <View style={styles.avatarBadge}>
              <Text style={{ fontSize: 10 }}>✓</Text>
            </View>
          </SoundButton>
          <Text style={styles.heroName}>{profile?.name}</Text>
          <Text style={styles.heroEmail}>{profile?.email}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{vehicles.length}</Text>
              <Text style={styles.statLabel}>Vehicles</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{profile?.phone ? '✓' : '—'}</Text>
              <Text style={styles.statLabel}>Phone</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{uploadedDocs}/4</Text>
              <Text style={styles.statLabel}>Docs</Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ paddingHorizontal: 16 }}>

          {/* Personal Info */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}><Text style={{ fontSize: 16 }}>👤</Text></View>
              <Text style={styles.cardTitle}>Personal Info</Text>
              {editing && (
                <View style={styles.editingBadge}>
                  <Text style={styles.editingBadgeText}>Editing</Text>
                </View>
              )}
            </View>
            {[
              { label: 'Full Name', key: 'name',    icon: '✦', keyboard: 'default'       },
              { label: 'Email',     key: 'email',   icon: '✉', keyboard: 'email-address' },
              { label: 'Phone',     key: 'phone',   icon: '📞', keyboard: 'phone-pad'     },
              { label: 'Address',   key: 'address', icon: '📍', keyboard: 'default'       },
            ].map((f, idx) => (
              <View key={f.key} style={[styles.fieldRow, idx === 3 && { borderBottomWidth: 0, marginBottom: 0 }]}>
                <View style={styles.fieldIconWrap}><Text style={{ fontSize: 13 }}>{f.icon}</Text></View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  {editing ? (
                    <TextInput
                      style={styles.fieldInput}
                      value={form[f.key] ?? ''}
                      onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                      keyboardType={f.keyboard}
                      placeholderTextColor={C.gray}
                      selectionColor={C.gold}
                      placeholder={`Enter ${f.label.toLowerCase()}…`}
                    />
                  ) : (
                    <Text style={profile?.[f.key] ? styles.fieldValue : styles.fieldEmpty}>
                      {profile?.[f.key] || 'Not set'}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Documents */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}><Text style={{ fontSize: 16 }}>📄</Text></View>
              <Text style={styles.cardTitle}>Documents</Text>
              {uploadedDocs > 0 && (
                <View style={styles.docsBadge}>
                  <Text style={styles.docsBadgeText}>{uploadedDocs}/4 uploaded</Text>
                </View>
              )}
            </View>
            <View style={styles.docsProgress}>
              <View style={[styles.docsProgressFill, { width: `${(uploadedDocs / 4) * 100}%` }]} />
            </View>
            <Text style={styles.docsHint}>Tap a document card to upload a photo or scan</Text>
            <View style={styles.docsGrid}>
              {DOC_TYPES.map(doc => (
                <DocumentCard
                  key={doc.key}
                  doc={doc}
                  uri={docUris[doc.key]}
                  uploading={docUploading[doc.key]}
                  onPress={() => handleDocUpload(doc.key, doc.apiKey)}
                />
              ))}
            </View>
          </View>

          {/* ✅ FIX: Vehicle section - handleOpenVehicleFleet use කරනවා */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}><Text style={{ fontSize: 16 }}>🚗</Text></View>
              <Text style={styles.cardTitle}>Vehicle</Text>
            </View>
            <View style={styles.linkCard}>
              <Text style={styles.linkCardText}>Go to the fleet screen to view vehicle details.</Text>
              <SoundButton
                style={styles.linkBtn}
                onPress={handleOpenVehicleFleet}
                activeOpacity={0.8}
              >
                <Text style={styles.linkBtnText}>Open Vehicle Fleet</Text>
              </SoundButton>
            </View>
          </View>

          {/* Logout */}
          <SoundButton style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Sign Out</Text>
          </SoundButton>

        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.navy,
             paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.navy },
  scroll: { flex: 1, backgroundColor: C.navyMid },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: C.navy, paddingHorizontal: 16, paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:     { width: 64 },
  backText:    { color: C.gold, fontWeight: '700', fontSize: 15 },
  headerTitle: { color: C.white, fontSize: 17, fontWeight: '800' },
  editBtn:     { backgroundColor: C.goldDim, borderRadius: 12, paddingHorizontal: 18,
                  paddingVertical: 8, borderWidth: 1, borderColor: C.goldBorder },
  saveBtnStyle:{ backgroundColor: C.gold },
  editBtnText: { color: C.gold, fontWeight: '700', fontSize: 14 },
  hero:         { backgroundColor: C.navy, alignItems: 'center', paddingTop: 36, paddingBottom: 28,
                   overflow: 'hidden', position: 'relative' },
  ringOuter:    { position: 'absolute', width: 280, height: 280, borderRadius: 140,
                   borderWidth: 1, borderColor: 'rgba(201,168,76,0.06)', top: -60 },
  ringInner:    { position: 'absolute', width: 180, height: 180, borderRadius: 90,
                   borderWidth: 1, borderColor: 'rgba(201,168,76,0.10)', top: -20 },
  avatarWrap:   { position: 'relative', marginBottom: 14 },
  avatar:       { width: 90, height: 90, borderRadius: 45, backgroundColor: C.navyCard,
                   justifyContent: 'center', alignItems: 'center',
                   borderWidth: 2.5, borderColor: C.gold,
                   shadowColor: C.gold, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
                   overflow: 'hidden' },
  avatarImg:    { width: 90, height: 90, borderRadius: 45 },
  avatarText:   { fontSize: 34, fontWeight: '900', color: C.gold },
  cameraOverlay:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
                   backgroundColor: 'rgba(0,0,0,0.45)',
                   justifyContent: 'center', alignItems: 'center' },
  avatarBadge:  { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24,
                   borderRadius: 12, backgroundColor: C.success,
                   justifyContent: 'center', alignItems: 'center',
                   borderWidth: 2, borderColor: C.navy },
  heroName:     { fontSize: 24, fontWeight: '900', color: C.white, marginBottom: 4 },
  heroEmail:    { fontSize: 14, color: C.grayLight, marginBottom: 22 },
  statsRow:     { flexDirection: 'row', backgroundColor: C.navyCard, borderRadius: 18,
                   paddingVertical: 14, paddingHorizontal: 24,
                   borderWidth: 1, borderColor: C.border, width: SW - 48 },
  statItem:     { flex: 1, alignItems: 'center' },
  statNum:      { fontSize: 18, fontWeight: '900', color: C.gold, marginBottom: 2 },
  statLabel:    { fontSize: 11, color: C.gray, fontWeight: '600', letterSpacing: 0.5 },
  statDivider:  { width: 1, backgroundColor: C.border, marginHorizontal: 8 },
  card:             { backgroundColor: C.navyCard, borderRadius: 20, padding: 18,
                       marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardHeader:       { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardIconWrap:     { width: 36, height: 36, borderRadius: 12, backgroundColor: C.goldDim,
                       justifyContent: 'center', alignItems: 'center', marginRight: 10,
                       borderWidth: 1, borderColor: C.goldBorder },
  cardTitle:        { fontSize: 15, fontWeight: '800', color: C.white, flex: 1 },
  editingBadge:     { backgroundColor: C.goldDim, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
                       borderWidth: 1, borderColor: C.goldBorder },
  editingBadgeText: { color: C.gold, fontSize: 11, fontWeight: '700' },
  docsBadge:        { backgroundColor: C.successDim, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
                       borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  docsBadgeText:    { color: C.success, fontSize: 11, fontWeight: '700' },
  docsProgress:     { height: 4, backgroundColor: C.navyLight, borderRadius: 2, marginBottom: 8, overflow: 'hidden' },
  docsProgressFill: { height: '100%', backgroundColor: C.gold, borderRadius: 2 },
  docsHint:         { fontSize: 11, color: C.gray, marginBottom: 14 },
  docsGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  fieldRow:     { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12,
                   borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', marginBottom: 2 },
  fieldIconWrap:{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.navyLight,
                   justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
  fieldContent: { flex: 1 },
  fieldLabel:   { fontSize: 10, color: C.gold, fontWeight: '700', letterSpacing: 0.8,
                   textTransform: 'uppercase', marginBottom: 4 },
  fieldValue:   { fontSize: 15, color: C.white, fontWeight: '500' },
  fieldEmpty:   { fontSize: 15, color: C.gray, fontStyle: 'italic' },
  fieldInput:   { fontSize: 15, color: C.white, backgroundColor: C.navyLight,
                   borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
                   borderWidth: 1, borderColor: C.goldBorder },
  addBtn:     { backgroundColor: C.goldDim, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6,
                 borderWidth: 1, borderColor: C.goldBorder },
  addBtnText: { color: C.gold, fontWeight: '800', fontSize: 13 },
  linkCard:      { backgroundColor: C.navyLight, borderRadius: 18, padding: 18,
                    borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  linkCardText:  { color: C.grayLight, fontSize: 13, marginBottom: 12, lineHeight: 20 },
  linkBtn:       { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 12,
                    paddingHorizontal: 18, alignSelf: 'flex-start' },
  linkBtnText:   { color: C.navy, fontWeight: '800', fontSize: 14 },
  emptyVehicle:  { alignItems: 'center', paddingVertical: 24 },
  emptyVehicleTitle: { fontSize: 16, fontWeight: '800', color: C.offWhite, marginBottom: 6 },
  emptyVehicleSub:   { fontSize: 13, color: C.gray, marginBottom: 16, textAlign: 'center' },
  emptyAddBtn:       { backgroundColor: C.gold, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  emptyAddBtnText:   { color: C.navy, fontWeight: '900', fontSize: 14 },
  logoutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                 backgroundColor: C.errorDim, borderRadius: 16, paddingVertical: 16,
                 borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', marginBottom: 10 },
  logoutIcon: { fontSize: 18, marginRight: 8 },
  logoutText: { color: C.error, fontWeight: '800', fontSize: 15 },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalBox:      { backgroundColor: C.navyCard, borderTopLeftRadius: 28, borderTopRightRadius: 28,
                    maxHeight: '92%', padding: 22, borderTopWidth: 1, borderColor: C.goldBorder },
  modalHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: C.gray,
                    alignSelf: 'center', marginBottom: 18 },
  modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  modalTitle:    { fontSize: 20, fontWeight: '900', color: C.white },
  modalLabel:    { fontSize: 11, fontWeight: '700', color: C.gold, letterSpacing: 0.8,
                    textTransform: 'uppercase', marginBottom: 8 },
  modalInput:    { backgroundColor: C.navyLight, borderRadius: 14, paddingHorizontal: 16,
                    paddingVertical: 13, fontSize: 15, color: C.white,
                    borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  dropTrigger:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: C.navyLight, borderRadius: 14, paddingHorizontal: 16,
                    paddingVertical: 13, borderWidth: 1, borderColor: C.border },
  dropDisabled:  { opacity: 0.4 },
  dropVal:       { fontSize: 15, color: C.white, fontWeight: '500' },
  dropPlaceholder:{ fontSize: 15, color: C.gray },
  dropArrow:     { fontSize: 16, color: C.gold },
  modalBtns:     { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn:     { flex: 1, borderRadius: 14, paddingVertical: 15, alignItems: 'center',
                    borderWidth: 1.5, borderColor: C.border },
  cancelBtnText: { color: C.grayLight, fontWeight: '700' },
  confirmBtn:    { flex: 1, backgroundColor: C.gold, borderRadius: 14, paddingVertical: 15, alignItems: 'center',
                    shadowColor: C.gold, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  confirmBtnText:{ color: C.navy, fontWeight: '900', fontSize: 15 },
});