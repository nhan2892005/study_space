'use client';

import { useState, useEffect } from 'react';
import { Database, RefreshCw, Check, AlertCircle, TrendingUp } from 'lucide-react';

interface IndexStats {
  namespaces?: {
    [key: string]: {
      vectorCount: number;
    };
  };
  dimension?: number;
  indexFullness?: number;
  totalVectorCount?: number;
}

export default function RAGManagement() {
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<IndexStats | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/chatbot/embed');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleIndex = async (types: string[]) => {
    const key = types.join(',');
    setIndexing(prev => ({ ...prev, [key]: true }));
    setMessage(null);

    try {
      const response = await fetch('/api/chatbot/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ types }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessage({
        type: 'success',
        text: `✅ Đã index ${data.indexed} documents thành công! (Mentors: ${data.breakdown.mentors}, Posts: ${data.breakdown.posts}, General: ${data.breakdown.general})`,
      });

      await fetchStats();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `❌ Lỗi: ${error.message}`,
      });
    } finally {
      setIndexing(prev => ({ ...prev, [key]: false }));
    }
  };

  const indexButtons = [
    { label: 'Index Mentors', types: ['mentors'], icon: '👨‍🏫' },
    { label: 'Index Posts', types: ['posts'], icon: '📝' },
    { label: 'Index General FAQs', types: ['general'], icon: '💡' },
    { label: 'Index All', types: ['mentors', 'posts', 'general'], icon: '🔄' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-8 h-8 text-blue-500" />
        <div>
          <h2 className="text-2xl font-bold">RAG Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Quản lý vector database và embedding
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Vectors</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalVectorCount || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dimension</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.dimension || 768}
                </p>
              </div>
              <Database className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Index Fullness</p>
                <p className="text-2xl font-bold text-green-600">
                  {((stats.indexFullness || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <Check className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm flex-1">{message.text}</p>
        </div>
      )}

      {/* Index Buttons */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Index Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {indexButtons.map((btn, idx) => {
            const key = btn.types.join(',');
            const isLoading = indexing[key];

            return (
              <button
                key={idx}
                onClick={() => handleIndex(btn.types)}
                disabled={isLoading || Object.values(indexing).some(v => v)}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                <span className="flex items-center gap-2">
                  <span className="text-2xl">{btn.icon}</span>
                  <span className="font-medium">{btn.label}</span>
                </span>
                {isLoading && (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>⚠️ Lưu ý:</strong> Quá trình indexing có thể mất vài phút tùy thuộc vào số lượng documents. 
            Các documents hiện có sẽ được cập nhật hoặc thêm mới vào vector database.
          </p>
        </div>
      </div>

      {/* Usage Guidelines */}
      <div className="mt-6 space-y-4">
        <h3 className="font-semibold text-lg">Hướng dẫn sử dụng</h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex gap-3">
            <span className="text-blue-500 font-bold">1.</span>
            <p>Chạy "Index All" lần đầu để khởi tạo toàn bộ dữ liệu vào vector database</p>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-500 font-bold">2.</span>
            <p>Chạy index từng loại khi có thêm mentor mới, bài post mới, hoặc cập nhật FAQs</p>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-500 font-bold">3.</span>
            <p>Nên chạy re-index định kỳ (1 tuần/lần) để đảm bảo dữ liệu được cập nhật</p>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-500 font-bold">4.</span>
            <p>Kiểm tra stats để theo dõi số lượng vectors và index fullness</p>
          </div>
        </div>
      </div>

      {/* Refresh Stats Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>
    </div>
  );
}