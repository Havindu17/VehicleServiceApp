import React, { useState, useEffect } from 'react';
import './App.css';

const API = 'http://localhost:5000/api';

function App() {
  const [token, setToken] = useState(sessionStorage.getItem('adminToken') || '');
  const [page, setPage] = useState('landing'); // landing | login | dashboard

  useEffect(() => {
    if (token) setPage('dashboard');
  }, []);

  const handleLogin = (tok) => {
    setToken(tok);
    sessionStorage.setItem('adminToken', tok);
    setPage('dashboard');
  };

  const handleLogout = () => {
    setToken('');
    sessionStorage.removeItem('adminToken');
    setPage('landing');
  };

  if (page === 'dashboard') return <Dashboard token={token} onLogout={handleLogout} />;
  if (page === 'login')     return <Login onLogin={handleLogin} onBack={() => setPage('landing')} />;
  return <Landing onLogin={() => setPage('login')} />;
}

/* ── LANDING PAGE ── */
function Landing({ onLogin }) {
  return (
    <div className="landing">
      <nav className="nav">
        <span className="nav-logo">🔧 AutoServe Pro</span>
        <button className="btn-outline" onClick={onLogin}>Admin Login</button>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">Vehicle Service Management</div>
          <h1 className="hero-title">Manage Your<br/><span className="gold">Service Network</span></h1>
          <p className="hero-sub">Approve garages, monitor bookings, and keep your platform running smoothly — all from one place.</p>
          <button className="btn-gold hero-cta" onClick={onLogin}>Get Started →</button>
        </div>
        <div className="hero-visual">
          <div className="visual-card vc1">
            <div className="vc-label">Pending Approvals</div>
            <div className="vc-val gold">12</div>
          </div>
          <div className="visual-card vc2">
            <div className="vc-label">Active Garages</div>
            <div className="vc-val green">48</div>
          </div>
          <div className="visual-card vc3">
            <div className="vc-label">Total Customers</div>
            <div className="vc-val blue">320</div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">🏪</div>
          <h3>Garage Approvals</h3>
          <p>Review and approve new garage registrations before they go live on the platform.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">👥</div>
          <h3>Customer Management</h3>
          <p>Monitor all customer accounts and their service history across the platform.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Live Dashboard</h3>
          <p>Real-time stats on garages, bookings, and platform activity at a glance.</p>
        </div>
      </section>

      <footer className="footer">
        <span>© 2026 AutoServe Pro. Admin Panel.</span>
      </footer>
    </div>
  );
}

/* ── LOGIN ── */
function Login({ onLogin, onBack }) {
  const [email, setEmail]       = useState('admin@vehicleservice.com');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const doLogin = async () => {
    if (!email || !password) { setError('Email සහ Password දෙකම ඕනේ.'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok)                    { setError(data.message); setLoading(false); return; }
      if (data.user.role !== 'admin') { setError('Admin account නෙවෙයි!'); setLoading(false); return; }
      onLogin(data.token);
    } catch (e) {
      setError('Server connect නොවුනා.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="auth-logo">🔧</div>
        <h2 className="auth-title">Admin Login</h2>
        <p className="auth-sub">AutoServe Pro</p>

        <div className="form-group">
          <label>Email</label>
          <input className="input" type="email" placeholder="admin@vehicleservice.com"
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input className="input" type="password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doLogin()} />
        </div>

        {error && <p className="err">{error}</p>}
        <button className="btn-gold full" onClick={doLogin} disabled={loading}>
          {loading ? 'Logging in...' : 'Login →'}
        </button>
      </div>
    </div>
  );
}

/* ── DASHBOARD ── */
function Dashboard({ token, onLogout }) {
  const [garages, setGarages] = useState([]);
  const [tab, setTab]         = useState('pending');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/garages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { onLogout(); return; }
      setGarages(await res.json());
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API}/admin/garages/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      load();
    } catch (e) {}
  };

  const filtered = tab === 'all' ? garages : garages.filter(g => g.status === tab);
  const counts   = {
    total:    garages.length,
    pending:  garages.filter(g => g.status === 'pending').length,
    approved: garages.filter(g => g.status === 'approved').length,
    rejected: garages.filter(g => g.status === 'rejected').length,
  };

  return (
    <div className="dash">
      <div className="topbar">
        <span className="nav-logo">🔧 AutoServe Pro — Admin</span>
        <button className="btn-outline" onClick={onLogout}>Logout</button>
      </div>
      <div className="main">
        <div className="metrics">
          <Metric label="Total Garages" value={counts.total}    color="#60a5fa" />
          <Metric label="Pending"       value={counts.pending}  color="#f0c040" />
          <Metric label="Approved"      value={counts.approved} color="#3dd68c" />
          <Metric label="Rejected"      value={counts.rejected} color="#f87171" />
        </div>
        <div className="tabs">
          {['pending','approved','rejected','all'].map(t => (
            <div key={t} className={`tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
              {t !== 'all' && <span className="tab-count">{counts[t]}</span>}
            </div>
          ))}
        </div>
        {loading ? <div className="empty">Loading...</div>
          : filtered.length === 0 ? <div className="empty">මේ category එකේ garages නෑ.</div>
          : filtered.map(g => <GarageCard key={g._id} garage={g} onUpdate={updateStatus} />)
        }
      </div>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ color }}>{value}</div>
    </div>
  );
}

function GarageCard({ garage: g, onUpdate }) {
  const owner = g.ownerId || {};
  const date  = g.createdAt ? new Date(g.createdAt).toLocaleDateString() : '—';
  return (
    <div className="garage-card">
      <div className="garage-header">
        <div>
          <div className="garage-name">{g.name}</div>
          <div className="garage-owner">{owner.name||'—'} · {owner.email||g.email||'—'}</div>
        </div>
        <span className={`badge badge-${g.status}`}>{g.status.charAt(0).toUpperCase()+g.status.slice(1)}</span>
      </div>
      <div className="garage-meta">
        <span>📞 {g.phone||'—'}</span>
        <span>📍 {g.address||'—'}</span>
        <span>📅 {date}</span>
        {g.businessRegNo && <span>🏢 {g.businessRegNo}</span>}
      </div>
      <div className="garage-actions">
        {g.status==='pending'   && <><button className="btn btn-approve" onClick={()=>onUpdate(g._id,'approved')}>✓ Approve</button><button className="btn btn-reject" onClick={()=>onUpdate(g._id,'rejected')}>✕ Reject</button></>}
        {g.status==='approved'  && <button className="btn btn-revoke"  onClick={()=>onUpdate(g._id,'rejected')}>Revoke</button>}
        {g.status==='rejected'  && <button className="btn btn-approve" onClick={()=>onUpdate(g._id,'approved')}>Re-approve</button>}
      </div>
    </div>
  );
}

export default App;