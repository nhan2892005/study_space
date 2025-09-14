// src/contexts/SocketContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinChannel: (channelId: string, serverId: string) => void;
  leaveChannel: (channelId: string) => void;
  sendMessage: (data: {
    channelId: string;
    serverId: string;
    content: string;
    files?: any[];
  }) => void;
  onNewMessage: (callback: (message: any) => void) => void;
  onChannelJoined: (callback: (data: any) => void) => void;
  onError: (callback: (error: any) => void) => void;
  onUserTyping: (callback: (data: any) => void) => void;
  onUserStoppedTyping: (callback: (data: any) => void) => void;
  startTyping: (channelId: string) => void;
  stopTyping: (channelId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinChannel: () => {},
  leaveChannel: () => {},
  sendMessage: () => {},
  onNewMessage: () => undefined,
  onChannelJoined: () => undefined,
  onError: () => undefined,
  onUserTyping: () => undefined,
  onUserStoppedTyping: () => undefined,
  startTyping: () => {},
  stopTyping: () => {},
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.email) {
      return;
    }

    // Create socket connection with authentication
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket'],
      auth: {
        token: (session as any)?.accessToken || null
      },
    });

    socketInstance.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
      toast.success('Connected to chat server');
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
      toast.error('Disconnected from chat server');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      toast.error('Failed to connect to chat server');
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [session]);

  const joinChannel = (channelId: string, serverId: string) => {
    if (socket) {
      socket.emit('join-channel', { channelId, serverId });
    }
  };

  const leaveChannel = (channelId: string) => {
    if (socket) {
      socket.emit('leave-channel', { channelId });
    }
  };

  const sendMessage = (data: {
    channelId: string;
    serverId: string;
    content: string;
    files?: any[];
  }) => {
    if (socket) {
      socket.emit('send-message', data);
    }
  };

  const onNewMessage = (callback: (message: any) => void) => {
    if (socket) {
      socket.on('new-message', callback);
      return () => socket.off('new-message', callback);
    }
  };

  const onChannelJoined = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('channel-joined', callback);
      return () => socket.off('channel-joined', callback);
    }
  };

  const onError = (callback: (error: any) => void) => {
    if (socket) {
      socket.on('error', callback);
      return () => socket.off('error', callback);
    }
  };

  const onUserTyping = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('user-typing', callback);
      return () => socket.off('user-typing', callback);
    }
  };

  const onUserStoppedTyping = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('user-stopped-typing', callback);
      return () => socket.off('user-stopped-typing', callback);
    }
  };

  const startTyping = (channelId: string) => {
    if (socket) {
      socket.emit('typing-start', { channelId });
    }
  };

  const stopTyping = (channelId: string) => {
    if (socket) {
      socket.emit('typing-stop', { channelId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinChannel,
        leaveChannel,
        sendMessage,
        onNewMessage,
        onChannelJoined,
        onError,
        onUserTyping,
        onUserStoppedTyping,
        startTyping,
        stopTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};