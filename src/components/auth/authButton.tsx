"use client";

import { Fragment } from 'react';
import { signIn, signOut, useSession } from "next-auth/react";
import { Menu, Transition } from '@headlessui/react';
import Image from 'next/image';
import { UserRole } from '@/types/user';
import { USER_MENU_ITEMS } from '@/constants/navigation';
import Link from 'next/link';

export default function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;

  if (!session) {
    return (
      <Menu as="div" className="relative">
        <Menu.Button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          Sign in
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
<Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-md
  bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none
  dark:bg-gray-800 dark:divide-gray-700 z-50">            
  <div className="px-1 py-1">
              {(['mentee', 'mentor', 'admin'] as UserRole[]).map((role) => (
                <Menu.Item key={role}>
                  {({ active }) => (
                    <button
                      onClick={() => signIn("google", { callbackUrl: `/?role=${role}` })}
                      className={`${
                        active ? 'bg-blue-500 text-white' : 'text-gray-900 dark:text-gray-100'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm capitalize`}
                    >
                      Sign in as {role}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    );
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-2">
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || ""}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
        )}
        <span className="text-gray-700 dark:text-gray-300">{session.user?.name}</span>
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
<Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-md
  bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none
  dark:bg-gray-800 dark:divide-gray-700 z-50">          
        <div className="px-1 py-1">
            {USER_MENU_ITEMS.filter(item => item.label !== 'Sign Out').map((item) => (
              <Menu.Item key={item.label}>
                {({ active }) => (
                  <Link
                    href={item.href}
                    className={`${
                      active ? 'bg-blue-500 text-white' : 'text-gray-900 dark:text-gray-100'
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2`}
                  >
                    {item.icon && (
                      <Image 
                        src={`https://api.dicebear.com/9.x/icons/svg?seed=${item.icon.toLowerCase()}`}
                        alt={item.label}
                        width={16}
                        height={16}
                        className="opacity-75"
                      />
                    )}
                    {item.label}
                  </Link>
                )}
              </Menu.Item>
            ))}
          </div>
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => signOut()}
                  className={`${
                    active ? 'bg-red-500 text-white' : 'text-gray-900 dark:text-gray-100'
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2`}
                >
                  <Image 
                    src="/icons/logout.svg"
                    alt="Sign out"
                    width={16}
                    height={16}
                    className="opacity-75"
                  />
                  Sign out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}