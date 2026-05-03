import React, { useState } from "react";

// ── Design tokens (exact match from your app) ─────────────────────────────
const C = {
  navy:      "#08152B",
  navyMid:   "#0F2040",
  navyCard:  "#142035",
  navyLight: "#1A2D4A",
  gold:      "#C9A84C",
  goldDim:   "rgba(201,168,76,0.12)",
  white:     "#FFFFFF",
  offWhite:  "#E8EDF5",
  gray:      "#6B80A0",
  border:    "rgba(201,168,76,0.18)",
  success:   "#22C55E",
  error:     "#EF4444",
  warning:   "#F59E0B",
  blue:      "#4a90d9",
  purple:    "#c084fc",
};

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";

// ── Reusable small components ─────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    Active:    { bg: "rgba(34,197,94,0.15)",  color: "#5ddb8f" },
    Pending:   { bg: "rgba(201,168,76,0.15)", color: "#ffd07b" },
    Done:      { bg: "rgba(74,144,217,0.15)", color: "#7ab8ef" },
    Cancelled: { bg: "rgba(239,68,68,0.15)",  color: "#f5877b" },
    Approved:  { bg: "rgba(34,197,94,0.15)",  color: "#5ddb8f" },
    Pending:   { bg: "rgba(201,168,76,0.15)", color: "#ffd07b" },
    Suspended: { bg: "rgba(239,68,68,0.15)",  color: "#f5877b" },
    Banned:    { bg: "rgba(239,68,68,0.15)",  color: "#f5877b" },
    Paid:      { bg: "rgba(34,197,94,0.15)",  color: "#5ddb8f" },
    Review:    { bg: "rgba(245,158,11,0.15)", color: "#fbbf24" },
  };
  const s = map[status] || { bg: "rgba(255,255,255,0.1)", color: C.gray };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, padding: "2px 9px", borderRadius: 20,
      fontWeight: 600, background: s.bg, color: s.color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, display: "inline-block" }} />
      {status}
    </span>
  );
}

function ActionBtn({ label, variant = "view", onClick }) {
  const styles = {
    view:    { bg: "rgba(74,144,217,0.15)",  color: "#7ab8ef",  border: "rgba(74,144,217,0.25)" },
    danger:  { bg: "rgba(239,68,68,0.12)",   color: "#f5877b",  border: "rgba(239,68,68,0.2)"  },
    success: { bg: "rgba(34,197,94,0.12)",   color: "#5ddb8f",  border: "rgba(34,197,94,0.2)"  },
  };
  const s = styles[variant];
  return (
    <button onClick={onClick} style={{
      padding: "3px 10px", borderRadius: 6, fontSize: 11,
      cursor: "pointer", background: s.bg, color: s.color,
      border: `1px solid ${s.border}`, marginRight: 4,
    }}>{label}</button>
  );
}

function StatCard({ label, value, change, up, color }) {
  return (
    <div style={{
      background: C.navyCard, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "12px 16px", flex: 1,
    }}>
      <div style={{ fontSize: 10, color: C.gray, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 10, color: up ? C.success : C.error }}>{up ? "▲" : "▼"} {change}</div>
    </div>
  );
}

// ── Pages ─────────────────────────────────────────────────────────────────

