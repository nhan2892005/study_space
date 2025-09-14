import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Device } from 'mediasoup-client';
import { useSocket } from '@/contexts/SocketContext';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface Props {
  serverId: string;
  channelId: string;
}

interface Producer {
  id: string;
  kind: 'audio' | 'video';
}

interface Consumer {
  id: string;
  producerId: string;
  kind: 'audio' | 'video';
  track: MediaStreamTrack;
}

export default function StreamingArea({ serverId, channelId }: Props) {
  const { socket, getRouterRtpCapabilities, createWebRtcTransport, connectTransport, produce, consume, resumeConsumer } = useSocket();
  const { data: session } = useSession();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const deviceRef = useRef<Device>();
  const sendTransportRef = useRef<any>();
  const recvTransportRef = useRef<any>();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localScreenRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<HTMLDivElement>(null);

  const setupDevice = useCallback(async () => {
    try {
        const res = getRouterRtpCapabilities
          ? await getRouterRtpCapabilities(channelId)
          : await new Promise<any>((resolve, reject) => {
              socket?.emit('getRouterRtpCapabilities', { channelId }, resolve);
            });

        const { rtpCapabilities } = res;

      const device = new Device();
      await device.load({ routerRtpCapabilities: rtpCapabilities });
      deviceRef.current = device;
    } catch (error) {
      console.error('Error setting up device:', error);
      toast.error('Failed to setup streaming');
    }
  }, [channelId, socket]);

  const createSendTransport = useCallback(async () => {
    if (!deviceRef.current?.canProduce('video')) {
      throw new Error('Device cannot produce video');
    }

    const transportParams = createWebRtcTransport
      ? await createWebRtcTransport(channelId)
      : await new Promise<any>((resolve, reject) => {
          socket?.emit('createWebRtcTransport', { channelId }, resolve);
        });

    const { id, iceParameters, iceCandidates, dtlsParameters } = transportParams;

    const transport = deviceRef.current.createSendTransport({
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
    });

    transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        if (connectTransport) {
          await connectTransport(transport.id, dtlsParameters);
        } else {
          await new Promise<void>((resolve, reject) => {
            socket?.emit('connectTransport', { transportId: transport.id, dtlsParameters }, (res: any) => {
              if (res?.error) reject(new Error(res.error));
              else resolve();
            });
          });
        }
        callback();
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        errback(err);
      }
    });

    transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
      try {
        const res = produce
          ? await produce({ channelId, transportId: transport.id, kind, rtpParameters })
          : await new Promise<any>((resolve, reject) => {
              socket?.emit('produce', { channelId, transportId: transport.id, kind, rtpParameters }, resolve);
            });

        const { id } = res;
        callback({ id });
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        errback(err);
      }
    });

    sendTransportRef.current = transport;
  }, [channelId, socket]);

  const startStream = useCallback(async () => {
    try {
      if (!deviceRef.current || !sendTransportRef.current) {
        await setupDevice();
        await createSendTransport();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Produce video
      await sendTransportRef.current.produce({
        track: stream.getVideoTracks()[0],
        encodings: [
          { maxBitrate: 100000 },
          { maxBitrate: 300000 },
          { maxBitrate: 900000 },
        ],
        codecOptions: {
          videoGoogleStartBitrate: 1000
        }
      });

      // Produce audio
      await sendTransportRef.current.produce({
        track: stream.getAudioTracks()[0],
        codecOptions: {
          opusStereo: 1,
          opusDtx: 1
        }
      });

      socket?.emit('streamStarted', { channelId });
      setIsStreaming(true);
      // we are now effectively 'in' the live area as a streamer
      setIsJoined(true);
    } catch (error) {
      console.error('Error starting stream:', error);
      toast.error('Failed to start stream');
    }
  }, [channelId, socket, setupDevice, createSendTransport]);

  const stopStream = useCallback(async () => {
    try {
      // Close all tracks
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (localScreenRef.current?.srcObject) {
        const stream = localScreenRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      // Close transport
      sendTransportRef.current?.close();
      sendTransportRef.current = null;

      socket?.emit('streamStopped', { channelId });
      setIsStreaming(false);
      setIsScreenSharing(false);
    } catch (error) {
      console.error('Error stopping stream:', error);
      toast.error('Failed to stop stream');
    }
  }, [channelId, socket]);

  const joinStream = useCallback(async () => {
    try {
      if (!deviceRef.current) {
        await setupDevice();
      }

      setIsJoined(true);
    } catch (error) {
      console.error('Error joining stream:', error);
      toast.error('Failed to join stream');
    }
  }, [setupDevice]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        if (localScreenRef.current?.srcObject) {
          const stream = localScreenRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
        setIsScreenSharing(false);
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      if (localScreenRef.current) {
        localScreenRef.current.srcObject = stream;
      }

      // Produce screen share
      await sendTransportRef.current.produce({
        track: stream.getVideoTracks()[0],
        encodings: [
          { maxBitrate: 100000 },
          { maxBitrate: 300000 },
          { maxBitrate: 900000 },
        ],
        codecOptions: {
          videoGoogleStartBitrate: 1000
        },
        appData: { mediaType: 'screen' }
      });

      setIsScreenSharing(true);

      // Handle stop sharing
      stream.getVideoTracks()[0].onended = () => {
        toggleScreenShare();
      };
    } catch (error) {
      console.error('Error toggling screen share:', error);
      toast.error('Failed to share screen');
    }
  }, [isScreenSharing]);

  useEffect(() => {
    // Listen for new producers
    socket?.on('newProducer', async ({ producerId, producerPeerId, producerPeerSocketId }) => {
      // ignore our own producer (match by socketId)
      if (producerPeerSocketId === socket.id || !deviceRef.current) return;

      try {
        if (!recvTransportRef.current) {
              const transportParams = createWebRtcTransport
                ? await createWebRtcTransport(channelId)
                : await new Promise<any>((resolve, reject) => {
                    socket?.emit('createWebRtcTransport', { channelId }, resolve);
                  });

              const { id, iceParameters, iceCandidates, dtlsParameters } = transportParams;

          const transport = deviceRef.current.createRecvTransport({
            id,
            iceParameters,
            iceCandidates,
            dtlsParameters,
          });

          transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
              await new Promise<void>((resolve, reject) => {
                socket?.emit('connectTransport', {
                  transportId: transport.id,
                  dtlsParameters,
                }, (res: any) => {
                  if (res?.error) reject(new Error(res.error));
                  else resolve();
                });
              });
              callback();
            } catch (e) {
              const err = e instanceof Error ? e : new Error(String(e));
              errback(err);
            }
          });

          recvTransportRef.current = transport;
        }

        // Start consuming the producer - tell server which recv transport we created
        const consumeRes = consume
          ? await consume({ channelId, producerId, transportId: recvTransportRef.current.id, rtpCapabilities: deviceRef.current?.rtpCapabilities })
          : await new Promise<any>((resolve, reject) => {
              socket?.emit('consume', { channelId, producerId, transportId: recvTransportRef.current.id, rtpCapabilities: deviceRef.current?.rtpCapabilities }, resolve);
            });
        if (!consumeRes || consumeRes.error) {
          console.error('consume response error', consumeRes);
          return;
        }

        const { id, kind, rtpParameters } = consumeRes;

        const consumer = await recvTransportRef.current.consume({
          id,
          producerId,
          kind,
          rtpParameters,
        });

        // Create new video element for the consumer
        const video = document.createElement('video');
        video.id = `consumer-${consumer.id}`;
        video.autoplay = true;
        video.playsInline = true;
        const stream = new MediaStream([consumer.track]);
        video.srcObject = stream;
        remoteVideosRef.current?.appendChild(video);

        // Attempt to play the video. Browsers may block autoplay; calling play() helps
        // and will throw if blocked — log for debugging.
        try {
          await video.play();
          console.log('Playing remote consumer video', consumer.id);
        } catch (playErr) {
          console.warn('Autoplay blocked for consumer video', consumer.id, playErr);
        }

        // Resume the consumer
        if (resumeConsumer) await resumeConsumer(consumer.id);
        else socket?.emit('resumeConsumer', { consumerId: consumer.id });

        setConsumers(prev => [...prev, { 
          id: consumer.id, 
          producerId, 
          kind: consumer.kind, 
          track: consumer.track 
        }]);
      } catch (error) {
        console.error('Error consuming new producer:', error);
      }
    });

    return () => {
      socket?.off('newProducer');
    };
  }, [channelId, socket]);

  useEffect(() => {
    return () => {
      if (isStreaming) {
        stopStream();
      }
    };
  }, [isStreaming, stopStream]);

  if (!socket) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Live Stream</h2>
        <div className="flex gap-2">
          {!isStreaming && (
            <>
              <button
                onClick={startStream}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Start Stream
              </button>
              {!isJoined && (
                <button
                  onClick={joinStream}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
                >
                  Join Stream
                </button>
              )}
            </>
          )}
          {isStreaming && (
            <>
              <button
                onClick={toggleScreenShare}
                className={`px-4 py-2 ${
                  isScreenSharing 
                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } rounded`}
              >
                {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
              </button>
              <button
                onClick={stopStream}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
              >
                End Stream
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-grow">
        <div className="space-y-4">
          {(isStreaming || isJoined) && (
            <>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full bg-gray-800 rounded"
              />
              {isScreenSharing && (
                <video
                  ref={localScreenRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full bg-gray-800 rounded"
                />
              )}
            </>
          )}
        </div>
        <div ref={remoteVideosRef} className="grid grid-cols-2 gap-4" />
      </div>
    </div>
  );
}