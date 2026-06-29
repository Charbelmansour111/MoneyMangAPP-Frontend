function Footer() {
  return (
    <footer style={{ background: '#faf5ff', borderTop: '1.5px solid #ede9fe', padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '0.75rem', fontFamily: 'Georgia, serif' }}>C</div>
        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: '0.95rem', color: '#1e1b4b' }}>CozyCoin</span>
        <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}>· Smart Money Management</span>
      </div>
      <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>© 2026 CozyCoin. All rights reserved.</div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {['Privacy', 'Terms', 'Support'].map(item => (
          <span key={item} style={{ fontSize: '0.78rem', color: '#7c3aed', cursor: 'pointer', fontWeight: 500 }}>{item}</span>
        ))}
      </div>
    </footer>
  );
}

export default Footer;