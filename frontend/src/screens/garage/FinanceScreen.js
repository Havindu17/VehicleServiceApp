import SoundButton from "../../utils/SoundButton";
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, ActivityIndicator, RefreshControl,
  Dimensions, Modal, Share, Alert, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import api from '../../utils/api';

const { width: SCREEN_W } = Dimensions.get('window');

const COLORS = {
  navy:    '#0B1D3A',
  navyMid: '#132847',
  gold:    '#C9A84C',
  white:   '#FFFFFF',
  gray:    '#8A9BB5',
  cardBg:  '#162040',
  success: '#16A34A',
  warning: '#F59E0B',
  error:   '#EF4444',
  info:    '#2563EB',
  purple:  '#7C3AED',
  bg:      '#0D1829',
  cash:    '#16A34A',
  card:    '#2563EB',
  paid:    '#16A34A',
  pending: '#F59E0B',
};

const PIE_COLORS = ['#C9A84C','#2563EB','#7C3AED','#16A34A','#F59E0B','#EF4444'];
const CHART_W    = SCREEN_W - 48;
const PERIODS    = ['Today', 'Week', 'Month', 'Year'];

function PieLegend({ data }) {
  return (
    <View style={styles.pieLegend}>
      {data.map((item, i) => (
        <View key={i} style={styles.pieLegendItem}>
          <View style={[styles.pieDot, { backgroundColor: item.color }]} />
          <Text style={styles.pieLegendText}>{item.text}</Text>
          <Text style={[styles.pieLegendPct, { color: item.color }]}>{item.pct}%</Text>
        </View>
      ))}
    </View>
  );
}

function PaymentBadge({ method }) {
  const isCash = (method ?? 'Cash').toLowerCase() === 'cash';
  return (
    <View style={[styles.payBadge, {
      backgroundColor: isCash ? 'rgba(22,163,74,0.15)' : 'rgba(37,99,235,0.15)',
    }]}>
      <Text style={{ fontSize: 11, color: isCash ? COLORS.cash : COLORS.card, fontWeight: '700' }}>
        {isCash ? '💵 Cash' : '💳 Card'}
      </Text>
    </View>
  );
}

// ── Payment Status Badge ───────────────────────────────────────────────────
function PaymentStatusBadge({ status }) {
  const isPaid = (status ?? 'pending').toLowerCase() === 'paid';
  return (
    <View style={[styles.statusBadge, {
      backgroundColor: isPaid ? 'rgba(22,163,74,0.15)' : 'rgba(245,158,11,0.15)',
      borderColor:     isPaid ? COLORS.paid : COLORS.pending,
    }]}>
      <View style={[styles.statusDot, {
        backgroundColor: isPaid ? COLORS.paid : COLORS.pending,
      }]} />
      <Text style={{
        fontSize: 11,
        color:    isPaid ? COLORS.paid : COLORS.pending,
        fontWeight: '700',
      }}>
        {isPaid ? 'Paid' : 'Pending'}
      </Text>
    </View>
  );
}

