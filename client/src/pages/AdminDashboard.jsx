import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MessageSquare, Ban } from 'lucide-react';
import { toast } from 'react-hot-toast';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const statsRes = await api.get('/admin/stats');
      const usersRes = await api.get('/admin/users');
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load admin dashboard data');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleBan = async (userId, userName, isCurrentlyBanned) => {
    const action = isCurrentlyBanned ? 'unban' : 'ban';
    if (!window.confirm(`Are you sure you want to ${action} ${userName}?`)) return;

    try {
      const res = await api.put(`/admin/users/${userId}/ban`);
      toast.success(res.data.message);
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="typing-dot" style={{ width: '12px', height: '12px', backgroundColor: '#8b5cf6' }}></div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="fade-in">
      <div className="bg-bubbles">
        <div className="bg-bubble-1"></div>
        <div className="bg-bubble-2"></div>
      </div>

      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
            <ArrowLeft size={20} />
            <span>Back to Chats</span>
          </button>
          <h1 style={styles.title}>AURA ADMIN PANEL</h1>
        </div>

        <div style={styles.statsGrid}>
          <div className="glass-panel" style={styles.statCard}>
            <Users size={24} color="#8b5cf6" />
            <div>
              <div style={styles.statVal}>{stats?.totalUsers}</div>
              <div style={styles.statLabel}>Total Users</div>
            </div>
          </div>

          <div className="glass-panel" style={styles.statCard}>
            <div style={styles.onlineContainer}>
              <div style={styles.onlinePing}></div>
              <Users size={24} color="#10b981" />
            </div>
            <div>
              <div style={styles.statVal}>{stats?.activeUsers}</div>
              <div style={styles.statLabel}>Active Users Online</div>
            </div>
          </div>

          <div className="glass-panel" style={styles.statCard}>
            <MessageSquare size={24} color="#ec4899" />
            <div>
              <div style={styles.statVal}>{stats?.totalMessages}</div>
              <div style={styles.statLabel}>Total Messages</div>
            </div>
          </div>
        </div>

        <div style={styles.splitSection}>
          <div className="glass-panel" style={styles.usersPanel}>
            <h2 style={styles.sectionTitle}>User Directory</h2>
            <div style={styles.tableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tr}>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.userInfo}>
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} style={styles.userAvatar} />
                          ) : (
                            <div style={styles.userAvatarPlaceholder}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span style={styles.userName}>{u.name}</span>
                        </div>
                      </td>
                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}>
                        <span style={u.role === 'admin' ? styles.adminBadge : styles.userBadge}>
                          {u.role}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusDot,
                          backgroundColor: u.status === 'online' ? '#10b981' : '#71717a'
                        }}></span>
                        <span style={{ fontSize: '0.85rem' }}>{u.status}</span>
                      </td>
                      <td style={styles.td}>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleBan(u._id, u.name, u.banned)}
                            style={{
                              ...styles.banBtn,
                              backgroundColor: u.banned ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: u.banned ? '#10b981' : '#ef4444',
                              borderColor: u.banned ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                            }}
                          >
                            <Ban size={14} />
                            <span>{u.banned ? 'Unban' : 'Ban'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel" style={styles.analyticsPanel}>
            <h2 style={styles.sectionTitle}>Content Analytics</h2>
            <div style={styles.analyticsList}>
              <div style={styles.analyticsItem}>
                <div style={styles.analyticsItemHeader}>
                  <span>Text Messages</span>
                  <span>{stats?.analytics?.text}</span>
                </div>
                <div style={styles.progressBarBg}>
                  <div style={{
                    ...styles.progressBarFill,
                    width: `${stats?.totalMessages ? (stats.analytics.text / stats.totalMessages) * 100 : 0}%`,
                    backgroundColor: '#8b5cf6'
                  }}></div>
                </div>
              </div>

              <div style={styles.analyticsItem}>
                <div style={styles.analyticsItemHeader}>
                  <span>Image Attachments</span>
                  <span>{stats?.analytics?.image}</span>
                </div>
                <div style={styles.progressBarBg}>
                  <div style={{
                    ...styles.progressBarFill,
                    width: `${stats?.totalMessages ? (stats.analytics.image / stats.totalMessages) * 100 : 0}%`,
                    backgroundColor: '#ec4899'
                  }}></div>
                </div>
              </div>

              <div style={styles.analyticsItem}>
                <div style={styles.analyticsItemHeader}>
                  <span>File Attachments</span>
                  <span>{stats?.analytics?.file}</span>
                </div>
                <div style={styles.progressBarBg}>
                  <div style={{
                    ...styles.progressBarFill,
                    width: `${stats?.totalMessages ? (stats.analytics.file / stats.totalMessages) * 100 : 0}%`,
                    backgroundColor: '#10b981'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    height: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0b10',
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#0a0b10',
    padding: '40px 20px',
    overflowY: 'auto',
  },
  card: {
    width: '100%',
    maxWidth: '1000px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '20px',
  },
  backBtn: {
    background: 'none',
    border: '1px solid var(--border-glass)',
    color: '#e4e4e7',
    borderRadius: '8px',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '800',
    letterSpacing: '2px',
    background: 'var(--accent-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
  },
  statCard: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  statVal: {
    fontSize: '1.75rem',
    fontWeight: '700',
    lineHeight: '1.2',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: '#a1a1aa',
  },
  onlineContainer: {
    position: 'relative',
    display: 'flex',
  },
  onlinePing: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    animation: 'float 1.5s ease-in-out infinite alternate',
  },
  splitSection: {
    display: 'grid',
    gridTemplateColumns: '2.2fr 1fr',
    gap: '20px',
    alignItems: 'start',
  },
  usersPanel: {
    padding: '24px',
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  analyticsPanel: {
    padding: '24px',
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  sectionTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    marginBottom: '20px',
    color: '#e4e4e7',
  },
  tableScroll: {
    maxHeight: '340px',
    overflowY: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tr: {
    borderBottom: '1px solid var(--border-glass-light)',
  },
  th: {
    padding: '12px 14px',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    color: '#71717a',
    fontWeight: '700',
  },
  td: {
    padding: '12px 14px',
    fontSize: '0.875rem',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    objectFit: 'cover',
  },
  userAvatarPlaceholder: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  userName: {
    fontWeight: '500',
  },
  adminBadge: {
    fontSize: '0.7rem',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    border: '1px solid rgba(139, 92, 246, 0.25)',
    color: '#a78bfa',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '600',
  },
  userBadge: {
    fontSize: '0.7rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-glass)',
    color: '#a1a1aa',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  statusDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginRight: '6px',
  },
  banBtn: {
    border: '1px solid',
    borderRadius: '6px',
    padding: '4px 10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 0.15s',
  },
  analyticsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  analyticsItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  analyticsItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  progressBarBg: {
    height: '8px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.4s ease-out',
  },
};

export default AdminDashboard;
