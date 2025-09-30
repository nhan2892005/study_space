import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ragChatbot } from '@/lib/rag/chatbot';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { message, conversationId } = await request.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return new Response('User not found', { status: 404 });
  }

  // Get history
  let conversationHistory: any[] = [];
  if (conversationId) {
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });
    conversationHistory = messages.map(msg => ({
      role: msg.role,
      parts: msg.content,
    }));
  }

  // Create streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullResponse = '';

        await ragChatbot.chatStream(
          message,
          conversationHistory,
          (chunk) => {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
          }
        );

        // Save to DB
        let convId = conversationId;
        if (!convId) {
          const conv = await prisma.chatConversation.create({
            data: { userId: user.id, title: message.slice(0, 50) },
          });
          convId = conv.id;
        }

        await prisma.chatMessage.createMany({
          data: [
            { conversationId: convId, role: 'user', content: message },
            { conversationId: convId, role: 'model', content: fullResponse },
          ],
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversationId: convId })}\n\n`));
        controller.close();
      } catch (error: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}