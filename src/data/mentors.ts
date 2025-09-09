export interface Mentor {
  id: string;
  name: string;
  avatar: string;
  role: 'lecturer' | 'student';
  year?: number; // for student mentors
  department: string;
  currentMentees: number;
  maxMentees: number;
  rating: number;
  totalReviews: number;
  availableDays: number;
  expertise: string[];
  achievements: string[];
  contact: {
    email: string;
    phone?: string;
  };
  schedule: {
    day: string;
    times: string[];
  }[];
}

export const mockMentors: Mentor[] = [
  {
    id: '1',
    name: 'Dr. Nguyen Van A',
    avatar: 'https://api.dicebear.com/9.x/avataaars/png?seed=1',
    role: 'lecturer',
    department: 'Computer Science',
    currentMentees: 3,
    maxMentees: 5,
    rating: 4.8,
    totalReviews: 45,
    availableDays: 3,
    expertise: ['Software Engineering', 'Database Systems', 'Web Development'],
    achievements: [
      'PhD in Computer Science',
      'Best Teaching Award 2024',
      '15+ Research Papers',
    ],
    contact: {
      email: 'nguyenvana@hcmut.edu.vn',
      phone: '0123456789',
    },
    schedule: [
      {
        day: 'Monday',
        times: ['09:00', '14:00'],
      },
      {
        day: 'Wednesday',
        times: ['09:00', '14:00'],
      },
      {
        day: 'Friday',
        times: ['09:00'],
      },
    ],
  },
  {
    id: '2',
    name: 'Tran Thi B',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=2',
    role: 'student',
    year: 4,
    department: 'Computer Science',
    currentMentees: 2,
    maxMentees: 3,
    rating: 4.9,
    totalReviews: 28,
    availableDays: 4,
    expertise: ['Data Structures', 'Algorithms', 'Python Programming'],
    achievements: [
      'GPA 9.0/10',
      'ACM-ICPC Finalist',
      'Google Developer Student Club Lead',
    ],
    contact: {
      email: 'tranthib@hcmut.edu.vn',
    },
    schedule: [
      {
        day: 'Tuesday',
        times: ['15:00', '17:00'],
      },
      {
        day: 'Thursday',
        times: ['15:00', '17:00'],
      },
      {
        day: 'Saturday',
        times: ['09:00', '14:00'],
      },
    ],
  },
];