export default function FinanceScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [period,        setPeriod]        = useState('Month');
  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [refresh,       setRefresh]       = useState(false);
  const [activeTab,     setActiveTab]     = useState('overview');
  const [chartType,     setChartType]     = useState('bar');
  const [exportModal,   setExportModal]   = useState(false);
  const [payFilter,     setPayFilter]     = useState('All');

  const [invoiceModal,  setInvoiceModal]  = useState(false);
  const [selectedTx,    setSelectedTx]    = useState(null);
  const [invoiceItems,  setInvoiceItems]  = useState([{ label: '', amount: '' }]);
  const [invoiceNotes,  setInvoiceNotes]  = useState('');
  const [sending,       setSending]       = useState(false);

  const [editPayModal,  setEditPayModal]  = useState(false);
  const [editingTx,     setEditingTx]     = useState(null);
  const [savingPay,     setSavingPay]     = useState(false);

  // ── Fetch (returns data so callers can await it) ───────────────────────
  const fetchFinance = async () => {
    try {
      const res = await api.get(`/garage/finance?period=${period.toLowerCase()}`);
      setData(res.data);
      return res.data;
    } catch (e) {
      console.error('Finance fetch error:', e);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useEffect(() => { setLoading(true); fetchFinance(); }, [period]);

  // ── Invoice Send ───────────────────────────────────────────────────────
  const sendInvoice = async (sendEmail) => {
    if (!selectedTx?._id) return Alert.alert('Error', 'No booking selected');
    const validItems = invoiceItems.filter(i => i.label && i.amount);
    if (validItems.length === 0) return Alert.alert('Error', 'Add at least one item');

    // ── Validation: all amounts must be numbers > 0 ────────────────────
    for (const item of validItems) {
      if (isNaN(Number(item.amount)) || Number(item.amount) <= 0) {
        return Alert.alert('Validation Error', `"${item.label}" amount is invalid`);
      }
    }

    setSending(true);
    try {
      await api.post('/garage/invoice', {
        bookingId: selectedTx._id,
        items:     validItems,
        notes:     invoiceNotes,
        sendEmail,
      });

      setInvoiceModal(false);

      // ── Await fresh data — no race condition ───────────────────────────
      const fresh = await fetchFinance();

      const newTotal = validItems.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      Alert.alert(
        '✅ Invoice Saved',
        `Total: Rs. ${newTotal.toLocaleString()}\nStatus: Paid${sendEmail ? '\nEmail sent to customer' : ''}`,
      );

    } catch (e) {
      Alert.alert('Error', e.response?.data?.message ?? 'Failed');
    }
    setSending(false);
  };

  // ── View Invoice ───────────────────────────────────────────────────────
  const viewInvoice = () => {
    const validItems = invoiceItems.filter(i => i.label && i.amount);
    if (validItems.length === 0) return Alert.alert('Error', 'Add at least one item');
    setInvoiceModal(false);
    navigation.navigate('InvoicePrint', {
      transaction:   selectedTx,
      items:         validItems,
      notes:         invoiceNotes,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    });
  };

  // ── Update Payment Method ──────────────────────────────────────────────
  const updatePaymentMethod = async (method) => {
    const bookingId = editingTx?._id || editingTx?.id || editingTx?.bookingId;
    if (!bookingId) {
      Alert.alert('Error', 'Booking ID not found.');
      return;
    }
    const currentMethod = (editingTx?.paymentMethod ?? 'Cash').toLowerCase();
    if (currentMethod === method.toLowerCase()) {
      setEditPayModal(false);
      return;
    }
    setSavingPay(true);
    try {
      await api.patch(`/garage/booking/${bookingId}/payment`, { paymentMethod: method });
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          transactions: prev.transactions.map(t => {
            const tId = t._id || t.id || t.bookingId;
            if (tId === bookingId) return { ...t, paymentMethod: method };
            return t;
          }),
        };
      });
      setEditPayModal(false);
      fetchFinance();
    } catch (e) {
      const errMsg = e?.response?.data?.message || `Failed (${e?.response?.status ?? 'network error'})`;
      Alert.alert('Error', errMsg);
    } finally {
      setSavingPay(false);
    }
  };

  // ── Export ─────────────────────────────────────────────────────────────
  const handleExport = async (type) => {
    setExportModal(false);
    if (type === 'share') {
      const lines = [
        `╔══════════════════════════════╗`,
        `║   FINANCE REPORT — ${period.toUpperCase().padEnd(6)}   ║`,
        `╚══════════════════════════════╝`,
        `Generated: ${new Date().toLocaleString()}`,
        ``,
        `SUMMARY`,
        `────────────────────────────────`,
        `Total Revenue  : Rs. ${(data?.totalRevenue ?? 0).toLocaleString()}`,
        `Completed Jobs : ${data?.completedJobs ?? 0}`,
        `Avg per Job    : Rs. ${(data?.avgPerJob ?? 0).toLocaleString()}`,
        `Pending Value  : Rs. ${(data?.pendingValue ?? 0).toLocaleString()}`,
        ``,
        `TRANSACTION HISTORY`,
        `────────────────────────────────`,
        ...(data?.transactions ?? []).map((t, i) =>
          `${String(i + 1).padStart(2)}. ${t.date}  ${(t.customerName ?? '').padEnd(16)} Rs. ${(t.amount ?? 0).toLocaleString()}  [${t.paymentMethod ?? 'Cash'}] [${t.paymentStatus ?? 'Paid'}]`
        ),
        ``,
        `— Generated by GarageApp —`,
      ].join('\n');
      await Share.share({ message: lines, title: `Finance Report – ${period}` });
    } else {
      navigation.navigate('FinanceReport', { data, period });
    }
  };

  // ── Chart helpers ──────────────────────────────────────────────────────
  const barData = (data?.dailyRevenue ?? []).map((d, i) => ({
    value:      d.amount,
    label:      d.label,
    frontColor: i % 2 === 0 ? COLORS.gold : '#9B7A2E',
    topLabelComponent: () => (
      <Text style={{ color: COLORS.gold, fontSize: 9, marginBottom: 2 }}>
        {d.amount > 0 ? d.amount : ''}
      </Text>
    ),
  }));

  const lineData = (data?.dailyRevenue ?? []).map(d => ({
    value:         d.amount,
    dataPointText: d.amount > 0 ? `${d.amount}` : '',
  }));

  const totalByService = (data?.byService ?? []).reduce((s, r) => s + r.revenue, 0) || 1;
  const pieData = (data?.byService ?? []).map((r, i) => ({
    value: r.revenue,
    color: PIE_COLORS[i % PIE_COLORS.length],
    text:  r.name,
    pct:   Math.round((r.revenue / totalByService) * 100),
  }));

  const cashTotal = (data?.transactions ?? [])
    .filter(t => (t.paymentMethod ?? 'Cash').toLowerCase() === 'cash')
    .reduce((s, t) => s + (t.amount ?? 0), 0);
  const cardTotal = (data?.transactions ?? [])
    .filter(t => t.paymentMethod?.toLowerCase() === 'card')
    .reduce((s, t) => s + (t.amount ?? 0), 0);

  const filteredTx = (data?.transactions ?? []).filter(t => {
    if (payFilter === 'All')     return true;
    if (payFilter === 'Paid')    return (t.paymentStatus ?? 'paid').toLowerCase() === 'paid';
    if (payFilter === 'Pending') return (t.paymentStatus ?? 'paid').toLowerCase() === 'pending';
    return (t.paymentMethod ?? 'Cash').toLowerCase() === payFilter.toLowerCase();
  });

  const invoiceTotal = invoiceItems.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerDecor} />
        <SoundButton onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </SoundButton>
        <Text style={styles.title}>Finance</Text>
        <SoundButton onPress={() => setExportModal(true)} style={styles.exportBtn}>
          <Text style={styles.exportText}>⬆ Export</Text>
        </SoundButton>
      </View>

      {/* Period Tabs */}
      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <SoundButton
            key={p}
            style={[styles.periodTab, period === p && styles.periodTabActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
          </SoundButton>
        ))}
      </View>

      {/* Section Nav */}
      <View style={styles.navRow}>
        {[
          { key: 'overview',     label: '📋 Overview' },
          { key: 'charts',       label: '📊 Charts'   },
          { key: 'transactions', label: '💳 History'  },
        ].map(tab => (
          <SoundButton
            key={tab.key}
            style={[styles.navTab, activeTab === tab.key && styles.navTabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.navTabText, activeTab === tab.key && styles.navTabTextActive]}>
              {tab.label}
            </Text>
          </SoundButton>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refresh}
              onRefresh={() => { setRefresh(true); fetchFinance(); }}
              tintColor={COLORS.gold}
            />
          }
        >
          {/* ══════════ OVERVIEW ══════════ */}
          {activeTab === 'overview' && (
            <>
              <View style={styles.summaryRow}>
                {[
                  { label: 'Total Revenue',  value: `Rs. ${(data?.totalRevenue ?? 0).toLocaleString()}`,  icon: '💰', color: COLORS.success },
                  { label: 'Completed Jobs', value: data?.completedJobs ?? 0,                             icon: '✅', color: COLORS.info    },
                  { label: 'Avg per Job',    value: `Rs. ${(data?.avgPerJob ?? 0).toLocaleString()}`,     icon: '📊', color: COLORS.purple  },
                  { label: 'Pending Value',  value: `Rs. ${(data?.pendingValue ?? 0).toLocaleString()}`,  icon: '⏳', color: COLORS.warning },
                ].map((s, i) => (
                  <View key={i} style={[styles.summaryCard, { borderTopColor: s.color }]}>
                    <Text style={styles.summaryIcon}>{s.icon}</Text>
                    <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={styles.summaryLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Payment Methods</Text>
              </View>
              <View style={styles.paymentSplit}>
                <View style={[styles.payCard, { borderTopColor: COLORS.cash }]}>
                  <Text style={styles.payIcon}>💵</Text>
                  <Text style={[styles.payAmount, { color: COLORS.cash }]}>Rs. {cashTotal.toLocaleString()}</Text>
                  <Text style={styles.payLabel}>Cash</Text>
                </View>
                <View style={[styles.payCard, { borderTopColor: COLORS.card }]}>
                  <Text style={styles.payIcon}>💳</Text>
                  <Text style={[styles.payAmount, { color: COLORS.card }]}>Rs. {cardTotal.toLocaleString()}</Text>
                  <Text style={styles.payLabel}>Card</Text>
                </View>
              </View>

              {(cashTotal + cardTotal) > 0 && (
                <View style={styles.splitBarWrap}>
                  <View style={[styles.splitBarFill, {
                    width: `${Math.round((cashTotal / (cashTotal + cardTotal)) * 100)}%`,
                    backgroundColor: COLORS.cash,
                  }]} />
                  <View style={[styles.splitBarFill, {
                    width: `${Math.round((cardTotal / (cashTotal + cardTotal)) * 100)}%`,
                    backgroundColor: COLORS.card,
                  }]} />
                </View>
              )}
              <View style={styles.splitBarLabels}>
                <Text style={{ color: COLORS.cash, fontSize: 11, fontWeight: '700' }}>
                  💵 Cash {cashTotal + cardTotal > 0 ? Math.round((cashTotal / (cashTotal + cardTotal)) * 100) : 0}%
                </Text>
                <Text style={{ color: COLORS.card, fontSize: 11, fontWeight: '700' }}>
                  💳 Card {cashTotal + cardTotal > 0 ? Math.round((cardTotal / (cashTotal + cardTotal)) * 100) : 0}%
                </Text>
              </View>

              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Revenue by Service</Text>
              </View>
              <View style={styles.tableBox}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, { flex: 2, color: COLORS.gray }]}>Service</Text>
                  <Text style={[styles.tableCell, { color: COLORS.gray }]}>Jobs</Text>
                  <Text style={[styles.tableCell, { color: COLORS.gray, textAlign: 'right' }]}>Revenue</Text>
                </View>
                {(data?.byService ?? []).map((row, i) => (
                  <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                    <Text style={[styles.tableCell, { flex: 2, fontWeight: '600', color: COLORS.white }]}>
                      {row.name}
                    </Text>
                    <Text style={[styles.tableCell, { color: COLORS.gray }]}>{row.count}</Text>
                    <Text style={[styles.tableCell, { color: COLORS.success, fontWeight: '700', textAlign: 'right' }]}>
                      Rs. {row.revenue.toLocaleString()}
                    </Text>
                  </View>
                ))}
                {(!data?.byService || data.byService.length === 0) && (
                  <Text style={styles.noData}>No data for this period</Text>
                )}
              </View>
            </>
          )}

          {/* ══════════ CHARTS ══════════ */}
          {activeTab === 'charts' && (
            <>
              <View style={styles.chartTypeRow}>
                {[
                  { key: 'bar',  label: '📊 Bar'  },
                  { key: 'line', label: '📈 Line' },
                  { key: 'pie',  label: '🥧 Pie'  },
                ].map(ct => (
                  <SoundButton
                    key={ct.key}
                    style={[styles.chartTypeBtn, chartType === ct.key && styles.chartTypeBtnActive]}
                    onPress={() => setChartType(ct.key)}
                  >
                    <Text style={[styles.chartTypeTxt, chartType === ct.key && styles.chartTypeTxtActive]}>
                      {ct.label}
                    </Text>
                  </SoundButton>
                ))}
              </View>

              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>
                  {chartType === 'bar'  ? `Daily Revenue – ${period}` :
                   chartType === 'line' ? `Revenue Trend – ${period}` :
                                          'Revenue by Service'}
                </Text>
                {chartType === 'bar' && barData.length > 0 && (
                  <BarChart
                    data={barData} width={CHART_W - 20} height={200}
                    barWidth={Math.max(18, Math.floor((CHART_W - 60) / Math.max(barData.length, 1)) - 6)}
                    spacing={6} roundedTop noOfSections={4}
                    yAxisTextStyle={{ color: COLORS.gray, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: COLORS.gray, fontSize: 9 }}
                    yAxisColor="transparent" xAxisColor="rgba(138,155,181,0.2)"
                    backgroundColor="transparent" rulesColor="rgba(138,155,181,0.1)" isAnimated
                  />
                )}
                {chartType === 'line' && lineData.length > 0 && (
                  <LineChart
                    data={lineData} width={CHART_W - 20} height={200}
                    color={COLORS.gold} thickness={2.5}
                    dataPointsColor={COLORS.gold} dataPointsRadius={4}
                    startFillColor={COLORS.gold} startOpacity={0.25} endOpacity={0.02}
                    noOfSections={4}
                    yAxisTextStyle={{ color: COLORS.gray, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: COLORS.gray, fontSize: 9 }}
                    yAxisColor="transparent" xAxisColor="rgba(138,155,181,0.2)"
                    rulesColor="rgba(138,155,181,0.1)" backgroundColor="transparent"
                    curved isAnimated
                  />
                )}
                {chartType === 'pie' && pieData.length > 0 && (
                  <View style={styles.pieWrap}>
                    <PieChart
                      data={pieData} radius={100} donut innerRadius={58}
                      centerLabelComponent={() => (
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ color: COLORS.gold, fontSize: 12, fontWeight: '800' }}>
                            Rs. {(data?.totalRevenue ?? 0).toLocaleString()}
                          </Text>
                          <Text style={{ color: COLORS.gray, fontSize: 10 }}>Total</Text>
                        </View>
                      )}
                      isAnimated
                    />
                    <PieLegend data={pieData} />
                  </View>
                )}
                {barData.length === 0 && lineData.length === 0 && pieData.length === 0 && (
                  <Text style={styles.noData}>No chart data for this period</Text>
                )}
              </View>

              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Service Breakdown</Text>
              </View>
              {(data?.byService ?? []).map((row, i) => {
                const pct = Math.round((row.revenue / (data?.totalRevenue || 1)) * 100);
                return (
                  <View key={i} style={styles.serviceRow}>
                    <Text style={styles.serviceName}>{row.name}</Text>
                    <View style={styles.serviceBarWrap}>
                      <View style={[styles.serviceBarFill, {
                        width: `${pct}%`,
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }]} />
                    </View>
                    <Text style={[styles.serviceRevenue, { color: PIE_COLORS[i % PIE_COLORS.length] }]}>
                      Rs. {row.revenue.toLocaleString()}
                    </Text>
                  </View>
                );
              })}
            </>
          )}

          {/* ══════════ TRANSACTIONS ══════════ */}
          {activeTab === 'transactions' && (
            <>
              {/* Filter row — All / Cash / Card / Paid / Pending */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 }}
                contentContainerStyle={{ gap: 8, alignItems: 'center' }}
              >
                {['All', 'Cash', 'Card', 'Paid', 'Pending'].map(f => (
                  <SoundButton
                    key={f}
                    style={[styles.payFilterBtn, payFilter === f && styles.payFilterBtnActive]}
                    onPress={() => setPayFilter(f)}
                  >
                    <Text style={[styles.payFilterTxt, payFilter === f && styles.payFilterTxtActive]}>
                      {f === 'Cash' ? '💵 Cash' : f === 'Card' ? '💳 Card' :
                       f === 'Paid' ? '✅ Paid' : f === 'Pending' ? '⏳ Pending' : 'All'}
                    </Text>
                  </SoundButton>
                ))}
                <Text style={styles.txCount}>{filteredTx.length} records</Text>
              </ScrollView>

              {filteredTx.map((t, i) => (
                <View key={i} style={styles.txCard}>
                  <View style={[styles.txAccent, {
                    backgroundColor: (t.paymentStatus ?? 'paid').toLowerCase() === 'paid'
                      ? COLORS.success : COLORS.warning,
                  }]} />
                  <View style={styles.txLeft}>
                    <Text style={styles.txName}>{t.customerName}</Text>
                    <Text style={styles.txService} numberOfLines={1} ellipsizeMode="tail">
                      {t.service}
                    </Text>
                    <Text style={styles.txDate}>📅 {t.date}</Text>

                    {/* Payment method badge (tappable) */}
                    <SoundButton
                      activeOpacity={0.7}
                      onPress={() => { setEditingTx(t); setEditPayModal(true); }}
                    >
                      <PaymentBadge method={t.paymentMethod ?? 'Cash'} />
                    </SoundButton>

                    {/* Payment status badge */}
                    <PaymentStatusBadge status={t.paymentStatus ?? 'paid'} />
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <Text style={styles.txAmount}>+ Rs. {(t.amount ?? 0).toLocaleString()}</Text>
                    <SoundButton
                      style={styles.invoiceBtn}
                      onPress={() => {
                        setSelectedTx(t);
                        setInvoiceItems(
                          t.costBreakdown?.length > 0
                            ? t.costBreakdown.map(c => ({ label: c.item, amount: String(c.amount) }))
                            : [{ label: t.service ?? '', amount: String(t.amount ?? '') }]
                        );
                        setInvoiceNotes(t.garageNotes ?? '');
                        setInvoiceModal(true);
                      }}
                    >
                      <Text style={styles.invoiceBtnTxt}>📄 Invoice</Text>
                    </SoundButton>
                  </View>
                </View>
              ))}

              {filteredTx.length === 0 && (
                <View style={styles.emptyTx}>
                  <Text style={styles.emptyIcon}>💵</Text>
                  <Text style={styles.emptyTxText}>No transactions this period</Text>
                </View>
              )}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ══════════ INVOICE MODAL ══════════ */}
      <Modal visible={invoiceModal} transparent animationType="slide"
        onRequestClose={() => setInvoiceModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '92%' }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              <Text style={styles.modalTitle}>📄 Invoice</Text>
              <Text style={styles.modalSub}>
                {selectedTx?.customerName} — {selectedTx?.allServices || selectedTx?.service}
              </Text>

              {/* Paid badge in modal */}
              <View style={{ alignItems: 'center', marginBottom: 8 }}>
                <PaymentStatusBadge status={selectedTx?.paymentStatus ?? 'paid'} />
              </View>

              <Text style={styles.invoiceSectionLabel}>Service Items</Text>
              {invoiceItems.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <TextInput
                    style={[styles.input, { flex: 2 }]}
                    placeholder="Item label"
                    placeholderTextColor={COLORS.gray}
                    value={item.label}
                    onChangeText={v => {
                      const arr = [...invoiceItems];
                      arr[i] = { ...arr[i], label: v };
                      setInvoiceItems(arr);
                    }}
                  />
                  <TextInput
                    style={[
                      styles.input, { flex: 1 },
                      item.amount && (isNaN(Number(item.amount)) || Number(item.amount) <= 0)
                        && { borderColor: COLORS.error },
                    ]}
                    placeholder="Rs."
                    placeholderTextColor={COLORS.gray}
                    keyboardType="numeric"
                    value={item.amount}
                    onChangeText={v => {
                      const arr = [...invoiceItems];
                      arr[i] = { ...arr[i], amount: v };
                      setInvoiceItems(arr);
                    }}
                  />
                  <SoundButton
                    style={styles.removeBtn}
                    onPress={() => setInvoiceItems(invoiceItems.filter((_, j) => j !== i))}
                  >
                    <Text style={{ color: COLORS.error, fontWeight: '700', fontSize: 16 }}>✕</Text>
                  </SoundButton>
                </View>
              ))}

              <SoundButton
                style={[styles.modalBtn, { backgroundColor: COLORS.navyMid, marginBottom: 12 }]}
                onPress={() => setInvoiceItems([...invoiceItems, { label: '', amount: '' }])}
              >
                <Text style={[styles.modalBtnTxt, { color: COLORS.gold }]}>+ Add Item</Text>
              </SoundButton>

              {/* Live total */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>Rs. {invoiceTotal.toLocaleString()}</Text>
              </View>

              <Text style={styles.invoiceSectionLabel}>Notes</Text>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top', marginBottom: 16 }]}
                placeholder="Add notes for customer..."
                placeholderTextColor={COLORS.gray}
                multiline
                value={invoiceNotes}
                onChangeText={setInvoiceNotes}
              />

              <SoundButton
                style={[styles.modalBtn, { marginBottom: 8 }]}
                onPress={() => sendInvoice(true)}
                disabled={sending}
              >
                <Text style={styles.modalBtnTxt}>
                  {sending ? '⏳ Saving...' : '📧 Save & Email Customer'}
                </Text>
              </SoundButton>

              <SoundButton
                style={[styles.modalBtn, { backgroundColor: COLORS.navyMid, marginBottom: 8 }]}
                onPress={() => sendInvoice(false)}
                disabled={sending}
              >
                <Text style={styles.modalBtnTxt}>💾 Save Only</Text>
              </SoundButton>

              <SoundButton
                style={[styles.modalBtn, { backgroundColor: COLORS.navyMid, marginBottom: 8 }]}
                onPress={viewInvoice}
                disabled={sending}
              >
                <Text style={[styles.modalBtnTxt, { color: COLORS.gold }]}>📄 View Invoice</Text>
              </SoundButton>

              <SoundButton style={styles.modalClose} onPress={() => setInvoiceModal(false)}>
                <Text style={{ color: COLORS.gray, fontWeight: '700' }}>Cancel</Text>
              </SoundButton>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════ EXPORT MODAL ══════════ */}
      <Modal visible={exportModal} transparent animationType="slide"
        onRequestClose={() => setExportModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>⬆ Export Report</Text>
            <Text style={styles.modalSub}>Finance – {period}</Text>
            <SoundButton style={styles.modalBtn} onPress={() => handleExport('share')}>
              <Text style={styles.modalBtnTxt}>📤 Share Report</Text>
            </SoundButton>
            <SoundButton
              style={[styles.modalBtn, { backgroundColor: COLORS.navyMid, borderWidth: 1, borderColor: COLORS.gold }]}
              onPress={() => handleExport('view')}
            >
              <Text style={[styles.modalBtnTxt, { color: COLORS.gold }]}>📊 View Full Report</Text>
            </SoundButton>
            <SoundButton style={styles.modalClose} onPress={() => setExportModal(false)}>
              <Text style={{ color: COLORS.gray, fontWeight: '700' }}>Cancel</Text>
            </SoundButton>
          </View>
        </View>
      </Modal>

      {/* ══════════ EDIT PAYMENT METHOD MODAL ══════════ */}
      <Modal visible={editPayModal} transparent animationType="slide"
        onRequestClose={() => !savingPay && setEditPayModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>💳 Payment Method</Text>
            <Text style={styles.modalSub}>{editingTx?.customerName} — {editingTx?.service}</Text>

            {__DEV__ && (
              <Text style={{ color: COLORS.gray, fontSize: 10, textAlign: 'center', marginBottom: 4 }}>
                ID: {editingTx?._id || editingTx?.id || 'NOT FOUND ⚠️'}
              </Text>
            )}

            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <PaymentBadge method={editingTx?.paymentMethod ?? 'Cash'} />
            </View>

            <SoundButton
              style={[
                styles.modalBtn,
                { backgroundColor: 'rgba(22,163,74,0.15)', borderWidth: 1, borderColor: COLORS.cash },
                (editingTx?.paymentMethod ?? 'Cash').toLowerCase() === 'cash' && styles.payOptActive,
              ]}
              onPress={() => updatePaymentMethod('Cash')}
              disabled={savingPay}
            >
              <Text style={[styles.modalBtnTxt, { color: COLORS.cash }]}>
                {savingPay ? '⏳ Saving...' : '💵 Cash'}
              </Text>
            </SoundButton>

            <SoundButton
              style={[
                styles.modalBtn,
                { backgroundColor: 'rgba(37,99,235,0.15)', borderWidth: 1, borderColor: COLORS.card },
                editingTx?.paymentMethod?.toLowerCase() === 'card' && styles.payOptActive,
              ]}
              onPress={() => updatePaymentMethod('Card')}
              disabled={savingPay}
            >
              <Text style={[styles.modalBtnTxt, { color: COLORS.card }]}>
                {savingPay ? '⏳ Saving...' : '💳 Card'}
              </Text>
            </SoundButton>

            {!savingPay && (
              <SoundButton style={styles.modalClose} onPress={() => setEditPayModal(false)}>
                <Text style={{ color: COLORS.gray, fontWeight: '700' }}>Cancel</Text>
              </SoundButton>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.navy },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  scroll: { flex: 1, backgroundColor: COLORS.bg },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                 backgroundColor: COLORS.navy, paddingHorizontal: 16, paddingBottom: 16,
                 borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)', overflow: 'hidden' },
  headerDecor: { position: 'absolute', top: -30, right: 80, width: 100, height: 100,
                 borderRadius: 50, backgroundColor: COLORS.gold, opacity: 0.06 },
  backBtn:     { width: 60 },
  backText:    { color: COLORS.gold, fontWeight: '700', fontSize: 15 },
  title:       { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  exportBtn:   { width: 80, alignItems: 'flex-end' },
  exportText:  { color: COLORS.gold, fontWeight: '700', fontSize: 13 },

  periodRow:        { flexDirection: 'row', backgroundColor: COLORS.navyMid,
                      paddingHorizontal: 14, paddingVertical: 10, gap: 8,
                      borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.1)' },
  periodTab:        { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10,
                      backgroundColor: 'rgba(255,255,255,0.05)' },
  periodTabActive:  { backgroundColor: COLORS.gold },
  periodText:       { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  periodTextActive: { color: COLORS.navy, fontWeight: '800' },

  navRow:           { flexDirection: 'row', backgroundColor: COLORS.navyMid,
                      paddingHorizontal: 14, paddingVertical: 8, gap: 8,
                      borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.08)' },
  navTab:           { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 10,
                      backgroundColor: 'rgba(255,255,255,0.04)' },
  navTabActive:     { backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1, borderColor: COLORS.gold },
  navTabText:       { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  navTabTextActive: { color: COLORS.gold, fontWeight: '800' },

  summaryRow:   { flexDirection: 'row', flexWrap: 'wrap', padding: 14, gap: 10 },
  summaryCard:  { width: '47%', backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16,
                  alignItems: 'center', borderTopWidth: 3,
                  borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)', elevation: 4 },
  summaryIcon:  { fontSize: 26, marginBottom: 8 },
  summaryValue: { fontSize: 20, fontWeight: '900', marginBottom: 4 },
  summaryLabel: { fontSize: 11, color: COLORS.gray, textAlign: 'center', fontWeight: '600' },

  paymentSplit:   { flexDirection: 'row', paddingHorizontal: 14, gap: 12, marginBottom: 12 },
  payCard:        { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16,
                    alignItems: 'center', borderTopWidth: 3,
                    borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)' },
  payIcon:        { fontSize: 28, marginBottom: 6 },
  payAmount:      { fontSize: 18, fontWeight: '900', marginBottom: 2 },
  payLabel:       { fontSize: 12, color: COLORS.gray, fontWeight: '700' },
  splitBarWrap:   { flexDirection: 'row', marginHorizontal: 14, height: 8, borderRadius: 4,
                    overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 4 },
  splitBarFill:   { height: '100%' },
  splitBarLabels: { flexDirection: 'row', justifyContent: 'space-between',
                    marginHorizontal: 14, marginBottom: 16 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16,
                   marginTop: 6, marginBottom: 10 },
  sectionAccent: { width: 4, height: 18, backgroundColor: COLORS.gold, borderRadius: 2, marginRight: 10 },
  sectionTitle:  { fontSize: 16, fontWeight: '800', color: COLORS.white },

  tableBox:    { marginHorizontal: 14, backgroundColor: COLORS.cardBg, borderRadius: 16,
                 overflow: 'hidden', marginBottom: 16,
                 borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)', elevation: 2 },
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.navyMid, padding: 12 },
  tableRow:    { flexDirection: 'row', padding: 12 },
  tableRowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  tableCell:   { flex: 1, fontSize: 13, color: COLORS.gray },
  noData:      { padding: 20, textAlign: 'center', color: COLORS.gray },

  chartTypeRow:       { flexDirection: 'row', marginHorizontal: 14, marginTop: 14, gap: 8, marginBottom: 12 },
  chartTypeBtn:       { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 12,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  chartTypeBtnActive: { backgroundColor: 'rgba(201,168,76,0.15)', borderColor: COLORS.gold },
  chartTypeTxt:       { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  chartTypeTxtActive: { color: COLORS.gold, fontWeight: '800' },
  chartCard:          { marginHorizontal: 14, backgroundColor: COLORS.cardBg, borderRadius: 18,
                        padding: 16, borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)', marginBottom: 16 },
  chartTitle:         { color: COLORS.white, fontWeight: '800', fontSize: 14, marginBottom: 14 },

  pieWrap:       { alignItems: 'center', gap: 16 },
  pieLegend:     { width: '100%', gap: 6 },
  pieLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pieDot:        { width: 10, height: 10, borderRadius: 5 },
  pieLegendText: { flex: 1, fontSize: 13, color: COLORS.white, fontWeight: '600' },
  pieLegendPct:  { fontSize: 13, fontWeight: '800' },

  serviceRow:     { marginHorizontal: 14, marginBottom: 10, flexDirection: 'row',
                    alignItems: 'center', gap: 8 },
  serviceName:    { width: 100, fontSize: 12, color: COLORS.white, fontWeight: '600' },
  serviceBarWrap: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.06)',
                    borderRadius: 4, overflow: 'hidden' },
  serviceBarFill: { height: '100%', borderRadius: 4 },
  serviceRevenue: { width: 70, fontSize: 12, fontWeight: '700', textAlign: 'right' },

  payFilterBtn:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  payFilterBtnActive: { backgroundColor: 'rgba(201,168,76,0.15)', borderColor: COLORS.gold },
  payFilterTxt:       { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  payFilterTxtActive: { color: COLORS.gold, fontWeight: '800' },
  txCount:            { marginLeft: 8, fontSize: 12, color: COLORS.gray },

  txCard:   { marginHorizontal: 14, marginBottom: 10, backgroundColor: COLORS.cardBg,
              borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center',
              borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)', elevation: 2 },
  txAccent: { width: 4, borderRadius: 2, marginRight: 12, minHeight: 60, alignSelf: 'stretch' },
  txLeft:   { flex: 1, gap: 3 },
  txName:   { fontSize: 14, fontWeight: '700', color: COLORS.white },
  txService:{ fontSize: 13, color: COLORS.gold, fontWeight: '600', maxWidth: 160 },
  txDate:   { fontSize: 12, color: COLORS.gray },
  txAmount: { fontSize: 16, fontWeight: '800', color: COLORS.success },
  payBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
              borderRadius: 8, marginTop: 2 },

  // ── Payment status badge ─────────────────────────────────────────────
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5,
                 alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
                 borderRadius: 8, borderWidth: 1, marginTop: 2 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },

  emptyTx:      { marginHorizontal: 14, backgroundColor: COLORS.cardBg, borderRadius: 16,
                  padding: 36, alignItems: 'center',
                  borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)' },
  emptyIcon:    { fontSize: 40, marginBottom: 10 },
  emptyTxText:  { color: COLORS.gray, fontSize: 14, fontWeight: '600' },

  invoiceBtn:          { backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1,
                         borderColor: COLORS.gold, borderRadius: 8,
                         paddingHorizontal: 10, paddingVertical: 5 },
  invoiceBtnTxt:       { color: COLORS.gold, fontSize: 11, fontWeight: '700' },
  invoiceSectionLabel: { color: COLORS.gold, fontWeight: '700', marginBottom: 8, fontSize: 13 },
  itemRow:             { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  input:               { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1,
                         borderColor: 'rgba(201,168,76,0.2)', borderRadius: 10,
                         padding: 10, color: COLORS.white, fontSize: 14 },
  removeBtn:           { width: 36, height: 36, justifyContent: 'center', alignItems: 'center',
                         backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8 },
  totalRow:            { flexDirection: 'row', justifyContent: 'space-between',
                         alignItems: 'center', marginVertical: 12,
                         backgroundColor: 'rgba(22,163,74,0.1)', padding: 12, borderRadius: 10 },
  totalLabel:          { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  totalValue:          { color: COLORS.success, fontWeight: '900', fontSize: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: COLORS.navyMid, borderTopLeftRadius: 24,
                  borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalTitle:   { color: COLORS.white, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  modalSub:     { color: COLORS.gray, fontSize: 13, textAlign: 'center', marginBottom: 4 },
  modalBtn:     { backgroundColor: COLORS.gold, borderRadius: 14, paddingVertical: 14,
                  alignItems: 'center' },
  modalBtnTxt:  { color: COLORS.navy, fontWeight: '800', fontSize: 15 },
  modalClose:   { alignItems: 'center', paddingVertical: 10 },
  payOptActive: { borderWidth: 2 },
});