import SoundButton from "../../utils/SoundButton";
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Modal, ScrollView, Alert, StatusBar,
  SafeAreaView, ActivityIndicator, Image, Animated,
  Platform, Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import api from '../../utils/api';

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
  errorBorder:'rgba(239,68,68,0.3)',
  success:    '#22C55E',
  successDim: 'rgba(34,197,94,0.12)',
  successBorder:'rgba(34,197,94,0.3)',
  warning:    '#F59E0B',
  warningDim: 'rgba(245,158,11,0.12)',
  warningBorder:'rgba(245,158,11,0.3)',
  border:     'rgba(201,168,76,0.15)',
  info:       '#3B82F6',
  infoDim:    'rgba(59,130,246,0.12)',
  infoBorder: 'rgba(59,130,246,0.3)',
};

const VEHICLE_TYPES = ['Car', 'Van', 'Bus', 'Truck', 'Motorcycle', 'SUV'];
const MAKES = ['Toyota','Honda','Nissan','Suzuki','Mitsubishi','Mazda','Hyundai','Kia','BMW','Mercedes','Audi','Ford'];
const MODELS_BY_MAKE = {
  Toyota:    ['Corolla','Camry','Prius','Aqua','Vitz','Axio','Fielder','Land Cruiser','Hilux','Rush'],
  Honda:     ['Civic','Fit','Grace','Vezel','HR-V','CR-V','Accord','City','Jazz'],
  Nissan:    ['Sunny','Tiida','X-Trail','Leaf','Note','Dayz','Navara'],
  Suzuki:    ['Alto','Swift','Wagon R','Jimny','Vitara','Baleno','Ciaz'],
  Mitsubishi:['Lancer','Outlander','Montero','L200','Attrage','Mirage'],
  Mazda:     ['Demio','Axela','CX-5','CX-3','Atenza'],
  Hyundai:   ['i10','i20','Accent','Elantra','Tucson','Santa Fe'],
  Kia:       ['Picanto','Rio','Sportage','Sorento','Cerato'],
  BMW:       ['320i','520i','X3','X5','116i'],
  Mercedes:  ['C200','E200','GLA','CLA','A180'],
  Audi:      ['A3','A4','A6','Q3','Q5'],
  Ford:      ['Fiesta','Focus','EcoSport','Ranger','Everest'],
};
const YEARS       = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));
const COLORS_LIST = ['White','Black','Silver','Blue','Red','Grey','Green','Brown','Orange','Yellow'];
const INSURANCE_COMPANIES = ['AIA','Allianz','Ceylinco','LOLC','Peoples','Sanasa','Sri Lanka Insurance','Union Assurance'];
const FUEL_TYPES = ['Petrol','Diesel','Electric','Hybrid'];

const COLOR_MAP = {
  White:'#F5F5F5', Black:'#1A1A1A', Silver:'#C0C0C0', Blue:'#3B82F6',
  Red:'#EF4444',   Grey:'#6B7280',  Green:'#22C55E',  Brown:'#92400E',
  Orange:'#F97316',Yellow:'#EAB308',
};

const VEHICLE_TYPE_ICONS = {
  Car:'🚗', Van:'🚐', Bus:'🚌', Truck:'🚚', Motorcycle:'🏍️', SUV:'🚙',
};

