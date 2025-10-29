"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function MenteeCard({ connection }: any) {
  // Mock mentee data for demo
  const mockMentees = [
    {
      id: 'mentee1',
      name: 'Nguyen Van A',
      email: 'a.nguyen@example.com',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    {
      id: 'mentee2',
      name: 'Tran Thi B',
      email: 'b.tran@example.com',
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
      id: 'mentee3',
      name: 'Le Van C',
      email: 'c.le@example.com',
      image: 'https://randomuser.me/api/portraits/men/65.jpg',
    },
    {
      id: 'mentee4',
      name: 'Pham Thi D',
      email: 'd.pham@example.com',
      image: 'https://randomuser.me/api/portraits/women/55.jpg',
    },
  ];

  // Mock review history for demo
  const mockReviews = [
    { score: 8, comment: 'Tiến bộ tốt trong tháng này.', date: '2025-10-01' },
    { score: 7, comment: 'Cần cải thiện kỹ năng giao tiếp.', date: '2025-09-15' },
    { score: 9, comment: 'Hoàn thành xuất sắc dự án nhóm.', date: '2025-08-28' },
  ];

  // Use mentee from props or fallback to first mock mentee
  const [menteeIndex, setMenteeIndex] = useState(0);
  const mentee = connection?.mentee || mockMentees[menteeIndex];
  const [score, setScore] = useState<number | undefined>(undefined);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submitFeedback = async () => {
    try {
      setLoading(true);
      // Simulate API call for demo
      await new Promise(res => setTimeout(res, 500));
      toast.success('Feedback saved');
      setComment('');
      setScore(undefined);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Error');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col items-center gap-2">
          {mentee.image ? (
            <Image src={mentee.image} alt={mentee.name} width={72} height={72} className="rounded-full border-2 border-blue-500" />
          ) : (
            <div className="w-18 h-18 bg-gray-200 rounded-full" />
          )}
          <div className="font-semibold text-lg text-gray-900 dark:text-white">{mentee.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-300">{mentee.email}</div>
        </div>
        <div className="flex-1 pl-6">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Điểm (0-10)</label>
            <input value={score ?? ''} onChange={e => setScore(e.target.value ? Number(e.target.value) : undefined)} type="number" min={0} max={10} className="mt-1 p-2 border rounded w-24 bg-gray-50 dark:bg-gray-900" />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Nhận xét</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} className="mt-1 p-2 border rounded w-full bg-gray-50 dark:bg-gray-900" placeholder="Nhận xét về mentee..." />
          </div>
          <div className="flex gap-2 items-center mb-3">
            <button onClick={submitFeedback} disabled={loading} className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow">{loading ? 'Đang gửi...' : 'Gửi nhận xét'}</button>
            {/* Demo: Chuyển mentee mock */}
            <button
              type="button"
              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs"
              onClick={() => setMenteeIndex((menteeIndex + 1) % mockMentees.length)}
            >
              Xem mentee khác
            </button>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Lịch sử đánh giá</h4>
            <div className="space-y-2">
              {mockReviews.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded px-3 py-2 border border-gray-200 dark:border-gray-800">
                  <div>
                    <span className="font-medium text-blue-600 dark:text-blue-400">{r.score}/10</span>
                    <span className="ml-2 text-gray-700 dark:text-gray-300 text-sm">{r.comment}</span>
                  </div>
                  <span className="text-xs text-gray-400">{r.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
