<<<<<<< HEAD
=======
import SoundButton from "../../utils/SoundButton";
>>>>>>> dev
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, ActivityIndicator, Alert, TextInput, Modal, Platform
} from 'react-native';
import api from '../../utils/api';

const COLORS = {
  navy:    '#0B1D3A', navyMid: '#132847', gold: '#C9A84C',
  white:   '#FFFFFF', gray: '#8A9BB5',    cardBg: '#162040',
};

const Stars = ({ rating, onSelect, size = 28 }) => (
  <View style={{ flexDirection: 'row', gap: 6 }}>
    {[1,2,3,4,5].map(s => (
<<<<<<< HEAD
      <TouchableOpacity key={s} onPress={() => onSelect && onSelect(s)} activeOpacity={0.7}>
        <Text style={{ fontSize: size, color: s <= rating ? COLORS.gold : 'rgba(201,168,76,0.2)' }}>★</Text>
      </TouchableOpacity>
=======
      <SoundButton key={s} onPress={() => onSelect && onSelect(s)} activeOpacity={0.7}>
        <Text style={{ fontSize: size, color: s <= rating ? COLORS.gold : 'rgba(201,168,76,0.2)' }}>★</Text>
      </SoundButton>
>>>>>>> dev
    ))}
  </View>
);

export default function CustomerFeedbackScreen({ navigation }) {
  const [garages,   setGarages]   = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState({ garageId: '', rating: 5, comment: '' });

  const fetchData = async () => {
    try {
      const [gRes, rRes] = await Promise.all([
<<<<<<< HEAD
        api.get('/customer/garages'),
        api.get('/customer/my-reviews'),
      ]);
      setGarages(gRes.data); setMyReviews(rRes.data);
=======
        api.get('/customer/visited-garages'), // ✅ visited garages පමණයි
        api.get('/customer/my-reviews'),
      ]);
      setGarages(gRes.data);
      setMyReviews(rRes.data);
>>>>>>> dev
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!form.garageId) { Alert.alert('Error', 'Please select a garage'); return; }
    try {
      setSaving(true);
      await api.post('/customer/reviews', form);
      Alert.alert('Success! ⭐', 'Your feedback has been submitted!');
<<<<<<< HEAD
      setModal(false); setForm({ garageId: '', rating: 5, comment: '' });
=======
      setModal(false);
      setForm({ garageId: '', rating: 5, comment: '' });
>>>>>>> dev
      fetchData();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not submit feedback');
    } finally { setSaving(false); }
  };

  if (loading) {
<<<<<<< HEAD
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.gold} /></View>;
=======
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
>>>>>>> dev
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      <View style={styles.header}>
<<<<<<< HEAD
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Feedback</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
=======
        <SoundButton onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </SoundButton>
        <Text style={styles.title}>Feedback</Text>
        <SoundButton style={styles.addBtn} onPress={() => setModal(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </SoundButton>
>>>>>>> dev
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16 }}>
        {myReviews.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptyText}>Share your experience with a garage!</Text>
<<<<<<< HEAD
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setModal(true)}>
              <Text style={styles.emptyBtnText}>Write a Review</Text>
            </TouchableOpacity>
=======
            <SoundButton style={styles.emptyBtn} onPress={() => setModal(true)}>
              <Text style={styles.emptyBtnText}>Write a Review</Text>
            </SoundButton>
