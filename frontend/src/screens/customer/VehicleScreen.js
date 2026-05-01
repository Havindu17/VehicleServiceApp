import SoundButton from "../../utils/SoundButton";
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Modal, ScrollView, Alert, StatusBar,
  SafeAreaView, ActivityIndicator, Image, Animated,
  Platform, Dimensions,
} from 'react-native';
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
  success:    '#22C55E',
  successDim: 'rgba(34,197,94,0.12)',
  border:     'rgba(201,168,76,0.15)',
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
  color:'', vehicleType:'Car',
};

// ────────────────────────── Image helpers ────────────────────────────────────
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

// ────────────────────────── DropdownModal ───────────────────────────────────
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

// ────────────────────────── DropTrigger ─────────────────────────────────────
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

// ────────────────────────── VehicleCard ─────────────────────────────────────
function VehicleCard({ item, onEdit, onDelete, index }) {
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

  return (
    <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
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
          {item.year    && <View style={s.tag}><Text style={s.tagText}>📅 {item.year}</Text></View>}
          {item.color   && <View style={s.tag}><Text style={s.tagText}>{item.color}</Text></View>}
        </View>
        <View style={s.cardActions}>
          <SoundButton style={s.editBtn} onPress={onEdit} activeOpacity={0.8}>
            <Text style={s.editBtnText}>Edit</Text>
          </SoundButton>
          <SoundButton style={s.deleteBtn} onPress={onDelete} activeOpacity={0.8}>
            <Text style={s.deleteBtnText}>Delete</Text>
          </SoundButton>
        </View>
      </View>
    </Animated.View>
  );
}

