import { UserRole } from "@/types/user";

export const ROUTES = {
  HOME: '/',
  PROFILE: '/profile',
  CALENDAR: '/calendar',
  STORAGE: '/storage',
  MENTOR_DETAIL: '/mentor',
  BLOG: '/blog',
  FIND_MENTORS: '/find-mentors',
  MY_MENTEES: '/my-mentees',
  COMMUNITY: '/community',
  ADMIN: '/admin',
  SETTINGS: {
    PROFILE: '/settings/profile',
    SCHEDULE: '/settings/schedule',
    RESOURCES: '/settings/resources',
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
    label: 'Home',
    href: ROUTES.HOME,
    roles: ['mentee', 'mentor', 'admin'],
  },
  {
    label: 'Find Mentors',
    href: ROUTES.FIND_MENTORS,
    roles: ['mentee'],
  },
  {
    label: 'My Mentees',
    href: ROUTES.MY_MENTEES,
    roles: ['mentor'],
  },
  {
    label: 'Blog',
    href: ROUTES.BLOG,
    roles: ['mentee', 'mentor', 'admin'],
  },
  {
    label: 'Community',
    href: ROUTES.COMMUNITY,
    roles: ['mentee', 'mentor', 'admin'],
  },
  {
    label: 'Admin Dashboard',
    href: ROUTES.ADMIN,
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
    label: 'My Schedule',
    href: ROUTES.SETTINGS.SCHEDULE,
    icon: 'Calendar',
    roles: ['mentee', 'mentor'],
  },
  {
    label: 'My Resources',
    href: ROUTES.SETTINGS.RESOURCES,
    icon: 'FolderOpen',
    roles: ['mentee', 'mentor'],
  },
  {
    label: 'Language',
    href: ROUTES.SETTINGS.LANGUAGE,
    icon: 'Globe',
    roles: ['mentee', 'mentor', 'admin'],
  },
  {
    label: 'Sign Out',
    href: '#',
    icon: 'ArrowRightOnRectangle',
    roles: ['mentee', 'mentor', 'admin'],
  },
] as const;
