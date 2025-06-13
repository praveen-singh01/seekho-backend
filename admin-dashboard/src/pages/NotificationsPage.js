import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Filter,
  RefreshCw,
  Users,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  TrendingUp,

  Download,
  Search
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { adminService } from '../services/adminService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [notificationAnalytics, setNotificationAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSendForm, setShowSendForm] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ type: '', isRead: '', search: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Send notification form state
  const [sendForm, setSendForm] = useState({
    title: '',
    message: '',
    type: 'info',
    sendToAll: true,
    userIds: [],
    priority: 'medium'
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchNotificationAnalytics();
  }, [pagination.page, filters]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchNotifications(true);
        fetchNotificationAnalytics();
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, pagination.page, filters]);

  const fetchNotifications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await adminService.getNotifications(
        pagination.page,
        pagination.limit,
        filters.type,
        filters.isRead
      );

      setNotifications(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages
      }));
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchNotificationAnalytics = async () => {
    try {
      const response = await adminService.getNotificationAnalytics(30);
      setNotificationAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching notification analytics:', err);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!sendForm.title.trim() || !sendForm.message.trim()) {
      alert('Title and message are required');
      return;
    }

    try {
      setSending(true);
      await adminService.sendNotification(sendForm);
      
      // Reset form
      setSendForm({
        title: '',
        message: '',
        type: 'info',
        sendToAll: true,
        userIds: [],
        priority: 'medium'
      });
      setShowSendForm(false);
      
      // Refresh notifications
      fetchNotifications();
      fetchNotificationAnalytics();
      
      alert('Notification sent successfully!');
    } catch (err) {
      console.error('Error sending notification:', err);
      alert('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTypeColor = (type) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      new_content: 'bg-purple-100 text-purple-800',
      subscription: 'bg-indigo-100 text-indigo-800',
      achievement: 'bg-pink-100 text-pink-800'
    };
    return colors[type] || colors.info;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  };

  const getTypeIcon = (type) => {
    const icons = {
      info: '📢',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      new_content: '🎬',
      subscription: '💳',
      achievement: '🏆'
    };
    return icons[type] || '📢';
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      low: '🔵',
      medium: '🟡',
      high: '🔴'
    };
    return icons[priority] || '🟡';
  };

  const exportData = () => {
    const data = {
      notifications,
      analytics: notificationAnalytics,
      exportedAt: new Date().toISOString(),
      filters
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower) ||
        notification.user?.name?.toLowerCase().includes(searchLower) ||
        notification.user?.email?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Bell className="mr-3 text-blue-600" size={32} />
                Notification Management
              </h1>
              <p className="text-gray-600 mt-1">Send and manage notifications to your users</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Auto Refresh Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoRefresh" className="text-sm text-gray-700">
                  Auto-refresh (30s)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchNotifications(true)}
                  disabled={refreshing}
                  className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>

                <button
                  onClick={exportData}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <Download size={16} />
                  <span>Export</span>
                </button>

                <button
                  onClick={() => setShowSendForm(!showSendForm)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <Send size={16} />
                  <span>{showSendForm ? 'Cancel' : 'Send Notification'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        {notificationAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Sent (30 days)</p>
                  <p className="text-3xl font-bold">
                    {notificationAnalytics.notificationsByType?.reduce((sum, item) => sum + item.count, 0) || 0}
                  </p>
                </div>
                <Send size={32} className="text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Read</p>
                  <p className="text-3xl font-bold">
                    {notificationAnalytics.notificationsByType?.reduce((sum, item) => sum + item.readCount, 0) || 0}
                  </p>
                </div>
                <CheckCircle size={32} className="text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Total Unread</p>
                  <p className="text-3xl font-bold">
                    {notificationAnalytics.notificationsByType?.reduce((sum, item) => sum + item.unreadCount, 0) || 0}
                  </p>
                </div>
                <AlertCircle size={32} className="text-yellow-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Read Rate</p>
                  <p className="text-3xl font-bold">
                    {notificationAnalytics.notificationsByType?.length > 0
                      ? Math.round((notificationAnalytics.notificationsByType.reduce((sum, item) => sum + item.readCount, 0) /
                          notificationAnalytics.notificationsByType.reduce((sum, item) => sum + item.count, 0)) * 100)
                      : 0}%
                  </p>
                </div>
                <TrendingUp size={32} className="text-purple-200" />
              </div>
            </div>
          </div>
        )}

        {/* Analytics Charts */}
        {notificationAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Notifications by Type */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Notifications by Type</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={notificationAnalytics.notificationsByType?.map((item, index) => ({
                      name: item._id,
                      value: item.count,
                      fill: COLORS[index % COLORS.length]
                    })) || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {notificationAnalytics.notificationsByType?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Read Rate by Priority */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Read Rate by Priority</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={notificationAnalytics.readRateByPriority || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Read Rate']} />
                  <Bar dataKey="readRate" fill="#8884d8" name="Read Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Daily Trends Chart */}
        {notificationAnalytics?.dailyTrends && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Notification Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={notificationAnalytics.dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sent" stroke="#8884d8" strokeWidth={2} name="Sent" />
                <Line type="monotone" dataKey="read" stroke="#82ca9d" strokeWidth={2} name="Read" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Send Notification Form */}
        {showSendForm && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <MessageSquare className="mr-2 text-blue-600" size={24} />
                Send New Notification
              </h2>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={sendForm.title}
                    onChange={(e) => setSendForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter notification title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={sendForm.type}
                    onChange={(e) => setSendForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="info">📢 Info</option>
                    <option value="success">✅ Success</option>
                    <option value="warning">⚠️ Warning</option>
                    <option value="error">❌ Error</option>
                    <option value="new_content">🎬 New Content</option>
                    <option value="subscription">💳 Subscription</option>
                    <option value="achievement">🏆 Achievement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={sendForm.message}
                  onChange={(e) => setSendForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your notification message here..."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {sendForm.message.length}/500 characters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={sendForm.priority}
                    onChange={(e) => setSendForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">🔵 Low Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="high">🔴 High Priority</option>
                  </select>
                </div>

                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="sendToAll"
                      checked={sendForm.sendToAll}
                      onChange={(e) => setSendForm(prev => ({ ...prev, sendToAll: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="sendToAll" className="text-sm font-medium text-gray-700 flex items-center">
                      <Users size={16} className="mr-1" />
                      Send to all users
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowSendForm(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Send Notification</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Filter className="mr-2 text-gray-600" size={20} />
              Filters & Search
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="new_content">New Content</option>
                <option value="subscription">Subscription</option>
                <option value="achievement">Achievement</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={filters.isRead}
                onChange={(e) => setFilters(prev => ({ ...prev, isRead: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="true">Read</option>
                <option value="false">Unread</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ type: '', isRead: '', search: '' })}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recent Notifications</h2>
              <div className="text-sm text-gray-500">
                Showing {filteredNotifications.length} of {pagination.total} notifications
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500">
                {filters.search || filters.type || filters.isRead
                  ? 'Try adjusting your filters to see more results.'
                  : 'No notifications have been sent yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notification</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => (
                    <tr key={notification._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <Users size={16} className="text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {notification.user?.name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {notification.user?.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {notification.title}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {notification.message}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${getTypeColor(notification.type)}`}>
                          {getTypeIcon(notification.type)}
                          <span className="ml-1 capitalize">{notification.type.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${getPriorityColor(notification.priority)}`}>
                          {getPriorityIcon(notification.priority)}
                          <span className="ml-1 capitalize">{notification.priority}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                          notification.isRead ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {notification.isRead ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                          <span className="ml-1">{notification.isRead ? 'Read' : 'Unread'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(notification.createdAt)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                  >
                    First
                  </button>

                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                  >
                    Previous
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNum;
                      if (pagination.pages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                            pagination.page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                  >
                    Next
                  </button>

                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: pagination.pages }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