>>>>>>> dev
          </View>
        ) : (
          myReviews.map((r, i) => (
            <View key={i} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <Text style={styles.garageName}>{r.garageName ?? 'Garage'}</Text>
                <Stars rating={r.rating} size={18} />
              </View>
              {r.comment
                ? <Text style={styles.comment}>"{r.comment}"</Text>
                : null}
              <Text style={styles.reviewDate}>
                {new Date(r.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Write a Review ⭐</Text>

            <Text style={styles.label}>Select Garage *</Text>
<<<<<<< HEAD
            <ScrollView style={{ maxHeight: 160, marginBottom: 16 }} nestedScrollEnabled>
              {garages.map(g => (
                <TouchableOpacity key={g._id}
                  style={[styles.garageOption, form.garageId === g._id && styles.garageOptionActive]}
                  onPress={() => setForm(p => ({ ...p, garageId: g._id }))}>
                  <Text style={[styles.garageOptionText,
                    form.garageId === g._id && styles.garageOptionTextActive]}>
                    🏪 {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
=======

            {/* ✅ Garage නැත්නම් message පෙන්වනවා */}
            {garages.length === 0 ? (
              <View style={{ padding: 16, alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ color: COLORS.gray, fontSize: 13, textAlign: 'center' }}>
                  📋 You haven't visited any garages yet.{'\n'}Book a service first!
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 160, marginBottom: 16 }} nestedScrollEnabled>
                {garages.map(g => (
                  <SoundButton
                    key={String(g._id)}
                    style={[
                      styles.garageOption,
                      String(form.garageId) === String(g._id) && styles.garageOptionActive,
                    ]}
                    onPress={() => setForm(p => ({ ...p, garageId: g._id }))}>
                    <Text style={[
                      styles.garageOptionText,
                      String(form.garageId) === String(g._id) && styles.garageOptionTextActive,
                    ]}>
                      🏪 {g.name}
                    </Text>
                  </SoundButton>
                ))}
              </ScrollView>
            )}
>>>>>>> dev

            <Text style={styles.label}>Rating *</Text>
            <View style={{ marginBottom: 16 }}>
              <Stars rating={form.rating} onSelect={v => setForm(p => ({ ...p, rating: v }))} />
            </View>

            <Text style={styles.label}>Comment (Optional)</Text>
<<<<<<< HEAD
            <TextInput style={styles.input} placeholder="Share your experience..."
              placeholderTextColor={COLORS.gray} multiline
              value={form.comment} onChangeText={v => setForm(p => ({ ...p, comment: v }))} />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
=======
            <TextInput
              style={styles.input}
              placeholder="Share your experience..."
              placeholderTextColor={COLORS.gray}
              multiline
              value={form.comment}
              onChangeText={v => setForm(p => ({ ...p, comment: v }))}
            />

            <View style={styles.modalBtns}>
              <SoundButton style={styles.cancelBtn} onPress={() => setModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </SoundButton>
              <SoundButton
                style={[styles.submitBtn, garages.length === 0 && { opacity: 0.4 }]}
                onPress={handleSubmit}
                disabled={saving || garages.length === 0}
              >
>>>>>>> dev
                {saving
                  ? <ActivityIndicator color={COLORS.navy} />
                  : <Text style={styles.submitBtnText}>Submit ⭐</Text>
                }
<<<<<<< HEAD
              </TouchableOpacity>
=======
              </SoundButton>
>>>>>>> dev
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:                   { flex: 1, backgroundColor: COLORS.navy,
                            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
<<<<<<< HEAD
  center:                 { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.navy },
=======
  center:                 { flex: 1, justifyContent: 'center', alignItems: 'center',
                            backgroundColor: COLORS.navy },
>>>>>>> dev
  header:                 { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            backgroundColor: COLORS.navy, paddingHorizontal: 16, paddingVertical: 16,
                            borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)' },
  backBtn:                { width: 60 },
  backText:               { color: COLORS.gold, fontWeight: '700', fontSize: 15 },
  title:                  { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  addBtn:                 { backgroundColor: COLORS.gold, borderRadius: 10,
                            paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText:             { color: COLORS.navy, fontWeight: '800', fontSize: 13 },
  scroll:                 { flex: 1, backgroundColor: '#0D1829' },
  emptyBox:               { alignItems: 'center', marginTop: 60 },
  emptyIcon:              { fontSize: 52, marginBottom: 12 },
  emptyTitle:             { fontSize: 18, fontWeight: '800', color: COLORS.white, marginBottom: 6 },
  emptyText:              { fontSize: 14, color: COLORS.gray, marginBottom: 20 },
  emptyBtn:               { backgroundColor: COLORS.gold, borderRadius: 14,
                            paddingHorizontal: 28, paddingVertical: 14 },
  emptyBtnText:           { color: COLORS.navy, fontWeight: '900', fontSize: 15 },
  reviewCard:             { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16,
                            marginBottom: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)' },
  reviewTop:              { flexDirection: 'row', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: 8 },
  garageName:             { fontSize: 15, fontWeight: '700', color: COLORS.white },
  comment:                { fontSize: 14, color: COLORS.gray, fontStyle: 'italic', marginBottom: 6 },
  reviewDate:             { fontSize: 12, color: 'rgba(138,155,181,0.6)' },
  modalOverlay:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox:               { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 24,
                            borderTopRightRadius: 24, padding: 24, maxHeight: '85%',
                            borderTopWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  modalTitle:             { fontSize: 20, fontWeight: '800', color: COLORS.white, marginBottom: 16 },
  label:                  { fontSize: 11, fontWeight: '700', color: COLORS.gold,
                            marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  garageOption:           { padding: 12, borderRadius: 10, borderWidth: 1.5,
                            borderColor: 'rgba(201,168,76,0.15)',
                            backgroundColor: COLORS.navyMid, marginBottom: 8 },
  garageOptionActive:     { borderColor: COLORS.gold, backgroundColor: 'rgba(201,168,76,0.1)' },
  garageOptionText:       { fontSize: 14, color: COLORS.gray },
  garageOptionTextActive: { color: COLORS.gold, fontWeight: '700' },
<<<<<<< HEAD
  input:                  { backgroundColor: COLORS.navyMid, borderRadius: 12, paddingHorizontal: 14,
                            paddingVertical: 12, fontSize: 15, color: COLORS.white,
                            borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)', marginBottom: 16,
=======
  input:                  { backgroundColor: COLORS.navyMid, borderRadius: 12,
                            paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
                            color: COLORS.white, borderWidth: 1,
                            borderColor: 'rgba(201,168,76,0.2)', marginBottom: 16,
>>>>>>> dev
                            minHeight: 80, textAlignVertical: 'top' },
  modalBtns:              { flexDirection: 'row', gap: 12 },
  cancelBtn:              { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center',
                            borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.2)' },
  cancelBtnText:          { color: COLORS.gray, fontWeight: '700' },
  submitBtn:              { flex: 1, backgroundColor: COLORS.gold, borderRadius: 12,
                            paddingVertical: 14, alignItems: 'center' },
  submitBtnText:          { color: COLORS.navy, fontWeight: '900' },
});