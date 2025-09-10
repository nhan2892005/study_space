import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export const useSocket = (channelId?: string) => {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket>();

  useEffect(() => {
    if (!session?.user) return;

    const socketInitializer = async () => {
      await fetch('/api/socket');
      
      const socket = io();
      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      if (channelId) {
        socket.emit('join-channel', channelId);
      }
    };

    socketInitializer();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [session, channelId]);

  const sendMessage = useCallback((content: string, files?: File[]) => {
    if (!socketRef.current || !channelId) return;
    socketRef.current.emit('send-message', { content, channelId, files });
  }, [channelId]);

  const uploadFile = useCallback(async (file: File) => {
    if (!socketRef.current || !channelId) return;
    
    const buffer = await file.arrayBuffer();
    socketRef.current.emit('upload-file', {
      file: buffer,
      fileName: file.name,
      fileType: file.type,
      channelId,
    });
  }, [channelId]);

  const joinStream = useCallback(() => {
    if (!socketRef.current || !channelId) return;
    socketRef.current.emit('join-stream', channelId);
  }, [channelId]);

  const leaveStream = useCallback(() => {
    if (!socketRef.current || !channelId) return;
    socketRef.current.emit('leave-stream', channelId);
  }, [channelId]);

  const startRecording = useCallback(() => {
    if (!socketRef.current || !channelId) return;
    socketRef.current.emit('start-recording', channelId);
  }, [channelId]);

  const stopRecording = useCallback((recordingData: Blob, title: string, targetChannelId: string) => {
    if (!socketRef.current || !channelId) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      if (!reader.result || !socketRef.current) return;
      
      socketRef.current.emit('stop-recording', {
        channelId,
        recordingData: reader.result,
        title,
        targetChannelId,
      });
    };
    reader.readAsArrayBuffer(recordingData);
  }, [channelId]);

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    uploadFile,
    joinStream,
    leaveStream,
    startRecording,
    stopRecording,
  };
};
