"use client";

import { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, Target, BookOpen, Star, Bell, Plus, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import toast from 'react-hot-toast';

interface ProgressData {
  category: string;
  currentScore: number;
  previousScore: number;
  target: number;
  color: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: string;
  priority: string;
  isCompleted: boolean;
}

interface RecentFeedback {
  id: string;
  category: string;
  score: number;
  comment: string;
  date: string;
  mentorName: string;
}

interface NewEvent {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  type: string;
  priority: string;
  location: string;
}

const MenteeDashboard = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<RecentFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<NewEvent>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    type: 'PERSONAL',
    priority: 'MEDIUM',
    location: ''
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard/mentee');
        if (!res.ok) throw new Error(`Failed to fetch mentee dashboard: ${res.status}`);
        const data = await res.json();
        if (!mounted) return;

        // Map progress records
        const progress: ProgressData[] = (data.progressData || []).map((p: any) => ({
          category: p.category || p.name || 'General',
          currentScore: p.currentScore ?? p.score ?? 0,
          previousScore: p.previousScore ?? 0,
          target: p.target ?? p.maxScore ?? 100,
          color: p.color || '#3B82F6'
        }));

        const events: CalendarEvent[] = (data.events || []).map((e: any) => ({
          id: e.id,
          title: e.title,
          startTime: e.startTime,
          endTime: e.endTime,
          type: e.type,
          priority: e.priority,
          isCompleted: !!e.isCompleted,
        }));

        const feedback: RecentFeedback[] = (data.recentFeedback || []).map((f: any) => ({
          id: f.id,
          category: f.category || 'General',
          score: f.score ?? 0,
          comment: f.comment || '',
          date: f.date || (f.createdAt ? new Date(f.createdAt).toISOString().split('T')[0] : ''),
          mentorName: f.mentorName || f.mentor?.name || 'Unknown'
        }));

        setProgressData(progress);
        setEvents(events);
        setRecentFeedback(feedback);
        // also fetch assigned tasks (created or assigned)
        try {
          const t = await fetch('/api/tasks');
          if (t.ok) {
            const td = await t.json();
            const assigned = td.assigned || td.assignedEvents || td.assigned || [];
            // merge assigned events into events list if not already present
            const assignedEvents = (assigned || []).map((a: any) => {
              const ev = a.event || a;
              return {
                id: ev.id,
                title: ev.title,
                startTime: ev.startTime,
                endTime: ev.endTime,
                type: ev.type,
                priority: ev.priority,
                isCompleted: ev.isCompleted
              };
            });

            // append unique assigned events
            const merged = [...events];
            assignedEvents.forEach((ae: any) => { if (!merged.find((x: any) => x.id === ae.id)) merged.push(ae); });
            setEvents(merged.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
          }
        } catch (e) { /* ignore */ }
      } catch (err) {
        console.error('Error loading mentee dashboard:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) {
      toast.error('Vui lòng điền đầy đủ thông tin: Tiêu đề, thời gian bắt đầu, thời gian kết thúc');
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

      const createdEvent = await res.json();
      setEvents([...events, {
        id: createdEvent.id,
        title: createdEvent.title,
        startTime: createdEvent.startTime,
        endTime: createdEvent.endTime,
        type: createdEvent.type,
        priority: createdEvent.priority,
        isCompleted: false
      }].sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));

      toast.success('Sự kiện đã được tạo thành công!');
      setShowAddEventModal(false);
      setNewEvent({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        type: 'PERSONAL',
        priority: 'MEDIUM',
        location: ''
      });
    } catch (err: any) {
      console.error('Error creating event:', err);
      toast.error(err.message || 'Lỗi khi tạo sự kiện');
    } finally {
      setCreatingEvent(false);
    }
  };

  const timeSeriesData = [
    { month: 'T1', coding: 65, communication: 60, project: 55, problem: 62, teamwork: 70 },
    { month: 'T2', coding: 68, communication: 62, project: 58, problem: 65, teamwork: 72 },
    { month: 'T3', coding: 72, communication: 65, project: 60, problem: 68, teamwork: 74 },
    { month: 'T4', coding: 75, communication: 67, project: 62, problem: 70, teamwork: 76 },
    { month: 'T5', coding: 78, communication: 68, project: 65, problem: 70, teamwork: 75 },
    { month: 'T6', coding: 82, communication: 70, project: 66, problem: 75, teamwork: 78 },
    { month: 'T7', coding: 85, communication: 72, project: 68, problem: 78, teamwork: 80 },
  ];

  const radarData = progressData.map(item => ({
    subject: item.category.replace(' ', '\n'),
    current: item.currentScore,
    target: item.target,
  }));

  const priorityColors = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800',
    URGENT: 'bg-red-200 text-red-900',
  };

  const typeIcons = {
    DEADLINE: <Clock className="h-4 w-4" />,
    MEETING: <Calendar className="h-4 w-4" />,
    ASSIGNMENT: <BookOpen className="h-4 w-4" />,
    EXAM: <Target className="h-4 w-4" />,
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Theo dõi tiến trình học tập của bạn</p>
          </div>
          <button 
            onClick={() => setShowAddEventModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Thêm sự kiện
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Điểm trung bình</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">76.6</p>
                <p className="text-xs text-green-600 dark:text-green-400">+4.2 từ tháng trước</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Deadline sắp tới</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{events.filter(e => !e.isCompleted).length}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400">2 trong tuần này</p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hoạt động hoàn thành</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                <p className="text-xs text-green-600 dark:text-green-400">Tháng này</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đánh giá gần đây</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">4.2</p>
                <p className="text-xs text-green-600 dark:text-green-400">⭐ Xuất sắc</p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Calendar & Events */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upcoming Events */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sự kiện sắp tới</h2>
                <Bell className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {typeIcons[event.type as keyof typeof typeIcons]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(event.startTime).toLocaleDateString('vi-VN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[event.priority as keyof typeof priorityColors]}`}>
                      {event.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Feedback */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Phản hồi gần đây</h2>
              <div className="space-y-4">
                {recentFeedback.map((feedback) => (
                  <div key={feedback.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">{feedback.category}</h3>
                      <div className="flex items-center space-x-1">
                        <span className="text-lg font-bold text-blue-600">{feedback.score}</span>
                        <span className="text-sm text-gray-500">/100</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{feedback.comment}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">bởi {feedback.mentorName}</p>
                      <p className="text-xs text-gray-500">{feedback.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Analytics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Radar Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tổng quan kỹ năng</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                    <Radar name="Hiện tại" dataKey="current" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                    <Radar name="Mục tiêu" dataKey="target" stroke="#10B981" fill="transparent" strokeDasharray="5 5" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Progress Timeline */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tiến trình theo thời gian</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="coding" stroke="#3B82F6" strokeWidth={2} name="Coding" />
                    <Line type="monotone" dataKey="communication" stroke="#10B981" strokeWidth={2} name="Communication" />
                    <Line type="monotone" dataKey="project" stroke="#F59E0B" strokeWidth={2} name="Project Mgmt" />
                    <Line type="monotone" dataKey="problem" stroke="#8B5CF6" strokeWidth={2} name="Problem Solving" />
                    <Line type="monotone" dataKey="teamwork" stroke="#EF4444" strokeWidth={2} name="Teamwork" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Progress Bars */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Chi tiết từng kỹ năng</h2>
              <div className="space-y-4">
                {progressData.map((item) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{item.category}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {item.currentScore}/{item.target}
                        </span>
                        <span className={`text-xs ${item.currentScore > item.previousScore ? 'text-green-600' : 'text-red-600'}`}>
                          {item.currentScore > item.previousScore ? '+' : ''}{item.currentScore - item.previousScore}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="h-2.5 rounded-full relative"
                        style={{ 
                          width: `${(item.currentScore / item.target) * 100}%`,
                          backgroundColor: item.color 
                        }}
                      >
                      </div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">0</span>
                      <span className="text-xs text-gray-500">{item.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievement Summary */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thành tích gần đây</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="bg-green-500 p-2 rounded-full">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">Hoàn thành dự án React</p>
                    <p className="text-xs text-green-600 dark:text-green-400">2 ngày trước</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="bg-blue-500 p-2 rounded-full">
                    <BookOpen className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Cải thiện điểm JS</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">1 tuần trước</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="bg-purple-500 p-2 rounded-full">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Đạt mục tiêu tháng</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">1 tuần trước</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="bg-yellow-500 p-2 rounded-full">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Streak 7 ngày</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">Đang diễn ra</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Thêm sự kiện mới</h2>
              <button
                onClick={() => setShowAddEventModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="Nhập tiêu đề sự kiện"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  placeholder="Nhập mô tả (tùy chọn)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Loại sự kiện
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PERSONAL">Cá nhân</option>
                  <option value="DEADLINE">Deadline</option>
                  <option value="MEETING">Cuộc họp</option>
                  <option value="ASSIGNMENT">Bài tập</option>
                  <option value="CLASS">Lớp học</option>
                  <option value="EXAM">Thi</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mức độ ưu tiên
                </label>
                <select
                  value={newEvent.priority}
                  onChange={(e) => setNewEvent({...newEvent, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  placeholder="Ví dụ: Phòng 305 hoặc Online Zoom"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingEvent}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors disabled:cursor-not-allowed"
                >
                  {creatingEvent ? 'Đang tạo...' : 'Tạo sự kiện'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenteeDashboard;