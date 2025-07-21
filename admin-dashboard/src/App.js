import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AppThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import CategoriesPage from './pages/CategoriesPage';
import TopicsPage from './pages/TopicsPage';
import VideosPage from './pages/VideosPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import UserAnalyticsPage from './pages/UserAnalyticsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import SubscriptionAnalyticsPage from './pages/SubscriptionAnalyticsPage';
import QuestionnairesPage from './pages/QuestionnairesPage';
import MCQsPage from './pages/MCQsPage';
import LearningModulesPage from './pages/LearningModulesPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  console.log('ProtectedRoute: isAuthenticated =', isAuthenticated, 'loading =', loading);

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  console.log('PublicRoute: isAuthenticated =', isAuthenticated, 'loading =', loading);

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  const { loading } = useAuth();

  // Show loading spinner while authentication is being initialized
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AppProvider>
      <AppThemeProvider>
        <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/:userId/analytics" element={<UserAnalyticsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/topics" element={<TopicsPage />} />
                <Route path="/videos" element={<VideosPage />} />
                <Route path="/questionnaires" element={<QuestionnairesPage />} />
                <Route path="/mcqs" element={<MCQsPage />} />
                <Route path="/learning-modules" element={<LearningModulesPage />} />
                <Route path="/admin-users" element={<AdminUsersPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
                <Route path="/subscription-analytics" element={<SubscriptionAnalyticsPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
        </Routes>
      </AppThemeProvider>
    </AppProvider>
  );
}

export default App;
