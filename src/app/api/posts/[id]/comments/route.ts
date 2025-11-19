import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';

// Add comment
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();
    if (!content) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: params.id,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Error creating comment' }, { status: 500 });
  }
}

// Delete comment
export async function DELETE(request: Request, { params }: { params: { id: string, commentId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const comment = await prisma.comment.findUnique({
      where: { id: params.commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.authorId !== user?.id) {
      return NextResponse.json({ error: 'Not authorized to delete this comment' }, { status: 403 });
    }

    await prisma.comment.delete({
      where: { id: params.commentId },
    });

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Error deleting comment' }, { status: 500 });
  }
}
