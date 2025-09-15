"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function MenteeCard({ connection }: any) {
  const { mentee } = connection;
  const [score, setScore] = useState<number | undefined>(undefined);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submitFeedback = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/my-mentees/${mentee.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      toast.success('Feedback saved');
      setComment('');
      setScore(undefined);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Error');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex items-start gap-4 bg-white dark:bg-gray-800 p-4 rounded shadow">
      {mentee.image ? (
        <Image src={mentee.image} alt={mentee.name} width={64} height={64} className="rounded-full" />
      ) : (
        <div className="w-16 h-16 bg-gray-200 rounded-full" />
      )}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{mentee.name}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">{mentee.email}</div>
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-sm">Điểm (0-10)</label>
          <input value={score ?? ''} onChange={e => setScore(e.target.value ? Number(e.target.value) : undefined)} type="number" min={0} max={10} className="mt-1 p-2 border rounded w-24" />
        </div>

        <div className="mt-3">
          <label className="block text-sm">Nhận xét</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} className="mt-1 p-2 border rounded w-full" />
        </div>

        <div className="mt-3">
          <button onClick={submitFeedback} disabled={loading} className="px-3 py-1 bg-blue-600 text-white rounded">{loading ? 'Đang gửi...' : 'Gửi nhận xét'}</button>
        </div>
      </div>
    </div>
  );
}
