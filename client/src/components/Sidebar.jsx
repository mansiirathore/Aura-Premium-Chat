import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, MessageSquarePlus, User, Users, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';

function Sidebar({ activeChat, setActiveChat, chats, setChats, onOpenProfile, onOpenGroup, notifications, clearNotification }) {
  const { user, logout } = useAuth();
  const { onlineUsers } = useSocket();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Handle live user search
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.trim().length > 0) {
        setSearching(true);
        try {
          const res = await api.get(`/users/search?query=${searchTerm}`);
          setSearchResults(res.data);
        } catch (error) {
          console.error(error);
          toast.error('Search failed');
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleStartChat = async (targetUserId) => {
    try {
      const res = await api.post('/chat', { userId: targetUserId });
      const newChat = res.data;
      
      // If chat is not in current list, add it
      if (!chats.some(c => c._id === newChat._id)) {
        setChats(prev => [newChat, ...prev]);
      }
      
      setActiveChat(newChat);
      setSearchTerm('');
      setSearchResults([]);
    } catch (error) {
      console.error(error);
      toast.error('Could not start chat');
    }
  };

  const getChatDetails = (chat) => {
    if (chat.isGroup) {
      return {
        name: chat.groupName,
        avatar: chat.groupAvatar,
        isOnline: false,
        subtext: `${chat.members.length} members`
      };
    }

    const otherMember = chat.members.find(m => m._id !== user._id);
    if (!otherMember) {
      return {
        name: 'Saved Messages',
        avatar: user.avatar,
        isOnline: true,
        subtext: 'Personal Space'
      };
    }

    const isOnline = onlineUsers.includes(otherMember._id);
    return {
      name: otherMember.name,
      avatar: otherMember.avatar,
      isOnline,
      subtext: isOnline ? 'online' : 'offline'
    };
  };

  return (
    <div style={styles.sidebar}>
      {/* Sidebar Header */}
      <div style={styles.header}>
        <div style={styles.profileSection} onClick={onOpenProfile} title="Edit Profile">
          {user?.avatar ? (
            <img src={user.avatar} alt="My Avatar" style={styles.myAvatar} />
          ) : (
            <div style={styles.avatarPlaceholder}>
              {user?.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={styles.myInfo}>
            <div style={styles.myName}>{user?.name}</div>
            <div style={styles.myStatus}>Active</div>
          </div>
        </div>

        <div style={styles.actions}>
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/admin')} style={styles.actionBtn} title="Admin Panel">
              <ShieldAlert size={20} color="#a78bfa" />
            </button>
          )}
          <button onClick={onOpenGroup} style={styles.actionBtn} title="Create Group Chat">
            <MessageSquarePlus size={20} />
          </button>
          <button onClick={logout} style={styles.actionBtn} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* User Search Input */}
      <div style={styles.searchBox}>
        <div style={styles.searchContainer}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            className="glass-input"
            style={styles.searchInput}
            placeholder="Search users to chat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Search Results Dropdown */}
        {searchTerm.trim().length > 0 && (
          <div className="glass-panel" style={styles.searchResults}>
            {searching ? (
              <div style={styles.loadingResults}>Searching users...</div>
            ) : searchResults.length === 0 ? (
              <div style={styles.noResults}>No users found</div>
            ) : (
              searchResults.map(u => (
                <div
                  key={u._id}
                  onClick={() => handleStartChat(u._id)}
                  style={styles.resultItem}
                >
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} style={styles.resultAvatar} />
                  ) : (
                    <div style={styles.resultAvatarPlaceholder}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={styles.resultDetails}>
                    <div style={styles.resultName}>{u.name}</div>
                    <div style={styles.resultEmail}>{u.email}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Recent Chats List */}
      <div style={styles.chatsList}>
        <h3 style={styles.listTitle}>Conversations</h3>
        {chats.length === 0 ? (
          <div style={styles.emptyList}>
            <Users size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <p>No active chats</p>
            <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Search a user above to start chatting!</p>
          </div>
        ) : (
          chats.map(chat => {
            const details = getChatDetails(chat);
            const isSelected = activeChat?._id === chat._id;
            const unreadCount = notifications[chat._id] || 0;

            return (
              <div
                key={chat._id}
                onClick={() => {
                  setActiveChat(chat);
                  if (unreadCount > 0) {
                    clearNotification(chat._id);
                  }
                }}
                style={{
                  ...styles.chatItem,
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                  borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent',
                }}
              >
                <div style={styles.avatarWrapper}>
                  {details.avatar ? (
                    <img src={details.avatar} alt={details.name} style={styles.chatAvatar} />
                  ) : (
                    <div style={styles.chatAvatarPlaceholder}>
                      {details.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {details.isOnline && <div style={styles.onlineIndicator} />}
                </div>

                <div style={styles.chatInfo}>
                  <div style={styles.chatTopLine}>
                    <span style={styles.chatName}>{details.name}</span>
                    {unreadCount > 0 && (
                      <span style={styles.badge}>{unreadCount}</span>
                    )}
                  </div>
                  <div style={styles.chatSubtext}>
                    {details.subtext}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: '320px',
    height: '100%',
    borderRight: '1px solid var(--border-glass)',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(10, 11, 16, 0.4)',
    zIndex: 10,
  },
  header: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border-glass-light)',
  },
  profileSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  },
  myAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    objectFit: 'cover',
    border: '1.5px solid rgba(139, 92, 246, 0.3)',
  },
  avatarPlaceholder: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    color: '#a78bfa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '1.1rem',
  },
  myInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  myName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    maxWidth: '120px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  myStatus: {
    fontSize: '0.75rem',
    color: '#10b981',
    fontWeight: '500',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: '#a1a1aa',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    padding: '16px 20px',
    position: 'relative',
    borderBottom: '1px solid var(--border-glass-light)',
  },
  searchContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: '#71717a',
  },
  searchInput: {
    width: '100%',
    paddingLeft: '38px',
    paddingTop: '8px',
    paddingBottom: '8px',
    fontSize: '0.85rem',
    borderRadius: '8px',
  },
  searchResults: {
    position: 'absolute',
    top: '56px',
    left: '20px',
    right: '20px',
    maxHeight: '260px',
    overflowY: 'auto',
    zIndex: 100,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
    padding: '6px',
  },
  loadingResults: {
    textAlign: 'center',
    color: '#71717a',
    fontSize: '0.8rem',
    padding: '12px 0',
  },
  noResults: {
    textAlign: 'center',
    color: '#71717a',
    fontSize: '0.8rem',
    padding: '12px 0',
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  resultAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  resultAvatarPlaceholder: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  resultDetails: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  resultName: {
    fontSize: '0.85rem',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  resultEmail: {
    fontSize: '0.7rem',
    color: '#71717a',
  },
  chatsList: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 0',
  },
  listTitle: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: '#71717a',
    letterSpacing: '1px',
    padding: '0 20px',
    marginBottom: '12px',
    fontWeight: '700',
  },
  chatItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    gap: '14px',
  },
  avatarWrapper: {
    position: 'relative',
  },
  chatAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    objectFit: 'cover',
  },
  chatAvatarPlaceholder: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '1.2rem',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    border: '2px solid #0c0d12',
  },
  chatInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflow: 'hidden',
  },
  chatTopLine: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatName: {
    fontSize: '0.9rem',
    fontWeight: '550',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  chatSubtext: {
    fontSize: '0.75rem',
    color: '#71717a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  badge: {
    backgroundColor: 'var(--accent-primary)',
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '99px',
    minWidth: '18px',
    textAlign: 'center',
  },
  emptyList: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#71717a',
    padding: '40px 20px',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
};

export default Sidebar;
