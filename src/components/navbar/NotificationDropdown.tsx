'use client';

import { Menu, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'SERVER_INVITATION';
  serverId: string;
  serverName: string;
  invitedByName: string;
}

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations');
      if (!response.ok) throw new Error('Failed to fetch invitations');
      
      const data = await response.json();
      setNotifications(data.invitations);
      setHasUnread(data.invitations.length > 0);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to load notifications');
    }
  };

  useEffect(() => {
    fetchInvitations();
    
    // Poll for new invitations every 30 seconds
    const interval = setInterval(fetchInvitations, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleAcceptInvitation = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${notificationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });

      if (!response.ok) throw new Error('Failed to accept invitation');

      // Remove the notification
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
      
      toast.success('Invitation accepted successfully');
      
      // Refresh notifications
      fetchInvitations();
      window.location.reload();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${notificationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DECLINED' }),
      });

      if (!response.ok) throw new Error('Failed to decline invitation');

      // Remove the notification
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );

      toast.success('Invitation declined');
      
      // Refresh notifications
      fetchInvitations();
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation');
    }
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {hasUnread && (
          <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full"></span>
        )}
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
        <Menu.Items className="absolute right-0 mt-2 w-96 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1" onClick={() => setHasUnread(false)}>
            {notifications.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                No new notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Bạn vừa được <span className="font-semibold">{notification.invitedByName}</span> mời 
                    vào server <span className="font-semibold">{notification.serverName}</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptInvitation(notification.id)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      Đồng ý
                    </button>
                    <button
                      onClick={() => handleDeclineInvitation(notification.id)}
                      className="px-3 py-1 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