function Dashboard({ setPage }) {
  const [approvals, setApprovals] = useState([
    { id: 1, name: "Silva Auto Works", owner: "Nimal Silva",  location: "Colombo 03", time: "Today 9:14 AM" },
    { id: 2, name: "Perera Motors",    owner: "Kamal Perera", location: "Kandy",      time: "Yesterday"    },
    { id: 3, name: "RD Garage",        owner: "Ravi D.",      location: "Gampaha",    time: "2 days ago"   },
  ]);
  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Bookings" value="1,284" change="8.2% this month"  up color={C.gold}   />
        <StatCard label="Active Garages" value="47"    change="3 new this week"  up color={C.blue}   />
        <StatCard label="Customers"      value="3,592" change="12.5% growth"     up color={C.success}/>
        <StatCard label="Revenue (LKR)"  value="2.4M"  change="2.1% vs last"  up={false} color={C.purple} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div style={{ background: C.navyCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            Recent Bookings
            <span onClick={() => setPage("bookings")} style={{ fontSize: 11, color: C.gold, cursor: "pointer", fontWeight: 400 }}>View all →</span>
          </div>
          <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
            <thead><tr>{["Customer","Service","Status"].map(h => <th key={h} style={{ textAlign:"left", color: C.gray, fontSize:10, padding:"0 6px 8px", textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
            <tbody>
              {[["Kasun P.","Oil Change","Active"],["Nimal S.","Brake Check","Pending"],["Dilani R.","Full Service","Done"],["Amara W.","AC Repair","Pending"]].map(([c,s,st],i) => (
                <tr key={i}><td style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}>{c}</td><td style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}>{s}</td><td style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}><StatusBadge status={st}/></td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: C.navyCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Top Services</div>
          {[["Oil Change",82,C.gold],["Full Service",65,C.blue],["Brake Check",48,C.success],["AC Repair",31,C.purple]].map(([name,pct,color]) => (
            <div key={name} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <div style={{ fontSize:11, color:C.gray, width:80 }}>{name}</div>
              <div style={{ flex:1, height:5, background:"rgba(255,255,255,0.06)", borderRadius:3 }}>
                <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:3 }} />
              </div>
              <div style={{ fontSize:11, fontWeight:600, width:28, textAlign:"right" }}>{pct}%</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.navyCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
          Pending Garage Approvals
          <span style={{ background:"rgba(239,68,68,0.15)", color:"#f5877b", fontSize:11, padding:"2px 8px", borderRadius:10 }}>{approvals.length} pending</span>
        </div>
        <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
          <thead><tr>{["Garage","Owner","Location","Submitted","Action"].map(h=><th key={h} style={{textAlign:"left",color:C.gray,fontSize:10,padding:"0 6px 8px",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
          <tbody>
            {approvals.map(r => (
              <tr key={r.id}>
                <td style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}>{r.name}</td>
                <td style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}>{r.owner}</td>
                <td style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}>{r.location}</td>
                <td style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}>{r.time}</td>
                <td style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}>
                  <ActionBtn label="Approve" variant="success" onClick={() => setApprovals(a => a.filter(x => x.id !== r.id))} />
                  <ActionBtn label="Reject"  variant="danger"  onClick={() => setApprovals(a => a.filter(x => x.id !== r.id))} />
                </td>
              </tr>
            ))}
            {approvals.length === 0 && <tr><td colSpan={5} style={{padding:16,textAlign:"center",color:C.gray,fontSize:12}}>No pending approvals</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Bookings() {
  const [tab, setTab] = useState("All");
  const all = [
    { id:"#1042", customer:"Kasun P.",  garage:"Silva Auto",    service:"Oil Change",    date:"02 May", amount:"LKR 2,500", status:"Active"    },
    { id:"#1041", customer:"Nimal S.",  garage:"Perera Motors", service:"Brake Check",   date:"02 May", amount:"LKR 4,200", status:"Pending"   },
    { id:"#1040", customer:"Dilani R.", garage:"RD Garage",     service:"Full Service",  date:"01 May", amount:"LKR 8,500", status:"Done"      },
    { id:"#1039", customer:"Amara W.",  garage:"Silva Auto",    service:"AC Repair",     date:"01 May", amount:"LKR 6,800", status:"Pending"   },
    { id:"#1038", customer:"Ruwan M.",  garage:"Perera Motors", service:"Tyre Swap",     date:"30 Apr", amount:"LKR 3,200", status:"Cancelled" },
  ];
  const tabs = ["All","Pending","Active","Done","Cancelled"];
  const filtered = tab === "All" ? all : all.filter(b => b.status === tab);
  return (
    <div>
      <div style={{ display:"flex", gap:0, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden", marginBottom:14, width:"fit-content" }}>
        {tabs.map(t => (
          <div key={t} onClick={() => setTab(t)} style={{
            padding:"6px 14px", fontSize:11, cursor:"pointer",
            background: tab===t ? "rgba(201,168,76,0.15)" : C.navyLight,
            color: tab===t ? C.gold : C.gray,
            borderRight: `1px solid ${C.border}`,
          }}>{t}</div>
        ))}
      </div>
      <div style={{ background:C.navyCard, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
        <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
          <thead><tr>{["#","Customer","Garage","Service","Date","Amount","Status","Action"].map(h=><th key={h} style={{textAlign:"left",color:C.gray,fontSize:10,padding:"0 6px 8px",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b.id}>
                {[b.id,b.customer,b.garage,b.service,b.date,b.amount].map((v,i)=><td key={i} style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}>{v}</td>)}
                <td style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}><StatusBadge status={b.status}/></td>
                <td style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}><ActionBtn label="View" variant="view"/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Customers() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [data, setData] = useState([
    { name:"Kasun Perera",      email:"kasun@gmail.com",  phone:"071-234-5678", bookings:8,  joined:"Jan 2024", status:"Active" },
    { name:"Dilani Ranasinghe", email:"dilani@gmail.com", phone:"077-456-7890", bookings:3,  joined:"Feb 2024", status:"Active" },
    { name:"Amara Wijesinghe",  email:"amara@gmail.com",  phone:"070-987-6543", bookings:12, joined:"Mar 2024", status:"Active" },
    { name:"Ruwan Mendis",      email:"ruwan@gmail.com",  phone:"076-321-9870", bookings:1,  joined:"Apr 2024", status:"Banned" },
  ]);
  const toggleBan = name => setData(d => d.map(c => c.name === name ? { ...c, status: c.status==="Banned" ? "Active" : "Banned" } : c));
  const filters = ["All","Active","Banned"];
  const list = data.filter(c => (filter==="All" || c.status===filter) && c.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers..." style={{
          padding:"6px 12px", borderRadius:8, border:`1px solid ${C.border}`,
          background:C.navyLight, color:C.white, fontSize:12, outline:"none", width:200,
        }}/>
        {filters.map(f=>(
          <div key={f} onClick={()=>setFilter(f)} style={{
            padding:"5px 12px", borderRadius:20, fontSize:11, cursor:"pointer",
            background: filter===f ? "rgba(201,168,76,0.15)" : C.navyLight,
            color: filter===f ? C.gold : C.gray,
            border: `1px solid ${filter===f ? "rgba(201,168,76,0.3)" : C.border}`,
          }}>{f}</div>
        ))}
      </div>
      <div style={{ background:C.navyCard, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
        <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
          <thead><tr>{["Name","Email","Phone","Bookings","Joined","Status","Action"].map(h=><th key={h} style={{textAlign:"left",color:C.gray,fontSize:10,padding:"0 6px 8px",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
          <tbody>
            {list.map(c=>(
              <tr key={c.name}>
                {[c.name,c.email,c.phone,c.bookings,c.joined].map((v,i)=><td key={i} style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}>{v}</td>)}
                <td style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}><StatusBadge status={c.status}/></td>
                <td style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}>
                  <ActionBtn label="View" variant="view"/>
                  <ActionBtn label={c.status==="Banned"?"Unban":"Ban"} variant={c.status==="Banned"?"success":"danger"} onClick={()=>toggleBan(c.name)}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Garages() {
  const [data, setData] = useState([
    { name:"Silva Auto Works", owner:"Nimal Silva",  location:"Colombo 03", services:8,  rating:"4.8", status:"Pending"  },
    { name:"Perera Motors",    owner:"Kamal Perera", location:"Kandy",      services:5,  rating:"4.5", status:"Pending"  },
    { name:"Lanka Service",    owner:"Sunil K.",     location:"Galle",      services:12, rating:"4.9", status:"Approved" },
    { name:"City Garage",      owner:"Priya F.",     location:"Colombo 07", services:7,  rating:"4.2", status:"Approved" },
  ]);
  const approve  = name => setData(d => d.map(g => g.name===name ? {...g, status:"Approved"} : g));
  const reject   = name => setData(d => d.filter(g => g.name!==name));
  const suspend  = name => setData(d => d.map(g => g.name===name ? {...g, status:"Suspended"} : g));
  return (
    <div style={{ background:C.navyCard, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
      <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
        <thead><tr>{["Garage","Owner","Location","Services","Rating","Status","Action"].map(h=><th key={h} style={{textAlign:"left",color:C.gray,fontSize:10,padding:"0 6px 8px",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
        <tbody>
          {data.map(g=>(
            <tr key={g.name}>
              {[g.name,g.owner,g.location,g.services,`⭐ ${g.rating}`].map((v,i)=><td key={i} style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}>{v}</td>)}
              <td style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}><StatusBadge status={g.status}/></td>
              <td style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}>
                {g.status==="Pending"  && <><ActionBtn label="Approve" variant="success" onClick={()=>approve(g.name)}/><ActionBtn label="Reject" variant="danger" onClick={()=>reject(g.name)}/></>}
                {g.status==="Approved" && <ActionBtn label="Suspend" variant="danger" onClick={()=>suspend(g.name)}/>}
                {g.status==="Suspended"&& <ActionBtn label="Restore" variant="success" onClick={()=>approve(g.name)}/>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Finance() {
  return (
    <div>
      <div style={{ display:"flex", gap:12, marginBottom:16 }}>
        <StatCard label="Total Revenue"     value="LKR 2.4M" change="8% vs last month"   up color={C.gold}   />
        <StatCard label="Platform Fee (10%)"value="LKR 240K" change="collected"           up color={C.success}/>
        <StatCard label="Pending Payouts"   value="LKR 84K"  change="3 garages"        up={false} color={C.error}  />
      </div>
      <div style={{ background:C.navyCard, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Recent Transactions</div>
        <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
          <thead><tr>{["Booking #","Customer","Garage","Total","Platform Cut","Date","Status"].map(h=><th key={h} style={{textAlign:"left",color:C.gray,fontSize:10,padding:"0 6px 8px",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
          <tbody>
            {[
              ["#1042","Kasun P.","Silva Auto","LKR 2,500","LKR 250","02 May","Done"],
              ["#1041","Nimal S.","Perera Motors","LKR 4,200","LKR 420","02 May","Pending"],
              ["#1040","Dilani R.","RD Garage","LKR 8,500","LKR 850","01 May","Done"],
            ].map((r,i)=>(
              <tr key={i}>{r.map((v,j)=><td key={j} style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}>{j===6?<StatusBadge status={v}/>:v}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Reviews() {
  const [data, setData] = useState([
    { customer:"Kasun P.",  garage:"Silva Auto",   rating:"5.0", review:"Excellent service!",    date:"02 May" },
    { customer:"Dilani R.", garage:"Lanka Service", rating:"4.0", review:"Good but slow.",         date:"01 May" },
    { customer:"Ruwan M.",  garage:"City Garage",  rating:"1.0", review:"Very bad experience!",  date:"30 Apr" },
  ]);
  return (
    <div style={{ background:C.navyCard, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
      <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
        <thead><tr>{["Customer","Garage","Rating","Review","Date","Action"].map(h=><th key={h} style={{textAlign:"left",color:C.gray,fontSize:10,padding:"0 6px 8px",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
        <tbody>
          {data.map((r,i)=>(
            <tr key={i}>
              {[r.customer,r.garage,`⭐ ${r.rating}`,r.review,r.date].map((v,j)=><td key={j} style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}>{v}</td>)}
              <td style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}>
                <ActionBtn label="Remove" variant="danger" onClick={()=>setData(d=>d.filter((_,j)=>j!==i))}/>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Notifications() {
  const items = [
    { icon:"🏠", bg:"rgba(239,68,68,0.15)",   text:"New garage approval: Silva Auto Works",     time:"5 min ago",  unread:true  },
    { icon:"👤", bg:"rgba(34,197,94,0.15)",    text:"New customer registered: Kasun Perera",     time:"12 min ago", unread:true  },
    { icon:"📋", bg:"rgba(201,168,76,0.15)",   text:"Booking #1042 marked as active",            time:"1 hr ago",   unread:true  },
    { icon:"⭐", bg:"rgba(239,68,68,0.15)",    text:"1-star review flagged: Ruwan M.",           time:"2 hrs ago",  unread:false },
    { icon:"💰", bg:"rgba(74,144,217,0.15)",   text:"Payout LKR 84,000 pending for 3 garages",  time:"3 hrs ago",  unread:false },
  ];
  return (
    <div style={{ background:C.navyCard, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
      {items.map((n,i)=>(
        <div key={i} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ width:30, height:30, borderRadius:8, background:n.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{n.icon}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:500, marginBottom:2 }}>{n.text}</div>
            <div style={{ fontSize:10, color:C.gray }}>{n.time}</div>
          </div>
          {n.unread && <div style={{ width:7, height:7, borderRadius:"50%", background:C.gold, marginTop:4, flexShrink:0 }}/>}
        </div>
      ))}
    </div>
  );
}

function Settings() {
  const [toggles, setToggles] = useState({ email:true, autoApprove:false, maintenance:false });
  const [fee, setFee] = useState("10");
  const toggle = k => setToggles(t => ({...t, [k]:!t[k]}));
  const Toggle = ({ k }) => (
    <div onClick={()=>toggle(k)} style={{
      width:36, height:20, borderRadius:20, cursor:"pointer", position:"relative",
      background: toggles[k] ? C.gold : C.navyLight,
      border:`1px solid ${C.border}`, transition:"background 0.2s",
    }}>
      <div style={{
        position:"absolute", top:2, width:14, height:14, borderRadius:"50%",
        background:C.white, transition:"left 0.2s",
        left: toggles[k] ? 18 : 2,
      }}/>
    </div>
  );
  const rows = [
    { key:"email",       label:"Email Notifications",  sub:"Send alerts to admin email" },
    { key:"autoApprove", label:"Auto-approve Garages",  sub:"Skip manual review for verified owners" },
    { key:"maintenance", label:"Maintenance Mode",      sub:"Disable app for all users" },
  ];
  return (
    <div style={{ background:C.navyCard, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
      {rows.map(r=>(
        <div key={r.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize:12, fontWeight:500 }}>{r.label}</div>
            <div style={{ fontSize:10, color:C.gray, marginTop:2 }}>{r.sub}</div>
          </div>
          <Toggle k={r.key}/>
        </div>
      ))}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
        <div>
          <div style={{ fontSize:12, fontWeight:500 }}>Platform Fee (%)</div>
          <div style={{ fontSize:10, color:C.gray, marginTop:2 }}>Current: {fee}% per booking</div>
        </div>
        <input value={fee} onChange={e=>setFee(e.target.value)} style={{ width:70, background:C.navyLight, border:`1px solid ${C.border}`, color:C.white, padding:"5px 8px", borderRadius:6, fontSize:12, outline:"none" }}/>
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0" }}>
        <div>
          <div style={{ fontSize:12, fontWeight:500 }}>Admin Password</div>
          <div style={{ fontSize:10, color:C.gray, marginTop:2 }}>Change login credentials</div>
        </div>
        <ActionBtn label="Change" variant="view"/>
      </div>
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err,  setErr]  = useState("");
  const [show, setShow] = useState(false);

  const handleLogin = () => {
    if (user === ADMIN_USER && pass === ADMIN_PASS) { onLogin(); }
    else { setErr("Invalid credentials. Try admin / admin123"); setTimeout(() => setErr(""), 3000); }
  };

  return (
    <div style={{
      minHeight:"100vh", background:C.navy, display:"flex",
      alignItems:"center", justifyContent:"center", padding:20,
      position:"relative", overflow:"hidden",
    }}>
      {/* decorative circles */}
      <div style={{ position:"absolute", top:-70, right:-50, width:200, height:200, borderRadius:"50%", background:C.gold, opacity:0.05 }}/>
      <div style={{ position:"absolute", top:80,  left:-60, width:160, height:160, borderRadius:"50%", background:C.gold, opacity:0.03 }}/>

      <div style={{ width:"100%", maxWidth:380 }}>
        {/* Brand */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ position:"relative", width:84, height:84, margin:"0 auto 14px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ width:68, height:68, borderRadius:22, background:C.navyCard, border:`2px solid ${C.gold}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>🔧</div>
            <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`1px dashed rgba(201,168,76,0.25)` }}/>
          </div>
          <div style={{ fontSize:24, fontWeight:900, letterSpacing:"1.2px", marginBottom:8 }}>AutoServe Pro</div>
          <div style={{ width:44, height:2.5, background:C.gold, borderRadius:2, margin:"0 auto 9px" }}/>
          <div style={{ fontSize:12, color:C.gray }}>Admin Access Only</div>
        </div>

        {/* Card */}
        <div style={{ background:C.navyCard, borderRadius:24, padding:24, border:`1px solid ${C.border}`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:C.gold }}/>
          <div style={{ fontSize:22, fontWeight:800, marginTop:4, marginBottom:4 }}>Welcome Back</div>
          <div style={{ fontSize:13, color:C.gray, marginBottom:22 }}>Sign in to manage your service center</div>

          {err && (
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(239,68,68,0.1)", borderRadius:12, padding:12, marginBottom:16, border:"1px solid rgba(239,68,68,0.3)" }}>
              <span style={{ fontSize:16 }}>🚫</span>
              <span style={{ color:C.error, fontSize:13, fontWeight:600 }}>{err}</span>
            </div>
          )}

          {/* Username */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.gold, marginBottom:7, letterSpacing:"0.9px", textTransform:"uppercase" }}>Username</div>
            <div style={{ display:"flex", alignItems:"center", background:C.navyLight, borderRadius:13, padding:"0 14px", border:`1.5px solid ${C.border}` }}>
              <span style={{ fontSize:17, marginRight:9 }}>👤</span>
              <input value={user} onChange={e=>setUser(e.target.value)} placeholder="admin"
                style={{ flex:1, padding:"14px 0", fontSize:15, color:C.white, background:"transparent", border:"none", outline:"none" }}/>
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.gold, marginBottom:7, letterSpacing:"0.9px", textTransform:"uppercase" }}>Password</div>
            <div style={{ display:"flex", alignItems:"center", background:C.navyLight, borderRadius:13, padding:"0 14px", border:`1.5px solid ${C.border}` }}>
              <span style={{ fontSize:17, marginRight:9 }}>🔒</span>
              <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••"
                type={show?"text":"password"} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                style={{ flex:1, padding:"14px 0", fontSize:15, color:C.white, background:"transparent", border:"none", outline:"none" }}/>
              <button onClick={()=>setShow(s=>!s)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:17, padding:"4px" }}>{show?"🙈":"👁️"}</button>
            </div>
          </div>

          <div style={{ textAlign:"right", marginBottom:20 }}>
            <span style={{ color:C.gold, fontSize:13, fontWeight:600, cursor:"pointer" }}>Forgot password?</span>
          </div>

          <button onClick={handleLogin} style={{
            width:"100%", background:C.gold, border:"none", borderRadius:14,
            padding:16, fontSize:16, fontWeight:900, color:C.navy,
            letterSpacing:"0.4px", cursor:"pointer",
          }}>Sign In  →</button>

          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:6, marginTop:16 }}>
            <span style={{ fontSize:13 }}>🔐</span>
            <span style={{ fontSize:11, color:C.gray }}>256-bit encrypted · Your data is safe</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Panel ──────────────────────────────────────────────────────
const NAV = [
  { section:"Overview", items:[
    { id:"dashboard",     label:"Dashboard",     icon:"📊" },
    { id:"bookings",      label:"Bookings",      icon:"📋", badge:12 },
  ]},
  { section:"Users", items:[
    { id:"customers",     label:"Customers",     icon:"👤" },
    { id:"garages",       label:"Garages",       icon:"🏠", badge:3, badgeDanger:true },
  ]},
  { section:"Business", items:[
    { id:"services",      label:"Services",      icon:"🔧" },
    { id:"finance",       label:"Finance",       icon:"💰" },
    { id:"reviews",       label:"Reviews",       icon:"⭐" },
  ]},
  { section:"System", items:[
    { id:"notifications", label:"Notifications", icon:"🔔", badge:5, badgeDanger:true },
    { id:"settings",      label:"Settings",      icon:"⚙️" },
  ]},
];

const PAGE_TITLES = {
  dashboard:"Dashboard Overview", bookings:"All Bookings",
  customers:"Customer Management", garages:"Garage Management",
  services:"Services", finance:"Finance Overview",
  reviews:"Customer Reviews", notifications:"Notifications",
  settings:"Settings",
};

function ServicesPage() {
  const rows = [
    ["Oil Change","Maintenance","2,500",342,"Active"],
    ["Full Service","Maintenance","8,500",218,"Active"],
    ["Brake Check","Safety","4,200",156,"Active"],
    ["AC Repair","Comfort","6,800",98,"Active"],
    ["Tyre Swap","Tyres","3,200",87,"Active"],
    ["Engine Diagnostic","Diagnostic","5,000",54,"Review"],
  ];
  return (
    <div style={{ background:C.navyCard, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
      <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
        <thead><tr>{["Service","Category","Avg Price (LKR)","Bookings","Status"].map(h=><th key={h} style={{textAlign:"left",color:C.gray,fontSize:10,padding:"0 6px 8px",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map(([s,c,p,b,st],i)=>(
            <tr key={i}>
              {[s,c,p,b].map((v,j)=><td key={j} style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}>{v}</td>)}
              <td style={{padding:"7px 6px",borderTop:`1px solid ${C.border}`}}><StatusBadge status={st}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminPanel({ onLogout }) {
  const [page, setPage] = useState("dashboard");

  const pageMap = {
    dashboard:     <Dashboard setPage={setPage} />,
    bookings:      <Bookings />,
    customers:     <Customers />,
    garages:       <Garages />,
    services:      <ServicesPage />,
    finance:       <Finance />,
    reviews:       <Reviews />,
    notifications: <Notifications />,
    settings:      <Settings />,
  };

  return (
    <div style={{ display:"flex", height:"100vh", background:C.navy, color:C.white, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width:210, background:C.navyMid, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"16px 14px 12px", display:"flex", alignItems:"center", gap:9, borderBottom:`1px solid ${C.border}` }}>
          <div style={{ width:30, height:30, background:C.navyCard, border:`2px solid ${C.gold}`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>🔧</div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:C.gold }}>AutoServe Pro</div>
            <div style={{ fontSize:10, color:C.gray }}>Admin Panel</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:C.gold, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:C.navy }}>AD</div>
          <div>
            <div style={{ fontSize:12, fontWeight:600 }}>Admin</div>
            <div style={{ fontSize:10, color:C.gray }}>Super Admin</div>
          </div>
        </div>
        <nav style={{ flex:1, padding:"10px 0", overflowY:"auto" }}>
          {NAV.map(group => (
            <div key={group.section}>
              <div style={{ padding:"7px 14px 3px", fontSize:10, color:C.gray, letterSpacing:"0.8px", textTransform:"uppercase" }}>{group.section}</div>
              {group.items.map(item => (
                <div key={item.id} onClick={() => setPage(item.id)} style={{
                  display:"flex", alignItems:"center", gap:9, padding:"8px 14px",
                  fontSize:12, cursor:"pointer",
                  color: page===item.id ? C.gold : C.gray,
                  background: page===item.id ? "rgba(201,168,76,0.1)" : "transparent",
                  borderLeft: `3px solid ${page===item.id ? C.gold : "transparent"}`,
                }}>
                  <span style={{ fontSize:14, width:16, textAlign:"center" }}>{item.icon}</span>
                  {item.label}
                  {item.badge && (
                    <span style={{ marginLeft:"auto", background: item.badgeDanger ? C.error : C.gold, color: item.badgeDanger ? C.white : C.navy, fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:10 }}>{item.badge}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>
        <div onClick={onLogout} style={{
          margin:"10px 14px", padding:8, background:"rgba(239,68,68,0.12)",
          border:"1px solid rgba(239,68,68,0.25)", color:C.error,
          borderRadius:8, fontSize:12, cursor:"pointer", textAlign:"center",
        }}>🚪 Logout</div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", borderBottom:`1px solid ${C.border}`, background:C.navyMid }}>
          <div style={{ fontSize:16, fontWeight:600 }}>{PAGE_TITLES[page]}</div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:30, height:30, borderRadius:7, background:C.navyCard, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, cursor:"pointer", position:"relative" }}>
              🔔
              <div style={{ position:"absolute", top:5, right:5, width:7, height:7, background:C.error, borderRadius:"50%", border:`1.5px solid ${C.navyMid}` }}/>
            </div>
            <div style={{ width:30, height:30, borderRadius:"50%", background:C.gold, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:C.navy }}>AD</div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:20 }}>
          {pageMap[page]}
        </div>
      </main>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  return loggedIn
    ? <AdminPanel onLogout={() => setLoggedIn(false)} />
    : <LoginScreen onLogin={() => setLoggedIn(true)} />;
}