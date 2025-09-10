'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { NAV_ITEMS, USER_MENU_ITEMS } from '@/constants/navigation';
import { useTheme } from 'next-themes';
import AuthButtons from '../auth/authButton';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold">
                Study Space
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              {theme === 'dark' ? '🌞' : '🌙'}
            </button>

            {/* Language Toggle */}
            <button className="ml-4 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
              🌐
            </button>

            {session?.user && (
              <div className="ml-4">
                <NotificationDropdown />
              </div>
            )}

            <AuthButtons/>

            {/* {session?.user && (
              <Menu as="div" className="ml-3 relative">
                <Menu.Button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <div className="flex items-center gap-2">
                    {session.user.image ? (
                      <Image
                        width={32}
                        height={32}
                        className="rounded-full"
                        src={session.user.image}
                        alt="User avatar"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200" />
                    )}
                    <span className="hidden md:block text-gray-900 dark:text-gray-100">
                      {session.user.name}
                    </span>
                  </div>
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      {USER_MENU_ITEMS.map((item) => (
                        <Menu.Item key={item.href}>
                          {({ active }) => (
                            <Link
                              href={item.href}
                              className={`${
                                active
                                  ? 'bg-gray-100 dark:bg-gray-600'
                                  : ''
                              } block px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                            >
                              {item.label}
                            </Link>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            )} */}
          </div>
        </div>
      </div>
    </nav>
  );
}
