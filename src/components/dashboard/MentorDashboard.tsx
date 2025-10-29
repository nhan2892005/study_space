"use client";

import { useState, useEffect } from 'react';
import { Users, TrendingUp, Clock, MessageSquare, Calendar, Star, Bell, Plus, Send } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface MenteeStats {
  id: string;
  name: string;
  avatar: string;
  overallScore: number;
  improvement: number;
  lastActivity: string;
  categories: {
    coding: number;
    communication: number;
    project: number;
    problem: number;
    teamwork: number;
  };
}

interface NotificationData {
  type: 'event' | 'announcement' | 'reminder';
  title: string;
  message: string;
  recipients: 'all' | string[];
  scheduledTime?: string;
}

const MentorDashboard = () => {
  const [menteeStats, setMenteeStats] = useState<MenteeStats[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState<NotificationData>({
    type: 'event',
    title: '',
    message: '',
    recipients: 'all',
  });
  const [loading, setLoading] = useState(true);

  // Use mock data for demo
  useEffect(() => {
    setLoading(true);
    const mockMentees: MenteeStats[] = [
      {
        id: 'm1',
        name: 'Nguyen Van A',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        overallScore: 82,
        improvement: 4,
        lastActivity: '2025-10-28 14:30',
        categories: {
          coding: 85,
          communication: 78,
          project: 80,
          problem: 82,
          teamwork: 88,
        },
      },
      {
        id: 'm2',
        name: 'Tran Thi B',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        overallScore: 76,
        improvement: 2,
        lastActivity: '2025-10-27 09:10',
        categories: {
          coding: 75,
          communication: 80,
          project: 72,
          problem: 70,
          teamwork: 74,
        },
      },
      {
        id: 'm3',
        name: 'Le Van C',
        avatar: 'https://randomuser.me/api/portraits/men/65.jpg',
        overallScore: 68,
        improvement: -1,
        lastActivity: '2025-10-26 16:45',
        categories: {
          coding: 65,
          communication: 70,
          project: 68,
          problem: 66,
          teamwork: 69,
        },
      },
      {
        id: 'm4',
        name: 'Pham Thi D',
        avatar: 'https://randomuser.me/api/portraits/women/55.jpg',
        overallScore: 80,
        improvement: 3,
        lastActivity: '2025-10-25 11:20',
        categories: {
          coding: 82,
          communication: 76,
          project: 84,
          problem: 80,
          teamwork: 85,
        },
      },
    ];
    setMenteeStats(mockMentees);
    setLoading(false);
  }, []);

  const monthlyProgressData = [
    { month: 'T1', average: 72, mentee1: 68, mentee2: 75, mentee3: 65, mentee4: 80 },
    { month: 'T2', average: 74, mentee1: 70, mentee2: 77, mentee3: 66, mentee4: 82 },
    { month: 'T3', average: 76, mentee1: 72, mentee2: 78, mentee3: 67, mentee4: 84 },
    { month: 'T4', average: 78, mentee1: 74, mentee2: 80, mentee3: 68, mentee4: 86 },
    { month: 'T5', average: 79, mentee1: 76, mentee2: 81, mentee3: 66, mentee4: 87 },
    { month: 'T6', average: 81, mentee1: 78, mentee2: 82, mentee3: 65, mentee4: 89 },
  ];

  const categoryDistribution = [
    { name: 'Coding Skills', value: 28, color: '#3B82F6' },
    { name: 'Communication', value: 22, color: '#10B981' },
    { name: 'Project Mgmt', value: 18, color: '#F59E0B' },
    { name: 'Problem Solving', value: 20, color: '#8B5CF6' },
    { name: 'Teamwork', value: 12, color: '#EF4444' },
  ];

  const weeklyActivityData = [
    { day: 'T2', submissions: 8, meetings: 4, reviews: 6 },
    { day: 'T3', submissions: 12, meetings: 3, reviews: 8 },
    { day: 'T4', submissions: 10, meetings: 5, reviews: 7 },
    { day: 'T5', submissions: 15, meetings: 2, reviews: 10 },
    { day: 'T6', submissions: 9, meetings: 6, reviews: 5 },
    { day: 'T7', submissions: 7, meetings: 1, reviews: 3 },
    { day: 'CN', submissions: 5, meetings: 0, reviews: 2 },
  ];

  const handleSendNotification = async () => {
    try {
      // API call to send notification
      console.log('Sending notification:', notificationData);
      
      // Reset form and close modal
      setNotificationData({
        type: 'event',
        title: '',
        message: '',
        recipients: 'all',
      });
      setShowNotificationModal(false);
      
      // Show success message
      alert('Thông báo đã được gửi thành công!');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Có lỗi xảy ra khi gửi thông báo!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mentor Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Quản lý và theo dõi tiến độ của mentee</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowNotificationModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Gửi thông báo
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tạo sự kiện
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng số mentee</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{menteeStats.length}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Còn {5 - menteeStats.length} slot</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Điểm TB của lớp</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(menteeStats.reduce((sum, m) => sum + m.overallScore, 0) / menteeStats.length)}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">+3.2 từ tháng trước</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hoạt động tuần này</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">42</p>
                <p className="text-xs text-orange-600 dark:text-orange-400">15 bài nộp, 12 cuộc họp</p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đánh giá của tôi</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">4.7</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">⭐ Từ 23 reviews</p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Mentee Management */}
          <div className="lg:col-span-1 space-y-6">
            {/* Mentee List */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Danh sách Mentee</h2>
              <div className="space-y-4">
                {menteeStats.map((mentee) => (
                  <div key={mentee.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                    <img
                      src={mentee.avatar}
                      alt={mentee.name}
                      className="w-10 h-10 rounded-full bg-gray-300"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {mentee.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {mentee.overallScore}/100
                        </span>
                        <span className={`text-xs font-medium ${
                          mentee.improvement > 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {mentee.improvement > 0 ? '+' : ''}{mentee.improvement}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {mentee.lastActivity}
                      </p>
                      <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${mentee.overallScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hành động nhanh</h2>
              <div className="space-y-3">
                <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-900 dark:text-white">Lên lịch họp nhóm</span>
                </button>
                <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-900 dark:text-white">Gửi feedback hàng loạt</span>
                </button>
                <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center space-x-3">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm text-gray-900 dark:text-white">Đánh giá tiến độ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Analytics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tiến độ theo thời gian</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[60, 95]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="average" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Điểm TB" />
                    <Line type="monotone" dataKey="mentee1" stroke="#10B981" strokeWidth={2} name="Mentee 1" />
                    <Line type="monotone" dataKey="mentee2" stroke="#F59E0B" strokeWidth={2} name="Mentee 2" />
                    <Line type="monotone" dataKey="mentee3" stroke="#EF4444" strokeWidth={2} name="Mentee 3" />
                    <Line type="monotone" dataKey="mentee4" stroke="#8B5CF6" strokeWidth={2} name="Mentee 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Distribution */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Phân bố kỹ năng</h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Weekly Activity */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hoạt động trong tuần</h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyActivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="submissions" stackId="a" fill="#3B82F6" name="Bài nộp" />
                      <Bar dataKey="meetings" stackId="a" fill="#10B981" name="Cuộc họp" />
                      <Bar dataKey="reviews" stackId="a" fill="#F59E0B" name="Đánh giá" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Performance Matrix */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ma trận hiệu suất</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Mentee</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Coding</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Communication</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Project</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Problem</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Teamwork</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menteeStats.map((mentee) => (
                      <tr key={mentee.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{mentee.name}</td>
                        <td className="text-center py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            mentee.categories.coding >= 80 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : mentee.categories.coding >= 70
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {mentee.categories.coding}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            mentee.categories.communication >= 80 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : mentee.categories.communication >= 70
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {mentee.categories.communication}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            mentee.categories.project >= 80 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : mentee.categories.project >= 70
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {mentee.categories.project}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            mentee.categories.problem >= 80 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : mentee.categories.problem >= 70
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {mentee.categories.problem}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            mentee.categories.teamwork >= 80 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : mentee.categories.teamwork >= 70
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {mentee.categories.teamwork}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Modal */}
        {showNotificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gửi thông báo</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Loại thông báo
                  </label>
                  <select
                    value={notificationData.type}
                    onChange={(e) => setNotificationData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    <option value="event">Sự kiện</option>
                    <option value="announcement">Thông báo chung</option>
                    <option value="reminder">Nhắc nhở</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tiêu đề
                  </label>
                  <input
                    type="text"
                    value={notificationData.title}
                    onChange={(e) => setNotificationData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    placeholder="Nhập tiêu đề thông báo..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nội dung
                  </label>
                  <textarea
                    value={notificationData.message}
                    onChange={(e) => setNotificationData(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    placeholder="Nhập nội dung thông báo..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Người nhận
                  </label>
                  <select
                    value={notificationData.recipients}
                    onChange={(e) => setNotificationData(prev => ({ ...prev, recipients: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">Tất cả mentee</option>
                    {menteeStats.map(mentee => (
                      <option key={mentee.id} value={mentee.id}>{mentee.name}</option>
                    ))}
                  </select>
                </div>

                {notificationData.type === 'event' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Thời gian
                    </label>
                    <input
                      type="datetime-local"
                      value={notificationData.scheduledTime || ''}
                      onChange={(e) => setNotificationData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSendNotification}
                  disabled={!notificationData.title || !notificationData.message}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Gửi thông báo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorDashboard;