import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.token) {
      // Connect to the backend socket server (port 5001 in development)
      const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '/';
      const newSocket = io(socketUrl, {
        autoConnect: true,
        transports: ['websocket', 'polling']
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('[Socket] Connected to server');
      });

      newSocket.on('connect_error', (err) => {
        console.error('[Socket] Connection error:', err);
      });

      newSocket.on('disconnect', () => {
        console.log('[Socket] Disconnected from server');
      });

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
      }
      setSocket(null);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
