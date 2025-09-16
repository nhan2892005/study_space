"use client";

import { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertTriangle, Settings, UserPlus, Shield, BarChart3, Activity, Eye, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter } from 'recharts';

interface SystemStats {
  totalUsers: number;
  totalMentors: number;
  totalMentees: number;
  activeConnections: number;
  averageRating: number;
  monthlyGrowth: number;
}

interface MentorStats {
  id: string;
  name: string;
  email: string;
  department: string;
  menteeCount: number;
  averageRating: number;
  totalReviews: number;
  joinDate: string;
  status: 'active' | 'inactive' | 'pending';
  completedSessions: number;
}

interface PlatformActivity {
  date: string;
  newUsers: number;
  sessions: number;
  messages: number;
  reviews: number;
}

const AdminDashboard = () => {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [mentorStats, setMentorStats] = useState<MentorStats[]>([]);
  const [activityData, setActivityData] = useState<PlatformActivity[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API calls
    const mockSystemStats: SystemStats = {
      totalUsers: 1247,
      totalMentors: 89,
      totalMentees: 1158,
      activeConnections: 342,
      averageRating: 4.6,
      monthlyGrowth: 12.5,
    };

    const mockMentorStats: MentorStats[] = [
      {
        id: '1',
        name: 'Dr. Nguyễn Văn A',
        email: 'nguyenvana@email.com',
        department: 'Khoa học máy tính',
        menteeCount: 5,
        averageRating: 4.8,
        totalReviews: 23,
        joinDate: '2024-01-15',
        status: 'active',
        completedSessions: 145,
      },
      {
        id: '2',
        name: 'Dr. Trần Thị B',
        email: 'tranthib@email.com',
        department: 'Công nghệ thông tin',
        menteeCount: 4,
        averageRating: 4.5,
        totalReviews: 18,
        joinDate: '2024-02-20',
        status: 'active',
        completedSessions: 98,
      },
      {
        id: '3',
        name: 'MSc. Lê Văn C',
        email: 'levanc@email.com',
        department: 'Kỹ thuật phần mềm',
        menteeCount: 3,
        averageRating: 4.2,
        totalReviews: 12,
        joinDate: '2024-03-10',
        status: 'pending',
        completedSessions: 45,
      },
      {
        id: '4',
        name: 'Dr. Phạm Thị D',
        email: 'phamthid@email.com',
        department: 'Trí tuệ nhân tạo',
        menteeCount: 5,
        averageRating: 4.9,
        totalReviews: 31,
        joinDate: '2023-11-05',
        status: 'active',
        completedSessions: 203,
      },
    ];

    const mockActivityData: PlatformActivity[] = [
      { date: '2025-08-17', newUsers: 12, sessions: 89, messages: 245, reviews: 8 },
      { date: '2025-08-18', newUsers: 15, sessions: 95, messages: 278, reviews: 12 },
      { date: '2025-08-19', newUsers: 8, sessions: 76, messages: 198, reviews: 6 },
      { date: '2025-08-20', newUsers: 22, sessions: 112, messages: 334, reviews: 15 },
      { date: '2025-08-21', newUsers: 18, sessions: 104, messages: 289, reviews: 11 },
      { date: '2025-08-22', newUsers: 9, sessions: 67, messages: 156, reviews: 4 },
      { date: '2025-08-23', newUsers: 14, sessions: 88, messages: 234, reviews: 9 },
      { date: '2025-08-24', newUsers: 25, sessions: 118, messages: 367, reviews: 18 },
      { date: '2025-08-25', newUsers: 19, sessions: 102, messages: 298, reviews: 13 },
      { date: '2025-08-26', newUsers: 16, sessions: 94, messages: 267, reviews: 10 },
      { date: '2025-08-27', newUsers: 21, sessions: 109, messages: 321, reviews: 16 },
      { date: '2025-08-28', newUsers: 13, sessions: 85, messages: 223, reviews: 7 },
      { date: '2025-08-29', newUsers: 17, sessions: 97, messages: 276, reviews: 12 },
      { date: '2025-08-30', newUsers: 20, sessions: 106, messages: 312, reviews: 14 },
      { date: '2025-09-01', newUsers: 24, sessions: 115, messages: 345, reviews: 17 },
      { date: '2025-09-02', newUsers: 11, sessions: 78, messages: 189, reviews: 5 },
      { date: '2025-09-03', newUsers: 26, sessions: 121, messages: 378, reviews: 19 },
      { date: '2025-09-04', newUsers: 15, sessions: 91, messages: 256, reviews: 9 },
      { date: '2025-09-05', newUsers: 23, sessions: 113, messages: 334, reviews: 16 },
      { date: '2025-09-06', newUsers: 18, sessions: 99, messages: 287, reviews: 11 },
      { date: '2025-09-07', newUsers: 12, sessions: 82, messages: 209, reviews: 6 },
      { date: '2025-09-08', newUsers: 28, sessions: 125, messages: 389, reviews: 21 },
      { date: '2025-09-09', newUsers: 16, sessions: 93, messages: 264, reviews: 10 },
      { date: '2025-09-10', newUsers: 22, sessions: 108, messages: 318, reviews: 15 },
      { date: '2025-09-11', newUsers: 19, sessions: 101, messages: 293, reviews: 12 },
      { date: '2025-09-12', newUsers: 14, sessions: 87, messages: 231, reviews: 8 },
      { date: '2025-09-13', newUsers: 27, sessions: 119, messages: 356, reviews: 18 },
      { date: '2025-09-14', newUsers: 21, sessions: 105, messages: 309, reviews: 14 },
      { date: '2025-09-15', newUsers: 17, sessions: 96, messages: 273, reviews: 11 },
      { date: '2025-09-16', newUsers: 25, sessions: 116, messages: 341, reviews: 17 },
    ];

    setSystemStats(mockSystemStats);
    setMentorStats(mockMentorStats);
    setActivityData(mockActivityData);
    setLoading(false);
  }, []);

  const departmentData = [
    { name: 'Khoa học máy tính', mentors: 23, mentees: 287, color: '#3B82F6' },
    { name: 'Công nghệ thông tin', mentors: 18, mentees: 234, color: '#10B981' },
    { name: 'Kỹ thuật phần mềm', mentors: 15, mentees: 198, color: '#F59E0B' },
    { name: 'Trí tuệ nhân tạo', mentors: 12, mentees: 156, color: '#8B5CF6' },
    { name: 'An toàn thông tin', mentors: 9, mentees: 123, color: '#EF4444' },
    { name: 'Khác', mentors: 12, mentees: 160, color: '#6B7280' },
  ];

  const performanceData = mentorStats.map(mentor => ({
    name: mentor.name.split(' ').pop(),
    mentees: mentor.menteeCount,
    rating: mentor.averageRating,
    sessions: mentor.completedSessions,
  }));

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };

  const exportData = () => {
    // Generate CSV data
    const csvData = mentorStats.map(mentor => ({
      Name: mentor.name,
      Email: mentor.email,
      Department: mentor.department,
      Mentees: mentor.menteeCount,
      Rating: mentor.averageRating,
      Reviews: mentor.totalReviews,
      Status: mentor.status,
      'Join Date': mentor.joinDate,
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'mentor-report.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Quản lý và giám sát hệ thống mentorship</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={exportData}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Xuất báo cáo
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Thêm mentor
            </button>
          </div>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng người dùng</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemStats?.totalUsers}</p>
                <p className="text-xs text-green-600 dark:text-green-400">+{systemStats?.monthlyGrowth}% tháng này</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Mentors</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemStats?.totalMentors}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Active: {mentorStats.filter(m => m.status === 'active').length}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Mentees</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemStats?.totalMentees}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">Connected: {systemStats?.activeConnections}</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Kết nối hoạt động</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemStats?.activeConnections}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400">Ratio: {((systemStats?.activeConnections || 0) / (systemStats?.totalMentees || 1) * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đánh giá TB</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemStats?.averageRating}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">⭐ Excellent</p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cần xem xét</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{mentorStats.filter(m => m.status === 'pending').length}</p>
                <p className="text-xs text-red-600 dark:text-red-400">Pending approvals</p>
              </div>
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex justify-end mb-6">
          <div className="bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-md ${
                  selectedTimeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {range === '7d' ? '7 ngày' : range === '30d' ? '30 ngày' : range === '90d' ? '3 tháng' : '1 năm'}
              </button>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Platform Activity */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hoạt động nền tảng</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData.slice(-30)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).getDate().toString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('vi-VN')}
                  />
                  <Area type="monotone" dataKey="newUsers" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Người dùng mới" />
                  <Area type="monotone" dataKey="sessions" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Phiên làm việc" />
                  <Area type="monotone" dataKey="reviews" stackId="3" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} name="Đánh giá" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Distribution */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Phân bố theo khoa</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="mentees"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {departmentData.map((item, index) => (
                <div key={index} className="flex items-center text-sm">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Mentor Performance Scatter */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hiệu suất mentor</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mentees" name="Số mentee" />
                  <YAxis dataKey="rating" name="Đánh giá" domain={[3.5, 5]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [value, name === 'mentees' ? 'Số mentee' : 'Đánh giá']}
                  />
                  <Scatter dataKey="rating" fill="#3B82F6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Growth Trend */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Xu hướng tăng trưởng</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData.slice(-7)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('vi-VN')}
                  />
                  <Bar dataKey="newUsers" fill="#3B82F6" name="Người dùng mới" />
                  <Bar dataKey="sessions" fill="#10B981" name="Phiên học" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Mentor Management Table */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quản lý Mentor</h2>
            <div className="flex items-center space-x-3">
              <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                <Eye className="h-5 w-5" />
              </button>
              <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Mentor</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Khoa</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Mentees</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Đánh giá</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Reviews</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Phiên hoàn thành</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Trạng thái</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {mentorStats.map((mentor) => (
                  <tr key={mentor.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{mentor.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{mentor.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-900 dark:text-white">{mentor.department}</p>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {mentor.menteeCount}/5
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white mr-1">
                          {mentor.averageRating}
                        </span>
                        <span className="text-yellow-400">⭐</span>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {mentor.totalReviews}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {mentor.completedSessions}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[mentor.status]}`}>
                        {mentor.status === 'active' ? 'Hoạt động' : mentor.status === 'pending' ? 'Chờ duyệt' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <div className="flex justify-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          Xem
                        </button>
                        <button className="text-green-600 hover:text-green-800 text-sm">
                          Chỉnh sửa
                        </button>
                        {mentor.status === 'pending' && (
                          <button className="text-orange-600 hover:text-orange-800 text-sm">
                            Duyệt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hiển thị 1-{mentorStats.length} của {mentorStats.length} mentor
            </p>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-sm">
                Trước
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                1
              </button>
              <button className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-sm">
                Sau
              </button>
            </div>
          </div>
        </div>

        {/* Alert Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Cần chú ý</h3>
            </div>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              3 mentor chưa hoạt động hơn 7 ngày
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Thống kê</h3>
            </div>
            <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
              Tỷ lệ kết nối: {((systemStats?.activeConnections || 0) / (systemStats?.totalMentees || 1) * 100).toFixed(1)}%
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Tăng trưởng</h3>
            </div>
            <p className="text-sm text-green-600 dark:text-green-300 mt-1">
              +{systemStats?.monthlyGrowth}% người dùng mới tháng này
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;