function ProfessionalVehicleCard({ item, onEdit, onDelete, index }) {
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

  return (
    <Animated.View style={[s.professionalCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
      {hasImg ? (
        <Image source={{ uri: item.imageUrl }} style={s.professionalImg} />
      ) : (
        <View style={s.professionalImgPlaceholder}>
          <Text style={{ fontSize: 52 }}>{icon}</Text>
          <Text style={s.cardImgPlaceholderText}>No photo</Text>
        </View>
      )}
      <View style={s.professionalBody}>
        <View style={s.professionalHeader}>
          <Text style={s.cardTitle}>{item.make} {item.model}</Text>
          <Text style={s.typeBadgeText}>{icon} {item.vehicleType}</Text>
        </View>
        <View style={s.professionalRow}>
          <Text style={s.professionalLabel}>Plate</Text>
          <Text style={s.professionalValue}>{item.licensePlate}</Text>
        </View>
        <View style={s.professionalRow}>
          <Text style={s.professionalLabel}>Year</Text>
          <Text style={s.professionalValue}>{item.year || 'N/A'}</Text>
        </View>
        <View style={s.professionalRow}>
          <Text style={s.professionalLabel}>Color</Text>
          <Text style={s.professionalValue}>{item.color || 'N/A'}</Text>
        </View>
        <View style={s.cardActions}>
          <SoundButton style={s.editBtn} onPress={onEdit} activeOpacity={0.8}>
            <Text style={s.editBtnText}>Edit</Text>
          </SoundButton>
          <SoundButton style={s.deleteBtn} onPress={onDelete} activeOpacity={0.8}>
            <Text style={s.deleteBtnText}>Delete</Text>
          </SoundButton>
        </View>
      </View>
    </Animated.View>
  );
}

// ────────────────────────── Main Screen ─────────────────────────────────────
// ✅ FIX: route param add කළා
export default function VehicleScreen({ navigation, route }) {
  const { user } = useAuth();
  const [vehicles,     setVehicles]     = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [search,       setSearch]       = useState('');
  const [viewMode,     setViewMode]     = useState('fleet');
  const [showModal,    setShowModal]    = useState(false);
  const [editId,       setEditId]       = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [drop,         setDrop]         = useState(null);
  const [imgUri,       setImgUri]       = useState(null);
  const [imgUploading, setImgUploading] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.log('STATUS:', err?.response?.status);
      console.log('ERROR:', err?.response?.data);
      console.log('MESSAGE:', err?.message);
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

  // ── Open add / edit ────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setImgUri(null);
    setShowModal(true);
  };

  const openEdit = (v) => {
    setForm({
      make:         v.make ?? '',
      model:        v.model ?? '',
      year:         v.year ? String(v.year) : '',
      licensePlate: v.licensePlate ?? '',
      color:        v.color ?? '',
      vehicleType:  v.vehicleType ?? 'Car',
    });
    setEditId(v._id ?? v.id);
    setImgUri(v.imageUrl ?? null);
    setShowModal(true);
  };

  // ── Image ──────────────────────────────────────────────────────────────────
  const handlePickImage = async () => {
    const asset = await pickVehicleImage();
    if (!asset) return;
    setImgUri(asset.uri);
  };

  const removeImage = () => {
    Alert.alert('Remove Photo', 'Remove this vehicle photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setImgUri(null) },
    ]);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.make.trim() || !form.model.trim() || !form.licensePlate.trim()) {
      Alert.alert('Required', 'Make, Model and License Plate are required');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        make:         form.make.trim(),
        model:        form.model.trim(),
        year:         form.year ? parseInt(form.year) : null,
        licensePlate: form.licensePlate.trim().toUpperCase(),
        color:        form.color.trim(),
        vehicleType:  form.vehicleType,
      };

      let savedVehicle;
      if (editId) {
        const res = await api.put(`/customer/vehicles/${editId}`, payload);
        savedVehicle = res.data;
        setVehicles(prev => prev.map(v => (v._id ?? v.id) === editId ? savedVehicle : v));
      } else {
        const res = await api.post('/customer/vehicles', payload);
        savedVehicle = res.data;
        setVehicles(prev => [...prev, savedVehicle]);
      }

      const vehicleId = savedVehicle._id ?? savedVehicle.id;
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
        } catch { Alert.alert('Photo Error', 'Vehicle saved but photo upload failed'); }
        finally { setImgUploading(false); }
      } else if (!imgUri && savedVehicle.imageUrl) {
        try { await api.delete(`/customer/vehicles/${vehicleId}/image`); } catch {}
        setVehicles(prev => prev.map(v =>
          (v._id ?? v.id) === vehicleId ? { ...v, imageUrl: null } : v
        ));
      }

      setShowModal(false);
    } catch (err) {
      Alert.alert('Save Failed', err?.response?.data?.message ?? 'Could not save vehicle');
    } finally { setSaving(false); }
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
          } catch { Alert.alert('Error', 'Could not delete vehicle'); }
        },
      },
    ]);
  };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const stats = {
    total:      vehicles.length,
    withPhoto:  vehicles.filter(v => v.imageUrl).length,
    unassigned: vehicles.filter(v => !v.customer).length,
  };

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

      <View style={s.tabRow}>
        <SoundButton
          style={[s.tabButton, viewMode === 'fleet' && s.tabButtonActive]}
          onPress={() => setViewMode('fleet')}
        >
          <Text style={[s.tabText, viewMode === 'fleet' && s.tabTextActive]}>Fleet</Text>
        </SoundButton>
        <SoundButton
          style={[s.tabButton, viewMode === 'professional' && s.tabButtonActive]}
          onPress={() => setViewMode('professional')}
        >
          <Text style={[s.tabText, viewMode === 'professional' && s.tabTextActive]}>Professional</Text>
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
                <View style={s.statCard}>
                  <Text style={[s.statNum, { color: C.gold }]}>{stats.unassigned}</Text>
                  <Text style={s.statLabel}>Unassigned</Text>
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
            </View>
          }
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={{ fontSize: 52, marginBottom: 14 }}>🚗</Text>
              <Text style={s.emptyTitle}>No vehicles found</Text>
              <Text style={s.emptyHint}>Tap + Add to create your first fleet vehicle.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            viewMode === 'professional' ? (
              <ProfessionalVehicleCard
                item={item}
                index={index}
                onEdit={() => openEdit(item)}
                onDelete={() => handleDelete(item)}
              />
            ) : (
              <VehicleCard
                item={item}
                index={index}
                onEdit={() => openEdit(item)}
                onDelete={() => handleDelete(item)}
              />
            )
          )}
        />
      )}

      {/* ── Add / Edit Modal ── */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHandle} />
            <View style={s.modalTitleRow}>
              <Text style={s.modalTitle}>{editId ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
              <SoundButton
                onPress={() => { setShowModal(false); setImgUri(null); }}
                style={dd.closeBtn}
              >
                <Text style={dd.closeText}>✕</Text>
              </SoundButton>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                      <Text style={{ fontSize: 12 }}>✎ Change / Remove</Text>
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

              <DropTrigger label="Make *" value={form.make} placeholder="Select make…"
                onPress={() => setDrop('make')} />
              <DropTrigger label="Model *" value={form.model}
                placeholder={form.make ? 'Select model…' : 'Select make first'}
                onPress={() => setDrop('model')} disabled={!form.make} />
              <DropTrigger label="Year" value={form.year} placeholder="Select year…"
                onPress={() => setDrop('year')} />

              <Text style={s.modalLabel}>License Plate *</Text>
              <TextInput
                style={s.modalInput}
                placeholder="e.g. WP ABC 1234"
                placeholderTextColor={C.gray}
                value={form.licensePlate}
                onChangeText={t => setField('licensePlate', t.toUpperCase())}
                autoCapitalize="characters"
              />

              <DropTrigger label="Color" value={form.color} placeholder="Select color…"
                onPress={() => setDrop('color')} />

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
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DropdownModal visible={drop === 'make'}  title="Select Make"  items={MAKES}
        selected={form.make}  onSelect={v => { setField('make', v); setField('model', ''); }} onClose={() => setDrop(null)} />
      <DropdownModal visible={drop === 'model'} title="Select Model" items={MODELS_BY_MAKE[form.make] ?? []}
        selected={form.model} onSelect={v => setField('model', v)} onClose={() => setDrop(null)} />
      <DropdownModal visible={drop === 'year'}  title="Select Year"  items={YEARS}
        selected={form.year}  onSelect={v => setField('year', v)}  onClose={() => setDrop(null)} />
      <DropdownModal visible={drop === 'color'} title="Select Color" items={COLORS_LIST}
        selected={form.color} onSelect={v => setField('color', v)} onClose={() => setDrop(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.navy,
                  paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center',
                  backgroundColor: C.navyMid, gap: 12 },
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
  tabRow:      { flexDirection: 'row', backgroundColor: C.navyCard, borderRadius: 18,
                  marginHorizontal: 14, marginTop: 14, padding: 4, borderWidth: 1,
                  borderColor: C.border, overflow: 'hidden' },
  tabButton:   { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 16 },
  tabButtonActive: { backgroundColor: C.gold },
  tabText:     { color: C.gray, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: C.navy },
  listContent: { backgroundColor: C.navyMid, paddingHorizontal: 14, paddingBottom: 30 },
  statsRow:    { flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 12 },
  statCard:    { flex: 1, backgroundColor: C.navyCard, borderRadius: 16, paddingVertical: 14,
                  alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statNum:     { fontSize: 20, fontWeight: '900', color: C.gold, marginBottom: 2 },
  statLabel:   { fontSize: 10, color: C.gray, fontWeight: '600', letterSpacing: 0.4 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.navyCard,
                  borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                  borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  searchIcon:  { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: C.white },
  card:            { backgroundColor: C.navyCard, borderRadius: 20, marginBottom: 12,
                      borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  professionalCard: { backgroundColor: C.navyCard, borderRadius: 20, marginBottom: 12,
                      borderWidth: 1, borderColor: C.goldBorder, overflow: 'hidden' },
  cardImg:         { width: '100%', height: 160, resizeMode: 'cover' },
  professionalImg:  { width: '100%', height: 180, resizeMode: 'cover' },
  cardImgPlaceholder:{ width: '100%', height: 130, backgroundColor: C.navyLight,
                        justifyContent: 'center', alignItems: 'center',
                        borderBottomWidth: 1, borderBottomColor: C.border },
  professionalImgPlaceholder:{ width: '100%', height: 180, backgroundColor: C.navyLight,
                        justifyContent: 'center', alignItems: 'center',
                        borderBottomWidth: 1, borderBottomColor: C.border },
  professionalBody:  { padding: 16, gap: 10 },
  professionalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  professionalRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
                      borderBottomWidth: 1, borderBottomColor: C.border },
  professionalLabel:{ color: C.gray, fontSize: 12 },
  professionalValue:{ color: C.white, fontSize: 14, fontWeight: '700' },
  cardImgPlaceholderText:{ fontSize: 11, color: C.gray, marginTop: 4 },
  typeBadge:       { position: 'absolute', top: 10, right: 10,
                      backgroundColor: 'rgba(8,15,30,0.75)',
                      borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
                      borderWidth: 1, borderColor: C.goldBorder },
  typeBadgeText:   { fontSize: 11, fontWeight: '700', color: C.gold },
  cardBody:        { padding: 14 },
  cardTitleRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  cardTitle:       { fontSize: 16, fontWeight: '800', color: C.white, flex: 1 },
  colorDot:        { width: 13, height: 13, borderRadius: 6.5, borderWidth: 1.5, marginLeft: 8 },
  cardPlate:       { fontSize: 13, color: C.gold, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  tagsRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag:             { backgroundColor: C.navyLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
                      borderWidth: 1, borderColor: C.border },
  tagText:         { fontSize: 11, color: C.grayLight, fontWeight: '600' },
  tagGold:         { borderColor: C.goldBorder, backgroundColor: C.goldDim },
  tagTextGold:     { color: C.gold },
  cardActions:     { flexDirection: 'row', gap: 8 },
  editBtn:         { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                      backgroundColor: C.goldDim, borderWidth: 1, borderColor: C.goldBorder },
  editBtnText:     { fontWeight: '700', fontSize: 13, color: C.gold },
  deleteBtn:       { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                      backgroundColor: 'rgba(239,68,68,0.1)',
                      borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
  deleteBtnText:   { fontWeight: '700', fontSize: 13, color: C.error },
  emptyWrap:       { alignItems: 'center', marginTop: 60, paddingHorizontal: 24 },
  emptyTitle:      { color: C.offWhite, fontSize: 17, fontWeight: '800', marginBottom: 6 },
  emptyHint:       { color: C.gray, fontSize: 13, textAlign: 'center', marginBottom: 20 },
  emptyAddBtn:     { backgroundColor: C.gold, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  emptyAddBtnText: { color: C.navy, fontWeight: '900', fontSize: 14 },
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalBox:        { backgroundColor: C.navyCard, borderTopLeftRadius: 28, borderTopRightRadius: 28,
                      maxHeight: '95%', padding: 22, borderTopWidth: 1, borderColor: C.goldBorder },
  modalHandle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: C.gray,
                      alignSelf: 'center', marginBottom: 18 },
  modalTitleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
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
  photoBox:           { width: '100%', height: 180, borderRadius: 16, overflow: 'hidden',
                         borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.goldBorder,
                         marginBottom: 12, backgroundColor: C.navyLight },
  photoPreview:       { width: '100%', height: '100%', resizeMode: 'cover' },
  photoEditBadge:     { position: 'absolute', bottom: 0, left: 0, right: 0,
                         backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 8,
                         alignItems: 'center' },
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
  custChip:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                        borderWidth: 1.5, borderColor: C.border, backgroundColor: C.navyLight },
  custChipActive:    { borderColor: C.gold, backgroundColor: C.goldDim },
  custChipText:      { fontSize: 13, color: C.gray },
  custChipTextActive:{ color: C.gold, fontWeight: '700' },
  modalBtns:     { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn:     { flex: 1, borderRadius: 14, paddingVertical: 15, alignItems: 'center',
                    borderWidth: 1.5, borderColor: C.border },
  cancelBtnText: { color: C.grayLight, fontWeight: '700' },
  confirmBtn:    { flex: 1, backgroundColor: C.gold, borderRadius: 14, paddingVertical: 15,
                    alignItems: 'center', elevation: 5 },
  confirmBtnText:{ color: C.navy, fontWeight: '900', fontSize: 15 },
});