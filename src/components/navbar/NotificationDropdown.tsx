'use client';

import { Menu, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'SERVER_INVITATION' | 'MENTEE_REQUEST';
  // server invitation fields
  serverId?: string;
  serverName?: string;
  invitedByName?: string;
  // mentee request fields
  menteeId?: string;
  menteeName?: string;
}

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  const fetchInvitations = async () => {
    try {
      const [invRes, reqRes] = await Promise.all([
        fetch('/api/invitations').catch(() => null),
        fetch('/api/mentor/requests').catch(() => null),
      ]);
      if (invRes === null) throw new Error('can not fetch');
      if (reqRes === null) throw new Error('can not fetch');
      const invRes_json = await invRes.json();
      const reqRes_json = await reqRes.json();

      const invitations = invRes && invRes.ok ? (invRes_json).invitations : [];
      const requests = reqRes && reqRes.ok ? (reqRes_json).requests : [];

      const merged = [
        ...invitations.map((i: any) => ({ id: i.id, type: 'SERVER_INVITATION', serverId: i.serverId, serverName: i.serverName, invitedByName: i.invitedByName })),
        ...requests.map((r: any) => ({id: r.id,type: 'MENTEE_REQUEST', menteeId: r.mentee.id, menteeName: r.mentee.name,
      })),
      ];

      setNotifications(merged as any);
      setHasUnread(merged.length > 0);
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

  const handleAccept = async (notification: Notification) => {
    try {
      if (notification.type === 'SERVER_INVITATION') {
        const response = await fetch(`/api/invitations/${notification.id}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ACCEPTED' }),
        });
        if (!response.ok) throw new Error('Failed to accept invitation');
        toast.success('Invitation accepted successfully');
        // after joining a server it's reasonable to reload so sidebar updates
        window.location.reload();
      } else if (notification.type === 'MENTEE_REQUEST') {
        // Accept mentee request by calling mentor respond endpoint
        const response = await fetch(`/api/mentor/requests/${notification.id}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ACCEPT' }),
        });
        if (!response.ok) throw new Error('Failed to accept mentee request');
        toast.success('Mentee request accepted');
      }

      // Remove the notification locally and refresh
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      fetchInvitations();
    } catch (error) {
      console.error('Error handling accept:', error);
      toast.error('Failed to accept');
    }
  };

  const handleDecline = async (notification: Notification) => {
    try {
      if (notification.type === 'SERVER_INVITATION') {
        const response = await fetch(`/api/invitations/${notification.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'DECLINED' }),
        });
        if (!response.ok) throw new Error('Failed to decline invitation');
        toast.success('Invitation declined');
      } else if (notification.type === 'MENTEE_REQUEST') {
        const response = await fetch(`/api/mentor/requests/${notification.id}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'REJECT' }),
        });
        if (!response.ok) throw new Error('Failed to reject mentee request');
        toast.success('Mentee request rejected');
      }

      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      fetchInvitations();
    } catch (error) {
      console.error('Error handling decline:', error);
      toast.error('Failed to decline');
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
                  {notification.type === 'SERVER_INVITATION' ? (
                    <>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        Bạn vừa được <span className="font-semibold">{notification.invitedByName}</span> mời 
                        vào server <span className="font-semibold">{notification.serverName}</span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(notification)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                        >
                          Đồng ý
                        </button>
                        <button
                          onClick={() => handleDecline(notification)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          Từ chối
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        <span className="font-semibold">{notification.menteeName}</span> muốn trở thành mentee của bạn
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(notification)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                        >
                          Đồng ý
                        </button>
                        <button
                          onClick={() => handleDecline(notification)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          Từ chối
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
