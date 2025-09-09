import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { ReactionType } from '@prisma/client';

// Toggle reaction
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await request.json();
    if (!type || !Object.values(ReactionType).includes(type)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if reaction exists
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        postId_userId: {
          postId: params.id,
          userId: user.id,
        },
      },
    });

    if (existingReaction) {
      // If same reaction type, remove it
      if (existingReaction.type === type) {
        await prisma.reaction.delete({
          where: {
            postId_userId: {
              postId: params.id,
              userId: user.id,
            },
          },
        });
        return NextResponse.json({ message: 'Reaction removed' });
      }
      
      // If different reaction type, update it
      const updatedReaction = await prisma.reaction.update({
        where: {
          postId_userId: {
            postId: params.id,
            userId: user.id,
          },
        },
        data: { type },
      });
      return NextResponse.json(updatedReaction);
    }

    // Create new reaction
    const newReaction = await prisma.reaction.create({
      data: {
        type,
        postId: params.id,
        userId: user.id,
      },
    });

    return NextResponse.json(newReaction);
  } catch (error) {
    console.error('Error handling reaction:', error);
    return NextResponse.json({ error: 'Error handling reaction' }, { status: 500 });
  }
}
