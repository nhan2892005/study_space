export type UserRole = 'mentee' | 'mentor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  department?: string; // Khoa
  major?: string;     // Chuyên ngành
  year?: number;      // Năm học (đối với sinh viên)
  bio?: string;       // Giới thiệu
  achievements?: string[]; // Thành tích
}

export interface MentorProfile extends User {
  rating: number;         // Đánh giá trung bình
  totalReviews: number;  // Tổng số đánh giá
  availableDays: string[]; // Các ngày có thể dạy
  currentMentees: number; // Số mentee hiện tại
  maxMentees: number;    // Số mentee tối đa có thể nhận
  expertise: string[];   // Các lĩnh vực chuyên môn
}

export interface Post {
  id: string;
  authorId: string;
  author: User;
  content: string;
  images?: string[];
  createdAt: Date;
  updatedAt?: Date;
  reactions: {
    like: number;
    heart: number;
    haha: number;
    sad: number;
    congrats: number;
  };
  comments: Comment[];
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}