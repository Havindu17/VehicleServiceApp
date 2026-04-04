import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, ActivityIndicator, RefreshControl
} from 'react-native';
import api from '../../utils/api';

const PERIODS = ['Today', 'Week', 'Month', 'Year'];

export default function FinanceScreen({ navigation }) {
  const [period,  setPeriod]  = useState('Month');
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  const fetchFinance = async () => {
    try {
      const res = await api.get(`/garage/finance?period=${period.toLowerCase()}`);
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefresh(false); }
  };

  useEffect(() => { setLoading(true); fetchFinance(); }, [period]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a1628" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Finance</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Period Tabs */}
      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodTab, period === p && styles.periodTabActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); fetchFinance(); }} />}
        >
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            {[
              { label: 'Total Revenue',  value: `Rs. ${data?.totalRevenue ?? 0}`,  icon: '💰', color: '#16a34a' },
              { label: 'Completed Jobs', value: data?.completedJobs ?? 0,           icon: '✅', color: '#2563eb' },
              { label: 'Avg per Job',    value: `Rs. ${data?.avgPerJob ?? 0}`,      icon: '📊', color: '#7c3aed' },
              { label: 'Pending Value',  value: `Rs. ${data?.pendingValue ?? 0}`,   icon: '⏳', color: '#f59e0b' },
            ].map((s, i) => (
              <View key={i} style={[styles.summaryCard, { borderLeftColor: s.color }]}>
                <Text style={styles.summaryIcon}>{s.icon}</Text>
                <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.summaryLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Revenue by Service */}
          <Text style={styles.sectionTitle}>Revenue by Service</Text>
          <View style={styles.tableBox}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 2, color: '#888' }]}>Service</Text>
              <Text style={[styles.tableCell, { color: '#888' }]}>Jobs</Text>
              <Text style={[styles.tableCell, { color: '#888', textAlign: 'right' }]}>Revenue</Text>
            </View>
            {(data?.byService ?? []).map((row, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>{row.name}</Text>
                <Text style={styles.tableCell}>{row.count}</Text>
                <Text style={[styles.tableCell, { color: '#16a34a', fontWeight: '700', textAlign: 'right' }]}>
                  Rs. {row.revenue}
                </Text>
              </View>
            ))}
            {(!data?.byService || data.byService.length === 0) && (
              <Text style={styles.noData}>No data for this period</Text>
            )}
          </View>

          {/* Recent Transactions */}
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {(data?.transactions ?? []).map((t, i) => (
            <View key={i} style={styles.txCard}>
              <View style={styles.txLeft}>
                <Text style={styles.txName}>{t.customerName}</Text>
                <Text style={styles.txService}>{t.service}</Text>
                <Text style={styles.txDate}>{t.date}</Text>
              </View>
              <Text style={styles.txAmount}>+ Rs. {t.amount}</Text>
            </View>
          ))}
          {(!data?.transactions || data.transactions.length === 0) && (
            <View style={styles.emptyTx}>
              <Text style={styles.emptyTxText}>No transactions this period</Text>
            </View>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      )}
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
  periodRow:      { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16,
                    paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: '#e8e8e8' },
  periodTab:      { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10, backgroundColor: '#f5f7fa' },
  periodTabActive:{ backgroundColor: '#2563eb' },
  periodText:     { fontSize: 13, fontWeight: '600', color: '#888' },
  periodTextActive:{ color: '#fff' },
  summaryRow:     { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  summaryCard:    { width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 14,
                    borderLeftWidth: 4,
                    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  summaryIcon:    { fontSize: 22, marginBottom: 6 },
  summaryValue:   { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  summaryLabel:   { fontSize: 11, color: '#888' },
  sectionTitle:   { fontSize: 16, fontWeight: '800', color: '#0a1628',
                    marginHorizontal: 16, marginTop: 8, marginBottom: 10 },
  tableBox:       { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 14,
                    overflow: 'hidden', marginBottom: 16,
                    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  tableHeader:    { flexDirection: 'row', backgroundColor: '#f5f7fa', padding: 12 },
  tableRow:       { flexDirection: 'row', padding: 12 },
  tableRowAlt:    { backgroundColor: '#fafafa' },
  tableCell:      { flex: 1, fontSize: 13, color: '#333' },
  noData:         { padding: 20, textAlign: 'center', color: '#aaa' },
  txCard:         { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff',
                    borderRadius: 14, padding: 14, flexDirection: 'row',
                    justifyContent: 'space-between', alignItems: 'center',
                    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  txLeft:         { flex: 1 },
  txName:         { fontSize: 14, fontWeight: '700', color: '#0a1628' },
  txService:      { fontSize: 13, color: '#2563eb', marginTop: 2 },
  txDate:         { fontSize: 12, color: '#aaa', marginTop: 2 },
  txAmount:       { fontSize: 16, fontWeight: '800', color: '#16a34a' },
  emptyTx:        { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 14,
                    padding: 30, alignItems: 'center' },
  emptyTxText:    { color: '#aaa', fontSize: 14 },
});