import React, { useState, useEffect, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Modal, ActivityIndicator,
} from "react-native";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const C = {
  navy:"#08152B", navyMid:"#0F2040", navyCard:"#142035", navyLight:"#1A2D4A",
  gold:"#C9A84C", goldDim:"rgba(201,168,76,0.12)", white:"#FFFFFF",
  gray:"#6B80A0", border:"rgba(201,168,76,0.18)", success:"#22C55E",
  error:"#EF4444", blue:"#4a90d9", purple:"#c084fc", warning:"#F59E0B",
};

// ─── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Active:   {bg:"rgba(34,197,94,0.15)",  c:"#5ddb8f"},
    Pending:  {bg:"rgba(201,168,76,0.15)", c:"#ffd07b"},
    Done:     {bg:"rgba(74,144,217,0.15)", c:"#7ab8ef"},
    Cancelled:{bg:"rgba(239,68,68,0.15)",  c:"#f5877b"},
    Approved: {bg:"rgba(34,197,94,0.15)",  c:"#5ddb8f"},
    Suspended:{bg:"rgba(239,68,68,0.15)",  c:"#f5877b"},
    Banned:   {bg:"rgba(239,68,68,0.15)",  c:"#f5877b"},
    Paid:     {bg:"rgba(34,197,94,0.15)",  c:"#5ddb8f"},
    Rejected: {bg:"rgba(239,68,68,0.15)",  c:"#f5877b"},
    pending:  {bg:"rgba(201,168,76,0.15)", c:"#ffd07b"},
    approved: {bg:"rgba(34,197,94,0.15)",  c:"#5ddb8f"},
    rejected: {bg:"rgba(239,68,68,0.15)",  c:"#f5877b"},
    suspended:{bg:"rgba(239,68,68,0.15)",  c:"#f5877b"},
  };
  const s = map[status] || {bg:"rgba(255,255,255,0.1)", c:C.gray};
  return (
    <View style={{flexDirection:"row",alignItems:"center",paddingHorizontal:8,paddingVertical:3,borderRadius:20,backgroundColor:s.bg,alignSelf:"flex-start"}}>
      <View style={{width:5,height:5,borderRadius:3,backgroundColor:s.c,marginRight:5}}/>
      <Text style={{fontSize:11,fontWeight:"600",color:s.c}}>{status}</Text>
    </View>
  );
}

// ─── Action Button ─────────────────────────────────────────────────────────
function Btn({ label, variant="view", onPress }) {
  const m = {
    view:   {bg:"rgba(74,144,217,0.15)", c:"#7ab8ef"},
    danger: {bg:"rgba(239,68,68,0.15)", c:"#f5877b"},
    success:{bg:"rgba(34,197,94,0.15)", c:"#5ddb8f"},
  };
  const s = m[variant];
  return (
    <TouchableOpacity onPress={onPress} style={{paddingHorizontal:12,paddingVertical:6,borderRadius:8,backgroundColor:s.bg,marginRight:6,marginTop:4}}>
      <Text style={{fontSize:12,fontWeight:"700",color:s.c}}>{label}</Text>
    </TouchableOpacity>
  );
}

