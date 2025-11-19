// src/types/post.ts
import { Post, User, Comment, Reaction } from "@prisma/client";

// Định nghĩa lại User để thêm field image (không có trong DB)
type Author = Pick<User, "id" | "name" | "userType" | "department"> & {
  image: string;
};

// Định nghĩa lại Comment để thay thế Author gốc bằng Author có image
type ExtendedComment = Omit<Comment, "author" | "createdAt"> & {
  createdAt: string; // Đã convert sang string
  author: {
    id: string;
    name: string | null;
    image: string;
  };
};

export interface ExtendedPost extends Omit<Post, "images" | "createdAt" | "updatedAt"> {
  createdAt: string; // Đã convert sang string
  updatedAt: string; // Đã convert sang string
  images: string[];  // Đã flatten thành mảng string
  author: Author;
  comments: ExtendedComment[];
  reactions: Reaction[];
}