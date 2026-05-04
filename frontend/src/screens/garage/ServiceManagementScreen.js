import SoundButton from "../../utils/SoundButton";
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, FlatList, ActivityIndicator, Alert, Modal, Platform, ScrollView
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
  error:   '#EF4444',
  info:    '#2563EB',
};

// ── Predefined service catalog ─────────────────────────────────────────────
const SERVICE_CATALOG = [
  {
    category: 'Oil & Fluids',
    items: [
      { name: 'Oil Change',              price: '2500', duration: '30',  description: 'Engine oil + filter replacement' },
      { name: 'Coolant Flush',           price: '1800', duration: '45',  description: 'Coolant system flush & refill' },
      { name: 'Brake Fluid Change',      price: '1500', duration: '30',  description: 'Brake fluid flush & replacement' },
      { name: 'Transmission Fluid',      price: '3500', duration: '60',  description: 'Transmission fluid change' },
      { name: 'Power Steering Fluid',    price: '1200', duration: '20',  description: 'Power steering fluid top-up' },
    ]
  },
  {
    category: 'Engine & Mechanical',
    items: [
      { name: 'Full Engine Tune-Up',     price: '8500', duration: '120', description: 'Spark plugs, filters, timing check' },
      { name: 'Spark Plug Replacement',  price: '3000', duration: '45',  description: 'Replace all spark plugs' },
      { name: 'Air Filter Replacement',  price: '800',  duration: '15',  description: 'Engine air filter replacement' },
      { name: 'Timing Belt Replacement', price: '12000',duration: '180', description: 'Timing belt & tensioner replacement' },
      { name: 'Engine Diagnostics',      price: '1500', duration: '30',  description: 'OBD scan & fault code reading' },
      { name: 'Battery Replacement',     price: '2000', duration: '20',  description: 'Battery test & replacement' },
    ]
  },
  {
    category: 'Tyres & Wheels',
    items: [
      { name: 'Tyre Rotation',           price: '1000', duration: '30',  description: 'Rotate all 4 tyres' },
      { name: 'Wheel Balancing',         price: '1500', duration: '45',  description: 'Balance all 4 wheels' },
      { name: 'Wheel Alignment',         price: '2500', duration: '60',  description: '4-wheel alignment check & adjust' },
      { name: 'Tyre Replacement (each)', price: '3500', duration: '20',  description: 'Single tyre fitting & balancing' },
      { name: 'Puncture Repair',         price: '500',  duration: '20',  description: 'Tyre puncture repair' },
    ]
  },
  {
    category: 'Brakes & Suspension',
    items: [
      { name: 'Brake Pad Replacement',   price: '4500', duration: '60',  description: 'Front or rear brake pads' },
      { name: 'Brake Disc Replacement',  price: '8000', duration: '90',  description: 'Brake disc resurface or replace' },
      { name: 'Shock Absorber Replace',  price: '6000', duration: '90',  description: 'Front or rear shock absorber' },
      { name: 'Brake Inspection',        price: '800',  duration: '30',  description: 'Full brake system inspection' },
    ]
  },
  {
    category: 'AC & Electrical',
    items: [
      { name: 'AC Gas Refill',           price: '4500', duration: '45',  description: 'AC refrigerant top-up' },
      { name: 'AC Full Service',         price: '6500', duration: '90',  description: 'AC cleaning, gas refill & check' },
      { name: 'Electrical Diagnostics',  price: '1500', duration: '45',  description: 'Electrical fault finding' },
      { name: 'Alternator Check',        price: '1000', duration: '30',  description: 'Alternator output test' },
    ]
  },
  {
    category: 'Wash & Detailing',
    items: [
      { name: 'Full Car Wash',           price: '800',  duration: '30',  description: 'Exterior wash & dry' },
      { name: 'Interior Cleaning',       price: '2000', duration: '60',  description: 'Interior vacuum & wipe down' },
      { name: 'Full Detail',             price: '5000', duration: '180', description: 'Full interior & exterior detail' },
      { name: 'Engine Bay Cleaning',     price: '1500', duration: '45',  description: 'Engine bay wash & degrease' },
      { name: 'Wax & Polish',            price: '3500', duration: '120', description: 'Machine polish & wax' },
    ]
  },
  {
    category: 'Inspection & Service',
    items: [
      { name: 'Full Vehicle Inspection', price: '2000', duration: '60',  description: '50-point vehicle inspection' },
      { name: 'Pre-Purchase Inspection', price: '3000', duration: '90',  description: 'Detailed inspection for used cars' },
      { name: '1000km Service',          price: '3500', duration: '60',  description: 'New vehicle 1000km check' },
      { name: '5000km Service',          price: '4500', duration: '90',  description: 'Standard 5000km service' },
      { name: '10000km Service',         price: '7500', duration: '120', description: 'Full 10000km major service' },
    ]
  },
];

