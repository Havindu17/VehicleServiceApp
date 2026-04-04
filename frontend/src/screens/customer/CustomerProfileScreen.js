import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, ActivityIndicator, Alert, Modal, Platform
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const COLORS = {
  navy:    '#0B1D3A', navyMid: '#132847', gold: '#C9A84C',
  white:   '#FFFFFF', gray: '#8A9BB5',    cardBg: '#162040',
  error:   '#EF4444', success: '#16A34A',
};

const VEHICLE_TYPES = ['Car', 'Van', 'Bus', 'Truck', 'Motorcycle'];
const MAKES = ['Toyota','Honda','Nissan','Suzuki','Mitsubishi','Mazda','Hyundai','Kia','BMW','Mercedes','Audi','Ford'];
const MODELS_BY_MAKE = {
  Toyota:['Corolla','Camry','Prius','Aqua','Vitz','Axio','Fielder','Land Cruiser','Hilux','Rush'],
  Honda:['Civic','Fit','Grace','Vezel','HR-V','CR-V','Accord','City','Jazz'],
  Nissan:['Sunny','Tiida','X-Trail','Leaf','Note','Dayz','Navara'],
  Suzuki:['Alto','Swift','Wagon R','Jimny','Vitara','Baleno','Ciaz'],
  Mitsubishi:['Lancer','Outlander','Montero','L200','Attrage','Mirage'],
  Mazda:['Demio','Axela','CX-5','CX-3','Atenza'],
  Hyundai:['i10','i20','Accent','Elantra','Tucson','Santa Fe'],
  Kia:['Picanto','Rio','Sportage','Sorento','Cerato'],
  BMW:['320i','520i','X3','X5','116i'],
  Mercedes:['C200','E200','GLA','CLA','A180'],
  Audi:['A3','A4','A6','Q3','Q5'],
  Ford:['Fiesta','Focus','EcoSport','Ranger','Everest'],
};
const YEARS  = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));
const COL    = ['White','Black','Silver','Blue','Red','Grey','Green','Brown','Orange','Yellow'];
const EMPTY_V = { make:'', model:'', year:'', licensePlate:'', color:'', vehicleType:'Car' };