const EMPTY_FORM = {
  make:'', model:'', year:'', licensePlate:'',
  color:'', vehicleType:'Car', fuelType:'Petrol', mileage:'',
  insuranceCompany:'', insurancePolicyNo:'', insuranceExpiry:'',
  revenueLicenseExpiry:'', revenueLicenseNo:'',
  lastServiceDate:'', nextServiceDate:'', nextServiceMileage:'',
  notes:'',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function expiryStatus(days) {
  if (days === null) return null;
  if (days < 0)   return { label: 'Expired',      color: C.error,   bg: C.errorDim,   border: C.errorBorder };
  if (days <= 30) return { label: `${days}d left`, color: C.error,   bg: C.errorDim,   border: C.errorBorder };
  if (days <= 90) return { label: `${days}d left`, color: C.warning, bg: C.warningDim, border: C.warningBorder };
  return           { label: `${days}d left`, color: C.success, bg: C.successDim, border: C.successBorder };
}

function formatDate(dateStr) {
  if (!dateStr) return 'Not set';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

// ── Safe date string ──────────────────────────────────────────────────────────
function toDateStr(val) {
  if (!val) return '';
  try {
    const s = typeof val === 'string' ? val : new Date(val).toISOString();
    return s.split('T')[0];
  } catch { return ''; }
}

// ── Image picker ──────────────────────────────────────────────────────────────
async function pickVehicleImage() {
  return new Promise(resolve => {
    Alert.alert('Add Photo', 'Choose source', [
      {
        text: 'Camera', onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access required.'); resolve(null); return; }
          const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.85 });
          resolve(r.canceled ? null : r.assets[0]);
        },
      },
      {
        text: 'Gallery', onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed', 'Library access required.'); resolve(null); return; }
          const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.85 });
          resolve(r.canceled ? null : r.assets[0]);
        },
      },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

// ── DropdownModal ─────────────────────────────────────────────────────────────
function DropdownModal({ visible, title, items, selected, onSelect, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={dd.overlay}>
        <View style={dd.box}>
          <View style={dd.header}>
            <Text style={dd.title}>{title}</Text>
            <SoundButton onPress={onClose} style={dd.closeBtn}>
              <Text style={dd.closeText}>✕</Text>
            </SoundButton>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map(item => (
              <SoundButton
                key={item}
                style={[dd.item, selected === item && dd.itemActive]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={[dd.itemText, selected === item && dd.itemTextActive]}>{item}</Text>
                {selected === item && <Text style={dd.check}>✓</Text>}
              </SoundButton>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const dd = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  box:           { backgroundColor: C.navyCard, borderTopLeftRadius: 28, borderTopRightRadius: 28,
                    maxHeight: '65%', borderTopWidth: 1, borderColor: C.goldBorder },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    padding: 22, borderBottomWidth: 1, borderBottomColor: C.border },
  title:         { fontSize: 17, fontWeight: '800', color: C.white },
  closeBtn:      { width: 34, height: 34, borderRadius: 12, backgroundColor: C.navyLight,
                    justifyContent: 'center', alignItems: 'center' },
  closeText:     { color: C.grayLight, fontSize: 14, fontWeight: '700' },
  item:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    paddingHorizontal: 22, paddingVertical: 15,
                    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  itemActive:    { backgroundColor: C.goldDim },
  itemText:      { fontSize: 15, color: C.grayLight, fontWeight: '500' },
  itemTextActive:{ color: C.gold, fontWeight: '700' },
  check:         { color: C.gold, fontWeight: '900', fontSize: 16 },
});

// ── DropTrigger ───────────────────────────────────────────────────────────────
function DropTrigger({ label, value, placeholder, onPress, disabled }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.modalLabel}>{label}</Text>
      <SoundButton
        style={[s.dropTrigger, disabled && s.dropDisabled]}
        onPress={onPress} disabled={disabled} activeOpacity={0.75}
      >
        <Text style={value ? s.dropVal : s.dropPh}>{value || placeholder}</Text>
        <Text style={s.dropArr}>▾</Text>
      </SoundButton>
    </View>
  );
}

// ── DateInput ─────────────────────────────────────────────────────────────────
function DateInput({ label, value, onChange, placeholder = 'Select date' }) {
  const [show, setShow] = useState(false);
  const days   = daysUntil(value);
  const status = expiryStatus(days);

  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) onChange(selectedDate.toISOString().split('T')[0]);
  };

  const dateValue = value ? new Date(value) : new Date();

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.modalLabel}>{label}</Text>
      <TouchableOpacity
        style={[s.dropTrigger, { justifyContent: 'space-between' }]}
        onPress={() => setShow(true)}
        activeOpacity={0.75}
      >
        <Text style={value ? s.dropVal : s.dropPh}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {status && (
            <View style={{ backgroundColor: status.bg, borderColor: status.border,
              borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: status.color, fontSize: 10, fontWeight: '800' }}>{status.label}</Text>
            </View>
          )}
          <Text style={{ fontSize: 16 }}>📅</Text>
        </View>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeDate}
          minimumDate={new Date(2000, 0, 1)}
          maximumDate={new Date(2040, 11, 31)}
          themeVariant="dark"
        />
      )}
      {show && Platform.OS === 'ios' && (
        <TouchableOpacity
          style={{ backgroundColor: C.gold, borderRadius: 10, paddingVertical: 10,
            alignItems: 'center', marginTop: 8 }}
          onPress={() => setShow(false)}
        >
          <Text style={{ color: C.navy, fontWeight: '800' }}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
function SectionHeader({ icon, title }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionIcon}>{icon}</Text>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionLine} />
    </View>
  );
}

// ── ExpiryBadge ───────────────────────────────────────────────────────────────
function ExpiryBadge({ label, date }) {
  const days   = daysUntil(date);
  const status = expiryStatus(days);
  if (!date) return null;
  return (
    <View style={[s.cardExpiryBadge, { backgroundColor: status?.bg, borderColor: status?.border }]}>
      <Text style={[s.cardExpiryLabel, { color: status?.color }]}>{label}</Text>
      <Text style={[s.cardExpiryDate,  { color: status?.color }]}>{formatDate(date)}</Text>
      {status && <Text style={[s.cardExpiryDays, { color: status.color }]}>{status.label}</Text>}
    </View>
  );
}

