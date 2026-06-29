import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/accounts': 'Accounts',
  '/transactions': 'Transactions',
  '/budget': 'Budget Alerts',
  '/savings': 'Savings',
  '/reports': 'Reports',
};

const NOTIF_COLORS = {
  danger:  { bg: '#fef2f2', border: '#fecaca', icon: '#ef4444', text: '#991b1b' },
  warning: { bg: '#fef3c7', border: '#fcd34d', icon: '#f59e0b', text: '#92400e' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', icon: '#3b82f6', text: '#1e40af' },
};

function Navbar({ onMenuClick, notifications = [] }) {
  const name = localStorage.getItem('name') || 'User';
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = PAGE_TITLES[location.pathname] || 'CozyCoin';
  const [showPanel, setShowPanel] = useState(false);
  const [dismissed, setDismissed] = useState(new Set());

  const visible = notifications.filter(n => !dismissed.has(n.id));
  const dangerCount = visible.filter(n => n.type === 'danger').length;
  const badgeCount = visible.length;

  const dismiss = (id) => setDismissed(prev => new Set([...prev, id]));
  const dismissAll = () => setDismissed(new Set(notifications.map(n => n.id)));

  return (
    <>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.5rem', background: 'white', borderBottom: '1.5px solid #ede9fe', position: 'sticky', top: 0, zIndex: 100 }}>

        {/* LEFT — Hamburger */}
        <button onClick={onMenuClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ display: 'block', width: 22, height: 2, background: '#7c3aed', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#7c3aed', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#7c3aed', borderRadius: 2 }} />
        </button>

        {/* CENTER — Logo + page title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '0.95rem', fontFamily: 'Georgia, serif' }}>C</div>
          <span style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: '1.3rem', color: '#1e1b4b', letterSpacing: '-0.5px' }}>CozyCoin</span>
          <span style={{ width: 1, height: 20, background: '#ddd6fe', display: 'block' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#7c3aed' }}>{pageTitle}</span>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="d-none d-md-block" style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>
            Hi, <strong style={{ color: '#1e1b4b' }}>{name}</strong> 👋
          </span>

          {/* Bell */}
          <button
            onClick={() => setShowPanel(p => !p)}
            style={{ position: 'relative', background: showPanel ? '#ede9fe' : '#f5f3ff', border: `1.5px solid ${showPanel ? '#ddd6fe' : 'transparent'}`, borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {badgeCount > 0 && (
              <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, background: dangerCount > 0 ? '#ef4444' : '#f59e0b', borderRadius: 999, border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: 'white', padding: '0 3px' }}>
                {badgeCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1e1b4b, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
            {name[0].toUpperCase()}
          </div>
        </div>
      </nav>

      {/* NOTIFICATION PANEL */}
      {showPanel && (
        <>
          {/* backdrop */}
          <div onClick={() => setShowPanel(false)} style={{ position: 'fixed', inset: 0, zIndex: 149 }} />

          <div style={{ position: 'fixed', top: 64, right: 16, width: 360, maxHeight: '80vh', background: 'white', borderRadius: 16, border: '1.5px solid #ddd6fe', boxShadow: '0 8px 32px rgba(124,58,237,0.15)', zIndex: 150, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Panel header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1.5px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#faf5ff' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#1e1b4b', fontSize: '0.95rem' }}>Notifications</div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                  {visible.length === 0 ? 'All caught up!' : `${visible.length} alert${visible.length !== 1 ? 's' : ''} need your attention`}
                </div>
              </div>
              {visible.length > 0 && (
                <button onClick={dismissAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>
                  Clear all
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {visible.length === 0 ? (
                <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
                  <div style={{ fontWeight: 700, color: '#1e1b4b', marginBottom: '0.25rem' }}>All clear!</div>
                  <div style={{ fontSize: '0.82rem', color: '#9ca3af' }}>Your budgets and savings goals are on track.</div>
                </div>
              ) : (
                visible.map(n => {
                  const c = NOTIF_COLORS[n.type];
                  return (
                    <div key={n.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f9fafb', background: 'white', transition: 'background 0.1s' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, border: `1.5px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                          {n.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <div style={{ fontWeight: 700, color: c.text, fontSize: '0.82rem', lineHeight: 1.3 }}>{n.title}</div>
                            <span style={{ fontSize: '0.68rem', color: '#9ca3af', flexShrink: 0, marginTop: '0.1rem' }}>{n.time}</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.2rem', lineHeight: 1.4 }}>{n.message}</div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button
                              onClick={() => { navigate(n.actionPath); setShowPanel(false); }}
                              style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6, padding: '0.25rem 0.6rem', fontSize: '0.72rem', fontWeight: 700, color: c.text, cursor: 'pointer' }}
                            >
                              {n.action} →
                            </button>
                            <button
                              onClick={() => dismiss(n.id)}
                              style={{ background: 'none', border: 'none', borderRadius: 6, padding: '0.25rem 0.6rem', fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', cursor: 'pointer' }}
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Panel footer */}
            <div style={{ padding: '0.75rem 1.25rem', borderTop: '1.5px solid #f3f4f6', background: '#faf5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Updates every time you open the app</span>
              <button onClick={() => { navigate('/budget'); setShowPanel(false); }} style={{ background: 'none', border: 'none', fontSize: '0.72rem', color: '#7c3aed', fontWeight: 600, cursor: 'pointer' }}>
                View all budgets →
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Navbar;