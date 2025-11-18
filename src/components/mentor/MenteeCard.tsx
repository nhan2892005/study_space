"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';

export default function MenteeCard({ connection }: any) {
  const { mentee } = connection;
  const [score, setScore] = useState<number | undefined>(undefined);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load feedback history when expanding card
  useEffect(() => {
    if (showHistory && feedbackHistory.length === 0) {
      loadFeedbackHistory();
    }
  }, [showHistory]);

  const loadFeedbackHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch(`/api/my-mentees/${mentee.id}/feedback-history`);
      if (!res.ok) throw new Error('Failed to load feedback history');
      const data = await res.json();
      setFeedbackHistory(data.feedbackHistory);
      setStats(data.stats);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải lịch sử đánh giá');
    } finally {
      setHistoryLoading(false);
    }
  };

  const submitFeedback = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/my-mentees/${mentee.id}/feedback-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      toast.success('Đánh giá đã được lưu!');
      setComment('');
      setScore(undefined);
      
      // Reload history
      if (showHistory) {
        loadFeedbackHistory();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Lỗi khi lưu đánh giá');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Header - Always visible */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-start gap-4">
          {mentee.image ? (
            <Image src={mentee.image} alt={mentee.name} width={64} height={64} className="rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {mentee.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{mentee.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{mentee.email}</p>
              </div>
            </div>

            {/* Quick Stats */}
            {stats && (
              <div className="mt-3 flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 dark:text-gray-400">Điểm TBQ:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{stats.averageScore}/10</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 dark:text-gray-400">Lần đánh giá:</span>
                  <span className="font-bold">{stats.totalFeedback}</span>
                </div>
                {stats.trend && (
                  <div className="flex items-center gap-1">
                    {stats.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : stats.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">-</span>
                    )}
                    <span className={`text-xs font-semibold ${stats.trend === 'up' ? 'text-green-600 dark:text-green-400' : stats.trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      {stats.trend === 'up' ? 'Tăng' : stats.trend === 'down' ? 'Giảm' : 'Ổn định'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {showHistory ? (
              <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Content */}
      {showHistory && (
        <div className="border-t dark:border-gray-700">
          {/* New Feedback Form */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Thêm đánh giá mới</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Điểm (0-10)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={score ?? ''}
                    onChange={e => setScore(e.target.value ? Number(e.target.value) : undefined)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="VD: 8.5"
                  />
                  {score !== undefined && (
                    <div className={`flex items-center justify-center px-4 py-2 rounded-lg font-bold ${
                      score >= 8 ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                      score >= 6 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                      'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                    }`}>
                      {score >= 8 ? 'Tốt' : score >= 6 ? 'Trung bình' : 'Cần cải thiện'}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nhận xét</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Nhập nhận xét chi tiết..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <button
                onClick={submitFeedback}
                disabled={loading || (score === undefined && !comment)}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {loading ? 'Đang lưu...' : 'Lưu đánh giá'}
              </button>
            </div>
          </div>

          {/* Feedback History */}
          <div className="p-4 border-t dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Lịch sử đánh giá</h4>
            
            {historyLoading ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <div className="animate-spin inline-block w-5 h-5 border-2 border-gray-300 border-t-green-600 rounded-full mb-2"></div>
                <p className="text-sm">Đang tải...</p>
              </div>
            ) : feedbackHistory.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                Chưa có đánh giá nào
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {feedbackHistory.map((feedback) => (
                  <div key={feedback.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(feedback.createdAt).toLocaleString('vi-VN')}
                      </span>
                      {feedback.score !== null && (
                        <span className={`text-sm font-bold px-2 py-1 rounded ${
                          feedback.score >= 8 ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                          feedback.score >= 6 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                          'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                        }`}>
                          {feedback.score}/10
                        </span>
                      )}
                    </div>
                    {feedback.comment && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">{feedback.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
