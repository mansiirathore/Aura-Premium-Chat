import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5000', {
        withCredentials: true,
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        newSocket.emit('online', user._id);
      });

      newSocket.on('get_online_users', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('user_online', ({ userId }) => {
        setOnlineUsers((prev) => [...new Set([...prev, userId])]);
      });

      newSocket.on('user_offline', ({ userId }) => {
        setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      });

      newSocket.on('banned', () => {
        setUser(null);
        localStorage.removeItem('token');
        toast.error('Your account has been banned by the administrator.');
      });

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setOnlineUsers([]);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
