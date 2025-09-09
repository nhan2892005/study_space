import { Post, User } from '@/types/user';

export const mockPosts: Post[] = [
  {
    id: '1',
    authorId: '1',
    author: {
      id: '1',
      name: 'Dr. Nguyen Van A',
      email: 'nguyenvana@hcmut.edu.vn',
      role: 'mentor',
      department: 'Computer Science',
      image: 'https://api.dicebear.com/9.x/pixel-art/png?seed=Nhan',
    } as User,
    content: 'Hôm nay mình vừa hoàn thành khóa học Machine Learning! 🎉',
    createdAt: new Date('2025-09-07T10:00:00Z'),
    reactions: {
      like: 15,
      heart: 7,
      haha: 2,
      sad: 0,
      congrats: 10,
    },
    comments: [
      {
        id: 'c1',
        postId: '1',
        authorId: '2',
        author: {
          id: '2',
          name: 'Tran Thi B',
          email: 'tranthib@hcmut.edu.vn',
          role: 'mentee',
          image: 'https://api.dicebear.com/9.x/pixel-art/png?seed=Chanh',
        } as User,
        content: 'Chúc mừng thầy ạ!',
        createdAt: new Date('2025-09-07T10:30:00Z'),
      }
    ]
  },
  {
    id: '2',
    authorId: '3',
    author: {
      id: '3',
      name: 'Le Van C',
      email: 'levanc@hcmut.edu.vn',
      role: 'mentor',
      department: 'Electrical Engineering',
      image: 'https://api.dicebear.com/9.x/pixel-art/png?seed=Minh',
    } as User,
    content: 'Chia sẻ một số tips học tập hiệu quả cho các bạn sinh viên:\n1. Lập kế hoạch học tập rõ ràng\n2. Thực hành thường xuyên\n3. Tham gia các nhóm học tập',
    createdAt: new Date('2025-09-08T09:00:00Z'),
    reactions: {
      like: 25,
      heart: 12,
      haha: 0,
      sad: 0,
      congrats: 5,
    },
    comments: []
  }
];
