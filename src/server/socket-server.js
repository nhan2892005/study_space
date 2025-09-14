// src/server/socket-server.js
const { createServer } = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

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

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    // Verify JWT token (you'll need to implement JWT creation in your auth)
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true
      }
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

// Store active connections by user
const activeConnections = new Map();

// Mediasoup service
const mediasoupService = require('./mediasoup-service');

// Initialize mediasoup workers (async fire-and-forget)
mediasoupService.init({ numWorkers: 1 }).catch(err => {
  console.error('Failed to init mediasoup service', err);
});

io.on('connection', async (socket) => {
  console.log(`User ${socket.user.name} connected`);
  
  // Store connection
  activeConnections.set(socket.userId, socket);

  // Join user to all their server rooms
  try {
    const userServers = await prisma.serverMember.findMany({
      where: { userId: socket.userId },
      include: {
        server: {
          include: {
            channels: true
          }
        }
      }
    });

    // Join server rooms and channel rooms
    for (const membership of userServers) {
      const serverId = membership.serverId;
      
      // Join server room for server-wide events
      socket.join(`server:${serverId}`);
      
      // Join all channel rooms in this server
      for (const channel of membership.server.channels) {
        socket.join(`channel:${channel.id}`);
      }
    }

    console.log(`User ${socket.user.name} joined ${userServers.length} servers`);
  } catch (error) {
    console.error('Error joining user to rooms:', error);
  }

  // Handle joining specific channel
  socket.on('join-channel', async (data) => {
    try {
      const { channelId, serverId } = data;

      // Verify user has access to this channel
      const membership = await prisma.serverMember.findFirst({
        where: {
          serverId: serverId,
          userId: socket.userId
        }
      });

      if (!membership) {
        socket.emit('error', { message: 'Not authorized to join this channel' });
        return;
      }

      // Join channel room
      socket.join(`channel:${channelId}`);
      console.log(`User ${socket.user.name} joined channel ${channelId}`);

      // Send confirmation
      socket.emit('channel-joined', { channelId });
    } catch (error) {
      console.error('Error joining channel:', error);
      socket.emit('error', { message: 'Failed to join channel' });
    }
  });

  // Handle leaving channel
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
        where: {
          serverId: serverId,
          userId: socket.userId
        }
      });

      if (!membership) {
        socket.emit('error', { message: 'Not authorized to send message' });
        return;
      }

      // Create message in database
      const message = await prisma.message.create({
        data: {
          content: content || (files.length > 0 ? 'Shared files' : ''),
          type: files.length > 0 ? 'FILE' : 'TEXT',
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
          author: {
            select: { name: true, image: true }
          },
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
          image: message.author.image || ''
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

  // Handle server creation (join creator to server room)
  socket.on('server-created', async (data) => {
    try {
      const { serverId } = data;
      
      // Join server room
      socket.join(`server:${serverId}`);
      
      // Join all channel rooms for this server
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

  // Handle channel creation (join creator and existing members to channel room)
  socket.on('channel-created', async (data) => {
    try {
      const { channelId, serverId } = data;

      // Get all server members
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

  // ------------------ mediasoup signaling handlers ------------------
  socket.on('getRouterRtpCapabilities', async ({ channelId }, callback) => {
    try {
      const router = await mediasoupService.getOrCreateRouter(channelId);
      callback({ rtpCapabilities: router.rtpCapabilities });
    } catch (err) {
      console.error('getRouterRtpCapabilities error', err);
      callback({ error: err.message });
    }
  });

  socket.on('createWebRtcTransport', async ({ channelId }, callback) => {
    try {
      const router = await mediasoupService.getOrCreateRouter(channelId);
      const { transport, params } = await mediasoupService.createWebRtcTransport(router);

      // store transport on socket for cleanup and reference
      socket.data = socket.data || {};
      socket.data.transports = socket.data.transports || new Map();
      socket.data.transports.set(params.id, transport);

      callback(params);
    } catch (err) {
      console.error('createWebRtcTransport error', err);
      callback({ error: err.message });
    }
  });

  socket.on('connectTransport', async ({ transportId, dtlsParameters }, callback) => {
    try {
      const transport = socket.data?.transports?.get(transportId);
      if (!transport) throw new Error('transport not found');
      await mediasoupService.connectTransport(transport, dtlsParameters);
      callback({ ok: true });
    } catch (err) {
      console.error('connectTransport error', err);
      callback({ error: err.message });
    }
  });

  socket.on('produce', async ({ channelId, transportId, kind, rtpParameters }, callback) => {
    try {
      const transport = socket.data?.transports?.get(transportId);
      if (!transport) throw new Error('transport not found');

      const producer = await transport.produce({ kind, rtpParameters });

      // save
      socket.data.producers = socket.data.producers || new Map();
      socket.data.producers.set(producer.id, producer);

      // notify others in channel
      // include both userId and socketId so clients can identify the producer's connection
      socket.to(`channel:${channelId}`).emit('newProducer', {
        producerId: producer.id,
        producerPeerId: socket.userId,
        producerPeerSocketId: socket.id,
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
      if (!mediasoupService.canConsume(router, producerId, rtpCapabilities)) {
        callback({ error: 'cannotConsume' });
        return;
      }

      // create recv transport if not exists
      socket.data = socket.data || {};
      socket.data.transports = socket.data.transports || new Map();
      let recvTransport = socket.data.transports.get('recv');
      if (!recvTransport) {
        const { transport, params } = await mediasoupService.createWebRtcTransport(router);
        recvTransport = transport;
        socket.data.transports.set('recv', recvTransport);
        // return params to client so they can create transport
        callback({ transportParams: params });
        return;
      }

      // create consumer on existing recvTransport
      const consumer = await recvTransport.consume({ producerId, rtpCapabilities, paused: false });
      socket.data.consumers = socket.data.consumers || new Map();
      socket.data.consumers.set(consumer.id, consumer);

      callback({ id: consumer.id, producerId, kind: consumer.kind, rtpParameters: consumer.rtpParameters });
    } catch (err) {
      console.error('consume error', err);
      callback({ error: err.message });
    }
  });

  socket.on('resumeConsumer', async ({ consumerId }, callback) => {
    try {
      const consumer = socket.data?.consumers?.get(consumerId);
      if (!consumer) throw new Error('consumer not found');
      await consumer.resume();
      callback({ ok: true });
    } catch (err) {
      console.error('resumeConsumer error', err);
      callback({ error: err.message });
    }
  });

  socket.on('streamStarted', ({ channelId }) => {
    socket.to(`channel:${channelId}`).emit('streamStarted', { peerId: socket.userId });
  });

  socket.on('streamStopped', ({ channelId }) => {
    socket.to(`channel:${channelId}`).emit('streamStopped', { peerId: socket.userId });
  });

  // ------------------------------------------------------------------

  // Handle member invitation accepted
  socket.on('member-joined', async (data) => {
    try {
      const { serverId, userId } = data;

      // Get the new member's socket if they're online
      const memberSocket = activeConnections.get(userId);
      
      if (memberSocket) {
        // Join server room
        memberSocket.join(`server:${serverId}`);
        
        // Join all channel rooms in this server
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

  // Handle user typing
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

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User ${socket.user.name} disconnected`);
    activeConnections.delete(socket.userId);
  });
});

// Start server
const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down socket server...');
  await prisma.$disconnect();
  httpServer.close();
});

module.exports = { io, httpServer };