const EMPTY_SERVICE = { name: '', description: '', price: '', duration: '', category: '' };

// ── Validation Rules ───────────────────────────────────────────────────────
const VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-&()\/]+$/,
    patternMsg: 'Only letters, numbers, spaces and - & ( ) / allowed',
  },
  category: {
    required: false,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-&]*$/,
    patternMsg: 'Only letters, numbers, spaces and - & allowed',
  },
  price: {
    required: true,
    isNumber: true,
    min: 1,
    max: 9999999,
  },
  duration: {
    required: false,
    isNumber: true,
    isInteger: true,
    min: 1,
    max: 1440, // max 24 hrs in minutes
  },
  description: {
    required: false,
    maxLength: 300,
  },
};

function validateField(key, value) {
  const rules = VALIDATION_RULES[key];
  if (!rules) return null;

  const v = typeof value === 'string' ? value.trim() : value;

  if (rules.required && !v) {
    return `${fieldLabel(key)} is required`;
  }

  if (!v) return null; // optional field — empty is fine

  if (rules.minLength && v.length < rules.minLength) {
    return `${fieldLabel(key)} must be at least ${rules.minLength} characters`;
  }
  if (rules.maxLength && v.length > rules.maxLength) {
    return `${fieldLabel(key)} must be under ${rules.maxLength} characters`;
  }
  if (rules.pattern && !rules.pattern.test(v)) {
    return rules.patternMsg ?? `${fieldLabel(key)} has invalid characters`;
  }
  if (rules.isNumber) {
    const num = Number(v);
    if (isNaN(num) || num <= 0) {
      return `${fieldLabel(key)} must be a valid positive number`;
    }
    if (rules.isInteger && !Number.isInteger(num)) {
      return `${fieldLabel(key)} must be a whole number`;
    }
    if (rules.min != null && num < rules.min) {
      return `${fieldLabel(key)} must be at least ${rules.min}`;
    }
    if (rules.max != null && num > rules.max) {
      return `${fieldLabel(key)} must be ${rules.max} or less`;
    }
  }
  return null;
}

function fieldLabel(key) {
  return {
    name:        'Service Name',
    category:    'Category',
    price:       'Price',
    duration:    'Duration',
    description: 'Description',
  }[key] ?? key;
}

function validateForm(form) {
  const errors = {};
  Object.keys(VALIDATION_RULES).forEach(key => {
    const err = validateField(key, form[key]);
    if (err) errors[key] = err;
  });
  return errors;
}

// ── Normalize API response to a consistent shape ───────────────────────────
function normalizeService(raw, index) {
  if (!raw) return null;

  if (typeof raw === 'string') {
    return {
      _id:         `str-${index}-${raw}`,
      name:        raw,
      description: '',
      price:       '',
      duration:    '',
      category:    '',
    };
  }

  return {
    _id:         raw._id ?? raw.id ?? `svc-${index}-${raw.name ?? index}`,
    name:        raw.name        ?? '',
    description: raw.description ?? '',
    price:       raw.price       != null ? String(raw.price) : '',
    duration:    raw.duration    != null ? String(raw.duration) : '',
    category:    raw.category    ?? '',
  };
}

