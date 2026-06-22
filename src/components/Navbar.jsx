function Navbar({ onMenuClick }) {
  const name = localStorage.getItem('name') || 'User';

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.85rem 1.5rem',
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>

      {/* LEFT — Hamburger only */}
      <button
        onClick={onMenuClick}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.4rem',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        <span style={{ display: 'block', width: 22, height: 2, background: '#6d28d9', borderRadius: 2 }} />
        <span style={{ display: 'block', width: 22, height: 2, background: '#6d28d9', borderRadius: 2 }} />
        <span style={{ display: 'block', width: 22, height: 2, background: '#6d28d9', borderRadius: 2 }} />
      </button>

{/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: '#1e1b4b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 900,
            fontSize: '0.95rem',
            fontFamily: 'Georgia, serif',
          }}>
            C
          </div>
          <span style={{
            fontFamily: 'Georgia, serif',
            fontWeight: 900,
            fontSize: '1.3rem',
            color: '#1e1b4b',
            letterSpacing: '-0.5px',
          }}>
            CozyCoin
          </span>
        </div>

      {/* RIGHT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

        <span className="d-none d-md-block" style={{
          fontSize: '0.85rem',
          color: '#6b7280',
          fontWeight: 500,
        }}>
          Hi, <strong style={{ color: '#1e1b4b' }}>{name}</strong> 👋
        </span>

        <button style={{
          position: 'relative',
          background: '#f3f4f6',
          border: 'none',
          borderRadius: '50%',
          width: 38,
          height: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span style={{
            position: 'absolute',
            top: 7,
            right: 7,
            width: 7,
            height: 7,
            background: '#ef4444',
            borderRadius: '50%',
            border: '1.5px solid white',
          }} />
        </button>

        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: '#1e1b4b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: 'pointer',
        }}>
          {name[0].toUpperCase()}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;