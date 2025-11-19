"use client";

import { useState, useEffect } from 'react';
import { Users, TrendingUp, Settings, UserPlus, Shield, BarChart3, Trash2, Edit2, Plus, X, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

interface AdminStats {
  userStats: {
    totalAdmins: number;
    totalMentors: number;
    totalMentees: number;
    totalUsers: number;
  };
  connectionStats: {
    totalConnections: number;
    acceptedConnections: number;
    pendingConnections: number;
    rejectedConnections: number;
    acceptanceRate: string;
    avgMenteePerMentor: string;
  };
  activityStats: {
    newUsersLast30Days: number;
    newConnectionsLast30Days: number;
    totalPosts: number;
    totalFeedback: number;
  };
  progressStats: {
    averageScore: string;
    totalProgressRecords: number;
  };
  topMentors: any[];
  departmentDistribution: any[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  rating: number;
  totalReviews: number;
  menteeCount: number;
  postCount: number;
  createdAt: string;
}

interface Connection {
  id: string;
  menteeId: string;
  menteeName: string;
  mentorId: string;
  mentorName: string;
  status: string;
  createdAt: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'connections'>('overview');
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form states
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'MENTEE', department: '' });
  const [newConnection, setNewConnection] = useState({ menteeId: '', mentorId: '' });
  
  // Search and filter states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [connectionStatusFilter, setConnectionStatusFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [connectionPage, setConnectionPage] = useState(1);
  
  // Pagination
  const [userTotal, setUserTotal] = useState(0);
  const [connectionTotal, setConnectionTotal] = useState(0);
  const pageSize = 10;

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, connectionsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users?page=1&limit=10'),
        fetch('/api/admin/connections?page=1&limit=10')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
        setUserTotal(usersData.pagination.total);
      }

      if (connectionsRes.ok) {
        const connectionsData = await connectionsRes.json();
        setConnections(connectionsData.connections);
        setConnectionTotal(connectionsData.pagination.total);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Load users with filters
  const loadUsers = async (page: number = 1, search: string = '', role: string = '') => {
    try {
      let url = `/api/admin/users?page=${page}&limit=${pageSize}`;
      if (search) url += `&search=${search}`;
      if (role) url += `&role=${role}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setUserTotal(data.pagination.total);
        setUserPage(page);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      toast.error('Lỗi khi tải danh sách người dùng');
    }
  };

  // Load connections with filters
  const loadConnections = async (page: number = 1, status: string = '') => {
    try {
      let url = `/api/admin/connections?page=${page}&limit=${pageSize}`;
      if (status) url += `&status=${status}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections);
        setConnectionTotal(data.pagination.total);
        setConnectionPage(page);
      }
    } catch (err) {
      console.error('Error loading connections:', err);
      toast.error('Lỗi khi tải danh sách kết nối');
    }
  };

  // Create or update user
  const handleSaveUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.role) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      const url = editingUser ? '/api/admin/users' : '/api/admin/users';
      const method = editingUser ? 'PATCH' : 'POST';
      const body = editingUser 
        ? { userId: editingUser.id, ...newUser }
        : newUser;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      toast.success(editingUser ? 'Cập nhật người dùng thành công' : 'Tạo người dùng thành công');
      setShowUserModal(false);
      setNewUser({ name: '', email: '', role: 'MENTEE', department: '' });
      setEditingUser(null);
      await loadUsers();
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu người dùng');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${userName}"?`)) return;

    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      toast.success('Xóa người dùng thành công');
      await loadUsers();
      await loadData();
    } catch (err) {
      toast.error('Lỗi khi xóa người dùng');
    }
  };

  // Create connection
  const handleCreateConnection = async () => {
    if (!newConnection.menteeId || !newConnection.mentorId) {
      toast.error('Vui lòng chọn mentee và mentor');
      return;
    }

    if (newConnection.menteeId === newConnection.mentorId) {
      toast.error('Mentee và mentor phải khác nhau');
      return;
    }

    try {
      const res = await fetch('/api/admin/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newConnection, status: 'ACCEPTED' })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      toast.success('Tạo kết nối thành công');
      setShowConnectionModal(false);
      setNewConnection({ menteeId: '', mentorId: '' });
      await loadConnections();
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo kết nối');
    }
  };

  // Delete connection
  const handleDeleteConnection = async (connId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa kết nối này?')) return;

    try {
      const res = await fetch(`/api/admin/connections?connectionId=${connId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      toast.success('Xóa kết nối thành công');
      await loadConnections();
      await loadData();
    } catch (err) {
      toast.error('Lỗi khi xóa kết nối');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Quản lý hệ thống và người dùng</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setEditingUser(null);
                setNewUser({ name: '', email: '', role: 'MENTEE', department: '' });
                setShowUserModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Thêm người dùng
            </button>
            <button
              onClick={() => setShowConnectionModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Thêm kết nối
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          {(['overview', 'users', 'connections'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'overview' && 'Tổng quan'}
              {tab === 'users' && 'Quản lý người dùng'}
              {tab === 'connections' && 'Kết nối Mentor-Mentee'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* User Stats */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng người dùng</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.userStats.totalUsers}</p>
                    <p className="text-xs text-blue-600 mt-1">Admins: {stats.userStats.totalAdmins}, Mentors: {stats.userStats.totalMentors}, Mentees: {stats.userStats.totalMentees}</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              {/* Connection Stats */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Kết nối hoạt động</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.connectionStats.acceptedConnections}</p>
                    <p className="text-xs text-green-600 mt-1">Tỷ lệ chấp nhận: {stats.connectionStats.acceptanceRate}%</p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hoạt động (30 ngày)</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activityStats.newUsersLast30Days}</p>
                    <p className="text-xs text-orange-600 mt-1">Người dùng mới, {stats.activityStats.newConnectionsLast30Days} kết nối mới</p>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                    <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </div>

              {/* Progress Stats */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Điểm TB toàn hệ</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.progressStats.averageScore}</p>
                    <p className="text-xs text-purple-600 mt-1">{stats.progressStats.totalProgressRecords} bản ghi tiến độ</p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                    <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Connection Distribution */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Phân bố kết nối</h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Chấp nhận', value: stats.connectionStats.acceptedConnections, fill: '#10B981' },
                          { name: 'Chờ duyệt', value: stats.connectionStats.pendingConnections, fill: '#F59E0B' },
                          { name: 'Từ chối', value: stats.connectionStats.rejectedConnections, fill: '#EF4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      >
                        <Cell fill="#10B981" />
                        <Cell fill="#F59E0B" />
                        <Cell fill="#EF4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department Distribution */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Phân bố theo khoa</h2>
                <div className="space-y-3">
                  {stats.departmentDistribution.map((dept: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{dept.department}</span>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-24">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(dept.count / stats.userStats.totalUsers) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white w-8">{dept.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Mentors */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Mentors</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Tên</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Khoa</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Đánh giá</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Reviews</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Mentees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topMentors.map((mentor: any) => (
                      <tr key={mentor.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{mentor.name}</p>
                          <p className="text-xs text-gray-500">{mentor.email}</p>
                        </td>
                        <td className="text-center py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{mentor.department}</td>
                        <td className="text-center py-3 px-4">
                          <span className="inline-flex items-center space-x-1 text-sm font-medium text-yellow-600">
                            ⭐ {mentor.rating}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{mentor.totalReviews}</td>
                        <td className="text-center py-3 px-4">
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-medium">
                            {mentor.menteeCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    loadUsers(1, e.target.value, userRoleFilter);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  loadUsers(1, userSearch, e.target.value);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Tất cả roles</option>
                <option value="ADMIN">Admin</option>
                <option value="MENTOR">Mentor</option>
                <option value="MENTEE">Mentee</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Tên</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Email</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Role</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Khoa</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Đánh giá</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                        <td className="text-center py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            user.role === 'MENTOR' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{user.department}</td>
                        <td className="text-center py-3 px-4">
                          {user.role === 'MENTOR' ? (
                            <span className="text-sm font-medium text-yellow-600">⭐ {user.rating}</span>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setNewUser({ name: user.name, email: user.email, role: user.role, department: user.department });
                                setShowUserModal(true);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Hiển thị {users.length} / {userTotal} người dùng</p>
              <div className="flex gap-2">
                <button
                  onClick={() => loadUsers(userPage - 1, userSearch, userRoleFilter)}
                  disabled={userPage === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-900 dark:text-white"
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-gray-900 dark:text-white">{userPage} / {Math.ceil(userTotal / pageSize)}</span>
                <button
                  onClick={() => loadUsers(userPage + 1, userSearch, userRoleFilter)}
                  disabled={userPage >= Math.ceil(userTotal / pageSize)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-900 dark:text-white"
                >
                  Tiếp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <div className="space-y-4">
            {/* Filter */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <select
                value={connectionStatusFilter}
                onChange={(e) => {
                  setConnectionStatusFilter(e.target.value);
                  loadConnections(1, e.target.value);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACCEPTED">Chấp nhận</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </div>

            {/* Connections Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Mentee</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Mentor</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Trạng thái</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Ngày tạo</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connections.map((conn) => (
                      <tr key={conn.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{conn.menteeName}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{conn.mentorName}</p>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            conn.status === 'ACCEPTED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            conn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {conn.status === 'ACCEPTED' ? '✓' : conn.status === 'PENDING' ? '⏳' : '✗'} {conn.status}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(conn.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="text-center py-3 px-4">
                          <button
                            onClick={() => handleDeleteConnection(conn.id)}
                            className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Hiển thị {connections.length} / {connectionTotal} kết nối</p>
              <div className="flex gap-2">
                <button
                  onClick={() => loadConnections(connectionPage - 1, connectionStatusFilter)}
                  disabled={connectionPage === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-900 dark:text-white"
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-gray-900 dark:text-white">{connectionPage} / {Math.ceil(connectionTotal / pageSize)}</span>
                <button
                  onClick={() => loadConnections(connectionPage + 1, connectionStatusFilter)}
                  disabled={connectionPage >= Math.ceil(connectionTotal / pageSize)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-900 dark:text-white"
                >
                  Tiếp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingUser ? 'Chỉnh sửa người dùng' : 'Tạo người dùng mới'}
                </h2>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tên
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    disabled={!!editingUser}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="MENTEE">Mentee</option>
                    <option value="MENTOR">Mentor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Khoa
                  </label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      setEditingUser(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveUser}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingUser ? 'Cập nhật' : 'Tạo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connection Modal */}
        {showConnectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Thêm kết nối mới</h2>
                <button
                  onClick={() => setShowConnectionModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Chọn Mentee
                  </label>
                  <select
                    value={newConnection.menteeId}
                    onChange={(e) => setNewConnection({ ...newConnection, menteeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">-- Chọn Mentee --</option>
                    {users.filter(u => u.role === 'MENTEE').map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Chọn Mentor
                  </label>
                  <select
                    value={newConnection.mentorId}
                    onChange={(e) => setNewConnection({ ...newConnection, mentorId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">-- Chọn Mentor --</option>
                    {users.filter(u => u.role === 'MENTOR').map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowConnectionModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleCreateConnection}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Tạo kết nối
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;