export default function ServiceManagementScreen({ navigation }) {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [catalog,  setCatalog]  = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY_SERVICE);
  const [errors,   setErrors]   = useState({});       // ← validation errors
  const [touched,  setTouched]  = useState({});       // ← which fields were touched
  const [saving,   setSaving]   = useState(false);
  const [addingId, setAddingId] = useState(null);

  const fetchServices = async () => {
    try {
      const res = await api.get('/garage/services');
      const raw = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.services)
          ? res.data.services
          : [];
      setServices(raw.map(normalizeService).filter(Boolean));
    } catch (e) {
      console.error('fetchServices error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_SERVICE);
    setErrors({});
    setTouched({});
    setModal(true);
  };

  const openEdit = (svc) => {
    setEditing(svc._id);
    setForm({
      name:        svc.name,
      description: svc.description,
      price:       svc.price,
      duration:    svc.duration,
      category:    svc.category,
    });
    setErrors({});
    setTouched({});
    setModal(true);
  };

  // ── Field change handler with live validation ──────────────────────────
  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    // Show live error only if field was already touched
    if (touched[key]) {
      const err = validateField(key, value);
      setErrors(prev => ({ ...prev, [key]: err ?? undefined }));
    }
  };

  // ── Mark field as touched on blur ─────────────────────────────────────
  const handleBlur = (key) => {
    setTouched(prev => ({ ...prev, [key]: true }));
    const err = validateField(key, form[key]);
    setErrors(prev => ({ ...prev, [key]: err ?? undefined }));
  };

  // ── Check for duplicate service name ─────────────────────────────────
  const isDuplicateName = (name) => {
    return services.some(
      s => s.name.toLowerCase() === name.trim().toLowerCase() && s._id !== editing
    );
  };

  const handleSave = async () => {
    // Mark all fields touched
    const allTouched = Object.keys(VALIDATION_RULES).reduce((acc, k) => {
      acc[k] = true; return acc;
    }, {});
    setTouched(allTouched);

    // Run full validation
    const validationErrors = validateForm(form);

    // Extra: duplicate name check
    if (!validationErrors.name && isDuplicateName(form.name)) {
      validationErrors.name = 'A service with this name already exists';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Show first error as alert too
      const firstMsg = Object.values(validationErrors)[0];
      Alert.alert('Validation Error', firstMsg);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim(),
        price:       form.price.trim(),
        duration:    form.duration.trim(),
        category:    form.category.trim(),
      };
      if (editing) {
        await api.put(`/garage/services/${editing}`, payload);
      } else {
        await api.post('/garage/services', payload);
      }
      setModal(false);
      fetchServices();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not save service');
    } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Service', 'Are you sure you want to delete this service?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/garage/services/${id}`);
            setServices(prev => prev.filter(s => s._id !== id));
          } catch { Alert.alert('Error', 'Could not delete service'); }
        }
      }
    ]);
  };

  const handleAddFromCatalog = async (item) => {
    // Duplicate check before adding from catalog
    if (isDuplicateName(item.name)) {
      Alert.alert('Already Exists', `"${item.name}" is already in your services list.`);
      return;
    }
    setAddingId(item.name);
    try {
      await api.post('/garage/services', {
        name:        item.name,
        description: item.description,
        price:       item.price,
        duration:    item.duration,
        category:    item.category ?? '',
      });
      await fetchServices();
      Alert.alert('Added!', `"${item.name}" added to your services.`);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not add service');
    } finally { setAddingId(null); }
  };

  const isAlreadyAdded = (name) => services.some(s => s.name === name);

  // ── Field config for the modal form ──────────────────────────────────────
  const FORM_FIELDS = [
    { label: 'Service Name *', key: 'name',        placeholder: 'e.g. Oil Change',        keyboard: 'default' },
    { label: 'Category',       key: 'category',    placeholder: 'e.g. Maintenance',       keyboard: 'default' },
    { label: 'Price (Rs.) *',  key: 'price',       placeholder: '0',                      keyboard: 'numeric' },
    { label: 'Duration (min)', key: 'duration',    placeholder: '60',                     keyboard: 'numeric' },
    { label: 'Description',    key: 'description', placeholder: 'Short description...',   keyboard: 'default' },
  ];

  // ── Service card ──────────────────────────────────────────────────────────
  const renderItem = ({ item }) => {
    if (!item) return null;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={styles.serviceName}>{item.name || '(Unnamed)'}</Text>
            {item.category ? <Text style={styles.category}>{item.category}</Text> : null}
          </View>
          {item.price ? (
            <Text style={styles.price}>Rs. {item.price}</Text>
          ) : null}
        </View>
        {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
        {item.duration ? <Text style={styles.duration}>⏱ {item.duration} mins</Text> : null}
        <View style={styles.divider} />
        <View style={styles.btnRow}>
          <SoundButton style={styles.editBtn} onPress={() => openEdit(item)}>
            <Text style={styles.editBtnText}>✏️ Edit</Text>
          </SoundButton>
          <SoundButton style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
            <Text style={styles.deleteBtnText}>🗑 Delete</Text>
          </SoundButton>
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
        <Text style={styles.title}>Services</Text>
        <SoundButton style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </SoundButton>
      </View>

      {/* Catalog button */}
      <SoundButton style={styles.catalogBtn} onPress={() => setCatalog(true)}>
        <Text style={styles.catalogIcon}>📋</Text>
        <View style={styles.catalogBtnInfo}>
          <Text style={styles.catalogBtnTitle}>Add from Service Catalog</Text>
          <Text style={styles.catalogBtnSub}>Common vehicle services — tap to add instantly</Text>
        </View>
        <Text style={styles.catalogArrow}>›</Text>
      </SoundButton>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.gold} /></View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item, index) => item?._id ?? String(index)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 14, gap: 12 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔧</Text>
              <Text style={styles.emptyText}>No services yet</Text>
              <SoundButton style={styles.addFirstBtn} onPress={() => setCatalog(true)}>
                <Text style={styles.addFirstText}>Browse Service Catalog</Text>
              </SoundButton>
            </View>
          }
        />
      )}

      {/* ── Manual Add/Edit Modal ── */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Service' : 'Add New Service'}</Text>

            {FORM_FIELDS.map(f => (
              <View key={f.key}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={[
                    styles.input,
                    touched[f.key] && errors[f.key] && styles.inputError,
                  ]}
                  placeholder={f.placeholder}
                  placeholderTextColor={COLORS.gray}
                  keyboardType={f.keyboard}
                  autoCorrect={false}
                  autoCapitalize="none"
                  spellCheck={false}
                  value={form[f.key]}
                  onChangeText={v => handleChange(f.key, v)}
                  onBlur={() => handleBlur(f.key)}
                  maxLength={
                    f.key === 'name'        ? 100 :
                    f.key === 'category'    ? 50  :
                    f.key === 'description' ? 300 :
                    f.key === 'price'       ? 10  :
                    f.key === 'duration'    ? 4   : undefined
                  }
                />
                {/* Inline error message */}
                {touched[f.key] && errors[f.key] ? (
                  <Text style={styles.errorText}>⚠ {errors[f.key]}</Text>
                ) : null}
                {/* Character counter for text fields */}
                {f.key === 'description' && form.description.length > 0 ? (
                  <Text style={styles.charCount}>{form.description.length}/300</Text>
                ) : null}
              </View>
            ))}

            <View style={styles.modalBtns}>
              <SoundButton
                style={styles.cancelModalBtn}
                onPress={() => { setModal(false); setErrors({}); setTouched({}); }}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </SoundButton>
              <SoundButton style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving
                  ? <ActivityIndicator color={COLORS.navy} />
                  : <Text style={styles.saveBtnText}>Save</Text>}
              </SoundButton>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Catalog Modal ── */}
      <Modal visible={catalog} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.catalogModal}>
            <View style={styles.catalogHeader}>
              <Text style={styles.catalogTitle}>📋 Service Catalog</Text>
              <SoundButton onPress={() => setCatalog(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </SoundButton>
            </View>
            <Text style={styles.catalogSubtitle}>Tap any service to add it to your garage</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {SERVICE_CATALOG.map((group, gi) => (
                <View key={`group-${gi}`} style={styles.catalogGroup}>
                  <Text style={styles.catalogGroupTitle}>{group.category}</Text>
                  {group.items.map((item, ii) => {
                    const added  = isAlreadyAdded(item.name);
                    const adding = addingId === item.name;
                    return (
                      <View key={`item-${gi}-${ii}`} style={styles.catalogItem}>
                        <View style={styles.catalogItemLeft}>
                          <Text style={styles.catalogItemName}>{item.name}</Text>
                          <Text style={styles.catalogItemDesc}>{item.description}</Text>
                          <View style={styles.catalogItemMeta}>
                            <Text style={styles.catalogItemPrice}>Rs. {item.price}</Text>
                            {item.duration
                              ? <Text style={styles.catalogItemDur}>⏱ {item.duration} min</Text>
                              : null}
                          </View>
                        </View>
                        <SoundButton
                          style={[
                            styles.catalogAddBtn,
                            added  && styles.catalogAddBtnDone,
                            adding && styles.catalogAddBtnLoading,
                          ]}
                          onPress={() => !added && handleAddFromCatalog(item)}
                          disabled={added || adding}
                        >
                          {adding
                            ? <ActivityIndicator size="small" color={COLORS.navy} />
                            : <Text style={[styles.catalogAddText, added && styles.catalogAddTextDone]}>
                                {added ? '✓' : '+'}
                              </Text>
                          }
                        </SoundButton>
                      </View>
                    );
                  })}
                </View>
              ))}
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: COLORS.navy,
                     paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                     backgroundColor: COLORS.navy, paddingHorizontal: 20, paddingVertical: 16,
                     borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)' },
  backBtn:         { width: 60 },
  backText:        { color: COLORS.gold, fontWeight: '700', fontSize: 18 },
  title:           { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  addBtn:          { backgroundColor: COLORS.gold, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText:      { color: COLORS.navy, fontWeight: '800', fontSize: 14 },

  catalogBtn:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(201,168,76,0.08)',
                     marginHorizontal: 14, marginTop: 14, marginBottom: 4, borderRadius: 14, padding: 14,
                     borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  catalogIcon:     { fontSize: 28, marginRight: 12 },
  catalogBtnInfo:  { flex: 1 },
  catalogBtnTitle: { fontSize: 14, fontWeight: '800', color: COLORS.gold, marginBottom: 2 },
  catalogBtnSub:   { fontSize: 12, color: COLORS.gray },
  catalogArrow:    { fontSize: 24, color: COLORS.gold },

  card:            { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16,
                     borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)', elevation: 3 },
  cardTop:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardLeft:        { flex: 1 },
  serviceName:     { fontSize: 16, fontWeight: '800', color: COLORS.white },
  category:        { fontSize: 12, color: COLORS.gold, marginTop: 2, fontWeight: '600' },
  price:           { fontSize: 18, fontWeight: '800', color: COLORS.success },
  desc:            { fontSize: 13, color: COLORS.gray, marginBottom: 4 },
  duration:        { fontSize: 13, color: COLORS.gray, marginBottom: 4 },
  divider:         { height: 1, backgroundColor: 'rgba(201,168,76,0.1)', marginVertical: 10 },
  btnRow:          { flexDirection: 'row', gap: 10 },
  editBtn:         { flex: 1, backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: 10,
                     paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(37,99,235,0.3)' },
  editBtnText:     { color: COLORS.info, fontWeight: '700', fontSize: 13 },
  deleteBtn:       { flex: 1, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10,
                     paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  deleteBtnText:   { color: COLORS.error, fontWeight: '700', fontSize: 13 },
  empty:           { alignItems: 'center', paddingTop: 60 },
  emptyIcon:       { fontSize: 48, marginBottom: 12 },
  emptyText:       { fontSize: 16, color: COLORS.gray, marginBottom: 16 },
  addFirstBtn:     { backgroundColor: COLORS.gold, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  addFirstText:    { color: COLORS.navy, fontWeight: '800' },

  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox:        { backgroundColor: COLORS.navyMid, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                     padding: 24, borderTopWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  modalTitle:      { fontSize: 20, fontWeight: '800', color: COLORS.white, marginBottom: 16 },
  fieldLabel:      { fontSize: 11, fontWeight: '700', color: COLORS.gold,
                     marginBottom: 7, letterSpacing: 0.8, textTransform: 'uppercase' },
  input:           { backgroundColor: COLORS.navy, borderRadius: 12, paddingHorizontal: 14,
                     paddingVertical: 12, fontSize: 15, color: COLORS.white,
                     borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)', marginBottom: 4 },
  inputError:      { borderColor: COLORS.error, borderWidth: 1.5 },
  errorText:       { color: COLORS.error, fontSize: 11, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  charCount:       { color: COLORS.gray, fontSize: 11, textAlign: 'right', marginBottom: 8, marginRight: 2 },
  modalBtns:       { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelModalBtn:  { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center',
                     borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.3)' },
  cancelModalText: { color: COLORS.gray, fontWeight: '700' },
  saveBtn:         { flex: 1, backgroundColor: COLORS.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText:     { color: COLORS.navy, fontWeight: '900', fontSize: 15 },

  catalogModal:      { backgroundColor: COLORS.navyMid, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                       maxHeight: '90%', borderTopWidth: 1, borderColor: 'rgba(201,168,76,0.2)', marginTop: 'auto' },
  catalogHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                       padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.1)' },
  catalogTitle:      { fontSize: 18, fontWeight: '800', color: COLORS.white },
  closeBtn:          { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)',
                       justifyContent: 'center', alignItems: 'center' },
  closeBtnText:      { color: COLORS.gray, fontSize: 16, fontWeight: '700' },
  catalogSubtitle:   { fontSize: 13, color: COLORS.gray, paddingHorizontal: 20, paddingVertical: 10 },
  catalogGroup:      { paddingHorizontal: 16, marginBottom: 8 },
  catalogGroupTitle: { fontSize: 13, fontWeight: '800', color: COLORS.gold, marginBottom: 8,
                       paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)' },
  catalogItem:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
                       borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  catalogItemLeft:   { flex: 1, marginRight: 10 },
  catalogItemName:   { fontSize: 14, fontWeight: '700', color: COLORS.white, marginBottom: 2 },
  catalogItemDesc:   { fontSize: 12, color: COLORS.gray, marginBottom: 4 },
  catalogItemMeta:   { flexDirection: 'row', gap: 10 },
  catalogItemPrice:  { fontSize: 13, color: COLORS.success, fontWeight: '700' },
  catalogItemDur:    { fontSize: 12, color: COLORS.gray },
  catalogAddBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.gold,
                       justifyContent: 'center', alignItems: 'center' },
  catalogAddBtnDone:    { backgroundColor: 'rgba(22,163,74,0.2)', borderWidth: 1, borderColor: 'rgba(22,163,74,0.4)' },
  catalogAddBtnLoading: { backgroundColor: 'rgba(201,168,76,0.3)' },
  catalogAddText:       { color: COLORS.navy, fontSize: 20, fontWeight: '900' },
  catalogAddTextDone:   { color: COLORS.success, fontSize: 16 },
});