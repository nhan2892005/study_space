import { UserRole } from "@/types/user";

export const ROUTES = {
  HOME: '/',
  GROUP: '/group',
  CALENDAR: '/calendar',
  MENTORS: '/mentor',
  MY_MENTEES: '/my-mentees',
  DASHBOARD: '/dashboard',
  ASSISTANT: '/chatbot',
  MANAGE_RAG: '/admin/rag',
  SETTINGS: {
    PROFILE: '/settings/profile',
    LANGUAGE: '/settings/language',
  },
} as const;

interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  roles: UserRole[];
}

export const NAV_ITEMS: NavigationItem[] = [
  {
    label: 'Trang chủ',
    href: ROUTES.HOME,
    roles: ['mentee', 'mentor', 'admin'],
  },
  {
    label: 'Trao đổi',
    href: ROUTES.GROUP,
    roles: ['mentee', 'mentor'],
  },
  {
    label: 'Chat bot',
    href: ROUTES.ASSISTANT,
    roles: ['mentee', 'mentor'],
  },
  {
    label: 'Danh sách mentee của tôi',
    href: ROUTES.MY_MENTEES,
    roles: ['mentor'],
  },
  {
    label: 'Mentor của tôi',
    href: ROUTES.MENTORS,
    roles: ['mentee'],
  },
  {
    label: 'Bảng điều khiển',
    href: ROUTES.DASHBOARD,
    roles: ['mentee', 'mentor', 'admin'],
  },
  {
    label: 'Quản lý chat bot',
    href: ROUTES.MANAGE_RAG,
    roles: ['admin'],
  },
];

export const USER_MENU_ITEMS: NavigationItem[] = [
  {
    label: 'Profile Settings',
    href: ROUTES.SETTINGS.PROFILE,
    icon: 'UserCircle',
    roles: ['mentee', 'mentor', 'admin'],
  },
  {
    label: 'Sign Out',
    href: '#',
    icon: 'ArrowRightOnRectangle',
    roles: ['mentee', 'mentor', 'admin'],
  },
] as const;
