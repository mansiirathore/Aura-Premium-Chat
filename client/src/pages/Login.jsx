import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Mail, Lock } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const success = await login(email, password);
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

      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <MessageSquare size={32} color="#8b5cf6" />
          </div>
          <h1 style={styles.title}>AURA</h1>
          <p style={styles.subtitle}>Enter your credentials to access your chat space</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
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
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>New to Aura? </span>
          <Link to="/register" style={styles.link}>Create an account</Link>
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
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    letterSpacing: '3px',
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
    color: '#a78bfa',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'color 0.2s ease',
  },
};

export default Login;
