// hooks/useMeeting.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'react-hot-toast';

interface MeetingParticipant {
  id: string;
  name: string;
  image?: string;
  isHost: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  joinedAt: Date;
}

interface MeetingState {
  isActive: boolean;
  hostId?: string;
  hostName?: string;
  participantCount: number;
  startedAt?: Date;
}

interface MediaState {
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  audioLevel: number;
  videoQuality: 'low' | 'medium' | 'high';
  audioQuality: 'low' | 'medium' | 'high';
}

interface UseMeetingReturn {
  // Meeting state
  meetingState: MeetingState;
  participants: MeetingParticipant[];
  isHost: boolean;
  isJoined: boolean;
  canStartMeeting: boolean;
  
  // Media state
  mediaState: MediaState;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  
  // Actions
  startMeeting: () => Promise<void>;
  joinMeeting: () => Promise<void>;
  leaveMeeting: () => Promise<void>;
  endMeeting: () => Promise<void>;
  
  // Media controls
  toggleMicrophone: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  setAudioLevel: (level: number) => void;
  switchCamera: (deviceId: string) => Promise<void>;
  switchMicrophone: (deviceId: string) => Promise<void>;
  
  // Connection state
  isConnecting: boolean;
  connectionError: string | null;
}

export function useMeeting(channelId: string, serverId: string): UseMeetingReturn {
  const { data: session } = useSession();
  const { socket } = useSocket();
  
  // State management
  const [meetingState, setMeetingState] = useState<MeetingState>({
    isActive: false,
    participantCount: 0
  });
  
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const [mediaState, setMediaState] = useState<MediaState>({
    isMicOn: true,
    isCameraOn: true,
    isScreenSharing: false,
    audioLevel: 50,
    videoQuality: 'medium',
    audioQuality: 'medium'
  });
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  
  // Refs for cleanup
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout>();
  
  // Computed values
  const isHost = meetingState.hostId === session?.user?.id;
  const canStartMeeting = !meetingState.isActive && !isConnecting;
  
  // Get user media with constraints
  const getUserMedia = useCallback(async (constraints: MediaStreamConstraints) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      console.error('Error getting user media:', error);
      throw new Error('Failed to access camera/microphone');
    }
  }, []);
  
  // Audio level monitoring
  const startAudioLevelMonitoring = useCallback((stream: MediaStream) => {
    if (!stream.getAudioTracks().length) return;
    
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 512;
      analyser.minDecibels = -127;
      analyser.maxDecibels = 0;
      analyser.smoothingTimeConstant = 0.4;
      
      microphone.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevel = () => {
        if (audioContext.state === 'closed') return;
        
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const level = (average / 255) * 100;
        
        setMediaState(prev => ({ ...prev, audioLevel: Math.min(level, 100) }));
      };
      
      audioLevelIntervalRef.current = setInterval(updateLevel, 100);
      
      return () => {
        audioContext.close();
        if (audioLevelIntervalRef.current) {
          clearInterval(audioLevelIntervalRef.current);
        }
      };
    } catch (error) {
      console.warn('Audio level monitoring not supported:', error);
    }
  }, []);
  
  // Start meeting (host only)
  const startMeeting = useCallback(async () => {
    if (!session?.user?.id || !socket || isConnecting) return;
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Get user media
      const constraints: MediaStreamConstraints = {
        video: mediaState.isCameraOn ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false,
        audio: mediaState.isMicOn ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };
      
      const stream = await getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      // Start audio monitoring
      if (mediaState.isMicOn) {
        startAudioLevelMonitoring(stream);
      }
      
      // Notify server about meeting start
      socket.emit('meeting-started', {
        channelId,
        hostId: session.user.id,
        hostName: session.user.name
      });
      
      setIsJoined(true);
      toast.success('Meeting started successfully');
      
    } catch (error) {
      console.error('Error starting meeting:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to start meeting');
      toast.error('Failed to start meeting');
    } finally {
      setIsConnecting(false);
    }
  }, [session, socket, channelId, isConnecting, mediaState, getUserMedia, startAudioLevelMonitoring]);
  
  // Join meeting (participants)
  const joinMeeting = useCallback(async () => {
    if (!session?.user?.id || !socket || isConnecting) return;
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Get user media
      const constraints: MediaStreamConstraints = {
        video: mediaState.isCameraOn ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false,
        audio: mediaState.isMicOn ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };
      
      const stream = await getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      // Start audio monitoring
      if (mediaState.isMicOn) {
        startAudioLevelMonitoring(stream);
      }
      
      // Notify server about joining
      socket.emit('meeting-joined', {
        channelId,
        userId: session.user.id,
        userName: session.user.name
      });
      
      setIsJoined(true);
      toast.success('Joined meeting successfully');
      
    } catch (error) {
      console.error('Error joining meeting:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to join meeting');
      toast.error('Failed to join meeting');
    } finally {
      setIsConnecting(false);
    }
  }, [session, socket, channelId, isConnecting, mediaState, getUserMedia, startAudioLevelMonitoring]);
  
  // Leave meeting
  const leaveMeeting = useCallback(async () => {
    if (!socket) return;
    
    try {
      // Stop all tracks
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      
      // Clear audio monitoring
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      
      // Notify server
      socket.emit('meeting-left', {
        channelId,
        userId: session?.user?.id
      });
      
      // Reset state
      setIsJoined(false);
      setLocalStream(null);
      setRemoteStreams(new Map());
      setParticipants([]);
      localStreamRef.current = null;
      screenStreamRef.current = null;
      
      toast.success('Left meeting');
      
    } catch (error) {
      console.error('Error leaving meeting:', error);
      toast.error('Failed to leave meeting');
    }
  }, [socket, channelId, session]);
  
  // End meeting (host only)
  const endMeeting = useCallback(async () => {
    if (!socket || !isHost) return;
    
    try {
      // Stop all tracks
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      
      // Clear audio monitoring
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      
      // Notify server
      socket.emit('meeting-ended', { channelId });
      
      // Reset state
      setIsJoined(false);
      setLocalStream(null);
      setRemoteStreams(new Map());
      setParticipants([]);
      localStreamRef.current = null;
      screenStreamRef.current = null;
      
      toast.success('Meeting ended');
      
    } catch (error) {
      console.error('Error ending meeting:', error);
      toast.error('Failed to end meeting');
    }
  }, [socket, channelId, isHost]);
  
  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    if (!localStreamRef.current) return;
    
    try {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMediaState(prev => ({ ...prev, isMicOn: audioTrack.enabled }));
        
        // Notify other participants
        socket?.emit('media-state-changed', {
          channelId,
          userId: session?.user?.id,
          isMuted: !audioTrack.enabled
        });
        
        // Handle audio monitoring
        if (audioTrack.enabled) {
          startAudioLevelMonitoring(localStreamRef.current);
        } else if (audioLevelIntervalRef.current) {
          clearInterval(audioLevelIntervalRef.current);
          setMediaState(prev => ({ ...prev, audioLevel: 0 }));
        }
      }
    } catch (error) {
      console.error('Error toggling microphone:', error);
      toast.error('Failed to toggle microphone');
    }
  }, [socket, channelId, session, startAudioLevelMonitoring]);
  
  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (!localStreamRef.current) return;
    
    try {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setMediaState(prev => ({ ...prev, isCameraOn: videoTrack.enabled }));
        
        // Notify other participants
        socket?.emit('media-state-changed', {
          channelId,
          userId: session?.user?.id,
          isCameraOff: !videoTrack.enabled
        });
      }
    } catch (error) {
      console.error('Error toggling camera:', error);
      toast.error('Failed to toggle camera');
    }
  }, [socket, channelId, session]);
  
  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    try {
      if (mediaState.isScreenSharing) {
        // Stop screen sharing
        screenStreamRef.current?.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
        setMediaState(prev => ({ ...prev, isScreenSharing: false }));
        
        socket?.emit('screen-share-stopped', {
          channelId,
          userId: session?.user?.id
        });
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: 1920, height: 1080, frameRate: 15 },
          audio: true
        });
        
        screenStreamRef.current = screenStream;
        setMediaState(prev => ({ ...prev, isScreenSharing: true }));
        
        socket?.emit('screen-share-started', {
          channelId,
          userId: session?.user?.id
        });
        
        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      toast.error('Failed to toggle screen sharing');
    }
  }, [mediaState.isScreenSharing, socket, channelId, session]);
  
  // Set audio level
  const setAudioLevel = useCallback((level: number) => {
    setMediaState(prev => ({ ...prev, audioLevel: level }));
    
    // Apply volume to all remote audio/video elements
    document.querySelectorAll('audio, video').forEach((element) => {
      if (element !== document.querySelector('video[muted]')) { // Skip local muted video
        (element as HTMLAudioElement | HTMLVideoElement).volume = level / 100;
      }
    });
  }, []);
  
  // Switch camera device
  const switchCamera = useCallback(async (deviceId: string) => {
    if (!localStreamRef.current) return;
    
    try {
      const newStream = await getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: localStreamRef.current.getAudioTracks().length > 0 ? {
          deviceId: localStreamRef.current.getAudioTracks()[0].getSettings().deviceId
        } : false
      });
      
      // Stop old video track
      localStreamRef.current.getVideoTracks().forEach(track => track.stop());
      
      // Replace video track
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (newVideoTrack) {
        localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
        localStreamRef.current.addTrack(newVideoTrack);
      }
      
      setLocalStream(localStreamRef.current);
      toast.success('Camera switched');
      
    } catch (error) {
      console.error('Error switching camera:', error);
      toast.error('Failed to switch camera');
    }
  }, [getUserMedia]);
  
  // Switch microphone device
  const switchMicrophone = useCallback(async (deviceId: string) => {
    if (!localStreamRef.current) return;
    
    try {
      const newStream = await getUserMedia({
        video: localStreamRef.current.getVideoTracks().length > 0 ? {
          deviceId: localStreamRef.current.getVideoTracks()[0].getSettings().deviceId
        } : false,
        audio: { deviceId: { exact: deviceId } }
      });
      
      // Stop old audio track
      localStreamRef.current.getAudioTracks().forEach(track => track.stop());
      
      // Replace audio track
      const newAudioTrack = newStream.getAudioTracks()[0];
      if (newAudioTrack) {
        localStreamRef.current.removeTrack(localStreamRef.current.getAudioTracks()[0]);
        localStreamRef.current.addTrack(newAudioTrack);
        
        // Restart audio monitoring
        if (audioLevelIntervalRef.current) {
          clearInterval(audioLevelIntervalRef.current);
        }
        startAudioLevelMonitoring(localStreamRef.current);
      }
      
      setLocalStream(localStreamRef.current);
      toast.success('Microphone switched');
      
    } catch (error) {
      console.error('Error switching microphone:', error);
      toast.error('Failed to switch microphone');
    }
  }, [getUserMedia, startAudioLevelMonitoring]);
  
  // Socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    const handleMeetingStateUpdate = (state: MeetingState) => {
      setMeetingState(state);
    };
    
    const handleUserJoined = (data: { userId: string; userName: string }) => {
      setParticipants(prev => [...prev, {
        id: data.userId,
        name: data.userName,
        isHost: false,
        isMuted: false,
        isCameraOff: false,
        isScreenSharing: false,
        joinedAt: new Date()
      }]);
    };
    
    const handleUserLeft = (data: { userId: string }) => {
      setParticipants(prev => prev.filter(p => p.id !== data.userId));
      setRemoteStreams(prev => {
        const newStreams = new Map(prev);
        newStreams.delete(`${data.userId}-camera`);
        newStreams.delete(`${data.userId}-screen`);
        return newStreams;
      });
    };
    
    const handleMediaStateChanged = (data: {
      userId: string;
      isMuted?: boolean;
      isCameraOff?: boolean;
      isScreenSharing?: boolean;
    }) => {
      setParticipants(prev => prev.map(p => 
        p.id === data.userId
          ? {
              ...p,
              ...(data.isMuted !== undefined && { isMuted: data.isMuted }),
              ...(data.isCameraOff !== undefined && { isCameraOff: data.isCameraOff }),
              ...(data.isScreenSharing !== undefined && { isScreenSharing: data.isScreenSharing })
            }
          : p
      ));
    };
    
    const handleMeetingEnded = () => {
      setMeetingState({ isActive: false, participantCount: 0 });
      setIsJoined(false);
      setParticipants([]);
      setRemoteStreams(new Map());
      
      // Clean up local streams
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      screenStreamRef.current = null;
      setLocalStream(null);
      
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      
      toast.success('Meeting ended');
    };
    
    socket.on('meeting-state-updated', handleMeetingStateUpdate);
    socket.on('user-joined-meeting', handleUserJoined);
    socket.on('user-left-meeting', handleUserLeft);
    socket.on('user-media-state-changed', handleMediaStateChanged);
    socket.on('meeting-ended', handleMeetingEnded);
    
    return () => {
      socket.off('meeting-state-updated', handleMeetingStateUpdate);
      socket.off('user-joined-meeting', handleUserJoined);
      socket.off('user-left-meeting', handleUserLeft);
      socket.off('user-media-state-changed', handleMediaStateChanged);
      socket.off('meeting-ended', handleMeetingEnded);
    };
  }, [socket]);
  
  // Fetch initial meeting state
  useEffect(() => {
    if (socket && channelId) {
      socket.emit('get-meeting-state', { channelId }, (response: MeetingState) => {
        setMeetingState(response);
      });
    }
  }, [socket, channelId]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
    };
  }, []);
  
  return {
    meetingState,
    participants,
    isHost,
    isJoined,
    canStartMeeting,
    mediaState,
    localStream,
    remoteStreams,
    startMeeting,
    joinMeeting,
    leaveMeeting,
    endMeeting,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    setAudioLevel,
    switchCamera,
    switchMicrophone,
    isConnecting,
    connectionError
  };
}