import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  RefreshCw,
  TrendingUp,
  Users,
  Eye,
  Clock,
  Play,
  Calendar,
  Download
} from 'lucide-react';
import { adminService } from '../services/adminService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AnalyticsPage = () => {
  const [contentAnalytics, setContentAnalytics] = useState(null);
  const [engagementAnalytics, setEngagementAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchAnalytics(true);
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedPeriod]);

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const [contentData, engagementData] = await Promise.all([
        adminService.getContentAnalytics(),
        adminService.getEngagementAnalytics(selectedPeriod)
      ]);

      setContentAnalytics(contentData.data);
      setEngagementAnalytics(engagementData.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const exportData = () => {
    const data = {
      contentAnalytics,
      engagementAnalytics,
      exportedAt: new Date().toISOString(),
      period: selectedPeriod
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => fetchAnalytics()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
            >
              Try Again
            </button>
          </div>
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
                <TrendingUp className="mr-3 text-blue-600" size={32} />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Comprehensive insights into your platform performance</p>
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

              {/* Period Selector */}
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-gray-500" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchAnalytics(true)}
                  disabled={refreshing}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
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
              </div>
            </div>
          </div>
        </div>

        {/* Content Performance */}
        {contentAnalytics && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Play className="mr-2 text-purple-600" size={24} />
                Content Performance
              </h2>
            </div>

            {/* Popular Videos Chart */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Popular Videos</h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={contentAnalytics.popularVideos?.slice(0, 8) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="title"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [formatNumber(value), name]}
                      labelFormatter={(label) => `Video: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="views" fill="#8884d8" name="Views" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Popular Videos Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contentAnalytics.popularVideos?.slice(0, 10).map((video, index) => (
                      <tr key={video._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                              index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-gray-400' :
                              index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                            }`}>
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {video.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {video.topic?.category?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          <div className="flex items-center">
                            <Eye size={16} className="mr-1 text-gray-400" />
                            {formatNumber(video.views)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock size={16} className="mr-1 text-gray-400" />
                            {formatDuration(video.duration)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Performance */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Category Performance</h3>

              {/* Category Performance Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Views by Category</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={contentAnalytics.categoryPerformance?.slice(0, 6).map((cat, index) => ({
                          name: cat.categoryName,
                          value: cat.totalViews,
                          fill: COLORS[index % COLORS.length]
                        })) || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {contentAnalytics.categoryPerformance?.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatNumber(value), 'Views']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Videos by Category</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={contentAnalytics.categoryPerformance?.slice(0, 6) || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="categoryName" angle={-45} textAnchor="end" height={80} fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="totalVideos" fill="#00C49F" name="Videos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contentAnalytics.categoryPerformance?.slice(0, 6).map((category, index) => (
                  <div key={category._id} className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{category.categoryName}</h4>
                      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Videos:</span>
                        <span className="font-medium text-gray-900">{formatNumber(category.totalVideos)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Views:</span>
                        <span className="font-medium text-gray-900">{formatNumber(category.totalViews)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Avg Duration:</span>
                        <span className="font-medium text-gray-900">{formatDuration(category.avgDuration)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* User Engagement */}
        {engagementAnalytics && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Users className="mr-2 text-green-600" size={24} />
                User Engagement
                <span className="ml-2 text-sm font-normal text-gray-500">({engagementAnalytics.period})</span>
              </h2>
            </div>

            {/* Engagement Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Watch Time</p>
                    <p className="text-2xl font-bold">
                      {formatDuration(
                        engagementAnalytics.watchTimeTrends?.reduce((sum, day) => sum + day.totalWatchTime, 0) || 0
                      )}
                    </p>
                  </div>
                  <Clock size={32} className="text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Total Sessions</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(
                        engagementAnalytics.watchTimeTrends?.reduce((sum, day) => sum + day.totalSessions, 0) || 0
                      )}
                    </p>
                  </div>
                  <Play size={32} className="text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Active Days</p>
                    <p className="text-2xl font-bold">
                      {engagementAnalytics.watchTimeTrends?.length || 0}
                    </p>
                  </div>
                  <Calendar size={32} className="text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Avg Session Time</p>
                    <p className="text-2xl font-bold">
                      {formatDuration(
                        engagementAnalytics.watchTimeTrends?.length > 0
                          ? (engagementAnalytics.watchTimeTrends.reduce((sum, day) => sum + day.totalWatchTime, 0) /
                             engagementAnalytics.watchTimeTrends.reduce((sum, day) => sum + day.totalSessions, 0)) || 0
                          : 0
                      )}
                    </p>
                  </div>
                  <TrendingUp size={32} className="text-orange-200" />
                </div>
              </div>
            </div>

            {/* Daily Active Users Chart */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Active Users & Watch Time</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={engagementAnalytics.dailyActiveUsers || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'activeUsers' ? formatNumber(value) : formatDuration(value),
                        name === 'activeUsers' ? 'Active Users' : 'Watch Time'
                      ]}
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="activeUsers"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                      name="Active Users"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="totalWatchTime"
                      stackId="2"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.6}
                      name="Watch Time (seconds)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Watch Time Trends */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Watch Time & Session Trends</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={engagementAnalytics.watchTimeTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'totalSessions' ? formatNumber(value) : formatDuration(value),
                        name === 'totalSessions' ? 'Sessions' : 'Watch Time'
                      ]}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="totalSessions"
                      stroke="#ff7300"
                      strokeWidth={3}
                      name="Sessions"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="totalWatchTime"
                      stroke="#387908"
                      strokeWidth={3}
                      name="Watch Time (seconds)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* User Retention */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">User Retention Analysis</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Retention by Days Active</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={engagementAnalytics.userRetention || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatNumber(value), 'Users']} />
                      <Bar dataKey="userCount" fill="#8884d8" name="Users" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Retention Breakdown</h4>
                  {engagementAnalytics.userRetention?.map((retention, index) => {
                    const totalUsers = engagementAnalytics.userRetention.reduce((sum, r) => sum + r.userCount, 0);
                    const percentage = ((retention.userCount / totalUsers) * 100).toFixed(1);

                    return (
                      <div key={retention._id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {retention._id} day{retention._id !== 1 ? 's' : ''} active
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {formatNumber(retention.userCount)} users ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
