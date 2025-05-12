import React, { createContext, useContext, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socket = useRef(io('http://localhost:5000'));

  return (
    <SocketContext.Provider value={{ socket: socket.current }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);