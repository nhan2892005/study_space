import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { serverId: string; channelId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verify user is member of the server
  const membership = await prisma.serverMember.findFirst({
    where: {
      serverId: params.serverId,
      user: { email: session.user.email },
    },
  });

  if (!membership) {
    return new Response('Forbidden', { status: 403 });
  }

  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      // Get last message timestamp from query params
      const url = new URL(request.url);
      const lastMessageTime = url.searchParams.get('lastMessageTime');
      const since = lastMessageTime ? new Date(lastMessageTime) : new Date(Date.now() - 1000 * 60 * 5); // 5 minutes ago

      // Poll for new messages
      const pollMessages = async () => {
        try {
          const messages = await prisma.message.findMany({
            where: {
              channelId: params.channelId,
              createdAt: { gt: since },
            },
            include: {
              author: { select: { name: true, image: true } },
              files: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          });

          if (messages.length > 0) {
            const formattedMessages = messages.map(msg => ({
              id: msg.id,
              content: msg.content,
              type: msg.type,
              author: {
                name: msg.author.name || 'Unknown User',
                image: msg.author.image || '',
              },
              files: msg.files,
              timestamp: msg.createdAt,
            }));

            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'messages', data: formattedMessages })}\n\n`
            ));

            // Update since time
            since.setTime(Math.max(...messages.map(m => m.createdAt.getTime())));
          }
        } catch (error) {
          console.error('Error polling messages:', error);
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: 'Failed to fetch messages' })}\n\n`
          ));
        }
      };

      // Poll every 2 seconds (more responsive than 5s)
      const interval = setInterval(pollMessages, 2000);

      // Initial poll
      pollMessages();

      // Cleanup when connection closes
      return () => {
        clearInterval(interval);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}