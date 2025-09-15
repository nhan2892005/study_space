"use client";

import React, { useState } from 'react';
import Image from 'next/image';

type User = {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role: string;
  department?: string | null;
  major?: string | null;
  year?: number | null;
  bio?: string | null;
  achievements?: string[] | null;
};

export default function ProfileForm({ user }: { user: User }) {
  const [form, setForm] = useState({
    name: user.name || '',
    department: user.department || '',
    major: user.major || '',
    year: user.year?.toString() || '',
    bio: user.bio || '',
    achievements: (user.achievements || []).join('\n'),
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name || null,
          department: form.department || null,
          major: form.major || null,
          year: form.year ? Number(form.year) : null,
          bio: form.bio || null,
          achievements: form.achievements ? form.achievements.split('\n').map(s => s.trim()).filter(Boolean) : [],
        }),
      });

      if (res.ok) {
        setMessage('Saved successfully');
      } else {
        const data = await res.json();
        setMessage(data?.error || 'Failed to save');
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handleClearField(field: string) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: null }),
      });

      if (res.ok) {
        setForm((s) => ({ ...s, [field]: '' }));
        setMessage('Field cleared');
      } else {
        const data = await res.json();
        setMessage(data?.error || 'Failed to clear');
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-700 p-6 rounded shadow">
      <div className="flex items-center gap-4">
        {user.image ? (
          <Image src={user.image} alt={user.name || 'avatar'} width={64} height={64} className="rounded-full" />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
        )}
        <div>
          <div className="text-lg font-semibold">{user.name || 'No name'}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
          <div className="text-sm text-gray-500">Role: {user.role}</div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Full name</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 p-2 rounded bg-gray-50 dark:bg-gray-600" />
        <button type="button" onClick={() => handleClearField('name')} className="mt-1 text-sm text-red-500">Clear</button>
      </div>

      <div>
        <label className="block text-sm font-medium">Department</label>
        <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full mt-1 p-2 rounded bg-gray-50 dark:bg-gray-600" />
        <button type="button" onClick={() => handleClearField('department')} className="mt-1 text-sm text-red-500">Clear</button>
      </div>

      <div>
        <label className="block text-sm font-medium">Major</label>
        <input value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} className="w-full mt-1 p-2 rounded bg-gray-50 dark:bg-gray-600" />
        <button type="button" onClick={() => handleClearField('major')} className="mt-1 text-sm text-red-500">Clear</button>
      </div>

      <div>
        <label className="block text-sm font-medium">Year</label>
        <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full mt-1 p-2 rounded bg-gray-50 dark:bg-gray-600" />
        <button type="button" onClick={() => handleClearField('year')} className="mt-1 text-sm text-red-500">Clear</button>
      </div>

      <div>
        <label className="block text-sm font-medium">Bio</label>
        <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full mt-1 p-2 rounded bg-gray-50 dark:bg-gray-600" rows={4} />
        <button type="button" onClick={() => handleClearField('bio')} className="mt-1 text-sm text-red-500">Clear</button>
      </div>

      <div>
        <label className="block text-sm font-medium">Achievements (one per line)</label>
        <textarea value={form.achievements} onChange={(e) => setForm({ ...form, achievements: e.target.value })} className="w-full mt-1 p-2 rounded bg-gray-50 dark:bg-gray-600" rows={4} />
        <button type="button" onClick={() => handleClearField('achievements')} className="mt-1 text-sm text-red-500">Clear</button>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-500 text-white rounded">{saving ? 'Saving...' : 'Save'}</button>
        {message && <div className="text-sm text-gray-700 dark:text-gray-200">{message}</div>}
      </div>
    </form>
  );
}
