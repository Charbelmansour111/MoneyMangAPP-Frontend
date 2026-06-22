import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  {
    path: '/',
    label: 'Home',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#7c3aed' : '#9ca3af'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    )
  },
  {
    path: '/transactions',
    label: 'Trans.',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#7c3aed' : '#9ca3af'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"/>
        <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/>
        <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    )
  },

{
  path: '/accounts',
  label: 'Accounts',
  icon: (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#7c3aed' : '#9ca3af'}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  )
},

  {
    path: '/budget',
    label: 'Budget',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#7c3aed' : '#9ca3af'}
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#7c3aed' : '#9ca3af'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      </svg>
    )
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#7c3aed' : '#9ca3af'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    )
  },
];

function BottomBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className="d-md-none"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.6rem 0',
              border: 'none',
              background: 'transparent',
              color: isActive ? '#7c3aed' : '#9ca3af',
              cursor: 'pointer',
              borderTop: isActive ? '2px solid #7c3aed' : '2px solid transparent',
            }}
          >
            {item.icon(isActive)}
            <span style={{
              fontSize: '0.6rem',
              marginTop: 3,
              fontWeight: isActive ? 700 : 400,
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default BottomBar;