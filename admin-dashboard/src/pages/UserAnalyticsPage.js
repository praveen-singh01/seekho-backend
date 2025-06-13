import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';

const UserAnalyticsPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      fetchUserAnalytics();
    }
  }, [userId]);

  const fetchUserAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getUserAnalytics(userId);
      setUserAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching user analytics:', err);
      setError('Failed to load user analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
        <div className="mt-4 space-x-2">
          <button 
            onClick={fetchUserAnalytics}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
          <button 
            onClick={() => navigate('/users')}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  if (!userAnalytics) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">No user analytics data found</div>
        <button 
          onClick={() => navigate('/users')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Users
        </button>
      </div>
    );
  }

  const { user, stats, recentActivity } = userAnalytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <button 
            onClick={() => navigate('/users')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Users
          </button>
          <h1 className="text-2xl font-bold text-gray-900">User Analytics</h1>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Name</label>
            <div className="mt-1 text-sm text-gray-900">{user.name}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Email</label>
            <div className="mt-1 text-sm text-gray-900">{user.email}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Joined Date</label>
            <div className="mt-1 text-sm text-gray-900">{formatDate(user.joinedDate)}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Status</label>
            <div className="mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        {user.subscription && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-md font-medium text-gray-900 mb-3">Subscription Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Plan</label>
                <div className="mt-1 text-sm text-gray-900">{user.subscription.plan || 'N/A'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.subscription.status || 'Unknown'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Last Login</label>
                <div className="mt-1 text-sm text-gray-900">
                  {user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.videosWatched}</div>
          <div className="text-sm text-gray-600">Videos Watched</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{formatDuration(stats.totalWatchTime)}</div>
          <div className="text-sm text-gray-600">Total Watch Time</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{stats.completedVideos}</div>
          <div className="text-sm text-gray-600">Completed Videos</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{stats.totalSessions}</div>
          <div className="text-sm text-gray-600">Total Sessions</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{stats.favoriteVideos}</div>
          <div className="text-sm text-gray-600">Favorite Videos</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-indigo-600">{stats.bookmarkedVideos}</div>
          <div className="text-sm text-gray-600">Bookmarked Videos</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-pink-600">
            {stats.completedVideos > 0 ? Math.round((stats.completedVideos / stats.videosWatched) * 100) : 0}%
          </div>
          <div className="text-sm text-gray-600">Completion Rate</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        
        {recentActivity && recentActivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Video</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Watched At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentActivity.map((activity, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {activity.video?.title || 'Unknown Video'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Duration: {formatDuration(activity.video?.duration || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.video?.topic?.category?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDuration(activity.progress)} / {formatDuration(activity.video?.duration || 0)}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${activity.video?.duration ? Math.min((activity.progress / activity.video.duration) * 100, 100) : 0}%` 
                          }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        activity.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {activity.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(activity.watchedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No recent activity found
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAnalyticsPage;
