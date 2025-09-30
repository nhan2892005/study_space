import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { ragChatbot } from '@/lib/rag/chatbot';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, conversationId } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get conversation history
    let conversationHistory: any[] = [];
    let convId = conversationId;

    if (convId) {
      const messages = await prisma.chatMessage.findMany({
        where: { conversationId: convId },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });

      conversationHistory = messages.map(msg => ({
        role: msg.role as 'user' | 'model',
        parts: msg.content,
      }));
    } else {
      // Create new conversation
      const conversation = await prisma.chatConversation.create({
        data: {
          userId: user.id,
          title: message.slice(0, 50),
        },
      });
      convId = conversation.id;
    }

    // Optional: Apply filter based on user role
    const filter: Record<string, any> = {};
    if (user.role === 'MENTEE') {
      // Mentees might want mentor info
      filter.type = { $in: ['mentor', 'general'] };
    }

    // Get response from RAG
    const response = await ragChatbot.chat(message, conversationHistory, {
      filter,
      topK: 5,
    });

    // Save messages to DB
    await prisma.chatMessage.createMany({
      data: [
        {
          conversationId: convId,
          role: 'user',
          content: message,
        },
        {
          conversationId: convId,
          role: 'model',
          content: response.message,
        },
      ],
    });

    // Generate follow-up questions
    const followUpQuestions = await ragChatbot.generateFollowUpQuestions([
      ...conversationHistory,
      { role: 'user', parts: message },
      { role: 'model', parts: response.message },
    ]);

    return NextResponse.json({
      message: response.message,
      sources: response.sources,
      conversationId: convId,
      followUpQuestions,
      usage: response.usage,
    });
  } catch (error: any) {
    console.error('Chatbot error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process message' },
      { status: 500 }
    );
  }
}