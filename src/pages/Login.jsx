import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import Footer from '../components/Footer';

const FEATURES = [
  { icon: '📊', color: '#7c3aed', bg: 'rgba(124,58,237,0.15)', title: 'Income & expense tracking', desc: 'See exactly where your money goes every month.' },
  { icon: '🎯', color: '#10b981', bg: 'rgba(16,185,129,0.15)', title: 'Smart budget alerts', desc: 'Set limits per category and get notified before you overspend.' },
  { icon: '🏦', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', title: 'Savings goals & debt tracking', desc: 'Save for what matters and pay off what doesn\'t.' },
  { icon: '📈', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', title: 'Financial reports', desc: 'Exportable reports with visual breakdowns in any currency.' },
];

function BrandingPanel() {
  return (
    <div className="d-none d-md-flex" style={{ flex: 1, background: 'linear-gradient(160deg, #1e1b4b 0%, #4c1d95 60%, #7c3aed 100%)', flexDirection: 'column', justifyContent: 'space-between', padding: '3rem', color: 'white', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💰</div>
        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: '1.4rem' }}>CozyCoin</span>
      </div>
      <div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', fontWeight: 700, lineHeight: 1.3, margin: '0 0 0.75rem', color: 'white' }}>Your finances,<br />finally under control.</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>Take control of your finances with smart budgeting, expense tracking, and savings goals.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{f.icon}</div>
            <div>
              <p style={{ color: 'white', fontWeight: 600, fontSize: '0.88rem', margin: '0 0 2px' }}>{f.title}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.5rem' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>"The best time to take control of your money was yesterday. The second best time is now."</p>
      </div>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ gmail: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login(formData);
      localStorage.setItem('token', response.token);
      localStorage.setItem('userId', response.userId);
      localStorage.setItem('name', response.name);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { border: '1.5px solid #ddd6fe', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.9rem', backgroundColor: 'white', color: '#111827', width: '100%', boxSizing: 'border-box', outline: 'none', display: 'block' };
  const labelStyle = { fontWeight: 600, color: '#374151', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flex: 1 }}>
        <BrandingPanel />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: '#faf5ff' }}>
          <div className="d-md-none" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1e1b4b', fontFamily: 'Georgia, serif' }}>CozyCoin</div>
            <p style={{ color: '#9ca3af', fontSize: '0.75rem', letterSpacing: '3px', textTransform: 'uppercase', margin: 0 }}>Smart Money Management</p>
          </div>
          <div style={{ background: 'white', borderRadius: 24, padding: '2.5rem', width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(124,58,237,0.1)' }}>
            <h2 style={{ fontWeight: 700, color: '#1e1b4b', fontSize: '1.7rem', margin: '0 0 0.3rem' }}>Welcome back</h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.9rem' }}>Sign in to continue to your dashboard.</p>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '0.75rem 1rem', color: '#dc2626', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Email address</label>
                <input type="email" name="gmail" placeholder="you@example.com" value={formData.gmail} onChange={handleChange} required style={inputStyle} />
              </div>
              <div style={{ marginBottom: '1.75rem' }}>
                <label style={labelStyle}>Password</label>
                <input type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} required style={inputStyle} />
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #1e1b4b, #7c3aed)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: '#6b7280' }}>
              Don't have an account?{' '}<Link to="/register" style={{ color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>Create one here</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Login;