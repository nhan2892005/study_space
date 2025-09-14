import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface FileData {
  id: string;
  name: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  size: number;
}

interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'FILE' | 'SYSTEM';
  author: {
    name: string;
    image: string;
  };
  files?: FileData[];
  timestamp: Date;
}

export const useMessages = (serverId: string, channelId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastMessageTimeRef = useRef<Date | null>(null);

  // Initial fetch of messages
  const fetchMessages = useCallback(async () => {
    if (!channelId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/servers/${serverId}/channels/${channelId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data);
      
      // Set last message time for SSE
      if (data.length > 0) {
        lastMessageTimeRef.current = new Date(data[data.length - 1].timestamp);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [serverId, channelId]);

  // Setup Server-Sent Events connection
  const setupSSE = useCallback(() => {
    if (!channelId || eventSourceRef.current) return;

    const lastMessageTime = lastMessageTimeRef.current?.toISOString() || 
                           new Date(Date.now() - 1000 * 60 * 5).toISOString();
    
    const url = `/api/servers/${serverId}/channels/${channelId}/messages/stream?lastMessageTime=${lastMessageTime}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connected':
            console.log('SSE connected');
            break;
            
          case 'messages':
            if (data.data && Array.isArray(data.data)) {
              // Add new messages, avoiding duplicates
              setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const newMessages = data.data.filter((msg: Message) => !existingIds.has(msg.id));
                
                if (newMessages.length > 0) {
                  // Update last message time
                  const latestTime = Math.max(...newMessages.map((m: Message) => new Date(m.timestamp).getTime()));
                  lastMessageTimeRef.current = new Date(latestTime);
                  
                  return [...prev, ...newMessages].sort((a, b) => 
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                  );
                }
                return prev;
              });
            }
            break;
            
          case 'error':
            console.error('SSE error:', data.message);
            setError(data.message);
            break;
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setIsConnected(false);
      setError('Connection lost. Attempting to reconnect...');
      
      // Close and retry connection after 3 seconds
      eventSource.close();
      eventSourceRef.current = null;
      
      setTimeout(() => {
        if (channelId) { // Only reconnect if still on the same channel
          setupSSE();
        }
      }, 3000);
    };

  }, [serverId, channelId]);

  // Cleanup SSE connection
  const cleanupSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback(async (
    content: string, 
    files: File[] = []
  ): Promise<boolean> => {
    if (!channelId) return false;
    if (!content.trim() && files.length === 0) return false;

    try {
      let uploadedFiles: FileData[] = [];
      
      // Upload files if any
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file);
        });

        const uploadResponse = await fetch('/api/uploads/cloudinary', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload files');
        }

        const uploadResult = await uploadResponse.json();
        
        uploadedFiles = files.map((file, index) => ({
          id: '',
          name: file.name,
          url: uploadResult.urls[index],
          type: getFileType(file),
          size: file.size,
        }));
      }

      const response = await fetch(`/api/servers/${serverId}/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: content.trim() || (files.length > 0 ? 'Shared files' : ''),
          type: files.length > 0 ? 'FILE' : 'TEXT',
          files: uploadedFiles,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      // Message will be received via SSE, no need to manually refresh
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return false;
    }
  }, [serverId, channelId]);

  const getFileType = (file: File): 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' => {
    if (file.type.startsWith('image/')) return 'IMAGE';
    if (file.type.startsWith('video/')) return 'VIDEO';
    if (file.type.startsWith('audio/')) return 'AUDIO';
    return 'DOCUMENT';
  };

  // Setup connection when channel changes
  useEffect(() => {
    if (!channelId) {
      cleanupSSE();
      setMessages([]);
      return;
    }

    // First fetch initial messages, then setup SSE
    fetchMessages().then(() => {
      setupSSE();
    });

    // Cleanup on unmount or channel change
    return () => {
      cleanupSSE();
    };
  }, [channelId, fetchMessages, setupSSE, cleanupSSE]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSSE();
    };
  }, [cleanupSSE]);

  // Manual refresh fallback
  const refreshMessages = useCallback(async () => {
    await fetchMessages();
  }, [fetchMessages]);

  return {
    // Data
    messages,
    messagesCount: messages.length,
    latestMessage: messages.length > 0 ? messages[messages.length - 1] : null,
    
    // State
    loading,
    error,
    isConnected,
    
    // Actions
    sendMessage,
    refreshMessages,
  };
};