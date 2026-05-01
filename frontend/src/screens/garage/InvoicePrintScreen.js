import SoundButton from "../../utils/SoundButton";
// InvoicePrintScreen.js
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Share, Alert, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InvoicePrintScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();

  // FinanceScreen invoice modal එකෙන් pass කරන data
  const { transaction, items, notes, invoiceNumber } = route.params ?? {};

  const subtotal = items?.reduce((s, i) => s + (Number(i.amount) || 0), 0) ?? 0;
  const today    = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const handleShare = async () => {
    const lines = [
      `INVOICE — ${invoiceNumber ?? 'INV-0001'}`,
      `Date: ${today}`,
      ``,
      `Billed To: ${transaction?.customerName}`,
      ``,
      `ITEMS`,
      ...(items ?? []).map(i => `  ${i.label.padEnd(25)} Rs. ${Number(i.amount).toLocaleString()}`),
      ``,
      `TOTAL: Rs. ${subtotal.toLocaleString()}`,
      ``,
      notes ? `Notes: ${notes}` : '',
    ].join('\n');

    try {
      await Share.share({ message: lines, title: `Invoice ${invoiceNumber}` });
    } catch (e) {
      Alert.alert('Error', 'Could not share invoice');
    }
  };

  return (
    <View style={[S.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1D3A" />

      {/* Top bar */}
      <View style={S.topBar}>
        <SoundButton onPress={() => navigation.goBack()}>
          <Text style={S.back}>← Back</Text>
        </SoundButton>
        <Text style={S.topTitle}>Invoice</Text>
        <SoundButton onPress={handleShare}>
          <Text style={S.shareBtn}>Share</Text>
        </SoundButton>
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Paper card */}
        <View style={S.paper}>

          {/* Header band */}
          <View style={S.invHeader}>
            <View style={S.invHeaderTop}>
              <View>
                <Text style={S.brand}>AUTO GARAGE</Text>
                <Text style={S.invNum}>{invoiceNumber ?? 'INV-0001'}</Text>
              </View>
              <View style={S.paidBadge}>
                <Text style={S.paidBadgeTxt}>PAID</Text>
              </View>
            </View>
            <Text style={S.invDate}>Date: {today}   ·   Due: On receipt</Text>
          </View>

          <View style={S.invBody}>

            {/* Billed to / From */}
            <View style={S.metaRow}>
              <View style={{ flex: 1 }}>
                <Text style={S.metaLabel}>BILLED TO</Text>
                <Text style={S.metaName}>{transaction?.customerName ?? '—'}</Text>
                <Text style={S.metaSub}>{transaction?.customerEmail ?? ''}</Text>
                <Text style={S.metaSub}>{transaction?.customerPhone ?? ''}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={S.metaLabel}>FROM</Text>
                <Text style={S.metaName}>Auto Garage</Text>
                <Text style={S.metaSub}>No. 45, Main Street</Text>
                <Text style={S.metaSub}>Colombo 05</Text>
              </View>
            </View>

            <View style={S.divider} />

            {/* Table header */}
            <View style={S.tableHead}>
              <Text style={[S.thCell, { flex: 3 }]}>SERVICE / ITEM</Text>
              <Text style={[S.thCell, { flex: 1, textAlign: 'center' }]}>QTY</Text>
              <Text style={[S.thCell, { flex: 2, textAlign: 'right' }]}>AMOUNT</Text>
            </View>

            {/* Table rows */}
            {(items ?? []).map((item, i) => (
              <View key={i} style={[S.tableRow, i % 2 === 0 && S.tableRowAlt]}>
                <Text style={[S.tdCell, { flex: 3 }]}>{item.label}</Text>
                <Text style={[S.tdCell, { flex: 1, textAlign: 'center', color: '#888' }]}>1</Text>
                <Text style={[S.tdCell, { flex: 2, textAlign: 'right', fontWeight: '600' }]}>
                  Rs. {Number(item.amount).toLocaleString()}
                </Text>
              </View>
            ))}

            {/* Totals */}
            <View style={S.totalsBox}>
              <View style={S.totalLine}>
                <Text style={S.totalKey}>Subtotal</Text>
                <Text style={S.totalVal}>Rs. {subtotal.toLocaleString()}</Text>
              </View>
              <View style={S.totalLine}>
                <Text style={S.totalKey}>Tax (0%)</Text>
                <Text style={S.totalVal}>Rs. 0</Text>
              </View>
              <View style={S.grandTotal}>
                <Text style={S.grandKey}>Total</Text>
                <Text style={S.grandVal}>Rs. {subtotal.toLocaleString()}</Text>
              </View>
            </View>

            {/* Notes */}
            {!!notes && (
              <View style={S.notesBox}>
                <Text style={S.notesLabel}>NOTES</Text>
                <Text style={S.notesTxt}>{notes}</Text>
              </View>
            )}

          </View>

          {/* Footer */}
          <View style={S.invFooter}>
            <View style={S.statusDot} />
            <Text style={S.footerTxt}>
              Payment confirmed — {transaction?.paymentMethod ?? 'Cash'}
            </Text>
          </View>

        </View>

        {/* Action buttons */}
        <View style={S.actionsRow}>
          <SoundButton style={S.btnPrint} onPress={handleShare}>
            <Text style={S.btnPrintTxt}>⬆ Share Invoice</Text>
          </SoundButton>
          <SoundButton style={S.btnBack} onPress={() => navigation.goBack()}>
            <Text style={S.btnBackTxt}>← Done</Text>
          </SoundButton>
        </View>

      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#0D1829' },
  scroll: { flex: 1, backgroundColor: '#0D1829' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0B1D3A', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)',
  },
  back:      { color: '#C9A84C', fontSize: 15, fontWeight: '700' },
  topTitle:  { color: '#fff', fontSize: 17, fontWeight: '800' },
  shareBtn:  { color: '#C9A84C', fontSize: 14, fontWeight: '700' },

  paper: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
  },

  invHeader:    { backgroundColor: '#0B1D3A', padding: 20 },
  invHeaderTop: { flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'flex-start', marginBottom: 10 },
  brand:        { color: '#C9A84C', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  invNum:       { color: '#8A9BB5', fontSize: 12, marginTop: 2 },
  paidBadge:    { backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1,
                  borderColor: '#C9A84C', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  paidBadgeTxt: { color: '#C9A84C', fontSize: 11, fontWeight: '700' },
  invDate:      { color: '#8A9BB5', fontSize: 12 },

  invBody: { padding: 18 },

  metaRow:   { flexDirection: 'row', marginBottom: 16 },
  metaLabel: { fontSize: 10, color: '#999', letterSpacing: 0.5, marginBottom: 4, fontWeight: '700' },
  metaName:  { fontSize: 13, color: '#111', fontWeight: '700' },
  metaSub:   { fontSize: 12, color: '#666' },

  divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 12 },

  tableHead: { flexDirection: 'row', marginBottom: 6 },
  thCell:    { fontSize: 10, color: '#999', letterSpacing: 0.5, fontWeight: '700' },

  tableRow:    { flexDirection: 'row', paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#f5f5f5' },
  tableRowAlt: { backgroundColor: '#fafafa' },
  tdCell:      { fontSize: 13, color: '#222' },

  totalsBox:  { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  totalLine:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalKey:   { fontSize: 13, color: '#777' },
  totalVal:   { fontSize: 13, color: '#333' },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between',
                backgroundColor: '#0B1D3A', padding: 12, borderRadius: 10, marginTop: 8 },
  grandKey:   { fontSize: 15, color: '#fff', fontWeight: '700' },
  grandVal:   { fontSize: 15, color: '#C9A84C', fontWeight: '800' },

  notesBox:   { marginTop: 14, backgroundColor: '#f8f8f8', borderRadius: 10, padding: 12 },
  notesLabel: { fontSize: 10, color: '#999', letterSpacing: 0.5, fontWeight: '700', marginBottom: 4 },
  notesTxt:   { fontSize: 13, color: '#555' },

  invFooter:  { borderTopWidth: 1, borderTopColor: '#f0f0f0', padding: 12,
                flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  footerTxt:  { fontSize: 12, color: '#888' },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btnPrint:   { flex: 1, backgroundColor: '#C9A84C', borderRadius: 12,
                paddingVertical: 13, alignItems: 'center' },
  btnPrintTxt:{ color: '#0B1D3A', fontSize: 14, fontWeight: '800' },
  btnBack:    { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1,
                borderColor: 'rgba(201,168,76,0.3)', borderRadius: 12,
                paddingVertical: 13, alignItems: 'center' },
  btnBackTxt: { color: '#C9A84C', fontSize: 14, fontWeight: '700' },
});