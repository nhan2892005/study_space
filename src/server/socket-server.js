// server/socket-server.js
const { createServer } = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const mediasoupService = require('./mediasoup-service');

const prisma = new PrismaClient();

// Create HTTP server
const httpServer = createServer();

// Create Socket.IO server with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL || "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store active connections and meeting states
const activeConnections = new Map();
const channelMeetings = new Map(); // channelId -> meeting state
const channelProducers = new Map(); // channelId -> Map(socketId -> producers[])

// Initialize mediasoup workers
mediasoupService.init({ 
  numWorkers: process.env.NODE_ENV === 'production' ? 4 : 1,
  rtcMinPort: 40000,
  rtcMaxPort: 49999
}).catch(err => {
  console.error('Failed to init mediasoup service', err);
});

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user.id;
    socket.userEmail = user.email;
    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket) => {
  console.log(`User ${socket.user.name} connected`);
  
  // Store connection
  activeConnections.set(socket.userId, socket);
  socket.data = { transports: new Map(), producers: new Map(), consumers: new Map() };

  // Join user to all their server rooms
  try {
    const userServers = await prisma.serverMember.findMany({
      where: { userId: socket.userId },
      include: { server: { include: { channels: true } } }
    });

    for (const membership of userServers) {
      const serverId = membership.serverId;
      socket.join(`server:${serverId}`);
      
      for (const channel of membership.server.channels) {
        socket.join(`channel:${channel.id}`);
      }
    }

    console.log(`User ${socket.user.name} joined ${userServers.length} servers`);
  } catch (error) {
    console.error('Error joining user to rooms:', error);
  }

  // ==================== MEETING MANAGEMENT ====================

  // Get current meeting state for a channel
  socket.on('get-meeting-state', (data, callback) => {
    const { channelId } = data;
    const meetingState = channelMeetings.get(channelId) || {
      isActive: false,
      participantCount: 0
    };
    callback(meetingState);
  });

  // Start meeting (host only)
  socket.on('meeting-started', async (data) => {
    try {
      const { channelId, hostId, hostName } = data;
      
      // Check if meeting already active
      if (channelMeetings.has(channelId)) {
        socket.emit('error', { message: 'Meeting already active' });
        return;
      }

      // Verify user has permission to start meeting in this channel
      const membership = await prisma.serverMember.findFirst({
        where: { userId: hostId },
        include: { server: { include: { channels: { where: { id: channelId } } } } }
      });

      if (!membership || membership.server.channels.length === 0) {
        socket.emit('error', { message: 'Not authorized to start meeting' });
        return;
      }

      // Create meeting state
      const meetingState = {
        isActive: true,
        hostId,
        hostName,
        participantCount: 1,
        startedAt: new Date(),
        participants: new Set([hostId])
      };

      channelMeetings.set(channelId, meetingState);
      channelProducers.set(channelId, new Map());

      // Broadcast to all channel members
      io.to(`channel:${channelId}`).emit('meeting-state-updated', {
        isActive: true,
        hostId,
        hostName,
        participantCount: 1,
        startedAt: meetingState.startedAt
      });

      console.log(`Meeting started in channel ${channelId} by ${hostName}`);
    } catch (error) {
      console.error('Error starting meeting:', error);
      socket.emit('error', { message: 'Failed to start meeting' });
    }
  });

  // Join meeting
  socket.on('meeting-joined', async (data) => {
    try {
      const { channelId, userId, userName } = data;
      
      const meetingState = channelMeetings.get(channelId);
      if (!meetingState || !meetingState.isActive) {
        socket.emit('error', { message: 'No active meeting' });
        return;
      }

      // Add participant
      meetingState.participants.add(userId);
      meetingState.participantCount = meetingState.participants.size;

      // Broadcast user joined
      socket.to(`channel:${channelId}`).emit('user-joined-meeting', {
        userId,
        userName
      });

      // Send updated meeting state
      io.to(`channel:${channelId}`).emit('meeting-state-updated', {
        isActive: meetingState.isActive,
        hostId: meetingState.hostId,
        hostName: meetingState.hostName,
        participantCount: meetingState.participantCount,
        startedAt: meetingState.startedAt
      });

      console.log(`User ${userName} joined meeting in channel ${channelId}`);
    } catch (error) {
      console.error('Error joining meeting:', error);
      socket.emit('error', { message: 'Failed to join meeting' });
    }
  });

  // Leave meeting
  socket.on('meeting-left', async (data) => {
    try {
      const { channelId, userId } = data;
      
      const meetingState = channelMeetings.get(channelId);
      if (!meetingState) return;

      // Remove participant
      meetingState.participants.delete(userId);
      meetingState.participantCount = meetingState.participants.size;

      // Clean up user's producers
      const channelProducerMap = channelProducers.get(channelId);
      if (channelProducerMap) {
        channelProducerMap.delete(socket.id);
      }

      // Close user's transports
      if (socket.data.transports) {
        for (const transport of socket.data.transports.values()) {
          transport.close();
        }
        socket.data.transports.clear();
      }

      // Broadcast user left
      socket.to(`channel:${channelId}`).emit('user-left-meeting', { userId });

      // Update meeting state
      io.to(`channel:${channelId}`).emit('meeting-state-updated', {
        isActive: meetingState.isActive,
        hostId: meetingState.hostId,
        hostName: meetingState.hostName,
        participantCount: meetingState.participantCount,
        startedAt: meetingState.startedAt
      });

      console.log(`User ${userId} left meeting in channel ${channelId}`);
    } catch (error) {
      console.error('Error leaving meeting:', error);
    }
  });

  // End meeting (host only)
  socket.on('meeting-ended', async (data) => {
    try {
      const { channelId } = data;
      
      const meetingState = channelMeetings.get(channelId);
      if (!meetingState || meetingState.hostId !== socket.userId) {
        socket.emit('error', { message: 'Not authorized to end meeting' });
        return;
      }

      // Clean up all producers and transports for this channel
      const channelProducerMap = channelProducers.get(channelId);
      if (channelProducerMap) {
        for (const [socketId, producers] of channelProducerMap) {
          const participantSocket = [...activeConnections.values()]
            .find(s => s.id === socketId);
          
          if (participantSocket?.data?.transports) {
            for (const transport of participantSocket.data.transports.values()) {
              transport.close();
            }
            participantSocket.data.transports.clear();
          }
        }
        channelProducerMap.clear();
      }

      // Remove meeting state
      channelMeetings.delete(channelId);
      channelProducers.delete(channelId);

      // Broadcast meeting ended
      io.to(`channel:${channelId}`).emit('meeting-state-updated', {
        isActive: false,
        participantCount: 0
      });

      io.to(`channel:${channelId}`).emit('meeting-ended', {
        hostId: meetingState.hostId
      });

      console.log(`Meeting ended in channel ${channelId}`);
    } catch (error) {
      console.error('Error ending meeting:', error);
      socket.emit('error', { message: 'Failed to end meeting' });
    }
  });

  // Media state changes (mute/unmute, camera on/off)
  socket.on('media-state-changed', (data) => {
    const { channelId, userId, isMuted, isCameraOff, isScreenSharing } = data;
    
    socket.to(`channel:${channelId}`).emit('user-media-state-changed', {
      userId,
      isMuted,
      isCameraOff,
      isScreenSharing
    });
  });

  // Screen sharing events
  socket.on('screen-share-started', (data) => {
    const { channelId, userId } = data;
    socket.to(`channel:${channelId}`).emit('user-media-state-changed', {
      userId,
      isScreenSharing: true
    });
  });

  socket.on('screen-share-stopped', (data) => {
    const { channelId, userId } = data;
    socket.to(`channel:${channelId}`).emit('user-media-state-changed', {
      userId,
      isScreenSharing: false
    });
  });

  // ==================== MEDIASOUP SIGNALING ====================

  socket.on('getRouterRtpCapabilities', async ({ channelId }, callback) => {
    try {
      const router = await mediasoupService.getOrCreateRouter(channelId);
      callback({ rtpCapabilities: router.rtpCapabilities });
    } catch (err) {
      console.error('getRouterRtpCapabilities error', err);
      callback({ error: err.message });
    }
  });

  socket.on('createWebRtcTransport', async ({ channelId, direction }, callback) => {
    try {
      const router = await mediasoupService.getOrCreateRouter(channelId);
      const { transport, params } = await mediasoupService.createWebRtcTransport(router);

      // Store transport
      socket.data.transports.set(params.id, transport);

      callback(params);
    } catch (err) {
      console.error('createWebRtcTransport error', err);
      callback({ error: err.message });
    }
  });

  socket.on('connectTransport', async ({ transportId, dtlsParameters }, callback) => {
    try {
      const transport = socket.data.transports.get(transportId);
      if (!transport) throw new Error('Transport not found');

      await mediasoupService.connectTransport(transport, dtlsParameters);
      callback({ ok: true });
    } catch (err) {
      console.error('connectTransport error', err);
      callback({ error: err.message });
    }
  });

  socket.on('produce', async ({ channelId, transportId, kind, rtpParameters, appData }, callback) => {
    try {
      const transport = socket.data.transports.get(transportId);
      if (!transport) throw new Error('Transport not found');

      const producer = await transport.produce({
        kind,
        rtpParameters,
        appData: { ...appData, userId: socket.userId, userName: socket.user.name }
      });

      // Store producer
      socket.data.producers.set(producer.id, producer);

      // Store in channel producers map
      let channelProducerMap = channelProducers.get(channelId);
      if (!channelProducerMap) {
        channelProducerMap = new Map();
        channelProducers.set(channelId, channelProducerMap);
      }
      
      if (!channelProducerMap.has(socket.id)) {
        channelProducerMap.set(socket.id, []);
      }
      channelProducerMap.get(socket.id).push(producer);

      // Notify other participants
      socket.to(`channel:${channelId}`).emit('newProducer', {
        producerId: producer.id,
        producerUserId: socket.userId,
        producerUserName: socket.user.name,
        kind: producer.kind,
        mediaType: appData?.mediaType || 'camera'
      });

      callback({ id: producer.id });
    } catch (err) {
      console.error('produce error', err);
      callback({ error: err.message });
    }
  });

  socket.on('consume', async ({ channelId, producerId, rtpCapabilities }, callback) => {
    try {
      const router = await mediasoupService.getOrCreateRouter(channelId);
      
      // Check if we can consume
      const canConsume = await mediasoupService.canConsume(router, producerId, rtpCapabilities);
      if (!canConsume) {
        callback({ error: 'Cannot consume this producer' });
        return;
      }

      // Find a recv transport or create one
      let recvTransport = null;
      for (const [id, transport] of socket.data.transports) {
        if (transport.constructor.name === 'WebRtcTransport' && !transport.closed) {
          // Check if this transport can be used for receiving
          try {
            // Try to consume on this transport
            recvTransport = transport;
            break;
          } catch (e) {
            // This transport might be send-only, continue looking
            continue;
          }
        }
      }

      // If no suitable transport found, create a new one
      if (!recvTransport) {
        const { transport, params } = await mediasoupService.createWebRtcTransport(router);
        socket.data.transports.set(params.id, transport);
        recvTransport = transport;
      }

      // Create consumer
      const consumer = await mediasoupService.createConsumer(recvTransport, producerId, rtpCapabilities);
      
      // Store consumer
      socket.data.consumers.set(consumer.id, consumer);

      callback({
        id: consumer.id,
        producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters
      });
    } catch (err) {
      console.error('consume error', err);
      callback({ error: err.message });
    }
  });

  socket.on('resumeConsumer', async ({ consumerId }, callback) => {
    try {
      const consumer = socket.data.consumers.get(consumerId);
      if (!consumer) throw new Error('Consumer not found');
      
      await consumer.resume();
      callback({ ok: true });
    } catch (err) {
      console.error('resumeConsumer error', err);
      callback({ error: err.message });
    }
  });

  // ==================== REGULAR CHAT MESSAGES ====================

  // Handle joining specific channel
  socket.on('join-channel', async (data) => {
    try {
      const { channelId, serverId } = data;

      // Verify user has access to this channel
      const membership = await prisma.serverMember.findFirst({
        where: { serverId: serverId, userId: socket.userId }
      });

      if (!membership) {
        socket.emit('error', { message: 'Not authorized to join this channel' });
        return;
      }

      socket.join(`channel:${channelId}`);
      console.log(`User ${socket.user.name} joined channel ${channelId}`);
      socket.emit('channel-joined', { channelId });
    } catch (error) {
      console.error('Error joining channel:', error);
      socket.emit('error', { message: 'Failed to join channel' });
    }
  });

  socket.on('leave-channel', (data) => {
    const { channelId } = data;
    socket.leave(`channel:${channelId}`);
    console.log(`User ${socket.user.name} left channel ${channelId}`);
  });

  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      const { channelId, serverId, content, files = [] } = data;

      // Verify user can send message to this channel
      const membership = await prisma.serverMember.findFirst({
        where: { serverId: serverId, userId: socket.userId }
      });

      if (!membership) {
        socket.emit('error', { message: 'Not authorized to send message' });
        return;
      }

      // Create message in database
      const message = await prisma.message.create({
        data: {
          content: content || (files.length > 0 ? 'Shared files' : ''),
          authorId: socket.userId,
          channelId: channelId,
          files: {
            create: files.map(file => ({
              name: file.name,
              url: file.url,
              type: file.type,
              size: file.size
            }))
          }
        },
        include: {
          author: { select: { name: true } },
          files: true
        }
      });

      // Format message for broadcasting
      const formattedMessage = {
        id: message.id,
        content: message.content,
        type: message.type,
        author: {
          name: message.author.name || 'Unknown User',
          image: message.author.image || `https://api.dicebear.com/9.x/icons/svg?seed=${message.author.name}`
        },
        files: message.files,
        timestamp: message.createdAt
      };

      // Broadcast to all users in the channel
      io.to(`channel:${channelId}`).emit('new-message', formattedMessage);
      console.log(`Message sent to channel ${channelId} by ${socket.user.name}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle user typing indicators
  socket.on('typing-start', (data) => {
    const { channelId } = data;
    socket.to(`channel:${channelId}`).emit('user-typing', {
      userId: socket.userId,
      userName: socket.user.name,
      channelId
    });
  });

  socket.on('typing-stop', (data) => {
    const { channelId } = data;
    socket.to(`channel:${channelId}`).emit('user-stopped-typing', {
      userId: socket.userId,
      channelId
    });
  });

  // ==================== SERVER/CHANNEL MANAGEMENT ====================

  // Handle server creation
  socket.on('server-created', async (data) => {
    try {
      const { serverId } = data;
      
      socket.join(`server:${serverId}`);
      
      const channels = await prisma.channel.findMany({
        where: { serverId }
      });
      
      for (const channel of channels) {
        socket.join(`channel:${channel.id}`);
      }

      console.log(`User ${socket.user.name} joined new server ${serverId}`);
    } catch (error) {
      console.error('Error handling server creation:', error);
    }
  });

  // Handle channel creation
  socket.on('channel-created', async (data) => {
    try {
      const { channelId, serverId } = data;

      const serverMembers = await prisma.serverMember.findMany({
        where: { serverId },
        select: { userId: true }
      });

      // Join all active server members to the new channel room
      for (const member of serverMembers) {
        const memberSocket = activeConnections.get(member.userId);
        if (memberSocket) {
          memberSocket.join(`channel:${channelId}`);
        }
      }

      // Broadcast new channel to server members
      io.to(`server:${serverId}`).emit('new-channel', {
        channelId,
        serverId
      });

      console.log(`Channel ${channelId} created in server ${serverId}`);
    } catch (error) {
      console.error('Error handling channel creation:', error);
    }
  });

  // Handle member invitation accepted
  socket.on('member-joined', async (data) => {
    try {
      const { serverId, userId } = data;

      const memberSocket = activeConnections.get(userId);
      
      if (memberSocket) {
        memberSocket.join(`server:${serverId}`);
        
        const channels = await prisma.channel.findMany({
          where: { serverId }
        });
        
        for (const channel of channels) {
          memberSocket.join(`channel:${channel.id}`);
        }
      }

      // Broadcast to server about new member
      io.to(`server:${serverId}`).emit('member-joined', {
        serverId,
        userId
      });

      console.log(`User ${userId} joined server ${serverId}`);
    } catch (error) {
      console.error('Error handling member join:', error);
    }
  });

  // ==================== DISCONNECT HANDLING ====================

  socket.on('disconnect', async () => {
    console.log(`User ${socket.user.name} disconnected`);
    
    try {
      // Clean up meeting participation
      for (const [channelId, meetingState] of channelMeetings) {
        if (meetingState.participants && meetingState.participants.has(socket.userId)) {
          meetingState.participants.delete(socket.userId);
          meetingState.participantCount = meetingState.participants.size;
          
          // If host disconnected, end the meeting
          if (meetingState.hostId === socket.userId) {
            // Clean up all producers and transports for this channel
            const channelProducerMap = channelProducers.get(channelId);
            if (channelProducerMap) {
              for (const [socketId, producers] of channelProducerMap) {
                const participantSocket = [...activeConnections.values()]
                  .find(s => s.id === socketId);
                
                if (participantSocket?.data?.transports) {
                  for (const transport of participantSocket.data.transports.values()) {
                    transport.close();
                  }
                  participantSocket.data.transports.clear();
                }
              }
              channelProducerMap.clear();
            }
            
            channelMeetings.delete(channelId);
            channelProducers.delete(channelId);
            
            // Notify all participants
            io.to(`channel:${channelId}`).emit('meeting-ended', {
              reason: 'Host disconnected'
            });
            
            io.to(`channel:${channelId}`).emit('meeting-state-updated', {
              isActive: false,
              participantCount: 0
            });
          } else {
            // Regular participant left
            socket.to(`channel:${channelId}`).emit('user-left-meeting', {
              userId: socket.userId
            });
            
            // Update meeting state
            io.to(`channel:${channelId}`).emit('meeting-state-updated', {
              isActive: meetingState.isActive,
              hostId: meetingState.hostId,
              hostName: meetingState.hostName,
              participantCount: meetingState.participantCount,
              startedAt: meetingState.startedAt
            });
          }
        }
      }
      
      // Close all transports
      if (socket.data.transports) {
        for (const transport of socket.data.transports.values()) {
          transport.close();
        }
        socket.data.transports.clear();
      }
      
      // Clean up producers from channel maps
      for (const [channelId, producerMap] of channelProducers) {
        if (producerMap.has(socket.id)) {
          producerMap.delete(socket.id);
          if (producerMap.size === 0) {
            channelProducers.delete(channelId);
          }
        }
      }
      
    } catch (error) {
      console.error('Error during disconnect cleanup:', error);
    }
    
    // Remove from active connections
    activeConnections.delete(socket.userId);
  });
});

// ==================== SERVER STARTUP ====================

const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
  console.log(`Mediasoup workers initialized`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down socket server...');
  
  // Close all meetings
  for (const [channelId] of channelMeetings) {
    channelMeetings.delete(channelId);
    channelProducers.delete(channelId);
  }
  
  // Close all transports
  for (const socket of activeConnections.values()) {
    if (socket.data?.transports) {
      for (const transport of socket.data.transports.values()) {
        transport.close();
      }
    }
  }
  
  // Cleanup mediasoup
  await mediasoupService.cleanup();
  
  await prisma.$disconnect();
  httpServer.close();
});

process.on('SIGINT', async () => {
  console.log('Shutting down socket server...');
  
  // Cleanup mediasoup
  await mediasoupService.cleanup();
  
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = { io, httpServer };