import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, FlatList, ActivityIndicator, Alert, Modal
} from 'react-native';
import api from '../../utils/api';

const EMPTY_SERVICE = { name: '', description: '', price: '', duration: '', category: '' };

export default function ServiceManagementScreen({ navigation }) {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null); // null = add new
  const [form,     setForm]     = useState(EMPTY_SERVICE);
  const [saving,   setSaving]   = useState(false);

  const fetchServices = async () => {
    try {
      const res = await api.get('/garage/services');
      setServices(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchServices(); }, []);

  const openAdd  = () => { setEditing(null); setForm(EMPTY_SERVICE); setModal(true); };
  const openEdit = (svc) => { setEditing(svc._id); setForm({ name: svc.name, description: svc.description, price: String(svc.price), duration: String(svc.duration), category: svc.category }); setModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      Alert.alert('Error', 'Name and price are required');
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        await api.put(`/garage/services/${editing}`, form);
      } else {
        await api.post('/garage/services', form);
      }
      setModal(false);
      fetchServices();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not save service');
    } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Service', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/garage/services/${id}`);
            setServices(prev => prev.filter(s => s._id !== id));
          } catch { Alert.alert('Error', 'Could not delete'); }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={styles.serviceName}>{item.name}</Text>
          {item.category ? <Text style={styles.category}>{item.category}</Text> : null}
        </View>
        <Text style={styles.price}>Rs. {item.price}</Text>
      </View>
      {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
      {item.duration ? <Text style={styles.duration}>⏱ {item.duration} mins</Text> : null}
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
          <Text style={styles.editBtnText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
          <Text style={styles.deleteBtnText}>🗑 Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a1628" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Services</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={s => s._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔧</Text>
              <Text style={styles.emptyText}>No services yet</Text>
              <TouchableOpacity style={styles.addFirstBtn} onPress={openAdd}>
                <Text style={styles.addFirstText}>Add Your First Service</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Service' : 'Add New Service'}</Text>

            {[
              { label: 'Service Name *', key: 'name', placeholder: 'e.g. Oil Change' },
              { label: 'Category',       key: 'category', placeholder: 'e.g. Maintenance' },
              { label: 'Price (Rs.) *',  key: 'price', placeholder: '0', keyboard: 'numeric' },
              { label: 'Duration (min)', key: 'duration', placeholder: '60', keyboard: 'numeric' },
              { label: 'Description',    key: 'description', placeholder: 'Short description...' },
            ].map(f => (
              <View key={f.key}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={f.placeholder}
                  placeholderTextColor="#aaa"
                  keyboardType={f.keyboard ?? 'default'}
                  value={form[f.key]}
                  onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                />
              </View>
            ))}

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModal(false)}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f0f4ff' },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: '#0a1628', paddingHorizontal: 16, paddingVertical: 16 },
  backBtn:        { width: 60 },
  backText:       { color: '#4a90d9', fontWeight: '700', fontSize: 15 },
  title:          { color: '#fff', fontSize: 18, fontWeight: '800' },
  addBtn:         { backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  card:           { backgroundColor: '#fff', borderRadius: 16, padding: 16,
                    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardLeft:       { flex: 1 },
  serviceName:    { fontSize: 16, fontWeight: '800', color: '#0a1628' },
  category:       { fontSize: 12, color: '#2563eb', marginTop: 2, fontWeight: '600' },
  price:          { fontSize: 18, fontWeight: '800', color: '#16a34a' },
  desc:           { fontSize: 13, color: '#888', marginBottom: 4 },
  duration:       { fontSize: 13, color: '#555', marginBottom: 8 },
  btnRow:         { flexDirection: 'row', gap: 10, marginTop: 8 },
  editBtn:        { flex: 1, backgroundColor: '#eff6ff', borderRadius: 10, paddingVertical: 9,
                    alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  editBtnText:    { color: '#2563eb', fontWeight: '700', fontSize: 13 },
  deleteBtn:      { flex: 1, backgroundColor: '#fff1f2', borderRadius: 10, paddingVertical: 9,
                    alignItems: 'center', borderWidth: 1, borderColor: '#fecdd3' },
  deleteBtnText:  { color: '#ef4444', fontWeight: '700', fontSize: 13 },
  empty:          { alignItems: 'center', paddingTop: 60 },
  emptyIcon:      { fontSize: 48, marginBottom: 12 },
  emptyText:      { fontSize: 16, color: '#aaa', marginBottom: 16 },
  addFirstBtn:    { backgroundColor: '#2563eb', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  addFirstText:   { color: '#fff', fontWeight: '700' },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:       { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle:     { fontSize: 20, fontWeight: '800', color: '#0a1628', marginBottom: 16 },
  label:          { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  input:          { backgroundColor: '#f5f7fa', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
                    fontSize: 15, color: '#333', borderWidth: 1, borderColor: '#e8e8e8', marginBottom: 12 },
  modalBtns:      { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelModalBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center',
                    borderWidth: 1.5, borderColor: '#e8e8e8' },
  cancelModalText:{ color: '#888', fontWeight: '700' },
  saveBtn:        { flex: 1, backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText:    { color: '#fff', fontWeight: '800', fontSize: 15 },
});