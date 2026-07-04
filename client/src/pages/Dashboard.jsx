import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import ProfileModal from '../components/ProfileModal';
import GroupModal from '../components/GroupModal';
import { toast } from 'react-hot-toast';

function Dashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeChat, setActiveChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState({});
  const [typingStatus, setTypingStatus] = useState({});

  // Modal states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);

  // 1. Initial Load of Chats
  useEffect(() => {
    const loadChats = async () => {
      try {
        const res = await api.get('/chat');
        setChats(res.data);
      } catch (error) {
        console.error('Failed to load chats', error);
      }
    };
    loadChats();
  }, [activeChat]);

  // 2. Fetch Messages when active chat changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeChat) return;
      try {
        const res = await api.get(`/message/${activeChat._id}`);
        setMessages(res.data);
      } catch (error) {
        console.error('Failed to load messages', error);
      }
    };
    loadMessages();
  }, [activeChat]);

  // 3. Socket Event Listeners setup
  useEffect(() => {
    if (!socket) return;

    // Incoming messages
    socket.on('receive_message', (message) => {
      const msgChatId = message.chatId._id || message.chatId;

      if (activeChat && activeChat._id === msgChatId) {
        setMessages((prev) => [...prev, message]);
        // Report message immediately seen
        socket.emit('message_seen', { chatId: activeChat._id, userId: user._id });
      } else {
        // Increment notifications count
        setNotifications((prev) => ({
          ...prev,
          [msgChatId]: (prev[msgChatId] || 0) + 1,
        }));
      }

      // Move the chat to top of the list
      setChats((prev) => {
        const chatIndex = prev.findIndex((c) => c._id === msgChatId);
        if (chatIndex > -1) {
          const updated = [...prev];
          const [targetChat] = updated.splice(chatIndex, 1);
          return [targetChat, ...updated];
        }
        return prev;
      });
    });

    // Message edited
    socket.on('message_updated', (updatedMessage) => {
      const msgChatId = updatedMessage.chatId._id || updatedMessage.chatId;
      if (activeChat && activeChat._id === msgChatId) {
        setMessages((prev) =>
          prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
        );
      }
    });

    // Message deleted
    socket.on('message_deleted', (deletedMessage) => {
      const msgChatId = deletedMessage.chatId._id || deletedMessage.chatId;
      if (activeChat && activeChat._id === msgChatId) {
        if (deletedMessage.adminDeleted) {
          setMessages((prev) => prev.filter((m) => m._id !== deletedMessage._id));
        } else {
          setMessages((prev) =>
            prev.map((m) => (m._id === deletedMessage._id ? deletedMessage : m))
          );
        }
      }
    });

    // Message seen synchronization
    socket.on('message_seen', ({ chatId, userId }) => {
      if (activeChat && activeChat._id === chatId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (!m.seenBy.includes(userId)) {
              return { ...m, seenBy: [...m.seenBy, userId] };
            }
            return m;
          })
        );
      }
    });

    // Typing state starts
    socket.on('typing', (data) => {
      setTypingStatus((prev) => {
        const chatTyping = prev[data.chatId] || [];
        if (!chatTyping.some((u) => u.senderId === data.senderId)) {
          return {
            ...prev,
            [data.chatId]: [...chatTyping, data],
          };
        }
        return prev;
      });
    });

    // Typing state stops
    socket.on('stop_typing', (data) => {
      setTypingStatus((prev) => {
        const chatTyping = prev[data.chatId] || [];
        return {
          ...prev,
          [data.chatId]: chatTyping.filter((u) => u.senderId !== data.senderId),
        };
      });
    });

    // Group updates
    socket.on('group_updated', (updatedChat) => {
      setChats((prev) =>
        prev.map((c) => (c._id === updatedChat._id ? updatedChat : c))
      );
      if (activeChat && activeChat._id === updatedChat._id) {
        const isStillMember = updatedChat.members.some((m) => m._id === user._id);
        if (!isStillMember) {
          setActiveChat(null);
          toast.error('You were removed from this group.');
        } else {
          setActiveChat(updatedChat);
        }
      }
    });

    // Group deleted or self kicked
    socket.on('group_deleted', ({ chatId }) => {
      setChats((prev) => prev.filter((c) => c._id !== chatId));
      if (activeChat && activeChat._id === chatId) {
        setActiveChat(null);
        toast.error('This group was deleted or you are no longer a member.');
      }
    });

    // Direct chat deleted
    socket.on('chat_deleted', ({ chatId }) => {
      setChats((prev) => prev.filter((c) => c._id !== chatId));
      if (activeChat && activeChat._id === chatId) {
        setActiveChat(null);
        toast.error('This conversation has been deleted.');
      }
    });

    return () => {
      socket.off('receive_message');
      socket.off('message_updated');
      socket.off('message_deleted');
      socket.off('message_seen');
      socket.off('typing');
      socket.off('stop_typing');
      socket.off('group_updated');
      socket.off('group_deleted');
      socket.off('chat_deleted');
    };
  }, [socket, activeChat, user]);

  const clearNotification = (chatId) => {
    setNotifications((prev) => {
      const next = { ...prev };
      delete next[chatId];
      return next;
    });
  };

  const handleGroupCreated = (newGroupChat) => {
    setChats((prev) => [newGroupChat, ...prev]);
    setActiveChat(newGroupChat);
  };

  return (
    <div style={styles.dashboard}>
      <Sidebar
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        chats={chats}
        setChats={setChats}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenGroup={() => setIsGroupOpen(true)}
        notifications={notifications}
        clearNotification={clearNotification}
      />

      <ChatArea
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        messages={messages}
        setMessages={setMessages}
        typingStatus={typingStatus}
        clearNotification={clearNotification}
      />

      {/* Modal overlays */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <GroupModal
        isOpen={isGroupOpen}
        onClose={() => setIsGroupOpen(false)}
        onCreateGroup={handleGroupCreated}
      />
    </div>
  );
}

const styles = {
  dashboard: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#0a0b10',
    overflow: 'hidden',
  },
};

export default Dashboard;
