'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Device } from 'mediasoup-client';
import { useSocket } from '@/contexts/SocketContext';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface Props {
  serverId: string;
  channelId: string;
}

interface StreamingUser {
  id: string;
  name: string;
  image?: string;
  isHost: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
}

interface Consumer {
  id: string;
  producerId: string;
  kind: 'audio' | 'video';
  track: MediaStreamTrack;
  userId: string;
  mediaType?: 'camera' | 'screen';
}

interface Producer {
  id: string;
  kind: 'audio' | 'video';
  track: MediaStreamTrack;
  mediaType?: 'camera' | 'screen';
}

interface MeetingState {
  isActive: boolean;
  hostId?: string;
  hostName?: string;
  participantCount: number;
  startedAt?: Date;
}

export default function StreamingArea({ serverId, channelId }: Props) {
  const { socket } = useSocket();
  const { data: session } = useSession();
  
  // Device and transport refs
  const deviceRef = useRef<Device>();
  const sendTransportRef = useRef<any>();
  const recvTransportRef = useRef<any>();
  
  // Media refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localScreenRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream>();
  const screenStreamRef = useRef<MediaStream>();
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  
  // State management
  const [isJoined, setIsJoined] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [audioLevel, setAudioLevel] = useState(50);
  
  const [meetingState, setMeetingState] = useState<MeetingState>({
    isActive: false,
    participantCount: 0
  });
  
  const [streamingUsers, setStreamingUsers] = useState<StreamingUser[]>([]);
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  const isJoinedRef = useRef(isJoined);
  useEffect(() => { isJoinedRef.current = isJoined; }, [isJoined]);

  // Check if current user is host
  const isHost = meetingState.hostId === session?.user?.id;
  const canStartMeeting = !meetingState.isActive;

  // Initialize device
  const setupDevice = useCallback(async () => {
    try {
      if (deviceRef.current) return deviceRef.current;

      const response = await new Promise<any>((resolve, reject) => {
        socket?.emit('getRouterRtpCapabilities', { channelId }, (res: any) => {
          if (res.error) reject(new Error(res.error));
          else resolve(res);
        });
      });

      const device = new Device();
      await device.load({ routerRtpCapabilities: response.rtpCapabilities });
      deviceRef.current = device;
      
      console.log('Device setup completed');
      return device;
    } catch (error) {
      console.error('Error setting up device:', error);
      toast.error('Failed to setup media device');
      throw error;
    }
  }, [channelId, socket]);

  // Create transport
  const createTransport = useCallback(async (direction: 'send' | 'recv') => {
    try {
      const transportParams = await new Promise<any>((resolve, reject) => {
        socket?.emit('createWebRtcTransport', { channelId, direction }, (res: any) => {
          if (res.error) reject(new Error(res.error));
          else resolve(res);
        });
      });

      const device = deviceRef.current!;
      const transport = direction === 'send' 
        ? device.createSendTransport(transportParams)
        : device.createRecvTransport(transportParams);

      // Handle transport events
      transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          await new Promise<void>((resolve, reject) => {
            socket?.emit('connectTransport', {
              transportId: transport.id,
              dtlsParameters
            }, (res: any) => {
              if (res.error) reject(new Error(res.error));
              else resolve();
            });
          });
          callback();
        } catch (error) {
          errback(error as Error);
        }
      });

      if (direction === 'send') {
        transport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
          try {
            const response = await new Promise<any>((resolve, reject) => {
              socket?.emit('produce', {
                channelId,
                transportId: transport.id,
                kind,
                rtpParameters,
                appData
              }, (res: any) => {
                if (res.error) reject(new Error(res.error));
                else resolve(res);
              });
            });
            callback({ id: response.id });
          } catch (error) {
            errback(error as Error);
          }
        });
        sendTransportRef.current = transport;
      } else {
        recvTransportRef.current = transport;
      }

      console.log(`${direction} transport created:`, transport.id);
      return transport;
    } catch (error) {
      console.error(`Error creating ${direction} transport:`, error);
      throw error;
    }
  }, [channelId, socket]);

  // Start meeting (host only)
  const startMeeting = useCallback(async () => {
    try {
      console.log('Starting meeting...');
      
      await setupDevice();
      await createTransport('send');

      // Get user media with proper constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isCameraOn ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        } : false,
        audio: isMicOn ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      });

      localStreamRef.current = stream;
      
      // Set local video immediately
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('Local video set');
      }

      // Produce video track
      if (isCameraOn && stream.getVideoTracks().length > 0) {
        const videoProducer = await sendTransportRef.current.produce({
          track: stream.getVideoTracks()[0],
          encodings: [
            { maxBitrate: 100000, scaleResolutionDownBy: 4 },
            { maxBitrate: 300000, scaleResolutionDownBy: 2 },
            { maxBitrate: 900000 }
          ],
          codecOptions: {
            videoGoogleStartBitrate: 1000
          },
          appData: { mediaType: 'camera', userId: session?.user?.id }
        });

        setProducers(prev => [...prev, {
          id: videoProducer.id,
          kind: 'video',
          track: stream.getVideoTracks()[0],
          mediaType: 'camera'
        }]);
        
        console.log('Video producer created:', videoProducer.id);
      }

      // Produce audio track
      if (isMicOn && stream.getAudioTracks().length > 0) {
        const audioProducer = await sendTransportRef.current.produce({
          track: stream.getAudioTracks()[0],
          codecOptions: {
            opusStereo: 1,
            opusDtx: 1
          },
          appData: { mediaType: 'camera', userId: session?.user?.id }
        });

        setProducers(prev => [...prev, {
          id: audioProducer.id,
          kind: 'audio', 
          track: stream.getAudioTracks()[0],
          mediaType: 'camera'
        }]);
        
        console.log('Audio producer created:', audioProducer.id);
      }

      // Notify server about meeting start
      socket?.emit('meeting-started', {
        channelId,
        hostId: session?.user?.id,
        hostName: session?.user?.name
      });

      setIsStreaming(true);
      setIsJoined(true);
      toast.success('Meeting started successfully');

    } catch (error) {
      console.error('Error starting meeting:', error);
      toast.error('Failed to start meeting: ' + (error as Error).message);
    }
  }, [channelId, socket, session, setupDevice, createTransport, isCameraOn, isMicOn]);

  // Join meeting (participants)
  const joinMeeting = useCallback(async () => {
    try {
      console.log('Joining meeting...');
      
      await setupDevice();
      await createTransport('send');
      await createTransport('recv');

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isCameraOn ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        } : false,
        audio: isMicOn ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      });

      localStreamRef.current = stream;
      
      // Set local video immediately
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('Local video set for participant');
      }

      // Produce tracks if enabled
      if (isCameraOn && stream.getVideoTracks().length > 0) {
        const videoProducer = await sendTransportRef.current.produce({
          track: stream.getVideoTracks()[0],
          appData: { mediaType: 'camera', userId: session?.user?.id }
        });
        
        setProducers(prev => [...prev, {
          id: videoProducer.id,
          kind: 'video',
          track: stream.getVideoTracks()[0],
          mediaType: 'camera'
        }]);
        
        console.log('Participant video producer created:', videoProducer.id);
      }

      if (isMicOn && stream.getAudioTracks().length > 0) {
        const audioProducer = await sendTransportRef.current.produce({
          track: stream.getAudioTracks()[0],
          appData: { mediaType: 'camera', userId: session?.user?.id }
        });
        
        setProducers(prev => [...prev, {
          id: audioProducer.id,
          kind: 'audio',
          track: stream.getAudioTracks()[0],
          mediaType: 'camera'
        }]);
        
        console.log('Participant audio producer created:', audioProducer.id);
      }

      // Notify server about joining
      socket?.emit('meeting-joined', {
        channelId,
        userId: session?.user?.id,
        userName: session?.user?.name
      });

      setIsJoined(true);
      toast.success('Joined meeting successfully');

    } catch (error) {
      console.error('Error joining meeting:', error);
      toast.error('Failed to join meeting: ' + (error as Error).message);
    }
  }, [channelId, socket, session, setupDevice, createTransport, isCameraOn, isMicOn]);

  // Create and handle consumers for remote streams
  const createConsumer = useCallback(async (producerData: {
    producerId: string;
    producerUserId: string;
    producerUserName: string;
    kind: 'audio' | 'video';
    mediaType?: 'camera' | 'screen';
  }) => {
    try {
      if (producerData.producerUserId === session?.user?.id) {
        console.log('Ignoring own producer');
        return;
      }

      if (!recvTransportRef.current) {
        console.log('Creating recv transport for consumer');
        await createTransport('recv');
      }

      if (!deviceRef.current) {
        console.log('Device not ready for consuming');
        return;
      }

      console.log('Creating consumer for producer:', producerData.producerId);

      // Request to consume
      const response = await new Promise<any>((resolve, reject) => {
        socket?.emit('consume', {
          channelId,
          producerId: producerData.producerId,
          rtpCapabilities: deviceRef.current!.rtpCapabilities
        }, (res: any) => {
          if (res.error) {
            console.error('Consume error:', res.error);
            reject(new Error(res.error));
          } else {
            resolve(res);
          }
        });
      });

      const consumer = await recvTransportRef.current.consume({
        id: response.id,
        producerId: producerData.producerId,
        kind: response.kind,
        rtpParameters: response.rtpParameters
      });

      console.log('Consumer created:', consumer.id, 'kind:', consumer.kind);

      // Resume consumer
      socket?.emit('resumeConsumer', { consumerId: consumer.id }, (res: any) => {
        if (res.error) {
          console.error('Resume consumer error:', res.error);
        } else {
          console.log('Consumer resumed:', consumer.id);
        }
      });

      // Create or update media stream
      const streamKey = `${producerData.producerUserId}-${producerData.mediaType || 'camera'}`;
      
      setRemoteStreams(prevStreams => {
        const newStreams = new Map(prevStreams);
        let existingStream = newStreams.get(streamKey);
        
        if (!existingStream) {
          existingStream = new MediaStream();
          newStreams.set(streamKey, existingStream);
        }
        
        // Add track to stream
        existingStream.addTrack(consumer.track);
        
        console.log(`Added ${consumer.kind} track to stream for user:`, producerData.producerUserId);
        
        return newStreams;
      });

      // Store consumer
      setConsumers(prev => [...prev, {
        id: consumer.id,
        producerId: producerData.producerId,
        kind: producerData.kind,
        track: consumer.track,
        userId: producerData.producerUserId,
        mediaType: producerData.mediaType || 'camera'
      }]);

    } catch (error) {
      console.error('Error creating consumer:', error);
    }
  }, [socket, channelId, session, createTransport]);

  // Leave meeting
  const leaveMeeting = useCallback(async () => {
    try {
      // Stop all tracks
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());

      // Close transports
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();
      sendTransportRef.current = null;
      recvTransportRef.current = null;

      // Clear refs
      localStreamRef.current = undefined;
      screenStreamRef.current = undefined;

      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (localScreenRef.current) localScreenRef.current.srcObject = null;

      // Notify server
      if (isHost) {
        socket?.emit('meeting-ended', { channelId });
      } else {
        socket?.emit('meeting-left', { channelId, userId: session?.user?.id });
      }

      // Reset states
      setIsJoined(false);
      setIsStreaming(false);
      setIsScreenSharing(false);
      setConsumers([]);
      setProducers([]);
      setRemoteStreams(new Map());

      toast.success(isHost ? 'Meeting ended' : 'Left meeting');

    } catch (error) {
      console.error('Error leaving meeting:', error);
      toast.error('Failed to leave meeting');
    }
  }, [channelId, socket, session, isHost]);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    try {
      if (!localStreamRef.current) return;

      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
        
        socket?.emit('media-state-changed', {
          channelId,
          userId: session?.user?.id,
          isMuted: !audioTrack.enabled
        });
      }
    } catch (error) {
      console.error('Error toggling microphone:', error);
      toast.error('Failed to toggle microphone');
    }
  }, [channelId, socket, session]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    try {
      if (!localStreamRef.current) return;

      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
        
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
  }, [channelId, socket, session]);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        screenStreamRef.current?.getTracks().forEach(track => track.stop());
        screenStreamRef.current = undefined;
        if (localScreenRef.current) {
          localScreenRef.current.srcObject = null;
        }
        setIsScreenSharing(false);
        
        socket?.emit('screen-share-stopped', {
          channelId,
          userId: session?.user?.id
        });
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        screenStreamRef.current = screenStream;
        if (localScreenRef.current) {
          localScreenRef.current.srcObject = screenStream;
        }

        // Produce screen share if we have send transport
        if (sendTransportRef.current) {
          const screenProducer = await sendTransportRef.current.produce({
            track: screenStream.getVideoTracks()[0],
            encodings: [
              { maxBitrate: 1000000 }
            ],
            appData: { mediaType: 'screen', userId: session?.user?.id }
          });

          setProducers(prev => [...prev, {
            id: screenProducer.id,
            kind: 'video',
            track: screenStream.getVideoTracks()[0],
            mediaType: 'screen'
          }]);
        }

        setIsScreenSharing(true);
        
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
  }, [isScreenSharing, channelId, socket, session]);

  // Handle volume change
  const handleVolumeChange = useCallback((volume: number) => {
    setAudioLevel(volume);
    // Apply volume to all audio elements
    document.querySelectorAll('audio, video').forEach((element) => {
      const mediaElement = element as HTMLAudioElement | HTMLVideoElement;
      if (!mediaElement.muted) { // Don't change volume for muted elements (local video)
        mediaElement.volume = volume / 100;
      }
    });
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Meeting state events
    socket.on('meeting-state-updated', (data: MeetingState) => {
      setMeetingState(data);
    });

    socket.on('user-joined-meeting', (data: { userId: string, userName: string }) => {
      setStreamingUsers(prev => [...prev, {
        id: data.userId,
        name: data.userName,
        isHost: false,
        isMuted: false,
        isCameraOff: false,
        isScreenSharing: false
      }]);
    });

    socket.on('user-left-meeting', (data: { userId: string }) => {
      setStreamingUsers(prev => prev.filter(user => user.id !== data.userId));
      // Clean up consumers for this user
      setConsumers(prev => prev.filter(consumer => consumer.userId !== data.userId));
      // Clean up remote streams
      setRemoteStreams(prev => {
        const newStreams = new Map(prev);
        for (const [key] of newStreams) {
          if (key.startsWith(data.userId + '-')) {
            newStreams.delete(key);
          }
        }
        return newStreams;
      });
    });

    socket.on('user-media-state-changed', (data: {
      userId: string,
      isMuted?: boolean,
      isCameraOff?: boolean,
      isScreenSharing?: boolean
    }) => {
      setStreamingUsers(prev => prev.map(user => 
        user.id === data.userId
          ? { 
              ...user,
              ...(data.isMuted !== undefined && { isMuted: data.isMuted }),
              ...(data.isCameraOff !== undefined && { isCameraOff: data.isCameraOff }),
              ...(data.isScreenSharing !== undefined && { isScreenSharing: data.isScreenSharing })
            }
          : user
      ));
    });

    // Producer/Consumer events
    socket.on('newProducer', createConsumer);

    socket.on('meeting-ended', () => {
      setMeetingState({ isActive: false, participantCount: 0 });
      setIsJoined(false);
      setStreamingUsers([]);
      setConsumers([]);
      setProducers([]);
      setRemoteStreams(new Map());
      
      // Clean up local streams
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      localStreamRef.current = undefined;
      screenStreamRef.current = undefined;
      
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (localScreenRef.current) localScreenRef.current.srcObject = null;
      
      toast.success('Meeting ended');
    });

    return () => {
      socket.off('meeting-state-updated');
      socket.off('user-joined-meeting');
      socket.off('user-left-meeting');
      socket.off('user-media-state-changed');
      socket.off('newProducer');
      socket.off('meeting-ended');
    };
  }, [socket, createConsumer]);

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
      if (isJoinedRef.current) {
        leaveMeeting().catch(err => {
          console.error('Error leaving meeting on unmount:', err);
        });
      }
    };
  }, [leaveMeeting]);

  if (!socket) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
        <div>
          <h2 className="text-xl font-bold">Meeting Room</h2>
          {meetingState.isActive && (
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Meeting in progress • Host: {meetingState.hostName} • {meetingState.participantCount} participants
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {canStartMeeting && (
            <button
              onClick={startMeeting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium"
            >
              Start Meeting
            </button>
          )}
          
          {meetingState.isActive && !isJoined && (
            <button
              onClick={joinMeeting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
            >
              Join Meeting
            </button>
          )}

          {isJoined && (
            <button
              onClick={leaveMeeting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium"
            >
              {isHost ? 'End Meeting' : 'Leave Meeting'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {!meetingState.isActive ? (
        // No meeting active
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4">No active meeting</h3>
            <p className="text-gray-400 mb-6">Start a meeting to begin video conferencing with your team.</p>
          </div>
        </div>
      ) : !isJoined ? (
        // Meeting active but not joined
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 mx-auto mb-6 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2">Meeting in progress</h3>
            <p className="text-gray-400 mb-6">
              {meetingState.hostName} started a meeting with {meetingState.participantCount} participants
            </p>
            <button
              onClick={joinMeeting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
            >
              Join Meeting
            </button>
          </div>
        </div>
      ) : (
        // Joined meeting - show video grid
        <div className="flex-1 flex flex-col">
          {/* Video Grid */}
          <div className="flex-1 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
              {/* Local Video */}
              <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                  {session?.user?.name} (You) {isHost && '(Host)'}
                </div>
                <div className="absolute bottom-2 right-2 flex gap-1">
                  {!isMicOn && (
                    <div className="bg-red-500 p-1 rounded">
                      <svg className="w-3 h-3" fill="white" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0 9.972 9.972 0 010 14.142 1 1 0 11-1.414-1.414 7.971 7.971 0 000-11.314 1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {!isCameraOn && (
                    <div className="bg-red-500 p-1 rounded">
                      <svg className="w-3 h-3" fill="white" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13.9V6.1a2 2 0 00-2.93-1.784l-3.523 1.761a.5.5 0 00-.302.461v.618l-1.456-1.456a4 4 0 00-5.644 0L3.707 2.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Screen Share */}
              {isScreenSharing && (
                <div className="relative bg-gray-800 rounded-lg overflow-hidden md:col-span-2">
                  <video
                    ref={localScreenRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                    Your Screen
                  </div>
                </div>
              )}

              {/* Remote Videos */}
              {Array.from(remoteStreams.entries()).map(([key, stream]) => {
                const [userId, mediaType] = key.split('-');
                const user = streamingUsers.find(u => u.id === userId);
                
                return (
                  <div key={key} className={`relative bg-gray-800 rounded-lg overflow-hidden ${
                    mediaType === 'screen' ? 'md:col-span-2' : ''
                  }`}>
                    <video
                      autoPlay
                      playsInline
                      ref={(video) => {
                        if (video && video.srcObject !== stream) {
                          video.srcObject = stream;
                          console.log(`Set video source for ${key}:`, stream);
                        }
                      }}
                      className="w-full h-full object-cover"
                      onLoadedMetadata={() => {
                        console.log(`Video metadata loaded for ${key}`);
                      }}
                      onCanPlay={() => {
                        console.log(`Video can play for ${key}`);
                      }}
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                      {user?.name || 'Unknown'} {mediaType === 'screen' && '(Screen)'}
                    </div>
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      {user?.isMuted && (
                        <div className="bg-red-500 p-1 rounded">
                          <svg className="w-3 h-3" fill="white" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0 9.972 9.972 0 010 14.142 1 1 0 11-1.414-1.414 7.971 7.971 0 000-11.314 1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {user?.isCameraOff && (
                        <div className="bg-red-500 p-1 rounded">
                          <svg className="w-3 h-3" fill="white" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13.9V6.1a2 2 0 00-2.93-1.784l-3.523 1.761a.5.5 0 00-.302.461v.618l-1.456-1.456a4 4 0 00-5.644 0L3.707 2.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gray-800 p-4 border-t border-gray-700">
            <div className="flex items-center justify-center gap-4">
              {/* Microphone */}
              <button
                onClick={toggleMicrophone}
                className={`p-3 rounded-full transition-colors ${
                  isMicOn 
                    ? 'bg-gray-600 hover:bg-gray-500' 
                    : 'bg-red-600 hover:bg-red-500'
                }`}
                title={isMicOn ? 'Mute' : 'Unmute'}
              >
                {isMicOn ? (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>

              {/* Camera */}
              <button
                onClick={toggleCamera}
                className={`p-3 rounded-full transition-colors ${
                  isCameraOn 
                    ? 'bg-gray-600 hover:bg-gray-500' 
                    : 'bg-red-600 hover:bg-red-500'
                }`}
                title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {isCameraOn ? (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
              </button>

              {/* Screen Share */}
              <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-full transition-colors ${
                  isScreenSharing 
                    ? 'bg-blue-600 hover:bg-blue-500' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Volume Control */}
              <div className="flex items-center gap-2 ml-4">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
                </svg>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={audioLevel}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                  className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${audioLevel}%, #374151 ${audioLevel}%, #374151 100%)`
                  }}
                />
                <span className="text-sm text-gray-400 w-8">{audioLevel}%</span>
              </div>

              {/* Participants */}
              <div className="flex items-center gap-2 ml-4 px-3 py-2 bg-gray-700 rounded-lg">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span className="text-sm text-gray-300">{meetingState.participantCount}</span>
              </div>

              {/* Leave Meeting */}
              <button
                onClick={leaveMeeting}
                className="p-3 rounded-full bg-red-600 hover:bg-red-500 ml-4"
                title={isHost ? 'End meeting' : 'Leave meeting'}
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 p-4 rounded text-xs max-w-md max-h-96 overflow-y-auto">
          <div className="text-yellow-400 font-bold mb-2">Debug Info:</div>
          <div>Is Joined: {isJoined ? 'Yes' : 'No'}</div>
          <div>Local Stream: {localStreamRef.current ? 'Yes' : 'No'}</div>
          <div>Send Transport: {sendTransportRef.current ? 'Yes' : 'No'}</div>
          <div>Recv Transport: {recvTransportRef.current ? 'Yes' : 'No'}</div>
          <div>Producers: {producers.length}</div>
          <div>Consumers: {consumers.length}</div>
          <div>Remote Streams: {remoteStreams.size}</div>
          <div>Streaming Users: {streamingUsers.length}</div>
          
          {/* Local Stream Details */}
          {localStreamRef.current && (
            <div className="mt-2 p-2 bg-blue-900 rounded">
              <div className="text-blue-400 font-bold">Local Stream:</div>
              <div>ID: {localStreamRef.current.id}</div>
              <div>Video Tracks: {localStreamRef.current.getVideoTracks().length}</div>
              <div>Audio Tracks: {localStreamRef.current.getAudioTracks().length}</div>
              {localStreamRef.current.getVideoTracks().map((track, i) => (
                <div key={i} className="ml-2">
                  V{i}: {track.enabled ? '✓' : '✗'} {track.readyState} {track.label}
                </div>
              ))}
            </div>
          )}
          
          {/* Producers Details */}
          <div className="mt-2 p-2 bg-green-900 rounded">
            <div className="text-green-400 font-bold">Producers:</div>
            {producers.map((producer, i) => (
              <div key={producer.id} className="ml-2">
                {i}: {producer.kind} ({producer.mediaType}) - {producer.track.readyState}
              </div>
            ))}
          </div>
          
          {/* Consumers Details */}
          <div className="mt-2 p-2 bg-purple-900 rounded">
            <div className="text-purple-400 font-bold">Consumers:</div>
            {consumers.map((consumer, i) => (
              <div key={consumer.id} className="ml-2">
                {i}: {consumer.kind} from {consumer.userId} ({consumer.mediaType})
                <br/>Track: {consumer.track.readyState} - {consumer.track.enabled ? '✓' : '✗'}
              </div>
            ))}
          </div>
          
          {/* Remote Streams Details */}
          <div className="mt-2 p-2 bg-orange-900 rounded">
            <div className="text-orange-400 font-bold">Remote Streams:</div>
            {Array.from(remoteStreams.entries()).map(([key, stream]) => (
              <div key={key} className="ml-2">
                {key}: 
                <br/>ID: {stream.id}
                <br/>Video: {stream.getVideoTracks().length} Audio: {stream.getAudioTracks().length}
                {stream.getVideoTracks().map((track, i) => (
                  <div key={i} className="ml-4">
                    V{i}: {track.enabled ? '✓' : '✗'} {track.readyState}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}