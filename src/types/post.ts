import { Post, User, Comment, Reaction } from '@prisma/client';

export interface ExtendedPost extends Omit<Post, 'authorId'> {
  author: Pick<User, 'id' | 'name' | 'image' | 'role'>;
  comments: Array<Comment & {
    author: Pick<User, 'id' | 'name' | 'image'>;
  }>;
  reactions: Reaction[];
  images: string[];
}
