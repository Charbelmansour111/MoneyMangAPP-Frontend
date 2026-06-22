import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#7c3aed' : '#6b7280'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    )
  },

{
  path: '/accounts',
  label: 'Accounts',
  icon: (active) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#7c3aed' : '#6b7280'}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  )
},

  {
    path: '/transactions',
    label: 'Transactions',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#7c3aed' : '#6b7280'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    )
  },
  {
    path: '/budget',
    label: 'Budget',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#7c3aed' : '#6b7280'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h20"/>
        <path d="M5 20V10l7-7 7 7v10"/>
        <path d="M9 20v-5h6v5"/>
      </svg>
    )
  },
  {
    path: '/savings',
    label: 'Savings',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#7c3aed' : '#6b7280'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      </svg>
    )
  },
];

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleNav = (path) => {
    navigate(path);
  };

  return (
    <>
      {/* Overlay on mobile only */}
      {isOpen && (
        <div
          onClick={onClose}
          className="d-md-none"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 200,
          }}
        />
      )}

      {/* Sidebar panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: 240,
          background: 'white',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 300,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          boxShadow: isOpen ? '4px 0 20px rgba(0,0,0,0.06)' : 'none',
        }}
      >

        {/* Logo */}
        <div style={{
          padding: '1.2rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            background: '#1e1b4b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 900,
            fontSize: '0.9rem',
            fontFamily: 'Georgia, serif',
          }}>
            C
          </div>
          <span style={{
            fontFamily: 'Georgia, serif',
            fontWeight: 900,
            fontSize: '1.2rem',
            color: '#1e1b4b',
          }}>
            CozyCoin
          </span>
        </div>

        {/* User info */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#1e1b4b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.85rem',
            flexShrink: 0,
          }}>
            {(localStorage.getItem('name') || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#1e1b4b', fontSize: '0.9rem' }}>
              {localStorage.getItem('name') || 'User'}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>My Account</div>
          </div>
        </div>

        <nav style={{ padding: '1rem 0', flex: 1, overflowY: 'auto' }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button key={item.path} onClick={() => handleNav(item.path)} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                padding: '0.75rem 1.25rem', background: 'transparent', border: 'none',
                color: active ? '#7c3aed' : '#374151', cursor: 'pointer', textAlign: 'left'
              }}>
                {item.icon(active)}
                <span style={{ fontWeight: 600 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.7rem 1rem',
              border: '1.5px solid #e5e7eb',
              borderRadius: 10,
              background: 'white',
              color: '#374151',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>

      </div>
    </>
  );
}

export default Sidebar;