function Card({ children }) {
  return (
    <View style={{backgroundColor:C.navyCard,borderRadius:16,padding:16,marginBottom:14,borderWidth:1,borderColor:C.border}}>
      {children}
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={{flexDirection:"row",alignItems:"flex-start",paddingVertical:8,borderBottomWidth:1,borderBottomColor:C.border}}>
      <Text style={{fontSize:15,marginRight:10,marginTop:1}}>{icon}</Text>
      <View style={{flex:1}}>
        <Text style={{fontSize:10,color:C.gray,textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>{label}</Text>
        <Text style={{fontSize:13,color:"#E8EDF5",fontWeight:"500"}}>{value||"—"}</Text>
      </View>
    </View>
  );
}

function StatCard({ label, value, change, up, color }) {
  return (
    <View style={{flex:1,backgroundColor:C.navyCard,borderWidth:1,borderColor:C.border,borderRadius:12,padding:12,margin:4}}>
      <Text style={{fontSize:10,color:C.gray,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>{label}</Text>
      <Text style={{fontSize:20,fontWeight:"700",color,marginBottom:4}}>{value}</Text>
      <Text style={{fontSize:10,color:up?C.success:C.error}}>{up?"▲":"▼"} {change}</Text>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// GARAGE DETAIL MODAL
// ══════════════════════════════════════════════════════════════════════════
function GarageDetailModal({ garage, onClose, onAction }) {
  if (!garage) return null;
  return (
    <Modal visible={!!garage} animationType="slide" transparent>
      <View style={{flex:1,backgroundColor:"rgba(0,0,0,0.7)",justifyContent:"flex-end"}}>
        <View style={{backgroundColor:C.navyCard,borderTopLeftRadius:24,borderTopRightRadius:24,maxHeight:"92%",borderTopWidth:2,borderColor:C.gold}}>
          <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",padding:20,borderBottomWidth:1,borderBottomColor:C.border}}>
            <View>
              <Text style={{fontSize:18,fontWeight:"900",color:C.white}}>{garage.name}</Text>
              <Text style={{fontSize:12,color:C.gray,marginTop:2}}>Garage Detail</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{width:34,height:34,borderRadius:17,backgroundColor:C.navyLight,alignItems:"center",justifyContent:"center"}}>
              <Text style={{color:C.gray,fontSize:16}}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{padding:20}} showsVerticalScrollIndicator={false}>
            <View style={{flexDirection:"row",alignItems:"center",marginBottom:16}}>
              <StatusBadge status={garage.status}/>
            </View>
            <Card>
              <Text style={{fontSize:13,fontWeight:"700",color:C.gold,marginBottom:10}}>🏠 Garage Info</Text>
              <InfoRow icon="🏪" label="Garage Name" value={garage.name}/>
              <InfoRow icon="📍" label="Location"    value={typeof garage.location==="string"?garage.location:typeof garage.address==="string"?garage.address:"No address"}/>
              <InfoRow icon="📧" label="Email"       value={garage.email}/>
              <InfoRow icon="📱" label="Phone"       value={garage.phone}/>
              <InfoRow icon="⭐" label="Rating"      value={`${garage.rating||0} / 5.0`}/>
            </Card>
            <Card>
              <Text style={{fontSize:13,fontWeight:"700",color:C.gold,marginBottom:10}}>👤 Owner Info</Text>
              <InfoRow icon="🧑‍💼" label="Owner Name" value={garage.ownerName||garage.ownerId?.name}/>
              <InfoRow icon="📧"   label="Email"      value={garage.ownerEmail||garage.ownerId?.email}/>
              <InfoRow icon="📱"   label="Phone"      value={garage.ownerPhone||garage.ownerId?.phone}/>
            </Card>
            {garage.services?.length > 0 && (
              <Card>
                <Text style={{fontSize:13,fontWeight:"700",color:C.gold,marginBottom:10}}>🔧 Services</Text>
                {garage.services.map((s,i)=>(
                  <View key={i} style={{flexDirection:"row",justifyContent:"space-between",paddingVertical:8,borderBottomWidth:i<garage.services.length-1?1:0,borderBottomColor:C.border}}>
                    <Text style={{fontSize:12,color:"#E8EDF5"}}>{s.name}</Text>
                    <Text style={{fontSize:12,color:C.gold,fontWeight:"600"}}>LKR {s.price}</Text>
                  </View>
                ))}
              </Card>
            )}
            <Card>
              <Text style={{fontSize:13,fontWeight:"700",color:C.gold,marginBottom:12}}>⚡ Admin Actions</Text>
              <View style={{flexDirection:"row",flexWrap:"wrap"}}>
                {(garage.status==="pending"||garage.status==="Pending") && (
                  <>
                    <Btn label="✓ Approve" variant="success" onPress={()=>{onAction(garage._id||garage.id,"approve");onClose();}}/>
                    <Btn label="✕ Reject"  variant="danger"  onPress={()=>{onAction(garage._id||garage.id,"reject");onClose();}}/>
                  </>
                )}
                {(garage.status==="approved"||garage.status==="Approved") && (
                  <Btn label="⛔ Suspend" variant="danger" onPress={()=>{onAction(garage._id||garage.id,"suspend");onClose();}}/>
                )}
                {(garage.status==="suspended"||garage.status==="Suspended") && (
                  <Btn label="✓ Restore" variant="success" onPress={()=>{onAction(garage._id||garage.id,"restore");onClose();}}/>
                )}
              </View>
            </Card>
            <View style={{height:30}}/>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PAGES
// ══════════════════════════════════════════════════════════════════════════

function Dashboard({ setPage }) {
  const [stats, setStats]               = useState({ bookings:0, garages:0, customers:0 });
  const [pendingGarages, setPendingGarages] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading]           = useState(true);

  React.useEffect(() => {
    // allSettled — one fail වුනත් rest eka work කරනවා
    Promise.allSettled([
      api.get('/admin/garages'),
      api.get('/admin/users'),
      api.get('/admin/bookings'),
    ]).then(([gRes, uRes, bRes]) => {
      const garages  = gRes.status === 'fulfilled' ? (gRes.value.data || []) : [];
      const users    = uRes.status === 'fulfilled' ? (uRes.value.data || []) : [];
      const bookings = bRes.status === 'fulfilled' ? (bRes.value.data || []) : [];
      setStats({
        bookings:  bookings.length,
        garages:   garages.length,
        customers: users.filter(u => u.role === 'customer').length,
      });
      setPendingGarages(garages.filter(g => g.status === 'pending'));
      setRecentBookings(bookings.slice(0, 4));
    }).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id, action) => {
    const statusMap = { approve:"approved", reject:"rejected" };
    try {
      await api.patch(`/admin/garages/${id}`, { status: statusMap[action] });
      setPendingGarages(p => p.filter(g => (g._id||g.id) !== id));
      setStats(s => ({...s, garages: action==="approve" ? s.garages : s.garages - 1}));
    } catch(e) {}
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={{flexDirection:"row",flexWrap:"wrap",marginBottom:8}}>
        <StatCard label="Bookings"  value={loading?"…":String(stats.bookings)}          change="total"     up color={C.gold}/>
        <StatCard label="Garages"   value={loading?"…":String(stats.garages)}           change="total"     up color={C.blue}/>
        <StatCard label="Customers" value={loading?"…":String(stats.customers)}         change="total"     up color={C.success}/>
        <StatCard label="Pending"   value={loading?"…":String(pendingGarages.length)}   change="approvals" up={false} color={C.error}/>
      </View>

      {pendingGarages.length > 0 && (
        <Card>
          <View style={{flexDirection:"row",alignItems:"center",marginBottom:12}}>
            <Text style={{fontSize:14,fontWeight:"700",color:C.white,flex:1}}>⚠️ Pending Approvals</Text>
            <View style={{backgroundColor:"rgba(239,68,68,0.15)",borderRadius:10,paddingHorizontal:8,paddingVertical:2}}>
              <Text style={{fontSize:10,color:"#f5877b"}}>{pendingGarages.length} pending</Text>
            </View>
          </View>
          {pendingGarages.map((g,i)=>(
            <View key={g._id||i} style={{paddingVertical:10,borderBottomWidth:i<pendingGarages.length-1?1:0,borderBottomColor:C.border}}>
              <Text style={{fontSize:13,fontWeight:"600",color:"#E8EDF5",marginBottom:2}}>{g.name}</Text>
              <Text style={{fontSize:11,color:C.gray,marginBottom:8}}>{g.email||"No email"}</Text>
              <View style={{flexDirection:"row"}}>
                <Btn label="✓ Approve" variant="success" onPress={()=>handleApprove(g._id||g.id,"approve")}/>
                <Btn label="✕ Reject"  variant="danger"  onPress={()=>handleApprove(g._id||g.id,"reject")}/>
              </View>
            </View>
          ))}
        </Card>
      )}

      <Card>
        <View style={{flexDirection:"row",justifyContent:"space-between",marginBottom:12}}>
          <Text style={{fontSize:14,fontWeight:"700",color:C.white}}>Recent Bookings</Text>
          <TouchableOpacity onPress={()=>setPage("bookings")}>
            <Text style={{fontSize:11,color:C.gold}}>View all →</Text>
          </TouchableOpacity>
        </View>
        {loading && <ActivityIndicator color={C.gold}/>}
        {!loading && recentBookings.length===0 && <Text style={{color:C.gray,fontSize:12}}>No bookings yet</Text>}
        {recentBookings.map((b,i)=>(
          <View key={b._id||i} style={{paddingVertical:8,borderBottomWidth:i<recentBookings.length-1?1:0,borderBottomColor:C.border,flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
            <View>
              <Text style={{fontSize:12,color:"#E8EDF5",fontWeight:"600"}}>{b.customerId?.name||"Customer"}</Text>
              <Text style={{fontSize:11,color:C.gray}}>{b.serviceType||b.service||"Service"}</Text>
            </View>
            <StatusBadge status={b.status||"pending"}/>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={{fontSize:14,fontWeight:"700",color:C.white,marginBottom:8}}>Quick Links</Text>
        {[
          {label:"View All Garages →",   page:"garages"},
          {label:"View All Bookings →",  page:"bookings"},
          {label:"View All Customers →", page:"customers"},
          {label:"Reviews →",            page:"reviews"},
        ].map(item=>(
          <TouchableOpacity key={item.page} onPress={()=>setPage(item.page)}
            style={{paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.border}}>
            <Text style={{fontSize:13,color:C.gold,fontWeight:"600"}}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </Card>
    </ScrollView>
  );
}

function Bookings() {
  const [list, setList]     = useState([]);
  const [tab, setTab]       = useState("All");
  const [loading, setLoading] = useState(true);

  React.useEffect(()=>{
    api.get('/admin/bookings').then(r=>setList(r.data)).catch(()=>setList([])).finally(()=>setLoading(false));
  },[]);

  const tabs = ["All","pending","active","done","cancelled"];
  const filtered = tab==="All" ? list : list.filter(b=>b.status===tab);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
        {tabs.map(t=>(
          <TouchableOpacity key={t} onPress={()=>setTab(t)} style={{paddingHorizontal:14,paddingVertical:6,borderRadius:8,marginRight:8,backgroundColor:tab===t?"rgba(201,168,76,0.15)":C.navyLight,borderWidth:1,borderColor:tab===t?"rgba(201,168,76,0.3)":C.border}}>
            <Text style={{fontSize:11,color:tab===t?C.gold:C.gray,textTransform:"capitalize"}}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {loading ? <ActivityIndicator color={C.gold} style={{marginTop:40}}/> : (
        <Card>
          {filtered.length===0 && <Text style={{color:C.gray,textAlign:"center",padding:12}}>No bookings found</Text>}
          {filtered.map((b,i)=>(
            <View key={b._id||i} style={{paddingVertical:10,borderBottomWidth:i<filtered.length-1?1:0,borderBottomColor:C.border}}>
              <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <Text style={{fontSize:12,fontWeight:"700",color:C.gold}}>#{b._id?.slice(-6).toUpperCase()}</Text>
                <StatusBadge status={b.status}/>
              </View>
              <Text style={{fontSize:13,fontWeight:"600",color:"#E8EDF5"}}>{b.customerId?.name||"Customer"}</Text>
              <Text style={{fontSize:11,color:C.gray}}>{b.serviceType||b.service} · LKR {b.totalAmount||b.amount||"—"}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

function Customers() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/admin/users').then(r=>setData(r.data.filter(u=>u.role==="customer"))).catch(()=>setData([])).finally(()=>setLoading(false));
  };
  React.useEffect(()=>{ load(); },[]);

  const toggleBan = async (id, banned) => {
    try {
      await api.patch(`/admin/users/${id}`, { banned: !banned });
      load();
    } catch(e) {}
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {loading ? <ActivityIndicator color={C.gold} style={{marginTop:40}}/> : (
        <Card>
          {data.length===0 && <Text style={{color:C.gray,textAlign:"center",padding:12}}>No customers found</Text>}
          {data.map((c,i)=>(
            <View key={c._id||i} style={{paddingVertical:10,borderBottomWidth:i<data.length-1?1:0,borderBottomColor:C.border}}>
              <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <Text style={{fontSize:13,fontWeight:"600",color:"#E8EDF5"}}>{c.name}</Text>
                <StatusBadge status={c.banned?"Banned":"Active"}/>
              </View>
              <Text style={{fontSize:11,color:C.gray,marginBottom:8}}>{c.email} · {c.phone||"No phone"}</Text>
              <View style={{flexDirection:"row"}}>
                <Btn label={c.banned?"Unban":"Ban"} variant={c.banned?"success":"danger"} onPress={()=>toggleBan(c._id,c.banned)}/>
              </View>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

// ── Garages page receives onPendingCountChange callback ───────────────────
function Garages({ onPendingCountChange }) {
  const [data, setData]         = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/garages')
      .then(r => {
        const garages = r.data || [];
        setData(garages);
        // 🔔 notify root about current pending count
        const count = garages.filter(g => g.status === "pending").length;
        onPendingCountChange?.(count);
      })
      .catch(()=>setData([]))
      .finally(()=>setLoading(false));
  }, [onPendingCountChange]);

  useEffect(()=>{ load(); },[load]);

  const handleAction = async (id, action) => {
    const statusMap = { approve:"approved", reject:"rejected", suspend:"suspended", restore:"approved" };
    try {
      await api.patch(`/admin/garages/${id}`, { status: statusMap[action] });
      load();
    } catch(e) {}
  };

  const pendingCount = data.filter(g=>g.status==="pending").length;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {pendingCount > 0 && (
        <View style={{backgroundColor:"rgba(239,68,68,0.1)",borderRadius:12,padding:12,marginBottom:12,borderWidth:1,borderColor:"rgba(239,68,68,0.25)",flexDirection:"row",alignItems:"center"}}>
          <Text style={{fontSize:16,marginRight:8}}>⚠️</Text>
          <Text style={{color:"#f5877b",fontSize:12,fontWeight:"600"}}>{pendingCount} garage{pendingCount>1?"s":""} waiting for approval</Text>
        </View>
      )}
      {loading ? <ActivityIndicator color={C.gold} style={{marginTop:40}}/> : (
        <>
          {data.length===0 && <Text style={{color:C.gray,textAlign:"center",padding:20}}>No garages found</Text>}
          {data.map((g,i)=>(
            <Card key={g._id||i}>
              <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <View style={{flex:1}}>
                  <Text style={{fontSize:15,fontWeight:"800",color:C.white,marginBottom:3}}>{g.name}</Text>
                  <Text style={{fontSize:12,color:C.gray}}>👤 {g.ownerName||g.ownerId?.name||"Owner"}</Text>
                </View>
                <StatusBadge status={g.status}/>
              </View>
              <View style={{flexDirection:"row",flexWrap:"wrap",marginBottom:12}}>
                {[
                  {icon:"📍",val:typeof g.location==="string"?g.location:typeof g.address==="string"?g.address:"No address"},
                  {icon:"⭐",val:`${g.rating||0} rating`},
                  {icon:"📧",val:g.email||"No email"},
                ].map((chip,j)=>(
                  <View key={j} style={{flexDirection:"row",alignItems:"center",backgroundColor:C.navyLight,paddingHorizontal:8,paddingVertical:4,borderRadius:8,borderWidth:1,borderColor:C.border,marginRight:6,marginBottom:6}}>
                    <Text style={{fontSize:11,marginRight:4}}>{chip.icon}</Text>
                    <Text style={{fontSize:11,color:"#E8EDF5"}}>{chip.val}</Text>
                  </View>
                ))}
              </View>
              <View style={{flexDirection:"row",flexWrap:"wrap"}}>
                <Btn label="View Details →" variant="view" onPress={()=>setSelected(g)}/>
                {g.status==="pending"   && <><Btn label="✓ Approve" variant="success" onPress={()=>handleAction(g._id,"approve")}/><Btn label="✕ Reject" variant="danger" onPress={()=>handleAction(g._id,"reject")}/></>}
                {g.status==="approved"  && <Btn label="⛔ Suspend" variant="danger"  onPress={()=>handleAction(g._id,"suspend")}/>}
                {g.status==="suspended" && <Btn label="✓ Restore" variant="success" onPress={()=>handleAction(g._id,"restore")}/>}
              </View>
            </Card>
          ))}
        </>
      )}
      <GarageDetailModal
        garage={selected}
        onClose={()=>setSelected(null)}
        onAction={handleAction}
      />
    </ScrollView>
  );
}

function Finance() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={{flexDirection:"row",flexWrap:"wrap",marginBottom:8}}>
        <StatCard label="Total Revenue"   value="LKR 2.4M" change="8% vs last" up color={C.gold}/>
        <StatCard label="Platform Fee"    value="LKR 240K" change="collected"  up color={C.success}/>
        <StatCard label="Pending Payouts" value="LKR 84K"  change="3 garages" up={false} color={C.error}/>
      </View>
      <Card>
        <Text style={{fontSize:13,fontWeight:"700",color:C.gold,marginBottom:8}}>Finance module coming soon...</Text>
        <Text style={{fontSize:12,color:C.gray}}>Connect your financeController routes to see live data here.</Text>
      </Card>
    </ScrollView>
  );
}

function Reviews() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/admin/reviews').then(r=>setData(r.data)).catch(()=>setData([])).finally(()=>setLoading(false));
  };
  React.useEffect(()=>{ load(); },[]);

  const remove = async (id) => {
    try { await api.delete(`/admin/reviews/${id}`); load(); } catch(e){}
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {loading ? <ActivityIndicator color={C.gold} style={{marginTop:40}}/> : (
        <Card>
          {data.length===0 && <Text style={{color:C.gray,textAlign:"center",padding:12}}>No reviews found</Text>}
          {data.map((r,i)=>(
            <View key={r._id||i} style={{paddingVertical:10,borderBottomWidth:i<data.length-1?1:0,borderBottomColor:C.border}}>
              <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                <Text style={{fontSize:13,fontWeight:"600",color:"#E8EDF5"}}>{r.customerId?.name||"Customer"}</Text>
                <Text style={{color:C.gold,fontWeight:"700"}}>⭐ {r.rating}</Text>
              </View>
              <Text style={{fontSize:11,color:C.gray,marginBottom:4}}>at {r.garageId?.name||"Garage"}</Text>
              <Text style={{fontSize:12,color:"#E8EDF5",fontStyle:"italic",marginBottom:8}}>"{r.comment||r.review}"</Text>
              <Btn label="Remove" variant="danger" onPress={()=>remove(r._id)}/>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

function Settings({ onLogout }) {
  const [toggles, setToggles] = useState({email:true, autoApprove:false, maintenance:false});
  const toggle = k => setToggles(t=>({...t,[k]:!t[k]}));
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Card>
        {[
          {key:"email",       label:"Email Notifications", sub:"Send alerts to admin email"},
          {key:"autoApprove", label:"Auto-approve Garages", sub:"Skip manual review"},
          {key:"maintenance", label:"Maintenance Mode",     sub:"Disable app for all users"},
        ].map(r=>(
          <View key={r.key} style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.border}}>
            <View style={{flex:1}}>
              <Text style={{fontSize:13,fontWeight:"600",color:"#E8EDF5"}}>{r.label}</Text>
              <Text style={{fontSize:11,color:C.gray,marginTop:2}}>{r.sub}</Text>
            </View>
            <TouchableOpacity onPress={()=>toggle(r.key)} style={{width:36,height:20,borderRadius:10,backgroundColor:toggles[r.key]?C.gold:C.navyLight,position:"relative",borderWidth:1,borderColor:C.border}}>
              <View style={{position:"absolute",top:2,width:14,height:14,borderRadius:7,backgroundColor:"#fff",left:toggles[r.key]?18:2}}/>
            </TouchableOpacity>
          </View>
        ))}
      </Card>
      <TouchableOpacity onPress={onLogout} style={{backgroundColor:"rgba(239,68,68,0.15)",borderRadius:14,padding:16,alignItems:"center",borderWidth:1,borderColor:"rgba(239,68,68,0.3)"}}>
        <Text style={{color:C.error,fontWeight:"700",fontSize:15}}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// NAV CONFIG
// ══════════════════════════════════════════════════════════════════════════
const NAV = [
  {id:"dashboard", label:"Home",     icon:"📊"},
  {id:"bookings",  label:"Bookings", icon:"📋"},
  {id:"customers", label:"Users",    icon:"👤"},
  {id:"garages",   label:"Garages",  icon:"🏠"},
  {id:"reviews",   label:"Reviews",  icon:"⭐"},
  {id:"settings",  label:"Settings", icon:"⚙️"},
];

const TITLES = {
  dashboard:"Dashboard", bookings:"Bookings", customers:"Customers",
  garages:"Garages", finance:"Finance", reviews:"Reviews", settings:"Settings",
};

// ══════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════
export default function AdminPanelScreen() {
  const insets          = useSafeAreaInsets();
  const { logout }      = useAuth();
  const [page, setPage] = useState("dashboard");

  // 🔔 Pending count lives here so the badge always stays in sync
  const [pendingCount, setPendingCount] = useState(0);

  // Also fetch once on mount so badge shows even before user visits Garages tab
  useEffect(() => {
    api.get('/admin/garages')
      .then(r => {
        const count = (r.data || []).filter(g => g.status === "pending").length;
        setPendingCount(count);
      })
      .catch(() => {});
  }, []);

  const pages = {
    dashboard: <Dashboard setPage={setPage}/>,
    bookings:  <Bookings/>,
    customers: <Customers/>,
    garages:   <Garages onPendingCountChange={setPendingCount}/>,
    finance:   <Finance/>,
    reviews:   <Reviews/>,
    settings:  <Settings onLogout={logout}/>,
  };

  return (
    <View style={{flex:1,backgroundColor:C.navy,paddingTop:insets.top}}>
      <StatusBar barStyle="light-content" backgroundColor={C.navyMid}/>

      {/* ── Topbar ── */}
      <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:16,paddingVertical:12,backgroundColor:C.navyMid,borderBottomWidth:1,borderBottomColor:C.border}}>
        <View style={{flexDirection:"row",alignItems:"center"}}>
          <Text style={{fontSize:16}}>🔧</Text>
          <Text style={{fontSize:15,fontWeight:"700",color:C.gold}}>{TITLES[page]}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={{backgroundColor:"rgba(239,68,68,0.15)",paddingHorizontal:10,paddingVertical:5,borderRadius:8,borderWidth:1,borderColor:"rgba(239,68,68,0.25)"}}>
          <Text style={{fontSize:11,color:C.error,fontWeight:"600"}}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>

      {/* ── Page content ── */}
      <View style={{flex:1,padding:14}}>{pages[page]}</View>

      {/* ── Bottom Nav with badge ── */}
      <View style={{flexDirection:"row",backgroundColor:C.navyMid,borderTopWidth:1,borderTopColor:C.border,paddingBottom:4}}>
        {NAV.map(item => {
          const isGarages = item.id === "garages";
          const showBadge = isGarages && pendingCount > 0;
          const isActive  = page === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => setPage(item.id)}
              style={{flex:1,alignItems:"center",paddingVertical:7,position:"relative"}}
            >
              {/* Icon + badge wrapper */}
              <View style={{position:"relative"}}>
                <Text style={{fontSize:18}}>{item.icon}</Text>

                {/* 🔴 Notification badge */}
                {showBadge && (
                  <View style={{
                    position:"absolute",
                    top:-4, right:-6,
                    minWidth:16, height:16,
                    borderRadius:8,
                    backgroundColor:C.error,
                    justifyContent:"center",
                    alignItems:"center",
                    paddingHorizontal:3,
                    borderWidth:1.5,
                    borderColor:C.navyMid,
                  }}>
                    <Text style={{
                      color:"#fff",
                      fontSize:9,
                      fontWeight:"900",
                      lineHeight:11,
                    }}>
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={{fontSize:9,marginTop:1,color:isActive?C.gold:C.gray}}>{item.label}</Text>
              {isActive && (
                <View style={{position:"absolute",bottom:0,left:"15%",right:"15%",height:2,backgroundColor:C.gold,borderRadius:1}}/>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}