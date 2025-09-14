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