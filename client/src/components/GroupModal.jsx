import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { X, Search, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

function GroupModal({ isOpen, onClose, onCreateGroup }) {
  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        try {
          const res = await api.get('/users');
          setUsers(res.data);
        } catch (error) {
          console.error(error);
          toast.error('Failed to load users');
        }
      };
      fetchUsers();
    } else {
      setGroupName('');
      setSelectedUsers([]);
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedUsers(prev => [...prev, userId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      return toast.error('Please enter a group name');
    }
    if (selectedUsers.length < 2) {
      return toast.error('Please select at least 2 users');
    }

    setLoading(true);
    try {
      const res = await api.post('/group', {
        name: groupName,
        members: selectedUsers,
      });
      toast.success('Group created successfully!');
      onCreateGroup(res.data);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.overlay} className="fade-in">
      <div className="glass-panel" style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Create Group Chat</h2>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Group Name</label>
            <input
              type="text"
              required
              className="glass-input"
              style={styles.input}
              placeholder="e.g. Project Team, Chill Club"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Select Members ({selectedUsers.length} selected)</label>
            <div style={styles.searchContainer}>
              <Search size={16} style={styles.searchIcon} />
              <input
                type="text"
                className="glass-input"
                style={styles.searchInput}
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={styles.userList}>
              {filteredUsers.length === 0 ? (
                <div style={styles.empty}>No users found</div>
              ) : (
                filteredUsers.map(user => {
                  const isSelected = selectedUsers.includes(user._id);
                  return (
                    <div
                      key={user._id}
                      onClick={() => toggleSelectUser(user._id)}
                      style={{
                        ...styles.userItem,
                        backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                        borderColor: isSelected ? 'rgba(139, 92, 246, 0.25)' : 'var(--border-glass-light)'
                      }}
                    >
                      <div style={styles.userInfo}>
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} style={styles.avatar} />
                        ) : (
                          <div style={styles.avatarPlaceholder}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={styles.userName}>{user.name}</div>
                          <div style={styles.userEmail}>{user.email}</div>
                        </div>
                      </div>
                      <div style={{
                        ...styles.checkbox,
                        backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                        borderColor: isSelected ? 'var(--accent-primary)' : '#71717a'
                      }}>
                        {isSelected && <Check size={12} color="#fff" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" className="glass-button" disabled={loading}>
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '100%',
    maxWidth: '460px',
    padding: '28px',
    margin: '20px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '85vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '700',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#a1a1aa',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    overflow: 'hidden',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflow: 'hidden',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#e4e4e7',
  },
  input: {
    width: '100%',
  },
  searchContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    color: '#71717a',
  },
  searchInput: {
    width: '100%',
    paddingLeft: '42px',
    paddingTop: '8px',
    paddingBottom: '8px',
    fontSize: '0.875rem',
  },
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '6px',
    maxHeight: '220px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '1rem',
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  userEmail: {
    fontSize: '0.75rem',
    color: '#71717a',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    borderRadius: '4px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  },
  empty: {
    textAlign: 'center',
    color: '#71717a',
    fontSize: '0.875rem',
    padding: '20px 0',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '10px',
  },
  cancelBtn: {
    background: 'none',
    border: '1px solid var(--border-glass)',
    color: '#e4e4e7',
    borderRadius: '10px',
    padding: '12px 20px',
    cursor: 'pointer',
    fontWeight: '600',
  },
};

export default GroupModal;
