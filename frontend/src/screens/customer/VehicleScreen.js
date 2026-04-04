import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Modal, ScrollView, Alert, StatusBar,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import api from '../../utils/api';

const VEHICLE_TYPES = ['Car', 'Motorcycle', 'Van', 'Truck', 'SUV'];

const EMPTY_FORM = {
  make: '', model: '', year: '', licensePlate: '',
  color: '', vehicleType: 'Car', customerId: '',
};

function nameInitials(name = '') {
  return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

const AVATAR_COLORS = ['#1565C0','#2E7D32','#E65100','#6A1B9A','#00695C','#C62828'];
function getAvatarColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function VehicleScreen({ navigation }) {
  const [vehicles,     setVehicles]   = useState([]);
  const [customers,    setCustomers]  = useState([]);
  const [loading,      setLoading]    = useState(false);
  const [saving,       setSaving]     = useState(false);
  const [search,       setSearch]     = useState('');
  const [modalVisible, setModal]      = useState(false);
  const [editId,       setEditId]     = useState(null);
  const [form,         setForm]       = useState(EMPTY_FORM);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [v, c] = await Promise.all([
        api.get('/vehicles'),
        api.get('/customers'),
      ]);
      setVehicles(v.data);
      setCustomers(c.data);
    } catch (err) {
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

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModal(true);
  };

  const openEdit = (v) => {
    setForm({
      make:        v.make ?? '',
      model:       v.model ?? '',
      year:        v.year ? String(v.year) : '',
      licensePlate:v.licensePlate ?? '',
      color:       v.color ?? '',
      vehicleType: v.vehicleType ?? 'Car',
      customerId:  v.customerId?._id ?? v.customerId ?? '',
    });
    setEditId(v._id ?? v.id);
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.make.trim() || !form.model.trim() || !form.licensePlate.trim()) {
      Alert.alert('Error', 'Make, Model and License Plate are required');
      return;
    }
    const payload = {
      make:         form.make.trim(),
      model:        form.model.trim(),
      year:         form.year ? parseInt(form.year) : null,
      licensePlate: form.licensePlate.trim().toUpperCase(),
      color:        form.color.trim(),
      vehicleType:  form.vehicleType,
      customerId:   form.customerId || null,
    };
    try {
      setSaving(true);
      if (editId) {
        const res = await api.put(`/vehicles/${editId}`, payload);
        setVehicles(prev => prev.map(v => (v._id ?? v.id) === editId ? res.data : v));
      } else {
        const res = await api.post('/vehicles', payload);
        setVehicles(prev => [...prev, res.data]);
      }
      setModal(false);
    } catch (err) {
      Alert.alert('Save Failed', err?.response?.data?.message ?? 'Could not save vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (v) => {
    Alert.alert('Delete Vehicle', `Remove "${v.make} ${v.model}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/vehicles/${v._id ?? v.id}`);
            setVehicles(prev => prev.filter(x => (x._id ?? x.id) !== (v._id ?? v.id)));
          } catch {
            Alert.alert('Error', 'Could not delete vehicle');
          }
        },
      },
    ]);
  };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const getCustomerName = (v) => {
    if (!v.customerId) return null;
    const id = v.customerId?._id ?? v.customerId;
    const c = customers.find(c => (c._id ?? c.id) === id);
    return c ? c.name : null;
  };

  const stats = {
    fleet:  vehicles.length,
    active: vehicles.filter(v => v.vehicleType !== 'Truck').length,
    free:   vehicles.filter(v => !v.customerId).length,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>🚗 Vehicle Management</Text>
          <Text style={styles.headerSub}>{vehicles.length} vehicles registered</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Loading vehicles...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id ?? item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchAll}
          refreshing={loading}
          ListHeaderComponent={
            <View>
              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.fleet}</Text>
                  <Text style={styles.statLabel}>Fleet</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: '#2E7D32' }]}>{stats.active}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: '#1565C0' }]}>{stats.free}</Text>
                  <Text style={styles.statLabel}>Free</Text>
                </View>
              </View>
              {/* Search */}
              <TextInput
                style={styles.searchInput}
                placeholder="🔍  Search by make, model or plate..."
                placeholderTextColor="#aaa"
                value={search}
                onChangeText={setSearch}
              />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🚗</Text>
              <Text style={styles.emptyTitle}>No vehicles yet</Text>
              <Text style={styles.emptyHint}>Tap "+ Add" to register your first vehicle</Text>
            </View>
          }
          renderItem={({ item }) => {
            const customerName = getCustomerName(item);
            const color = getAvatarColor(item.make + item.model);
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.avatar, { backgroundColor: color }]}>
                    <Text style={styles.avatarText}>{nameInitials(item.make)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.make} {item.model}</Text>
                    <Text style={styles.cardPlate}>🔖 {item.licensePlate}</Text>
                  </View>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{item.vehicleType}</Text>
                  </View>
                </View>
                {!!item.year  && <Text style={styles.cardDetail}>📅  {item.year}</Text>}
                {!!item.color && <Text style={styles.cardDetail}>🎨  {item.color}</Text>}
                {customerName  && <Text style={styles.cardDetail}>👤  {customerName}</Text>}
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                    <Text style={styles.editBtnText}>✏️  Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                    <Text style={styles.deleteBtnText}>🗑  Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>{editId ? '✏️  Edit Vehicle' : '🚗  Add New Vehicle'}</Text>

              {[
                { label: 'MAKE',          key: 'make',         placeholder: 'e.g. Toyota' },
                { label: 'MODEL',         key: 'model',        placeholder: 'e.g. Corolla' },
                { label: 'YEAR',          key: 'year',         placeholder: 'e.g. 2020', keyboard: 'numeric' },
                { label: 'LICENSE PLATE', key: 'licensePlate', placeholder: 'e.g. CAR-1234' },
                { label: 'COLOR',         key: 'color',        placeholder: 'e.g. White' },
              ].map(f => (
                <View key={f.key} style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={f.placeholder}
                    placeholderTextColor="#bbb"
                    keyboardType={f.keyboard ?? 'default'}
                    value={form[f.key]}
                    onChangeText={t => setField(f.key, t)}
                  />
                </View>
              ))}

              {/* Vehicle Type */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>VEHICLE TYPE</Text>
                <View style={styles.toggleRow}>
                  {VEHICLE_TYPES.map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.toggleBtn, form.vehicleType === t && styles.toggleBtnActive]}
                      onPress={() => setField('vehicleType', t)}
                    >
                      <Text style={[styles.toggleBtnText, form.vehicleType === t && styles.toggleBtnTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Assign to Customer */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>ASSIGN TO CUSTOMER</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.customerChip, !form.customerId && styles.customerChipActive]}
                    onPress={() => setField('customerId', '')}
                  >
                    <Text style={[styles.customerChipText, !form.customerId && styles.customerChipTextActive]}>None</Text>
                  </TouchableOpacity>
                  {customers.map(c => (
                    <TouchableOpacity
                      key={c._id ?? c.id}
                      style={[styles.customerChip, form.customerId === (c._id ?? c.id) && styles.customerChipActive]}
                      onPress={() => setField('customerId', c._id ?? c.id)}
                    >
                      <Text style={[styles.customerChipText, form.customerId === (c._id ?? c.id) && styles.customerChipTextActive]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)} disabled={saving}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
                  {saving
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.saveBtnText}>{editId ? '✅  Update' : '💾  Save'}</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: '#1565C0' },
  header:             { backgroundColor: '#1565C0', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:            { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.15)', justifyContent: 'center', alignItems: 'center' },
  backIcon:           { color: '#fff', fontSize: 18 },
  headerTitle:        { color: '#fff', fontSize: 17, fontWeight: '800' },
  headerSub:          { color: '#90CAF9', fontSize: 11, marginTop: 1 },
  addBtn:             { backgroundColor: '#0D47A1', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  addBtnText:         { color: '#fff', fontWeight: '800', fontSize: 13 },
  loadingWrap:        { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa', gap: 12 },
  loadingText:        { color: '#888', fontSize: 14 },
  listContent:        { backgroundColor: '#f5f7fa', paddingHorizontal: 14, paddingBottom: 30 },
  statsRow:           { flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 12 },
  statCard:           { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, alignItems: 'center', elevation: 2 },
  statValue:          { fontSize: 20, fontWeight: '800', color: '#0d1b4b' },
  statLabel:          { fontSize: 10, color: '#888', marginTop: 2 },
  searchInput:        { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: '#333', elevation: 1, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  card:               { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, elevation: 3 },
  cardHeader:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar:             { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  avatarText:         { color: '#fff', fontWeight: '800', fontSize: 15 },
  cardTitle:          { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  cardPlate:          { fontSize: 12, color: '#666', marginTop: 2 },
  typeBadge:          { backgroundColor: '#E3F2FD', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#90CAF9' },
  typeBadgeText:      { fontSize: 11, fontWeight: '700', color: '#0D47A1' },
  cardDetail:         { fontSize: 12, color: '#666', marginTop: 3 },
  cardActions:        { flexDirection: 'row', gap: 8, marginTop: 12 },
  editBtn:            { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: '#E3F2FD' },
  editBtnText:        { fontWeight: '700', fontSize: 12, color: '#1565C0' },
  deleteBtn:          { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: '#FFEBEE' },
  deleteBtnText:      { fontWeight: '700', fontSize: 12, color: '#C62828' },
  emptyState:         { alignItems: 'center', marginTop: 60 },
  emptyIcon:          { fontSize: 52, marginBottom: 12 },
  emptyTitle:         { color: '#555', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptyHint:          { color: '#aaa', fontSize: 13 },
  overlay:            { flex: 1, backgroundColor: 'rgba(0,0,0,.55)', justifyContent: 'flex-end' },
  sheet:              { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, maxHeight: '95%' },
  sheetHandle:        { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle:         { fontSize: 20, fontWeight: '800', color: '#1565C0', marginBottom: 20 },
  fieldWrap:          { marginBottom: 16 },
  fieldLabel:         { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  input:              { backgroundColor: '#f5f7fa', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#333' },
  toggleRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toggleBtn:          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#f5f7fa' },
  toggleBtnActive:    { backgroundColor: '#E3F2FD', borderColor: '#1565C0' },
  toggleBtnText:      { fontSize: 13, color: '#888' },
  toggleBtnTextActive:{ color: '#1565C0', fontWeight: '700' },
  customerChip:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#f5f7fa', marginRight: 8 },
  customerChipActive: { backgroundColor: '#E3F2FD', borderColor: '#1565C0' },
  customerChipText:   { fontSize: 13, color: '#888' },
  customerChipTextActive: { color: '#1565C0', fontWeight: '700' },
  modalBtns:          { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn:          { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center' },
  cancelBtnText:      { color: '#666', fontWeight: '600', fontSize: 15 },
  saveBtn:            { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#1565C0', alignItems: 'center' },
  saveBtnText:        { color: '#fff', fontWeight: '800', fontSize: 15 },
});
