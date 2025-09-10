'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-hot-toast';

interface Server {
  id: string;
  name: string;
  description?: string;
  image?: string | null;
  channels?: Channel[];
  _count?: {
    members: number;
  };
}

interface Channel {
  id: string;
  name: string;
  type: 'TEXT' | 'VOICE' | 'VIDEO' | 'STREAMING';
  description?: string;
}

interface ServerContextType {
  servers: Server[];
  activeServer: Server | null;
  setActiveServer: (serverId: string) => void;
  refreshServers: () => Promise<void>;
  channels: { [serverId: string]: Channel[] };
  activeChannel: Channel | null;
  setActiveChannel: (channel: Channel | null) => void;
  loadChannels: (serverId: string) => Promise<void>;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export function ServerProvider({ children }: { children: ReactNode }) {
  const [servers, setServers] = useState<Server[]>([]);
  const [activeServer, setActiveServerState] = useState<Server | null>(null);
  const [channels, setChannels] = useState<{ [serverId: string]: Channel[] }>({});
  const [activeChannel, setActiveChannelState] = useState<Channel | null>(null);

  const fetchServers = async () => {
    try {
      const response = await fetch('/api/servers');
      if (!response.ok) throw new Error('Failed to fetch servers');
      const data = await response.json();
      setServers(data);
    } catch (error) {
      console.error('Error fetching servers:', error);
      toast.error('Failed to load servers');
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const setActiveServer = (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (server) {
      setActiveServerState(server);
      if (!channels[serverId]) {
        loadChannels(serverId);
      }
    }
  };

  const loadChannels = async (serverId: string) => {
    try {
      const response = await fetch(`/api/servers/${serverId}/channels`);
      if (!response.ok) throw new Error('Failed to fetch channels');
      const data = await response.json();
      setChannels(prev => ({
        ...prev,
        [serverId]: data
      }));
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast.error('Failed to load channels');
    }
  };

  const setActiveChannel = (channel: Channel | null) => {
    setActiveChannelState(channel);
  };

  const refreshServers = async () => {
    await fetchServers();
  };

  return (
    <ServerContext.Provider
      value={{
        servers,
        activeServer,
        setActiveServer,
        refreshServers,
        channels,
        activeChannel,
        setActiveChannel,
        loadChannels
      }}
    >
      {children}
    </ServerContext.Provider>
  );
}

export function useServer() {
  const context = useContext(ServerContext);
  if (context === undefined) {
    throw new Error('useServer must be used within a ServerProvider');
  }
  return context;
}
