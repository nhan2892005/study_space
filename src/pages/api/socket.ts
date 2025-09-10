import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getSession } from 'next-auth/react';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type NextApiResponseServerIO = NextApiResponse & {
  socket: NetServer & {
    server?: any;
  };
};

export default async function SocketHandler(
  req: NextApiRequest,
  res: NextApiResponseServerIO,
) {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', async (socket) => {
      const session = await getSession({ req });
      if (!session?.user?.email) {
        socket.disconnect();
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true, image: true },
      });

      if (!user) {
        socket.disconnect();
        return;
      }

      // Join server rooms
      socket.on('join-server', (serverId: string) => {
        socket.join(`server:${serverId}`);
      });

      // Join channel rooms
      socket.on('join-channel', (channelId: string) => {
        socket.join(`channel:${channelId}`);
      });

      // Handle text messages
      socket.on('send-message', async (data: {
        content: string;
        channelId: string;
        files?: File[];
      }) => {
        try {
          const message = await prisma.message.create({
            data: {
              content: data.content,
              type: 'TEXT',
              channel: { connect: { id: data.channelId } },
              author: { connect: { id: user.id } },
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          });

          io.to(`channel:${data.channelId}`).emit('new-message', message);
        } catch (error) {
          console.error('Error sending message:', error);
        }
      });

      // Handle file uploads
      socket.on('upload-file', async (data: {
        file: Buffer;
        fileName: string;
        fileType: string;
        channelId: string;
      }) => {
        try {
          // Upload to Cloudinary
          const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: `chat/${data.channelId}`,
                resource_type: 'auto',
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(data.file);
          });

          const fileType = data.fileType.startsWith('image/')
            ? 'IMAGE'
            : data.fileType.startsWith('video/')
            ? 'VIDEO'
            : data.fileType.startsWith('audio/')
            ? 'AUDIO'
            : 'DOCUMENT';

          // Create message with file
          const message = await prisma.message.create({
            data: {
              content: `Shared a ${fileType.toLowerCase()}`,
              type: 'FILE',
              channel: { connect: { id: data.channelId } },
              author: { connect: { id: user.id } },
              files: {
                create: {
                  name: data.fileName,
                  url: (uploadResult as any).secure_url,
                  type: fileType,
                  size: (uploadResult as any).bytes,
                },
              },
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              files: true,
            },
          });

          io.to(`channel:${data.channelId}`).emit('new-message', message);
        } catch (error) {
          console.error('Error uploading file:', error);
        }
      });

      // Handle voice/video streaming
      socket.on('join-stream', (channelId: string) => {
        socket.join(`stream:${channelId}`);
        io.to(`channel:${channelId}`).emit('user-joined-stream', {
          userId: user.id,
          name: user.name,
        });
      });

      socket.on('leave-stream', (channelId: string) => {
        socket.leave(`stream:${channelId}`);
        io.to(`channel:${channelId}`).emit('user-left-stream', {
          userId: user.id,
          name: user.name,
        });
      });

      // Handle stream recording
      socket.on('start-recording', (channelId: string) => {
        // Implement recording logic
        socket.emit('recording-started', { channelId });
      });

      socket.on('stop-recording', async (data: {
        channelId: string;
        recordingData: Buffer;
        title: string;
        targetChannelId: string;
      }) => {
        try {
          // Upload recording to Cloudinary
          const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: `recordings/${data.channelId}`,
                resource_type: 'video',
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(data.recordingData);
          });

          // Save recording to database
          const recording = await prisma.recording.create({
            data: {
              title: data.title,
              url: (uploadResult as any).secure_url,
              duration: (uploadResult as any).duration,
              thumbnail: (uploadResult as any).thumbnail_url,
              channel: { connect: { id: data.targetChannelId } },
              recorder: { connect: { id: user.id } },
            },
          });

          io.to(`channel:${data.targetChannelId}`).emit('new-recording', recording);
        } catch (error) {
          console.error('Error saving recording:', error);
        }
      });

      // Join user's personal room for notifications
      socket.join(`user:${user.id}`);

      // Handle server invitations
      socket.on('accept-invitation', async (invitationId: string) => {
        try {
          await fetch(`/api/invitations/${invitationId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ACCEPTED' }),
          });
        } catch (error) {
          console.error('Error accepting invitation:', error);
        }
      });

      socket.on('decline-invitation', async (invitationId: string) => {
        try {
          await fetch(`/api/invitations/${invitationId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'DECLINED' }),
          });
        } catch (error) {
          console.error('Error declining invitation:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        socket.leave(`user:${user.id}`);
        // Clean up any active streams or recordings
      });
    });
  }

  res.end();
}