function DropdownModal({ visible, title, items, selected, onSelect, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.dropOverlay}>
        <View style={styles.dropBox}>
          <View style={styles.dropHeader}>
            <Text style={styles.dropTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.dropClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView>
            {items.map(item => (
              <TouchableOpacity key={item}
                style={[styles.dropItem, selected === item && styles.dropItemActive]}
                onPress={() => { onSelect(item); onClose(); }}>
                <Text style={[styles.dropItemText, selected === item && styles.dropItemTextActive]}>{item}</Text>
                {selected === item && <Text style={styles.dropCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function CustomerProfileScreen({ navigation }) {
  const { logout } = useAuth();
  const [profile,  setProfile]  = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({});
  const [vModal,   setVModal]   = useState(false);
  const [vForm,    setVForm]    = useState(EMPTY_V);
  const [vSaving,  setVSaving]  = useState(false);
  const [drop,     setDrop]     = useState(null);

  const fetchData = async () => {
    try {
      const [pRes, vRes] = await Promise.all([
        api.get('/customer/profile'),
        api.get('/customer/vehicles'),
      ]);
      setProfile(pRes.data); setForm(pRes.data); setVehicles(vRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/customer/profile', form);
      setProfile(form); setEditing(false);
      Alert.alert('Success ✅', 'Profile updated!');
    } catch { Alert.alert('Error', 'Could not update profile'); }
    finally { setSaving(false); }
  };

  const handleAddVehicle = async () => {
    if (!vForm.make || !vForm.model || !vForm.licensePlate) {
      Alert.alert('Error', 'Make, model and license plate are required');
      return;
    }
    try {
      setVSaving(true);
      const res = await api.post('/customer/vehicles', vForm);
      setVehicles(prev => [...prev, res.data]);
      setVModal(false); setVForm(EMPTY_V);
    } catch (e) { Alert.alert('Error', e?.response?.data?.message ?? 'Could not add vehicle'); }
    finally { setVSaving(false); }
  };

  const handleDeleteVehicle = (id) => {
    Alert.alert('Delete Vehicle', 'Remove this vehicle?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          await api.delete(`/customer/vehicles/${id}`);
          setVehicles(prev => prev.filter(v => v._id !== id));
        }
      }
    ]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.gold} /></View>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity
          onPress={editing ? handleSave : () => setEditing(true)}
          style={[styles.editBtn, editing && styles.saveBtn]} disabled={saving}>
          {saving
            ? <ActivityIndicator color={COLORS.navy} size="small" />
            : <Text style={[styles.editBtnText, editing && { color: COLORS.navy }]}>
                {editing ? 'Save' : 'Edit'}
              </Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16 }}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{profile?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <Text style={styles.profileName}>{profile?.name}</Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>Personal Info</Text>
          </View>
          {[
            { label: 'Full Name', key: 'name' },
            { label: 'Email',     key: 'email' },
            { label: 'Phone',     key: 'phone',   keyboard: 'phone-pad' },
            { label: 'Address',   key: 'address' },
          ].map(f => (
            <View key={f.key} style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              {editing ? (
                <TextInput style={styles.fieldInput}
                  value={form[f.key] ?? ''}
                  onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                  keyboardType={f.keyboard ?? 'default'}
                  placeholderTextColor={COLORS.gray}
                  selectionColor={COLORS.gold} />
              ) : (
                <Text style={styles.fieldValue}>{profile?.[f.key] ?? '—'}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Vehicles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>My Vehicles</Text>
            <TouchableOpacity style={styles.addVehicleBtn} onPress={() => setVModal(true)}>
              <Text style={styles.addVehicleText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {vehicles.length === 0 ? (
            <Text style={styles.noVehicle}>No vehicles added yet</Text>
          ) : (
            vehicles.map((v, i) => (
              <View key={i} style={styles.vehicleCard}>
                <View style={styles.vehicleIconBg}>
                  <Text style={{ fontSize: 22 }}>🚗</Text>
                </View>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleModel}>{v.make} {v.model}</Text>
                  <Text style={styles.vehicleMeta}>{v.year}  ·  {v.licensePlate}  ·  {v.color}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteVehicle(v._id)}
                  style={styles.deleteVehicleBtn}>
                  <Text style={{ fontSize: 16 }}>🗑</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>🚪  Logout</Text>
        </TouchableOpacity>
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Add Vehicle Modal */}
      <Modal visible={vModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Vehicle 🚗</Text>

            <Text style={styles.modalLabel}>Make *</Text>
            <TouchableOpacity style={styles.dropTrigger} onPress={() => setDrop('make')}>
              <Text style={vForm.make ? styles.dropTriggerText : styles.dropTriggerPlaceholder}>
                {vForm.make || 'Select make...'}
              </Text>
              <Text style={styles.dropArrow}>▾</Text>
            </TouchableOpacity>

            <Text style={styles.modalLabel}>Model *</Text>
            <TouchableOpacity
              style={[styles.dropTrigger, !vForm.make && styles.dropTriggerDisabled]}
              onPress={() => vForm.make && setDrop('model')}>
              <Text style={vForm.model ? styles.dropTriggerText : styles.dropTriggerPlaceholder}>
                {vForm.model || 'Select model...'}
              </Text>
              <Text style={styles.dropArrow}>▾</Text>
            </TouchableOpacity>

            <Text style={styles.modalLabel}>Year</Text>
            <TouchableOpacity style={styles.dropTrigger} onPress={() => setDrop('year')}>
              <Text style={vForm.year ? styles.dropTriggerText : styles.dropTriggerPlaceholder}>
                {vForm.year || 'Select year...'}
              </Text>
              <Text style={styles.dropArrow}>▾</Text>
            </TouchableOpacity>

            <Text style={styles.modalLabel}>License Plate *</Text>
            <TextInput style={styles.modalInput} placeholder="WP ABC 1234"
              placeholderTextColor={COLORS.gray} value={vForm.licensePlate}
              onChangeText={v => setVForm(p => ({ ...p, licensePlate: v }))} />

            <Text style={styles.modalLabel}>Color</Text>
            <TouchableOpacity style={styles.dropTrigger} onPress={() => setDrop('color')}>
              <Text style={vForm.color ? styles.dropTriggerText : styles.dropTriggerPlaceholder}>
                {vForm.color || 'Select color...'}
              </Text>
              <Text style={styles.dropArrow}>▾</Text>
            </TouchableOpacity>

            <Text style={styles.modalLabel}>Vehicle Type *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {VEHICLE_TYPES.map(t => (
                  <TouchableOpacity key={t}
                    style={[styles.typeChip, vForm.vehicleType === t && styles.typeChipActive]}
                    onPress={() => setVForm(p => ({ ...p, vehicleType: t }))}>
                    <Text style={[styles.typeChipText, vForm.vehicleType === t && styles.typeChipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelModalBtn}
                onPress={() => { setVModal(false); setVForm(EMPTY_V); }}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={handleAddVehicle} disabled={vSaving}>
                {vSaving
                  ? <ActivityIndicator color={COLORS.navy} />
                  : <Text style={styles.saveModalText}>Add Vehicle</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DropdownModal visible={drop === 'make'} title="Select Make" items={MAKES}
        selected={vForm.make} onSelect={v => setVForm(p => ({ ...p, make: v, model: '' }))}
        onClose={() => setDrop(null)} />
      <DropdownModal visible={drop === 'model'} title="Select Model"
        items={MODELS_BY_MAKE[vForm.make] ?? []}
        selected={vForm.model} onSelect={v => setVForm(p => ({ ...p, model: v }))}
        onClose={() => setDrop(null)} />
      <DropdownModal visible={drop === 'year'} title="Select Year" items={YEARS}
        selected={vForm.year} onSelect={v => setVForm(p => ({ ...p, year: v }))}
        onClose={() => setDrop(null)} />
      <DropdownModal visible={drop === 'color'} title="Select Color" items={COL}
        selected={vForm.color} onSelect={v => setVForm(p => ({ ...p, color: v }))}
        onClose={() => setDrop(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: COLORS.navy,
                       paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  center:            { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.navy },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                       backgroundColor: COLORS.navy, paddingHorizontal: 16, paddingVertical: 16,
                       borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)' },
  backBtn:           { width: 60 },
  backText:          { color: COLORS.gold, fontWeight: '700', fontSize: 15 },
  title:             { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  editBtn:           { backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 10,
                       paddingHorizontal: 16, paddingVertical: 7,
                       borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  saveBtn:           { backgroundColor: COLORS.gold },
  editBtnText:       { color: COLORS.gold, fontWeight: '700', fontSize: 14 },
  scroll:            { flex: 1, backgroundColor: '#0D1829' },
  avatarSection:     { alignItems: 'center', marginVertical: 24 },
  avatar:            { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.cardBg,
                       justifyContent: 'center', alignItems: 'center', marginBottom: 12,
                       borderWidth: 2, borderColor: COLORS.gold },
  avatarLetter:      { fontSize: 44, fontWeight: '800', color: COLORS.gold },
  profileName:       { fontSize: 22, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  profileEmail:      { fontSize: 14, color: COLORS.gray },
  section:           { backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 16,
                       marginBottom: 14, borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)' },
  sectionHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionAccent:     { width: 4, height: 18, backgroundColor: COLORS.gold, borderRadius: 2, marginRight: 10 },
  sectionTitle:      { fontSize: 14, fontWeight: '800', color: COLORS.white, flex: 1 },
  addVehicleBtn:     { backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 8,
                       paddingHorizontal: 12, paddingVertical: 5,
                       borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  addVehicleText:    { color: COLORS.gold, fontWeight: '700', fontSize: 13 },
  fieldBox:          { marginBottom: 14 },
  fieldLabel:        { fontSize: 11, fontWeight: '700', color: COLORS.gold,
                       marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue:        { fontSize: 15, color: COLORS.white, fontWeight: '500' },
  fieldInput:        { backgroundColor: COLORS.navyMid, borderRadius: 10, paddingHorizontal: 12,
                       paddingVertical: 10, fontSize: 15, color: COLORS.white,
                       borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  noVehicle:         { fontSize: 14, color: COLORS.gray, textAlign: 'center', paddingVertical: 10 },
  vehicleCard:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
                       borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.08)' },
  vehicleIconBg:     { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(201,168,76,0.1)',
                       justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  vehicleInfo:       { flex: 1 },
  vehicleModel:      { fontSize: 15, fontWeight: '700', color: COLORS.white },
  vehicleMeta:       { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  deleteVehicleBtn:  { padding: 8 },
  logoutBtn:         { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 14, paddingVertical: 15,
                       alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  logoutText:        { color: COLORS.error, fontWeight: '700', fontSize: 15 },
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox:          { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                       padding: 24, maxHeight: '90%',
                       borderTopWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  modalTitle:        { fontSize: 20, fontWeight: '800', color: COLORS.white, marginBottom: 16 },
  modalLabel:        { fontSize: 11, fontWeight: '700', color: COLORS.gold,
                       marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInput:        { backgroundColor: COLORS.navyMid, borderRadius: 12, paddingHorizontal: 14,
                       paddingVertical: 12, fontSize: 15, color: COLORS.white,
                       borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)', marginBottom: 12 },
  dropTrigger:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                       backgroundColor: COLORS.navyMid, borderRadius: 12, paddingHorizontal: 14,
                       paddingVertical: 12, borderWidth: 1,
                       borderColor: 'rgba(201,168,76,0.2)', marginBottom: 12 },
  dropTriggerDisabled:{ opacity: 0.4 },
  dropTriggerText:   { fontSize: 15, color: COLORS.white, fontWeight: '500' },
  dropTriggerPlaceholder:{ fontSize: 15, color: COLORS.gray },
  dropArrow:         { fontSize: 16, color: COLORS.gold },
  typeChip:          { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
                       borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.2)',
                       backgroundColor: COLORS.navyMid },
  typeChipActive:    { borderColor: COLORS.gold, backgroundColor: 'rgba(201,168,76,0.1)' },
  typeChipText:      { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  typeChipTextActive:{ color: COLORS.gold, fontWeight: '800' },
  modalBtns:         { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelModalBtn:    { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center',
                       borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.2)' },
  cancelModalText:   { color: COLORS.gray, fontWeight: '700' },
  saveModalBtn:      { flex: 1, backgroundColor: COLORS.gold, borderRadius: 12,
                       paddingVertical: 14, alignItems: 'center' },
  saveModalText:     { color: COLORS.navy, fontWeight: '900' },
  dropOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  dropBox:           { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                       maxHeight: '60%', borderTopWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  dropHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                       padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.1)' },
  dropTitle:         { fontSize: 18, fontWeight: '800', color: COLORS.white },
  dropClose:         { fontSize: 18, color: COLORS.gray },
  dropItem:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                       paddingHorizontal: 20, paddingVertical: 14,
                       borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.05)' },
  dropItemActive:    { backgroundColor: 'rgba(201,168,76,0.08)' },
  dropItemText:      { fontSize: 15, color: COLORS.gray },
  dropItemTextActive:{ color: COLORS.gold, fontWeight: '700' },
  dropCheck:         { color: COLORS.gold, fontWeight: '800', fontSize: 16 },
});