import React, { createContext, useState, useContext, useEffect } from 'react';
import { useSocket } from './SocketContext';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (!user) return;
    const handleUsers = (users) => {
      const updated = users.find(
        u =>
          u.name === user.name &&
          u.type === user.type &&
          (u.fittingRoom === user.fittingRoom || user.type === 'seller')
      );
      if (updated) setUser(updated);
    };
    socket.on('user_connected', handleUsers);
    return () => {
      socket.off('user_connected', handleUsers);
    };
  }, [socket, user]);

const login = (userData) => {
  setUser(userData);
  socket.emit('user_login', userData);
};

const logout = () => {
  if (user) {
    socket.emit('user_logout', user.id);
    setUser(null);
  }
};


  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
