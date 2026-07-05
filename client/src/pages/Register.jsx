import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, User, Mail, Lock } from 'lucide-react';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setLoading(true);
    const success = await register(name, email, password);
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div style={styles.container} className="fade-in">
      <div className="bg-bubbles">
        <div className="bg-bubble-1"></div>
        <div className="bg-bubble-2"></div>
      </div>

      <div className="glass-panel mobile-full-width" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <MessageSquare size={32} color="#ec4899" />
          </div>
          <h1 style={styles.title}>CREATE ACCOUNT</h1>
          <p style={styles.subtitle}>Join Aura and connect with friends in real-time</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <div style={styles.inputContainer}>
              <User size={18} style={styles.inputIcon} />
              <input
                type="text"
                required
                className="glass-input"
                style={styles.input}
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputContainer}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                required
                className="glass-input"
                style={styles.input}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputContainer}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type="password"
                required
                className="glass-input"
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="glass-button"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Get Started'}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>Already have an account? </span>
          <Link to="/login" style={styles.link}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    position: 'relative',
    backgroundColor: '#0a0b10',
    overflow: 'hidden',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    margin: '20px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  logoContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'rgba(236, 72, 153, 0.1)',
    border: '1px solid rgba(236, 72, 153, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '800',
    letterSpacing: '2px',
    background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#a1a1aa',
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#e4e4e7',
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: '#71717a',
  },
  input: {
    width: '100%',
    paddingLeft: '42px',
  },
  button: {
    marginTop: '10px',
    width: '100%',
  },
  footer: {
    textAlign: 'center',
    fontSize: '0.875rem',
    marginTop: '8px',
  },
  footerText: {
    color: '#71717a',
  },
  link: {
    color: '#f472b6',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'color 0.2s ease',
  },
};

export default Register;