// ── VehicleDetailModal ────────────────────────────────────────────────────────
function VehicleDetailModal({ visible, vehicle, onClose, onEdit }) {
  if (!vehicle) return null;
  const icon         = VEHICLE_TYPE_ICONS[vehicle.vehicleType] ?? '🚗';
  const totalRevenue = (vehicle.serviceHistory ?? []).reduce((s, h) => s + (h.cost ?? 0), 0);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.modalOverlay}>
        <View style={[s.modalBox, { maxHeight: '92%' }]}>
          <View style={s.modalHandle} />
          <View style={s.modalTitleRow}>
            <Text style={s.modalTitle}>{icon} {vehicle.make} {vehicle.model}</Text>
            <SoundButton onPress={onClose} style={dd.closeBtn}>
              <Text style={dd.closeText}>✕</Text>
            </SoundButton>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Basic */}
            <View style={s.detailSection}>
              {[
                ['Plate',   vehicle.licensePlate],
                ['Year',    vehicle.year ?? 'N/A'],
                ['Color',   vehicle.color ?? 'N/A'],
                ['Fuel',    vehicle.fuelType ?? 'N/A'],
                ['Mileage', vehicle.mileage ? `${vehicle.mileage} km` : 'N/A'],
              ].map(([label, val]) => (
                <View key={label} style={s.detailRow}>
                  <Text style={s.detailLabel}>{label}</Text>
                  <Text style={s.detailValue}>{val}</Text>
                </View>
              ))}
            </View>

            {/* Insurance */}
            <SectionHeader icon="🛡️" title="Insurance" />
            <View style={s.detailSection}>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Company</Text>
                <Text style={s.detailValue}>{vehicle.insuranceCompany || 'Not set'}</Text>
              </View>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Policy No</Text>
                <Text style={s.detailValue}>{vehicle.insurancePolicyNo || 'Not set'}</Text>
              </View>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Expiry</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.detailValue}>{formatDate(vehicle.insuranceExpiry)}</Text>
                  {vehicle.insuranceExpiry && (() => {
                    const st = expiryStatus(daysUntil(vehicle.insuranceExpiry));
                    return st ? <Text style={{ color: st.color, fontSize: 11, fontWeight: '700' }}>{st.label}</Text> : null;
                  })()}
                </View>
              </View>
            </View>

            {/* Revenue License */}
            <SectionHeader icon="📋" title="Revenue License" />
            <View style={s.detailSection}>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>License No</Text>
                <Text style={s.detailValue}>{vehicle.revenueLicenseNo || 'Not set'}</Text>
              </View>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Expiry</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.detailValue}>{formatDate(vehicle.revenueLicenseExpiry)}</Text>
                  {vehicle.revenueLicenseExpiry && (() => {
                    const st = expiryStatus(daysUntil(vehicle.revenueLicenseExpiry));
                    return st ? <Text style={{ color: st.color, fontSize: 11, fontWeight: '700' }}>{st.label}</Text> : null;
                  })()}
                </View>
              </View>
            </View>

            {/* Maintenance */}
            <SectionHeader icon="🔧" title="Maintenance" />
            <View style={s.detailSection}>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Last Service</Text>
                <Text style={s.detailValue}>{formatDate(vehicle.lastServiceDate)}</Text>
              </View>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Next Service</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.detailValue}>{formatDate(vehicle.nextServiceDate)}</Text>
                  {vehicle.nextServiceDate && (() => {
                    const st = expiryStatus(daysUntil(vehicle.nextServiceDate));
                    return st ? <Text style={{ color: st.color, fontSize: 11, fontWeight: '700' }}>{st.label}</Text> : null;
                  })()}
                </View>
              </View>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Next at km</Text>
                <Text style={s.detailValue}>{vehicle.nextServiceMileage ? `${vehicle.nextServiceMileage} km` : 'Not set'}</Text>
              </View>
            </View>

            {/* Revenue */}
            <SectionHeader icon="💰" title="Revenue" />
            <View style={[s.detailSection, { alignItems: 'center', paddingVertical: 18 }]}>
              <Text style={{ color: C.gold, fontSize: 28, fontWeight: '900' }}>
                Rs. {totalRevenue.toLocaleString()}
              </Text>
              <Text style={{ color: C.gray, fontSize: 12, marginTop: 4 }}>
                Total from {(vehicle.serviceHistory ?? []).length} service(s)
              </Text>
            </View>
            {(vehicle.serviceHistory ?? []).length > 0 && (
              <View style={s.detailSection}>
                {vehicle.serviceHistory.map((h, i) => (
                  <View key={i} style={[s.detailRow, { alignItems: 'flex-start' }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.detailValue}>{h.description ?? 'Service'}</Text>
                      <Text style={s.detailLabel}>{formatDate(h.date)}</Text>
                    </View>
                    <Text style={{ color: C.success, fontWeight: '800' }}>
                      Rs. {(h.cost ?? 0).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {vehicle.notes ? (
              <>
                <SectionHeader icon="📝" title="Notes" />
                <View style={s.detailSection}>
                  <Text style={{ color: C.offWhite, fontSize: 14, lineHeight: 22 }}>{vehicle.notes}</Text>
                </View>
              </>
            ) : null}

            <SoundButton
              style={[s.confirmBtn, { marginTop: 16, marginBottom: 8 }]}
              onPress={() => { onClose(); onEdit(); }}
            >
              <Text style={s.confirmBtnText}>✏️  Edit Vehicle</Text>
            </SoundButton>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── VehicleCard ───────────────────────────────────────────────────────────────
function VehicleCard({ item, onEdit, onDelete, onView, index }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, delay: index * 70, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  const icon     = VEHICLE_TYPE_ICONS[item.vehicleType] ?? '🚗';
  const dotColor = COLOR_MAP[item.color] ?? C.gray;
  const hasImg   = !!item.imageUrl;

  const insDays  = daysUntil(item.insuranceExpiry);
  const revDays  = daysUntil(item.revenueLicenseExpiry);
  const svcDays  = daysUntil(item.nextServiceDate);
  const hasAlert = (insDays !== null && insDays <= 90) ||
                   (revDays !== null && revDays <= 90) ||
                   (svcDays !== null && svcDays <= 30);

  return (
    <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <SoundButton onPress={onView} activeOpacity={0.85}>
        {hasImg ? (
          <Image source={{ uri: item.imageUrl }} style={s.cardImg} />
        ) : (
          <View style={s.cardImgPlaceholder}>
            <Text style={{ fontSize: 42 }}>{icon}</Text>
            <Text style={s.cardImgPlaceholderText}>No photo</Text>
          </View>
        )}
        <View style={s.typeBadge}>
          <Text style={s.typeBadgeText}>{icon} {item.vehicleType}</Text>
        </View>
        {hasAlert && (
          <View style={s.alertDot}>
            <Text style={{ fontSize: 8 }}>⚠️</Text>
          </View>
        )}
        <View style={s.cardBody}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardTitle}>{item.make} {item.model}</Text>
            {item.color && (
              <View style={[s.colorDot, {
                backgroundColor: dotColor,
                borderColor: item.color === 'White' ? C.gray : dotColor,
              }]} />
            )}
          </View>
          <Text style={s.cardPlate}>{item.licensePlate}</Text>
          <View style={s.tagsRow}>
            {item.year     && <View style={s.tag}><Text style={s.tagText}>📅 {item.year}</Text></View>}
            {item.fuelType && <View style={s.tag}><Text style={s.tagText}>⛽ {item.fuelType}</Text></View>}
            {item.mileage  && <View style={s.tag}><Text style={s.tagText}>🛣️ {item.mileage}km</Text></View>}
          </View>
          <View style={s.expiryRow}>
            <ExpiryBadge label="🛡️ INS" date={item.insuranceExpiry} />
            <ExpiryBadge label="📋 REV" date={item.revenueLicenseExpiry} />
            <ExpiryBadge label="🔧 SVC" date={item.nextServiceDate} />
          </View>
          <View style={s.cardActions}>
            <SoundButton style={s.viewBtn}   onPress={onView}   activeOpacity={0.8}><Text style={s.viewBtnText}>View</Text></SoundButton>
            <SoundButton style={s.editBtn}   onPress={onEdit}   activeOpacity={0.8}><Text style={s.editBtnText}>Edit</Text></SoundButton>
            <SoundButton style={s.deleteBtn} onPress={onDelete} activeOpacity={0.8}><Text style={s.deleteBtnText}>Delete</Text></SoundButton>
          </View>
        </View>
      </SoundButton>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function VehicleScreen({ navigation }) {
  const { user } = useAuth();
  const [vehicles,      setVehicles]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [search,        setSearch]        = useState('');
  const [showModal,     setShowModal]     = useState(false);
  const [showDetail,    setShowDetail]    = useState(false);
  const [detailVehicle, setDetailVehicle] = useState(null);
  const [editId,        setEditId]        = useState(null);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [drop,          setDrop]          = useState(null);
  const [imgUri,        setImgUri]        = useState(null);
  const [imgUploading,  setImgUploading]  = useState(false);
  const [formTab,       setFormTab]       = useState('basic');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer/vehicles');
      setVehicles(res.data);
    } catch {
      Alert.alert('Error', 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase();
    return (
      (v.make ?? '').toLowerCase().includes(q) ||
      (v.model ?? '').toLowerCase().includes(q) ||
      (v.licensePlate ?? '').toLowerCase().includes(q)
    );
  });

  const alertCount = vehicles.filter(v =>
    (daysUntil(v.insuranceExpiry)      !== null && daysUntil(v.insuranceExpiry)      <= 90) ||
    (daysUntil(v.revenueLicenseExpiry) !== null && daysUntil(v.revenueLicenseExpiry) <= 90) ||
    (daysUntil(v.nextServiceDate)      !== null && daysUntil(v.nextServiceDate)      <= 30)
  ).length;

  // ── Open Add ───────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setImgUri(null);
    setFormTab('basic');
    setShowModal(true);
  };

  // ── Open Edit — FIX: properly populate ALL fields ─────────────────────────
  const openEdit = (v) => {
    setForm({
      make:                 v.make                 ?? '',
      model:                v.model                ?? '',
      year:                 v.year                 ? String(v.year) : '',
      licensePlate:         v.licensePlate          ?? '',
      color:                v.color                ?? '',           // ✅ fix: was missing
      vehicleType:          v.vehicleType           ?? 'Car',
      fuelType:             v.fuelType             ?? 'Petrol',
      mileage:              v.mileage              ? String(v.mileage) : '',
      // Insurance ✅
      insuranceCompany:     v.insuranceCompany     ?? '',
      insurancePolicyNo:    v.insurancePolicyNo    ?? '',
      insuranceExpiry:      toDateStr(v.insuranceExpiry),          // ✅ fix: safe parse
      // Revenue License ✅
      revenueLicenseNo:     v.revenueLicenseNo     ?? '',
      revenueLicenseExpiry: toDateStr(v.revenueLicenseExpiry),     // ✅ fix: safe parse
      // Maintenance ✅
      lastServiceDate:      toDateStr(v.lastServiceDate),          // ✅ fix: safe parse
      nextServiceDate:      toDateStr(v.nextServiceDate),          // ✅ fix: safe parse
      nextServiceMileage:   v.nextServiceMileage   ? String(v.nextServiceMileage) : '',
      notes:                v.notes                ?? '',
    });
    setEditId(v._id ?? v.id);
    setImgUri(v.imageUrl ?? null);
    setFormTab('basic');
    setShowModal(true);
  };

  // ── Image ──────────────────────────────────────────────────────────────────
  const handlePickImage = async () => {
    const asset = await pickVehicleImage();
    if (asset) setImgUri(asset.uri);
  };

  const removeImage = () => {
    Alert.alert('Remove Photo', 'Remove this vehicle photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setImgUri(null) },
    ]);
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    if (!form.make.trim())         { Alert.alert('Required', 'Please select vehicle make');  setFormTab('basic');        return false; }
    if (!form.model.trim())        { Alert.alert('Required', 'Please select vehicle model'); setFormTab('basic');        return false; }
    if (!form.licensePlate.trim()) { Alert.alert('Required', 'License plate is required');   setFormTab('basic');        return false; }
    const plateRegex = /^[A-Z]{2,3}[\s-]?[A-Z]{1,3}[\s-]?\d{4}$|^[A-Z0-9\s-]{4,12}$/;
    if (!plateRegex.test(form.licensePlate.trim())) {
      Alert.alert('Invalid Plate', 'Enter a valid license plate (e.g. WP ABC 1234)'); setFormTab('basic'); return false;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (form.insuranceExpiry      && !dateRegex.test(form.insuranceExpiry))      { Alert.alert('Invalid Date', 'Insurance expiry must be YYYY-MM-DD');      setFormTab('documents');   return false; }
    if (form.revenueLicenseExpiry && !dateRegex.test(form.revenueLicenseExpiry)) { Alert.alert('Invalid Date', 'Revenue license expiry must be YYYY-MM-DD'); setFormTab('documents');   return false; }
    if (form.nextServiceDate      && !dateRegex.test(form.nextServiceDate))      { Alert.alert('Invalid Date', 'Next service date must be YYYY-MM-DD');      setFormTab('maintenance'); return false; }
    if (form.mileage              && isNaN(Number(form.mileage)))                { Alert.alert('Invalid',      'Mileage must be a number');                  setFormTab('basic');        return false; }
    if (form.nextServiceMileage   && isNaN(Number(form.nextServiceMileage)))     { Alert.alert('Invalid',      'Next service mileage must be a number');     setFormTab('maintenance'); return false; }
    return true;
  };

  // ── Save — FIX: send ALL fields in payload ─────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);

      // ✅ Full payload — every field explicitly mapped
      const payload = {
        make:                 form.make.trim(),
        model:                form.model.trim(),
        year:                 form.year ? parseInt(form.year) : null,
        licensePlate:         form.licensePlate.trim().toUpperCase(),
        color:                form.color,
        vehicleType:          form.vehicleType,
        fuelType:             form.fuelType,
        mileage:              form.mileage ? parseInt(form.mileage) : null,
        notes:                form.notes.trim(),
        // Insurance
        insuranceCompany:     form.insuranceCompany.trim(),
        insurancePolicyNo:    form.insurancePolicyNo.trim(),
        insuranceExpiry:      form.insuranceExpiry      || null,
        // Revenue License
        revenueLicenseNo:     form.revenueLicenseNo.trim(),
        revenueLicenseExpiry: form.revenueLicenseExpiry || null,
        // Maintenance
        lastServiceDate:      form.lastServiceDate      || null,
        nextServiceDate:      form.nextServiceDate      || null,
        nextServiceMileage:   form.nextServiceMileage ? parseInt(form.nextServiceMileage) : null,
      };

      let savedVehicle;
      if (editId) {
        const res = await api.put(`/customer/vehicles/${editId}`, payload);
        savedVehicle = res.data;
        // ✅ FIX: update state with full response so UI reflects saved data
        setVehicles(prev => prev.map(v => (v._id ?? v.id) === editId ? savedVehicle : v));
      } else {
        const res = await api.post('/customer/vehicles', payload);
        savedVehicle = res.data;
        setVehicles(prev => [...prev, savedVehicle]);
      }

      const vehicleId = savedVehicle._id ?? savedVehicle.id;

      // Image upload
      if (imgUri && imgUri !== savedVehicle.imageUrl) {
        setImgUploading(true);
        try {
          const fd = new FormData();
          fd.append('image', { uri: imgUri, name: 'vehicle.jpg', type: 'image/jpeg' });
          const imgRes = await api.post(`/customer/vehicles/${vehicleId}/image`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          setVehicles(prev => prev.map(v =>
            (v._id ?? v.id) === vehicleId ? { ...v, imageUrl: imgRes.data.imageUrl } : v
          ));
        } catch {
          Alert.alert('Photo Error', 'Vehicle saved but photo upload failed');
        } finally {
          setImgUploading(false);
        }
      } else if (!imgUri && savedVehicle.imageUrl) {
        try { await api.delete(`/customer/vehicles/${vehicleId}/image`); } catch {}
        setVehicles(prev => prev.map(v =>
          (v._id ?? v.id) === vehicleId ? { ...v, imageUrl: null } : v
        ));
      }

      // ✅ FIX: if detail modal was open, update detailVehicle too
      if (detailVehicle && (detailVehicle._id ?? detailVehicle.id) === vehicleId) {
        setDetailVehicle({ ...savedVehicle, imageUrl: savedVehicle.imageUrl });
      }

      setShowModal(false);
      Alert.alert('✅ Saved', editId ? 'Vehicle updated successfully' : 'Vehicle added successfully');
    } catch (err) {
      Alert.alert('Save Failed', err?.response?.data?.message ?? 'Could not save vehicle');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = (v) => {
    Alert.alert('Delete Vehicle', `Remove "${v.make} ${v.model}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/customer/vehicles/${v._id ?? v.id}`);
            setVehicles(prev => prev.filter(x => (x._id ?? x.id) !== (v._id ?? v.id)));
          } catch {
            Alert.alert('Error', 'Could not delete vehicle');
          }
        },
      },
    ]);
  };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const stats = {
    total:        vehicles.length,
    withPhoto:    vehicles.filter(v => v.imageUrl).length,
    alerts:       alertCount,
    totalRevenue: vehicles.reduce((s, v) =>
      s + (v.serviceHistory ?? []).reduce((ss, h) => ss + (h.cost ?? 0), 0), 0),
  };

  const FORM_TABS = [
    { key: 'basic',       label: '🚗 Basic' },
    { key: 'documents',   label: '📋 Documents' },
    { key: 'maintenance', label: '🔧 Service' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      <View style={s.header}>
        <SoundButton style={s.backBtn} onPress={() => navigation?.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </SoundButton>
        <Text style={s.headerTitle}>Vehicle Fleet</Text>
        <SoundButton style={s.addBtn} onPress={openAdd} activeOpacity={0.8}>
          <Text style={s.addBtnText}>+ Add</Text>
        </SoundButton>
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.gold} />
          <Text style={s.loadingText}>Loading vehicles…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id ?? item.id}
          contentContainerStyle={s.listContent}
          onRefresh={fetchAll}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              <View style={s.statsRow}>
                <View style={s.statCard}>
                  <Text style={s.statNum}>{stats.total}</Text>
                  <Text style={s.statLabel}>Total</Text>
                </View>
                <View style={s.statCard}>
                  <Text style={[s.statNum, { color: C.success }]}>{stats.withPhoto}</Text>
                  <Text style={s.statLabel}>With Photo</Text>
                </View>
                <View style={[s.statCard, stats.alerts > 0 && { borderColor: C.errorBorder }]}>
                  <Text style={[s.statNum, { color: stats.alerts > 0 ? C.error : C.gold }]}>{stats.alerts}</Text>
                  <Text style={s.statLabel}>⚠️ Alerts</Text>
                </View>
                <View style={s.statCard}>
                  <Text style={[s.statNum, { color: C.success, fontSize: 13 }]}>
                    {stats.totalRevenue > 0 ? `Rs.${(stats.totalRevenue / 1000).toFixed(0)}k` : '0'}
                  </Text>
                  <Text style={s.statLabel}>Revenue</Text>
                </View>
              </View>

              <View style={s.searchWrap}>
                <Text style={s.searchIcon}>🔍</Text>
                <TextInput
                  style={s.searchInput}
                  placeholder="Search make, model or plate…"
                  placeholderTextColor={C.gray}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              {alertCount > 0 && (
                <View style={s.alertBanner}>
                  <Text style={s.alertBannerText}>
                    ⚠️  {alertCount} vehicle{alertCount > 1 ? 's' : ''} need attention — insurance, license or service due soon
                  </Text>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={{ fontSize: 52, marginBottom: 14 }}>🚗</Text>
              <Text style={s.emptyTitle}>No vehicles found</Text>
              <Text style={s.emptyHint}>Tap + Add to register your first vehicle.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <VehicleCard
              item={item}
              index={index}
              onView={() => { setDetailVehicle(item); setShowDetail(true); }}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}

      {/* Detail Modal */}
      <VehicleDetailModal
        visible={showDetail}
        vehicle={detailVehicle}
        onClose={() => setShowDetail(false)}
        onEdit={() => detailVehicle && openEdit(detailVehicle)}
      />

      {/* Add / Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHandle} />
            <View style={s.modalTitleRow}>
              <Text style={s.modalTitle}>{editId ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
              <SoundButton onPress={() => { setShowModal(false); setImgUri(null); }} style={dd.closeBtn}>
                <Text style={dd.closeText}>✕</Text>
              </SoundButton>
            </View>

            {/* Tabs */}
            <View style={s.formTabRow}>
              {FORM_TABS.map(t => (
                <SoundButton
                  key={t.key}
                  style={[s.formTab, formTab === t.key && s.formTabActive]}
                  onPress={() => setFormTab(t.key)}
                >
                  <Text style={[s.formTabText, formTab === t.key && s.formTabTextActive]}>{t.label}</Text>
                </SoundButton>
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* ── BASIC TAB ── */}
              {formTab === 'basic' && (
                <View>
                  <Text style={s.modalLabel}>Vehicle Photo</Text>
                  <SoundButton
                    style={s.photoBox}
                    onPress={imgUri ? removeImage : handlePickImage}
                    activeOpacity={0.8}
                  >
                    {imgUri ? (
                      <>
                        <Image source={{ uri: imgUri }} style={s.photoPreview} />
                        <View style={s.photoEditBadge}>
                          <Text style={{ fontSize: 12, color: C.white }}>✎ Change / Remove</Text>
                        </View>
                      </>
                    ) : (
                      <View style={s.photoPlaceholder}>
                        <Text style={{ fontSize: 36, marginBottom: 6 }}>📷</Text>
                        <Text style={s.photoPlaceholderText}>Tap to add vehicle photo</Text>
                        <Text style={s.photoPlaceholderSub}>Camera or Gallery</Text>
                      </View>
                    )}
                  </SoundButton>
                  {imgUri && (
                    <SoundButton style={s.changePhotoBtn} onPress={handlePickImage}>
                      <Text style={s.changePhotoBtnText}>📷  Change Photo</Text>
                    </SoundButton>
                  )}

                  <DropTrigger label="Make *"  value={form.make}  placeholder="Select make…"  onPress={() => setDrop('make')} />
                  <DropTrigger label="Model *" value={form.model} placeholder={form.make ? 'Select model…' : 'Select make first'}
                    onPress={() => setDrop('model')} disabled={!form.make} />
                  <DropTrigger label="Year"    value={form.year}  placeholder="Select year…"  onPress={() => setDrop('year')} />

                  <Text style={s.modalLabel}>License Plate *</Text>
                  <TextInput
                    style={s.modalInput}
                    placeholder="e.g. WP ABC 1234"
                    placeholderTextColor={C.gray}
                    value={form.licensePlate}
                    onChangeText={t => setField('licensePlate', t.toUpperCase())}
                    autoCapitalize="characters"
                  />

                  {/* ✅ FIX: Color dropdown shows existing value */}
                  <DropTrigger label="Color" value={form.color} placeholder="Select color…" onPress={() => setDrop('color')} />
                  <DropTrigger label="Fuel Type" value={form.fuelType} placeholder="Select fuel…" onPress={() => setDrop('fuel')} />

                  <Text style={s.modalLabel}>Current Mileage (km)</Text>
                  <TextInput
                    style={s.modalInput}
                    placeholder="e.g. 45000"
                    placeholderTextColor={C.gray}
                    value={form.mileage}
                    onChangeText={t => setField('mileage', t.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                  />

                  <Text style={s.modalLabel}>Vehicle Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
                    {VEHICLE_TYPES.map(t => (
                      <SoundButton
                        key={t}
                        style={[s.typeChip, form.vehicleType === t && s.typeChipActive]}
                        onPress={() => setField('vehicleType', t)}
                      >
                        <Text style={{ fontSize: 18, marginBottom: 4 }}>{VEHICLE_TYPE_ICONS[t]}</Text>
                        <Text style={[s.typeChipText, form.vehicleType === t && s.typeChipTextActive]}>{t}</Text>
                      </SoundButton>
                    ))}
                  </ScrollView>

                  <Text style={s.modalLabel}>Notes</Text>
                  <TextInput
                    style={[s.modalInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                    placeholder="Any additional notes…"
                    placeholderTextColor={C.gray}
                    value={form.notes}
                    onChangeText={t => setField('notes', t)}
                    multiline
                  />
                </View>
              )}

              {/* ── DOCUMENTS TAB ── */}
              {formTab === 'documents' && (
                <View>
                  <SectionHeader icon="🛡️" title="Insurance Details" />

                  {/* ✅ FIX: Insurance Company dropdown shows existing value */}
                  <DropTrigger label="Insurance Company" value={form.insuranceCompany}
                    placeholder="Select company…" onPress={() => setDrop('insurance')} />

                  <Text style={s.modalLabel}>Policy Number</Text>
                  <TextInput
                    style={s.modalInput}
                    placeholder="e.g. POL-2024-12345"
                    placeholderTextColor={C.gray}
                    value={form.insurancePolicyNo}
                    onChangeText={t => setField('insurancePolicyNo', t)}
                    autoCapitalize="characters"
                  />

                  {/* ✅ FIX: DateInput shows existing date */}
                  <DateInput
                    label="Insurance Expiry Date"
                    value={form.insuranceExpiry}
                    onChange={t => setField('insuranceExpiry', t)}
                  />

                  <SectionHeader icon="📋" title="Revenue License" />

                  <Text style={s.modalLabel}>License Number</Text>
                  <TextInput
                    style={s.modalInput}
                    placeholder="e.g. RL-2024-67890"
                    placeholderTextColor={C.gray}
                    value={form.revenueLicenseNo}
                    onChangeText={t => setField('revenueLicenseNo', t)}
                    autoCapitalize="characters"
                  />

                  <DateInput
                    label="Revenue License Expiry Date"
                    value={form.revenueLicenseExpiry}
                    onChange={t => setField('revenueLicenseExpiry', t)}
                  />

                  <View style={s.infoBox}>
                    <Text style={s.infoBoxText}>
                      💡 Reminders will show when expiry is within 90 days
                    </Text>
                  </View>
                </View>
              )}

              {/* ── MAINTENANCE TAB ── */}
              {formTab === 'maintenance' && (
                <View>
                  <SectionHeader icon="🔧" title="Service Schedule" />

                  <DateInput
                    label="Last Service Date"
                    value={form.lastServiceDate}
                    onChange={t => setField('lastServiceDate', t)}
                  />
                  <DateInput
                    label="Next Service Date"
                    value={form.nextServiceDate}
                    onChange={t => setField('nextServiceDate', t)}
                  />

                  <Text style={s.modalLabel}>Next Service at Mileage (km)</Text>
                  <TextInput
                    style={s.modalInput}
                    placeholder="e.g. 50000"
                    placeholderTextColor={C.gray}
                    value={form.nextServiceMileage}
                    onChangeText={t => setField('nextServiceMileage', t.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                  />

                  <View style={s.infoBox}>
                    <Text style={s.infoBoxText}>
                      💡 Service reminder will show when date is within 30 days or mileage is near
                    </Text>
                  </View>
                </View>
              )}

              {/* Save / Cancel */}
              <View style={s.modalBtns}>
                <SoundButton
                  style={s.cancelBtn}
                  onPress={() => { setShowModal(false); setImgUri(null); }}
                  disabled={saving}
                >
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </SoundButton>
                <SoundButton
                  style={[s.confirmBtn, (saving || imgUploading) && { opacity: 0.7 }]}
                  onPress={handleSave}
                  disabled={saving || imgUploading}
                >
                  {saving || imgUploading
                    ? <ActivityIndicator color={C.navy} />
                    : <Text style={s.confirmBtnText}>{editId ? 'Update Vehicle' : 'Add Vehicle'}</Text>
                  }
                </SoundButton>
              </View>
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Dropdowns */}
      <DropdownModal visible={drop === 'make'}      title="Select Make"       items={MAKES}
        selected={form.make}             onSelect={v => { setField('make', v); setField('model', ''); }} onClose={() => setDrop(null)} />
      <DropdownModal visible={drop === 'model'}     title="Select Model"      items={MODELS_BY_MAKE[form.make] ?? []}
        selected={form.model}            onSelect={v => setField('model', v)}             onClose={() => setDrop(null)} />
      <DropdownModal visible={drop === 'year'}      title="Select Year"       items={YEARS}
        selected={form.year}             onSelect={v => setField('year', v)}              onClose={() => setDrop(null)} />
      <DropdownModal visible={drop === 'color'}     title="Select Color"      items={COLORS_LIST}
        selected={form.color}            onSelect={v => setField('color', v)}             onClose={() => setDrop(null)} />
      <DropdownModal visible={drop === 'fuel'}      title="Select Fuel Type"  items={FUEL_TYPES}
        selected={form.fuelType}         onSelect={v => setField('fuelType', v)}          onClose={() => setDrop(null)} />
      <DropdownModal visible={drop === 'insurance'} title="Insurance Company" items={INSURANCE_COMPANIES}
        selected={form.insuranceCompany} onSelect={v => setField('insuranceCompany', v)}  onClose={() => setDrop(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.navy,
                  paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.navyMid, gap: 12 },
  loadingText: { color: C.gray, fontSize: 14 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: C.navy, paddingHorizontal: 16, paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:     { width: 64 },
  backText:    { color: C.gold, fontWeight: '700', fontSize: 15 },
  headerTitle: { color: C.white, fontSize: 17, fontWeight: '800' },
  addBtn:      { backgroundColor: C.goldDim, borderRadius: 12, paddingHorizontal: 18,
                  paddingVertical: 8, borderWidth: 1, borderColor: C.goldBorder },
  addBtnText:  { color: C.gold, fontWeight: '700', fontSize: 14 },
  listContent: { backgroundColor: C.navyMid, paddingHorizontal: 14, paddingBottom: 30 },
  statsRow:    { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 12 },
  statCard:    { flex: 1, backgroundColor: C.navyCard, borderRadius: 14, paddingVertical: 12,
                  alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statNum:     { fontSize: 18, fontWeight: '900', color: C.gold, marginBottom: 2 },
  statLabel:   { fontSize: 9, color: C.gray, fontWeight: '600', letterSpacing: 0.3 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.navyCard,
                  borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                  borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  searchIcon:  { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: C.white },
  alertBanner: { backgroundColor: C.errorDim, borderRadius: 12, padding: 12, marginBottom: 12,
                  borderWidth: 1, borderColor: C.errorBorder },
  alertBannerText: { color: C.error, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  card:            { backgroundColor: C.navyCard, borderRadius: 20, marginBottom: 12,
                      borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardImg:         { width: '100%', height: 160, resizeMode: 'cover' },
  cardImgPlaceholder:{ width: '100%', height: 120, backgroundColor: C.navyLight,
                        justifyContent: 'center', alignItems: 'center',
                        borderBottomWidth: 1, borderBottomColor: C.border },
  cardImgPlaceholderText:{ fontSize: 11, color: C.gray, marginTop: 4 },
  typeBadge:       { position: 'absolute', top: 10, right: 10,
                      backgroundColor: 'rgba(8,15,30,0.75)', borderRadius: 20,
                      paddingHorizontal: 10, paddingVertical: 5,
                      borderWidth: 1, borderColor: C.goldBorder },
  typeBadgeText:   { fontSize: 11, fontWeight: '700', color: C.gold },
  alertDot:        { position: 'absolute', top: 10, left: 10,
                      backgroundColor: C.errorDim, borderRadius: 20,
                      paddingHorizontal: 8, paddingVertical: 4,
                      borderWidth: 1, borderColor: C.errorBorder },
  cardBody:        { padding: 14 },
  cardTitleRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  cardTitle:       { fontSize: 16, fontWeight: '800', color: C.white, flex: 1 },
  colorDot:        { width: 13, height: 13, borderRadius: 6.5, borderWidth: 1.5, marginLeft: 8 },
  cardPlate:       { fontSize: 13, color: C.gold, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  tagsRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag:             { backgroundColor: C.navyLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
                      borderWidth: 1, borderColor: C.border },
  tagText:         { fontSize: 11, color: C.grayLight, fontWeight: '600' },
  expiryRow:       { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  cardExpiryBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
                      borderWidth: 1, minWidth: 80 },
  cardExpiryLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cardExpiryDate:  { fontSize: 10, fontWeight: '600', marginTop: 1 },
  cardExpiryDays:  { fontSize: 9, fontWeight: '700', marginTop: 1 },
  cardActions:     { flexDirection: 'row', gap: 8 },
  viewBtn:         { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                      backgroundColor: C.infoDim, borderWidth: 1, borderColor: C.infoBorder },
  viewBtnText:     { fontWeight: '700', fontSize: 13, color: C.info },
  editBtn:         { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                      backgroundColor: C.goldDim, borderWidth: 1, borderColor: C.goldBorder },
  editBtnText:     { fontWeight: '700', fontSize: 13, color: C.gold },
  deleteBtn:       { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                      backgroundColor: C.errorDim, borderWidth: 1, borderColor: C.errorBorder },
  deleteBtnText:   { fontWeight: '700', fontSize: 13, color: C.error },
  emptyWrap:       { alignItems: 'center', marginTop: 60, paddingHorizontal: 24 },
  emptyTitle:      { color: C.offWhite, fontSize: 17, fontWeight: '800', marginBottom: 6 },
  emptyHint:       { color: C.gray, fontSize: 13, textAlign: 'center' },
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalBox:        { backgroundColor: C.navyCard, borderTopLeftRadius: 28, borderTopRightRadius: 28,
                      maxHeight: '95%', padding: 22, borderTopWidth: 1, borderColor: C.goldBorder },
  modalHandle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: C.gray,
                      alignSelf: 'center', marginBottom: 18 },
  modalTitleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:      { fontSize: 20, fontWeight: '900', color: C.white },
  modalLabel:      { fontSize: 11, fontWeight: '700', color: C.gold, letterSpacing: 0.8,
                      textTransform: 'uppercase', marginBottom: 8 },
  modalInput:      { backgroundColor: C.navyLight, borderRadius: 14, paddingHorizontal: 16,
                      paddingVertical: 13, fontSize: 15, color: C.white,
                      borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  dropTrigger:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      backgroundColor: C.navyLight, borderRadius: 14, paddingHorizontal: 16,
                      paddingVertical: 13, borderWidth: 1, borderColor: C.border },
  dropDisabled:    { opacity: 0.4 },
  dropVal:         { fontSize: 15, color: C.white, fontWeight: '500' },
  dropPh:          { fontSize: 15, color: C.gray },
  dropArr:         { fontSize: 16, color: C.gold },
  formTabRow:      { flexDirection: 'row', backgroundColor: C.navyLight, borderRadius: 14,
                      padding: 4, marginBottom: 20, borderWidth: 1, borderColor: C.border },
  formTab:         { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 },
  formTabActive:   { backgroundColor: C.gold },
  formTabText:     { fontSize: 11, color: C.gray, fontWeight: '700' },
  formTabTextActive:{ color: C.navy, fontWeight: '800' },
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginTop: 6 },
  sectionIcon:     { fontSize: 16, marginRight: 8 },
  sectionTitle:    { fontSize: 13, fontWeight: '800', color: C.gold, letterSpacing: 0.5 },
  sectionLine:     { flex: 1, height: 1, backgroundColor: C.border, marginLeft: 10 },
  infoBox:         { backgroundColor: C.infoDim, borderRadius: 12, padding: 12, marginBottom: 14,
                      borderWidth: 1, borderColor: C.infoBorder },
  infoBoxText:     { color: C.info, fontSize: 12, lineHeight: 18 },
  photoBox:           { width: '100%', height: 180, borderRadius: 16, overflow: 'hidden',
                         borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.goldBorder,
                         marginBottom: 12, backgroundColor: C.navyLight },
  photoPreview:       { width: '100%', height: '100%', resizeMode: 'cover' },
  photoEditBadge:     { position: 'absolute', bottom: 0, left: 0, right: 0,
                         backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 8, alignItems: 'center' },
  photoPlaceholder:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoPlaceholderText:{ fontSize: 14, color: C.grayLight, fontWeight: '600', marginBottom: 4 },
  photoPlaceholderSub: { fontSize: 11, color: C.gray },
  changePhotoBtn:     { backgroundColor: C.goldDim, borderRadius: 12, paddingVertical: 10,
                         alignItems: 'center', borderWidth: 1, borderColor: C.goldBorder, marginBottom: 14 },
  changePhotoBtnText: { color: C.gold, fontWeight: '700', fontSize: 13 },
  typeChip:          { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
                        borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
                        backgroundColor: C.navyLight, minWidth: 68 },
  typeChipActive:    { borderColor: C.gold, backgroundColor: C.goldDim },
  typeChipText:      { fontSize: 11, fontWeight: '600', color: C.gray },
  typeChipTextActive:{ color: C.gold, fontWeight: '800' },
  modalBtns:     { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn:     { flex: 1, borderRadius: 14, paddingVertical: 15, alignItems: 'center',
                    borderWidth: 1.5, borderColor: C.border },
  cancelBtnText: { color: C.grayLight, fontWeight: '700' },
  confirmBtn:    { flex: 1, backgroundColor: C.gold, borderRadius: 14, paddingVertical: 15,
                    alignItems: 'center' },
  confirmBtnText:{ color: C.navy, fontWeight: '900', fontSize: 15 },
  detailSection:   { backgroundColor: C.navyLight, borderRadius: 14, padding: 14,
                      marginBottom: 14, borderWidth: 1, borderColor: C.border },
  detailRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  detailLabel:     { color: C.gray, fontSize: 12, fontWeight: '600' },
  detailValue:     { color: C.white, fontSize: 14, fontWeight: '700', textAlign: 'right', flex: 1, marginLeft: 16 },
});