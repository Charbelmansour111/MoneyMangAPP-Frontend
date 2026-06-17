import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, FormGroup, Label, Input, Button, Alert, Spinner } from 'reactstrap';
import { register } from '../services/api';
import Footer from '../components/Footer';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    gmail: '',
    password: '',
    currenciesCode: 'USD'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>

      <div style={{ display: 'flex', flex: 1 }}>

        {/* LEFT — Branding */}
        <div
          className="d-none d-md-flex"
          style={{
            flex: 1,
            background: 'linear-gradient(160deg, #7c3aed 0%, #6d28d9 40%, #4c1d95 100%)',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem',
            color: 'white',
          }}
        >
          <div style={{ maxWidth: 380, textAlign: 'center' }}>

            <div style={{
              fontSize: '3.5rem',
              fontWeight: 900,
              letterSpacing: '-2px',
              marginBottom: '0.3rem',
              fontFamily: 'Georgia, serif'
            }}>
              Walli
            </div>
            <p style={{
              opacity: 0.7,
              fontSize: '0.8rem',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              marginBottom: '1.5rem'
            }}>
              Smart Money Management
            </p>

            <p style={{
              fontSize: '1.05rem',
              opacity: 0.85,
              lineHeight: 1.8,
              marginBottom: '2rem'
            }}>
              Join thousands of users who take control of their finances with Walli.
            </p>

            {/* Feature list */}
            <div style={{ textAlign: 'left' }}>
              {[
                { emoji: '📊', text: 'Track income & expenses' },
                { emoji: '🎯', text: 'Set and monitor budgets' },
                { emoji: '🏦', text: 'Reach your savings goals' },
                { emoji: '💱', text: 'Multi-currency support' },
              ].map((feature, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.7rem 0',
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <span style={{ fontSize: '1.3rem' }}>{feature.emoji}</span>
                  <span style={{ fontSize: '0.95rem', opacity: 0.9 }}>{feature.text}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* RIGHT — Register Form */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          backgroundColor: '#faf5ff',
        }}>

          {/* Mobile app name */}
          <div className="d-md-none text-center mb-4">
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              letterSpacing: '-1px',
              color: '#6d28d9',
              fontFamily: 'Georgia, serif'
            }}>
              Walli
            </div>
            <p style={{
              color: '#9ca3af',
              fontSize: '0.75rem',
              letterSpacing: '3px',
              textTransform: 'uppercase'
            }}>
              Smart Money Management
            </p>
          </div>

          {/* Form Card */}
          <div style={{
            background: 'white',
            borderRadius: 24,
            padding: '2.5rem',
            width: '100%',
            maxWidth: 420,
            boxShadow: '0 8px 40px rgba(109, 40, 217, 0.12)',
          }}>
            <h2 style={{
              fontWeight: 700,
              color: '#1e1b4b',
              fontSize: '1.8rem',
              marginBottom: '0.3rem'
            }}>
              Create account
            </h2>
            <p style={{
              color: '#6b7280',
              marginBottom: '2rem',
              fontSize: '0.95rem'
            }}>
              Start your financial journey today
            </p>

            {error && (
              <Alert color="danger" style={{ borderRadius: 10, fontSize: '0.9rem' }}>
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>

              {/* Name Field */}
              <FormGroup>
                <Label style={{
                  fontWeight: 600,
                  color: '#374151',
                  fontSize: '0.9rem',
                  display: 'block',
                  marginBottom: '0.5rem'
                }}>
                  Full name
                </Label>
                <Input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    border: '1.5px solid #e5e7eb',
                    borderRadius: 10,
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    backgroundColor: 'white',
                    color: '#111827',
                    boxShadow: 'none',
                    width: '100%',
                    display: 'block',
                    marginTop: '0.5rem'
                  }}
                />
              </FormGroup>

              {/* Email Field */}
              <FormGroup style={{ marginTop: '1.2rem' }}>
                <Label style={{
                  fontWeight: 600,
                  color: '#374151',
                  fontSize: '0.9rem',
                  display: 'block',
                  marginBottom: '0.5rem'
                }}>
                  Email address
                </Label>
                <Input
                  type="email"
                  name="gmail"
                  placeholder="you@example.com"
                  value={formData.gmail}
                  onChange={handleChange}
                  required
                  style={{
                    border: '1.5px solid #e5e7eb',
                    borderRadius: 10,
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    backgroundColor: 'white',
                    color: '#111827',
                    boxShadow: 'none',
                    width: '100%',
                    display: 'block',
                    marginTop: '0.5rem'
                  }}
                />
              </FormGroup>

              {/* Password Field */}
              <FormGroup style={{ marginTop: '1.2rem' }}>
                <Label style={{
                  fontWeight: 600,
                  color: '#374151',
                  fontSize: '0.9rem',
                  display: 'block',
                  marginBottom: '0.5rem'
                }}>
                  Password
                </Label>
                <Input
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{
                    border: '1.5px solid #e5e7eb',
                    borderRadius: 10,
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    backgroundColor: 'white',
                    color: '#111827',
                    boxShadow: 'none',
                    width: '100%',
                    display: 'block',
                    marginTop: '0.5rem'
                  }}
                />
              </FormGroup>

              <Button
                type="submit"
                block
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  border: 'none',
                  borderRadius: 12,
                  padding: '0.85rem',
                  fontWeight: 700,
                  fontSize: '1rem',
                  letterSpacing: '0.5px',
                  boxShadow: '0 4px 15px rgba(109, 40, 217, 0.3)',
                  marginTop: '1.5rem',
                  width: '100%'
                }}
              >
                {loading ? <Spinner size="sm" /> : 'Create Account →'}
              </Button>
            </Form>

            <div style={{
              textAlign: 'center',
              marginTop: '1.5rem',
              fontSize: '0.9rem',
              color: '#6b7280'
            }}>
              Already have an account?{' '}
              <Link to="/login" style={{
                color: '#7c3aed',
                fontWeight: 700,
                textDecoration: 'none'
              }}>
                Sign in here
              </Link>
            </div>

          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}

export default Register;