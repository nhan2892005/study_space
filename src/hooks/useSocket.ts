import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface ServerInvitation {
  id: string;
  serverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}

interface InvitationEvent {
  invitation: ServerInvitation;
  serverName: string;
  invitedByName: string;
}

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

    const handleInvitation = async (invitationId: string, status: 'ACCEPTED' | 'DECLINED') => {
      try {
        const response = await fetch(`/api/invitations/${invitationId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          throw new Error('Failed to respond to invitation');
        }

        toast.success(status === 'ACCEPTED' 
          ? 'Đã tham gia server thành công!' 
          : 'Đã từ chối lời mời');

      } catch (error) {
        console.error('Error handling invitation:', error);
        toast.error('Có lỗi xảy ra khi xử lý lời mời');
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
