"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Users, TrendingUp, Clock, MessageSquare, Calendar, Star, Bell, Plus, Send, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import toast from 'react-hot-toast';

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

interface NewEventModal {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  type: string;
  priority: string;
  location: string;
}

const MentorDashboard = () => {
  const [menteeStats, setMenteeStats] = useState<MenteeStats[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<any>(null);
  const [notificationData, setNotificationData] = useState<NotificationData>({
    type: 'event',
    title: '',
    message: '',
    recipients: 'all',
  });
  const [newEvent, setNewEvent] = useState<NewEventModal>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    type: 'CLASS',
    priority: 'MEDIUM',
    location: ''
  });
  const [loading, setLoading] = useState(true);

  // Mock data
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [dashboardRes, feedbackRes] = await Promise.all([
          fetch('/api/dashboard/mentor'),
          fetch('/api/dashboard/mentor/recent-feedback')
        ]);
        
        if (!dashboardRes.ok) throw new Error(`Failed to fetch mentor dashboard: ${dashboardRes.status}`);
        const data = await dashboardRes.json();
        if (!mounted) return;

        // Map menteeStats — API should return menteeStats array; fallback to empty
        const mentees: MenteeStats[] = (data.menteeStats || []).map((m: any) => ({
          id: m.id,
          name: m.name || 'Unknown',
          avatar: m.avatar || m.image || '/api/placeholder/40/40',
          overallScore: typeof m.overallScore === 'number' ? m.overallScore : Math.round((m.categories?.coding || 0 + m.categories?.communication || 0 + m.categories?.project || 0 + m.categories?.problem || 0 + m.categories?.teamwork || 0) / 5),
          improvement: typeof m.improvement === 'number' ? m.improvement : 0,
          lastActivity: m.lastActivity || (m.updatedAt ? new Date(m.updatedAt).toLocaleString() : ''),
          categories: {
            coding: m.categories?.coding || 0,
            communication: m.categories?.communication || 0,
            project: m.categories?.project || m.categories?.project_management || 0,
            problem: m.categories?.problem || m.categories?.problem_solving || 0,
            teamwork: m.categories?.teamwork || 0,
          }
        }));

        setMenteeStats(mentees);

        // Load recent feedback if available
        if (feedbackRes.ok) {
          const feedbackData = await feedbackRes.json();
          setRecentFeedback(feedbackData.recentFeedback);
          setFeedbackStats(feedbackData.stats);
        }

        // Optionally map analytics arrays if provided
        if (data.monthlyProgressData) {
          // replace local const via state? currently monthlyProgressData is const — keep local fallback
        }
      } catch (err) {
        console.error('Error loading mentor dashboard:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
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
    if (!notificationData.title || !notificationData.message) {
      toast.error('Vui lòng điền đầy đủ tiêu đề và nội dung thông báo');
      return;
    }

    try {
      setSendingNotification(true);
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: notificationData.type,
          title: notificationData.title,
          content: notificationData.message,
          recipients: notificationData.recipients,
          scheduledTime: notificationData.scheduledTime
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send notification');
      }

      toast.success('Thông báo đã được gửi thành công!');
      setNotificationData({
        type: 'event',
        title: '',
        message: '',
        recipients: 'all',
      });
      setShowNotificationModal(false);
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(error.message || 'Lỗi khi gửi thông báo');
    } finally {
      setSendingNotification(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) {
      toast.error('Vui lòng điền đầy đủ tiêu đề, thời gian bắt đầu và kết thúc');
      return;
    }

    try {
      setCreatingEvent(true);
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          startTime: new Date(newEvent.startTime).toISOString(),
          endTime: new Date(newEvent.endTime).toISOString(),
          type: newEvent.type,
          priority: newEvent.priority,
          location: newEvent.location
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create event');
      }

      toast.success('Sự kiện đã được tạo thành công!');
      setNewEvent({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        type: 'CLASS',
        priority: 'MEDIUM',
        location: ''
      });
      setShowEventModal(false);
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast.error(error.message || 'Lỗi khi tạo sự kiện');
    } finally {
      setCreatingEvent(false);
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
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Bell className="h-4 w-4" />
              Gửi thông báo
            </button>
            <button 
              onClick={() => setShowEventModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
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

            {/* Feedback Statistics */}
            {feedbackStats && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thống kê đánh giá</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{feedbackStats.averageScore}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Điểm trung bình</div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{feedbackStats.totalFeedback}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Tổng lượt đánh giá</div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{feedbackStats.last30Days}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">30 ngày gần đây</div>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{feedbackStats.highest}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Điểm cao nhất</div>
                  </div>
                </div>
              </div>
            )}
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

              {/* Recent Feedback */}
              {recentFeedback.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Đánh giá gần đây</h2>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentFeedback.slice(0, 8).map((feedback) => (
                      <div key={feedback.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {feedback.mentee.image ? (
                                <Image
                                  src={feedback.mentee.image}
                                  alt={feedback.mentee.name}
                                  width={32}
                                  height={32}
                                  className="rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {feedback.mentee.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{feedback.mentee.name}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{new Date(feedback.createdAt).toLocaleDateString('vi-VN')}</p>
                              </div>
                            </div>
                          </div>
                          {feedback.score !== null && (
                            <div className={`flex-shrink-0 text-sm font-bold px-2 py-1 rounded whitespace-nowrap ${
                              feedback.score >= 8 ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                              feedback.score >= 6 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                              'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                            }`}>
                              {feedback.score}/10
                            </div>
                          )}
                        </div>
                        {feedback.comment && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">{feedback.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gửi thông báo</h3>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Loại thông báo
                  </label>
                  <select
                    value={notificationData.type}
                    onChange={(e) => setNotificationData({...notificationData, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="event">Sự kiện</option>
                    <option value="announcement">Thông báo chung</option>
                    <option value="reminder">Nhắc nhở</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={notificationData.title}
                    onChange={(e) => setNotificationData({...notificationData, title: e.target.value})}
                    placeholder="Nhập tiêu đề thông báo..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={notificationData.message}
                    onChange={(e) => setNotificationData({...notificationData, message: e.target.value})}
                    placeholder="Nhập nội dung thông báo..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>

                {/* Recipients */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gửi đến
                  </label>
                  <select
                    value={notificationData.recipients as any}
                    onChange={(e) => setNotificationData({...notificationData, recipients: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">Tất cả mentee</option>
                    <option value="top">Top 5 mentee</option>
                  </select>
                </div>

                {/* Scheduled Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Thời gian gửi (tùy chọn)
                  </label>
                  <input
                    type="datetime-local"
                    value={notificationData.scheduledTime || ''}
                    onChange={(e) => setNotificationData({...notificationData, scheduledTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Để trống để gửi ngay</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSendNotification}
                  disabled={sendingNotification}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {sendingNotification ? 'Đang gửi...' : 'Gửi'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Event Modal */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tạo sự kiện</h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tên sự kiện <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="Nhập tên sự kiện..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="Nhập mô tả sự kiện..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Thời gian bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Thời gian kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Loại sự kiện <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({...newEvent, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="PERSONAL">Cá nhân</option>
                    <option value="DEADLINE">Hạn chót</option>
                    <option value="MEETING">Cuộc họp</option>
                    <option value="ASSIGNMENT">Bài tập</option>
                    <option value="CLASS">Lớp học</option>
                    <option value="EXAM">Kiểm tra</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Độ ưu tiên <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newEvent.priority}
                    onChange={(e) => setNewEvent({...newEvent, priority: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="LOW">Thấp</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HIGH">Cao</option>
                    <option value="URGENT">Khẩn cấp</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Địa điểm
                  </label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    placeholder="Nhập địa điểm..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={creatingEvent}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {creatingEvent ? 'Đang tạo...' : 'Tạo sự kiện'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorDashboard;