import React, { useState, useEffect, useRef } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Send, Paperclip, Trash2, Edit3, X, File, Download,
  MoreVertical, Check, CheckCheck, Smile, Settings, Users, UserPlus, UserMinus, LogOut, ArrowLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const POPULAR_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '🥰',
  '😍', '😘', '😜', '🤫', '🤔', '😎', '😢', '😭', '😡', '👍',
  '👎', '👏', '🙌', '🙏', '❤️', '🔥', '✨', '🎉'
];

function ChatArea({ activeChat, setActiveChat, messages, setMessages, typingStatus, clearNotification, onAcceptRequest, onDeclineRequest }) {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState('');
  const [sending, setSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showMenuId, setShowMenuId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Group details drawer
  const [showDrawer, setShowDrawer] = useState(false);
  const [addMemberTerm, setAddMemberTerm] = useState('');
  const [addSearchResults, setAddSearchResults] = useState([]);
  const [newGroupName, setNewGroupName] = useState(activeChat?.groupName || '');
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingStatus]);

  // Join/leave chat socket rooms
  useEffect(() => {
    if (activeChat && socket) {
      socket.emit('join_chat', activeChat._id);
      
      // Emit message_seen event when user loads messages
      socket.emit('message_seen', { chatId: activeChat._id, userId: user._id });
      
      if (clearNotification) {
        clearNotification(activeChat._id);
      }

      return () => {
        socket.emit('leave_chat', activeChat._id);
        if (isTypingRef.current) {
          socket.emit('stop_typing', { chatId: activeChat._id });
          isTypingRef.current = false;
        }
      };
    }
  }, [activeChat, socket]);

  // Sync group name changes when active chat changes
  useEffect(() => {
    setNewGroupName(activeChat?.groupName || '');
    setShowDrawer(false);
  }, [activeChat]);

  // Search users to add to group
  useEffect(() => {
    const searchToAdd = async () => {
      if (addMemberTerm.trim().length > 0) {
        try {
          const res = await api.get(`/users/search?query=${addMemberTerm}`);
          // Filter out users who are already members
          const filtered = res.data.filter(
            u => !activeChat.members.some(m => m._id === u._id)
          );
          setAddSearchResults(filtered);
        } catch (e) {
          console.error(e);
        }
      } else {
        setAddSearchResults([]);
      }
    };
    
    const timeout = setTimeout(searchToAdd, 300);
    return () => clearTimeout(timeout);
  }, [addMemberTerm, activeChat]);

  if (!activeChat) {
    return (
      <div style={styles.placeholderContainer}>
        <div className="bg-bubbles">
          <div className="bg-bubble-1"></div>
          <div className="bg-bubble-2"></div>
        </div>
        <div className="glass-panel" style={styles.placeholderCard}>
          <Users size={64} color="#8b5cf6" style={{ marginBottom: '16px', opacity: 0.8 }} />
          <h2 style={styles.placeholderTitle}>Select a Conversation</h2>
          <p style={styles.placeholderText}>Search for a user or select an active chat to start messaging in real-time with full security.</p>
        </div>
      </div>
    );
  }

  // Handle typing status trigger
  const handleInputChange = (e) => {
    setContent(e.target.value);
    
    if (!socket) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', {
        chatId: activeChat._id,
        senderId: user._id,
        senderName: user.name,
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { chatId: activeChat._id });
      isTypingRef.current = false;
    }, 2000);
  };

  // Handle File Input Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
      if (file.type.startsWith('image/')) {
        setAttachmentPreview(URL.createObjectURL(file));
      } else {
        setAttachmentPreview('file');
      }
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
    setAttachmentPreview('');
  };

  // Send Message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() && !attachment) return;
    
    setSending(true);
    
    // Stop typing immediately
    if (socket && isTypingRef.current) {
      socket.emit('stop_typing', { chatId: activeChat._id });
      isTypingRef.current = false;
    }

    const formData = new FormData();
    formData.append('chatId', activeChat._id);
    formData.append('content', content);
    if (attachment) {
      formData.append('file', attachment);
    }

    try {
      const res = await api.post('/message', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newMsg = res.data;
      
      setMessages(prev => [...prev, newMsg]);
      
      if (socket) {
        socket.emit('send_message', newMsg);
      }
      
      setContent('');
      clearAttachment();
    } catch (error) {
      console.error(error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Edit Message
  const handleStartEdit = (msg) => {
    setEditingMessageId(msg._id);
    setEditContent(msg.content);
    setShowMenuId(null);
  };

  const handleSaveEdit = async (msgId) => {
    if (!editContent.trim()) return;
    try {
      const res = await api.put('/message/edit', { messageId: msgId, content: editContent });
      const updatedMsg = res.data;
      
      setMessages(prev => prev.map(m => m._id === msgId ? updatedMsg : m));
      
      if (socket) {
        socket.emit('edit_message', updatedMsg);
      }
      
      setEditingMessageId(null);
    } catch (e) {
      toast.error('Failed to edit message');
    }
  };

  // Delete Message
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Delete message for everyone?')) return;
    try {
      const res = await api.delete('/message', { data: { messageId: msgId } });
      const deletedMsg = res.data;
      
      setMessages(prev => prev.map(m => m._id === msgId ? deletedMsg : m));
      
      if (socket) {
        socket.emit('delete_message', deletedMsg);
      }
      
      setShowMenuId(null);
    } catch (e) {
      toast.error('Failed to delete message');
    }
  };

  const handleAdminDelete = async (msgId) => {
    if (!window.confirm('Delete this message as administrator?')) return;
    try {
      await api.delete(`/admin/messages/${msgId}`);
      setMessages(prev => prev.filter(m => m._id !== msgId));
      if (socket) {
        socket.emit('delete_message', { _id: msgId, chatId: activeChat._id, adminDeleted: true });
      }
      toast.success('Message deleted by admin');
    } catch (e) {
      toast.error('Failed to moderate message');
    }
  };

  // Request Handlers
  const handleAcceptRequest = async () => {
    try {
      const res = await api.put('/chat/accept', { chatId: activeChat._id });
      setActiveChat(res.data);
      toast.success('Message request accepted!');
      if (onAcceptRequest) {
        onAcceptRequest(res.data);
      }
    } catch (error) {
      console.error('Accept request error:', error);
      toast.error('Failed to accept request');
    }
  };

  const handleDeclineRequest = async () => {
    if (!window.confirm('Are you sure you want to decline and delete this request?')) return;
    try {
      await api.put('/chat/decline', { chatId: activeChat._id });
      setActiveChat(null);
      toast.success('Message request declined and deleted');
      if (onDeclineRequest) {
        onDeclineRequest(activeChat._id);
      }
    } catch (error) {
      console.error('Decline request error:', error);
      toast.error('Failed to decline request');
    }
  };

  // Group Operations
  const handleRenameGroup = async () => {
    if (!newGroupName.trim() || newGroupName === activeChat.groupName) return;
    try {
      const res = await api.put('/group/name', { chatId: activeChat._id, name: newGroupName });
      const updatedChat = res.data;
      setActiveChat(updatedChat);
      toast.success('Group renamed');
    } catch (e) {
      toast.error('Failed to rename group');
    }
  };

  const handleAddMember = async (targetUserId) => {
    try {
      const res = await api.put('/group/add-member', { chatId: activeChat._id, userId: targetUserId });
      setActiveChat(res.data);
      setAddMemberTerm('');
      setAddSearchResults([]);
      toast.success('Member added');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      const res = await api.put('/group/remove-member', { chatId: activeChat._id, userId: targetUserId });
      setActiveChat(res.data);
      toast.success('Member removed');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleLeaveGroup = async () => {
    const confirmText = activeChat.admin._id === user._id 
      ? 'You are the admin. Leaving will delete this group. Proceed?'
      : 'Are you sure you want to leave this group?';
      
    if (!window.confirm(confirmText)) return;
    
    try {
      await api.delete('/group', { data: { chatId: activeChat._id } });
      setActiveChat(null);
      toast.success('You left the group');
    } catch (e) {
      toast.error('Failed to leave group');
    }
  };

  // Header Details
  const getHeaderDetails = () => {
    if (activeChat.isGroup) {
      const isAdmin = activeChat.admin._id === user._id;
      return {
        name: activeChat.groupName,
        avatar: activeChat.groupAvatar,
        sub: `${activeChat.members.length} members`,
        isOnline: false,
        canManage: true,
      };
    }
    
    const otherMember = activeChat.members.find(m => m._id !== user._id);
    if (!otherMember) {
      return {
        name: 'Saved Messages',
        avatar: user.avatar,
        sub: 'Personal Space',
        isOnline: true,
        canManage: false,
      };
    }

    const isOnline = onlineUsers.includes(otherMember._id);
    return {
      name: otherMember.name,
      avatar: otherMember.avatar,
      sub: isOnline ? 'online' : 'offline',
      isOnline,
      canManage: false,
    };
  };

  const headerDetails = getHeaderDetails();
  const activeTyping = typingStatus[activeChat._id] || [];

  const initiatedById = activeChat?.initiatedBy?._id || activeChat?.initiatedBy;
  const isRequestPending = activeChat && !activeChat.isGroup && activeChat.status === 'requested' && initiatedById !== user._id;

  // Render Seen Tick Helper
  const renderTicks = (msg) => {
    const isOtherMemberOnline = activeChat.isGroup 
      ? false 
      : onlineUsers.includes(activeChat.members.find(m => m._id !== user._id)?._id);

    // Filter seenBy (excluding sender itself)
    const viewCount = msg.seenBy.filter(id => id !== user._id).length;

    if (viewCount > 0) {
      return <CheckCheck size={16} color="#8b5cf6" title="Seen" />; // Blue ticks
    } else if (isOtherMemberOnline) {
      return <CheckCheck size={16} color="#71717a" title="Delivered" />; // Gray double ticks
    } else {
      return <Check size={16} color="#71717a" title="Sent" />; // Single gray tick
    }
  };

  return (
    <div className="chatarea-container" style={styles.chatViewport}>
      {/* Main chat window */}
      <div style={styles.chatContainer}>
        {/* Chat Header */}
        <div style={styles.header}>
          <div style={styles.headerInfo}>
            <button 
              onClick={() => setActiveChat(null)} 
              className="mobile-back-btn"
              title="Go back"
            >
              <ArrowLeft size={22} />
            </button>
            {headerDetails.avatar ? (
              <img src={headerDetails.avatar} alt={headerDetails.name} style={styles.headerAvatar} />
            ) : (
              <div style={styles.headerAvatarPlaceholder}>
                {headerDetails.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={styles.headerName}>{headerDetails.name}</div>
              <div style={{
                ...styles.headerSub,
                color: headerDetails.isOnline ? '#10b981' : '#71717a'
              }}>
                {headerDetails.sub}
              </div>
            </div>
          </div>

          <div style={styles.headerActions}>
            {activeChat.isGroup && (
              <button 
                onClick={() => setShowDrawer(!showDrawer)} 
                style={{ ...styles.iconBtn, color: showDrawer ? 'var(--accent-primary)' : '#a1a1aa' }}
                title="Group Settings"
              >
                <Settings size={20} />
              </button>
            )}
            {!activeChat.isGroup && (
              <button 
                onClick={async () => {
                  if (window.confirm('Delete this conversation?')) {
                    try {
                      await api.delete('/chat', { data: { chatId: activeChat._id } });
                      setActiveChat(null);
                      toast.success('Conversation deleted');
                    } catch (e) { toast.error('Failed to delete'); }
                  }
                }}
                style={styles.iconBtn}
                title="Delete Chat"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Message List */}
        <div style={styles.messagesList}>
          {messages.length === 0 ? (
            <div style={styles.emptyMessages}>
              <p>Say hello! Wave at your friend. 👋</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender._id === user._id;
              const isDeleted = msg.deleted;
              const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={msg._id || index}
                  style={{
                    ...styles.messageRow,
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                  }}
                >
                  {/* Sender Avatar for Group */}
                  {activeChat.isGroup && !isMe && (
                    <div style={styles.bubbleAvatarWrapper}>
                      {msg.sender.avatar ? (
                        <img src={msg.sender.avatar} alt={msg.sender.name} style={styles.bubbleAvatar} />
                      ) : (
                        <div style={styles.bubbleAvatarPlaceholder}>
                          {msg.sender.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}

                  <div 
                    style={styles.messageBubbleWrapper}
                    onMouseEnter={() => setShowMenuId(msg._id)}
                    onMouseLeave={() => setShowMenuId(null)}
                  >
                    {/* Hover actions menu */}
                    {!isDeleted && showMenuId === msg._id && (isMe || user?.role === 'admin') && (
                      <div style={styles.bubbleMenu}>
                        {isMe && msg.messageType === 'text' && (
                          <button onClick={() => handleStartEdit(msg)} style={styles.menuBtn} title="Edit">
                            <Edit3 size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            if (isMe) {
                              handleDeleteMessage(msg._id);
                            } else {
                              handleAdminDelete(msg._id);
                            }
                          }} 
                          style={styles.menuBtn} 
                          title="Delete message"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}

                    <div
                      style={{
                        ...styles.bubble,
                        backgroundColor: isMe ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        border: isMe ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid var(--border-glass-light)',
                        borderTopRightRadius: isMe ? '2px' : '12px',
                        borderTopLeftRadius: isMe ? '12px' : '2px',
                      }}
                    >
                      {activeChat.isGroup && !isMe && (
                        <div style={styles.senderName}>{msg.sender.name}</div>
                      )}

                      {/* Editing state */}
                      {editingMessageId === msg._id ? (
                        <div style={styles.editContainer}>
                          <input
                            type="text"
                            className="glass-input"
                            style={styles.editInput}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                          />
                          <div style={styles.editActions}>
                            <button onClick={() => setEditingMessageId(null)} style={styles.editCancelBtn}>
                              <X size={14} />
                            </button>
                            <button onClick={() => handleSaveEdit(msg._id)} style={styles.editSaveBtn}>
                              <Check size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Text message */}
                          {msg.messageType === 'text' && (
                            <p style={{
                              ...styles.messageText,
                              color: isDeleted ? '#71717a' : '#f3f4f6',
                              fontStyle: isDeleted ? 'italic' : 'normal'
                            }}>
                              {msg.content}
                            </p>
                          )}

                          {/* Image message */}
                          {msg.messageType === 'image' && (
                            <div style={styles.mediaContainer}>
                              <img src={msg.image} alt="Attachment" style={styles.mediaImage} />
                            </div>
                          )}

                          {/* File message */}
                          {msg.messageType === 'file' && (
                            <a href={msg.file} target="_blank" rel="noreferrer" style={styles.fileBox}>
                              <File size={24} color="#8b5cf6" />
                              <div style={styles.fileDetails}>
                                <div style={styles.fileName}>Attachment file</div>
                                <div style={styles.fileSub}>Click to view or download</div>
                              </div>
                              <Download size={18} color="#a1a1aa" />
                            </a>
                          )}

                          {/* Footer with ticks / timestamp */}
                          <div style={styles.bubbleFooter}>
                            {msg.edited && <span style={styles.editedTag}>edited</span>}
                            <span style={styles.timestamp}>{formattedTime}</span>
                            {isMe && !isDeleted && renderTicks(msg)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Notification */}
          {activeTyping.length > 0 && (
            <div style={styles.typingContainer}>
              <div style={styles.typingBubble}>
                <span style={styles.typingText}>
                  {activeTyping.map(u => u.senderName).join(', ')} is typing
                </span>
                <div style={{ display: 'flex', gap: '3px', marginLeft: '6px' }}>
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Section */}
        {isRequestPending ? (
          <div className="glass-panel" style={styles.requestBanner}>
            <p style={styles.requestBannerText}>
              Do you want to accept this message request from <strong>{headerDetails.name}</strong>? They won't know you've seen their message until you accept.
            </p>
            <div style={styles.requestActions}>
              <button onClick={handleAcceptRequest} className="glass-button" style={styles.acceptBtn}>
                Accept
              </button>
              <button onClick={handleDeclineRequest} style={styles.declineBtn}>
                Decline
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} style={styles.inputBar}>
            {/* File Selected Attachment Preview */}
            {attachment && (
              <div className="glass-panel" style={styles.previewPanel}>
                {attachmentPreview === 'file' ? (
                  <div style={styles.filePreviewBadge}>
                    <File size={20} color="#8b5cf6" />
                    <span style={styles.previewName}>{attachment.name}</span>
                  </div>
                ) : (
                  <img src={attachmentPreview} alt="Preview" style={styles.imagePreviewThumb} />
                )}
                <button type="button" onClick={clearAttachment} style={styles.clearAttachBtn}>
                  <X size={16} />
                </button>
              </div>
            )}

            {showEmojiPicker && (
              <div className="glass-panel" style={styles.emojiPickerContainer}>
                <div style={styles.emojiGrid}>
                  {POPULAR_EMOJIS.map((emoji) => (
                    <span
                      key={emoji}
                      onClick={() => {
                        setContent((prev) => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      style={styles.emojiItem}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={styles.inputControls}>
              <button 
                type="button" 
                onClick={() => fileInputRef.current.click()} 
                style={styles.attachBtn}
                title="Add attachment"
              >
                <Paperclip size={20} />
              </button>

              <button 
                type="button" 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                style={{ ...styles.attachBtn, color: showEmojiPicker ? 'var(--accent-primary)' : '#a1a1aa' }}
                title="Add emoji"
              >
                <Smile size={20} />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <input
                type="text"
                className="glass-input"
                style={styles.chatInput}
                placeholder="Write a message..."
                value={content}
                onChange={handleInputChange}
                onFocus={() => setShowEmojiPicker(false)}
              />

              <button type="submit" className="glass-button" style={styles.sendBtn} disabled={sending}>
                <Send size={18} />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Right Drawer - Group Settings */}
      {activeChat.isGroup && showDrawer && (
        <div className="glass-panel drawer-responsive" style={styles.drawer}>
          <div style={styles.drawerHeader}>
            <h3 style={styles.drawerTitle}>Group Settings</h3>
            <button onClick={() => setShowDrawer(false)} style={styles.iconBtn}>
              <X size={20} />
            </button>
          </div>

          <div style={styles.drawerContent}>
            {/* Rename Group Section */}
            <div style={styles.drawerSection}>
              <label style={styles.drawerLabel}>Group Name</label>
              <div style={styles.renameGroupForm}>
                <input
                  type="text"
                  className="glass-input"
                  style={styles.drawerInput}
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
                <button onClick={handleRenameGroup} className="glass-button" style={styles.saveNameBtn}>
                  Save
                </button>
              </div>
            </div>

            {/* Add Member Section (Admin only) */}
            {activeChat.admin._id === user._id && (
              <div style={styles.drawerSection}>
                <label style={styles.drawerLabel}>Add Member</label>
                <div style={styles.searchAddContainer}>
                  <input
                    type="text"
                    className="glass-input"
                    style={{ ...styles.drawerInput, width: '100%' }}
                    placeholder="Search users..."
                    value={addMemberTerm}
                    onChange={(e) => setAddMemberTerm(e.target.value)}
                  />
                  {addSearchResults.length > 0 && (
                    <div className="glass-panel" style={styles.addSearchResults}>
                      {addSearchResults.map(u => (
                        <div key={u._id} onClick={() => handleAddMember(u._id)} style={styles.addResultItem}>
                          <UserPlus size={16} color="#10b981" />
                          <span>{u.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Members Roster */}
            <div style={styles.drawerSection}>
              <label style={styles.drawerLabel}>Members ({activeChat.members.length})</label>
              <div style={styles.membersList}>
                {activeChat.members.map(member => {
                  const isMemberAdmin = activeChat.admin._id === member._id;
                  const isLoggedUserAdmin = activeChat.admin._id === user._id;
                  
                  return (
                    <div key={member._id} style={styles.memberItem}>
                      <div style={styles.memberDetails}>
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} style={styles.memberAvatar} />
                        ) : (
                          <div style={styles.memberAvatarPlaceholder}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={styles.memberName}>{member.name}</div>
                          {isMemberAdmin && <span style={styles.adminBadge}>admin</span>}
                        </div>
                      </div>
                      
                      {/* Admin option to remove other members */}
                      {isLoggedUserAdmin && member._id !== user._id && (
                        <button onClick={() => handleRemoveMember(member._id)} style={styles.removeMemberBtn} title="Remove User">
                          <UserMinus size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leave Group Option */}
            <button onClick={handleLeaveGroup} style={styles.leaveBtn}>
              <LogOut size={16} />
              <span>Leave Group</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  chatViewport: {
    flex: 1,
    height: '100%',
    display: 'flex',
    overflow: 'hidden',
  },
  chatContainer: {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(10, 11, 16, 0.25)',
    overflow: 'hidden',
    position: 'relative',
  },
  placeholderContainer: {
    flex: 1,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(10, 11, 16, 0.25)',
  },
  placeholderCard: {
    maxWidth: '460px',
    padding: '40px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '20px',
  },
  placeholderTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '10px',
  },
  placeholderText: {
    fontSize: '0.875rem',
    color: '#a1a1aa',
    lineHeight: '1.5',
  },
  header: {
    height: '80px',
    padding: '0 24px',
    borderBottom: '1px solid var(--border-glass)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(14, 15, 24, 0.4)',
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  headerAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    objectFit: 'cover',
  },
  headerAvatarPlaceholder: {
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
  headerName: {
    fontSize: '1rem',
    fontWeight: '600',
  },
  headerSub: {
    fontSize: '0.75rem',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: '#a1a1aa',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    transition: 'color 0.2s, background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  emptyMessages: {
    margin: 'auto',
    color: '#71717a',
    fontSize: '0.9rem',
  },
  messageRow: {
    display: 'flex',
    gap: '10px',
    maxWidth: '75%',
    alignSelf: 'inherit',
  },
  bubbleAvatarWrapper: {
    display: 'flex',
    alignItems: 'flex-end',
  },
  bubbleAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  bubbleAvatarPlaceholder: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  messageBubbleWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  bubbleMenu: {
    position: 'absolute',
    left: '-70px',
    display: 'flex',
    gap: '4px',
    backgroundColor: 'rgba(14, 15, 24, 0.9)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '4px',
    zIndex: 5,
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    color: '#a1a1aa',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'color 0.2s',
  },
  bubble: {
    padding: '12px 16px',
    borderRadius: '12px',
    maxWidth: '100%',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
  },
  senderName: {
    fontSize: '0.75rem',
    color: '#a78bfa',
    fontWeight: '600',
    marginBottom: '4px',
  },
  messageText: {
    fontSize: '0.925rem',
    lineHeight: '1.5',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  },
  mediaContainer: {
    maxWidth: '300px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  mediaImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
    maxHeight: '260px',
    objectFit: 'cover',
  },
  fileBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-glass)',
    textDecoration: 'none',
    color: '#f3f4f6',
    cursor: 'pointer',
  },
  fileDetails: {
    flex: 1,
    overflow: 'hidden',
  },
  fileName: {
    fontSize: '0.85rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fileSub: {
    fontSize: '0.7rem',
    color: '#71717a',
  },
  bubbleFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '4px',
    marginTop: '6px',
  },
  editedTag: {
    fontSize: '0.65rem',
    color: '#71717a',
    marginRight: '2px',
  },
  timestamp: {
    fontSize: '0.65rem',
    color: '#71717a',
  },
  typingContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginTop: '8px',
  },
  typingBubble: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-glass-light)',
    padding: '8px 14px',
    borderRadius: '12px',
    borderTopLeftRadius: '2px',
  },
  typingText: {
    fontSize: '0.75rem',
    color: '#a1a1aa',
    fontWeight: '500',
  },
  inputBar: {
    padding: '16px 24px',
    borderTop: '1px solid var(--border-glass)',
    backgroundColor: 'rgba(14, 15, 24, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  previewPanel: {
    alignSelf: 'flex-start',
    position: 'relative',
    padding: '6px',
    borderRadius: '10px',
    display: 'flex',
  },
  imagePreviewThumb: {
    width: '64px',
    height: '64px',
    borderRadius: '8px',
    objectFit: 'cover',
  },
  filePreviewBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '8px',
  },
  previewName: {
    fontSize: '0.8rem',
    maxWidth: '180px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  clearAttachBtn: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  attachBtn: {
    background: 'none',
    border: 'none',
    color: '#a1a1aa',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
  },
  chatInput: {
    flex: 1,
    borderRadius: '10px',
  },
  sendBtn: {
    padding: '12px',
    borderRadius: '10px',
    minWidth: '46px',
  },
  // Edit State styles
  editContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '220px',
  },
  editInput: {
    flex: 1,
    padding: '6px 10px',
    fontSize: '0.85rem',
  },
  editActions: {
    display: 'flex',
    gap: '4px',
  },
  editCancelBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    borderRadius: '6px',
    padding: '6px',
    cursor: 'pointer',
  },
  editSaveBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    color: '#10b981',
    borderRadius: '6px',
    padding: '6px',
    cursor: 'pointer',
  },
  // Drawer styles
  drawer: {
    width: '300px',
    height: '100%',
    borderRadius: '0',
    borderTop: '0',
    borderBottom: '0',
    borderRight: '0',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(14, 15, 24, 0.55)',
  },
  drawerHeader: {
    padding: '24px 20px',
    borderBottom: '1px solid var(--border-glass)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
  },
  drawerContent: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  drawerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  drawerLabel: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: '#71717a',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  drawerInput: {
    padding: '8px 12px',
    fontSize: '0.85rem',
  },
  renameGroupForm: {
    display: 'flex',
    gap: '8px',
  },
  saveNameBtn: {
    padding: '8px 16px',
    fontSize: '0.85rem',
  },
  searchAddContainer: {
    position: 'relative',
  },
  addSearchResults: {
    position: 'absolute',
    top: '40px',
    left: 0,
    right: 0,
    maxHeight: '160px',
    overflowY: 'auto',
    zIndex: 200,
    padding: '4px',
  },
  addResultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    cursor: 'pointer',
    borderRadius: '6px',
    fontSize: '0.85rem',
    transition: 'background-color 0.15s',
  },
  membersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '240px',
    overflowY: 'auto',
  },
  memberItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  memberAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    objectFit: 'cover',
  },
  memberAvatarPlaceholder: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '0.85rem',
  },
  memberName: {
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  adminBadge: {
    fontSize: '0.6rem',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    color: '#a78bfa',
    padding: '1px 4px',
    borderRadius: '4px',
    fontWeight: '600',
  },
  removeMemberBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
  },
  leaveBtn: {
    marginTop: 'auto',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    borderRadius: '10px',
    padding: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  emojiPickerContainer: {
    position: 'absolute',
    bottom: '76px',
    left: '24px',
    width: '260px',
    padding: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    zIndex: 100,
  },
  emojiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px',
    maxHeight: '140px',
    overflowY: 'auto',
  },
  emojiItem: {
    fontSize: '1.25rem',
    cursor: 'pointer',
    textAlign: 'center',
    padding: '2px',
    borderRadius: '6px',
    transition: 'background-color 0.1s',
    userSelect: 'none',
  },
  requestBanner: {
    margin: '16px 24px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    textAlign: 'center',
    border: '1px solid var(--border-glass)',
    borderRadius: '16px',
    background: 'var(--bg-glass-dark)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
  },
  requestBannerText: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    lineHeight: '1.5',
    maxWidth: '400px',
  },
  requestActions: {
    display: 'flex',
    gap: '16px',
    width: '100%',
    justifyContent: 'center',
  },
  acceptBtn: {
    padding: '10px 24px',
    fontSize: '0.9rem',
    minWidth: '100px',
  },
  declineBtn: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#ef4444',
    padding: '10px 24px',
    fontSize: '0.9rem',
    minWidth: '100px',
    cursor: 'pointer',
    borderRadius: '10px',
    fontFamily: 'inherit',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  backBtn: {
    // Empty class layout handles it
  },
};

export default ChatArea;
