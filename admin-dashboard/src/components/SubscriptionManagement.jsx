import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Pagination,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  People,
  AttachMoney,
  Autorenew,
  Cancel,
  Refresh,
  FilterList,
  Download,
  PlayArrow
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../services/authService';

const SubscriptionManagement = () => {
  const [stats, setStats] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    plan: '',
    isRecurring: '',
    search: ''
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Fetch subscription statistics
  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/subscriptions/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to fetch subscription statistics');
    }
  };

  // Fetch subscriptions with filters
  const fetchSubscriptions = async (pageNum = 1, currentFilters = filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum,
        limit: 10,
        ...currentFilters
      });

      // Remove empty filters
      Object.keys(currentFilters).forEach(key => {
        if (!currentFilters[key]) {
          params.delete(key);
        }
      });

      const response = await api.get(`/api/admin/subscriptions?${params}`);
      setSubscriptions(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setError('Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  };

  // Run manual maintenance
  const runMaintenance = async () => {
    try {
      setMaintenanceLoading(true);
      await api.post('/api/admin/subscriptions/maintenance');
      setSuccess('Subscription maintenance completed successfully');
      await fetchStats();
      await fetchSubscriptions(page);
    } catch (error) {
      console.error('Error running maintenance:', error);
      setError('Failed to run maintenance');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    setPage(1);
    fetchSubscriptions(1, filters);
    setFilterDialogOpen(false);
  };

  // Clear filters
  const clearFilters = () => {
    const emptyFilters = { status: '', plan: '', isRecurring: '', search: '' };
    setFilters(emptyFilters);
    setPage(1);
    fetchSubscriptions(1, emptyFilters);
    setFilterDialogOpen(false);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'cancelled': return 'error';
      case 'expired': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${(amount / 100).toFixed(2)}`;
  };

  // Export subscriptions
  const exportSubscriptions = async () => {
    try {
      const response = await api.get('/api/admin/subscriptions?limit=1000');
      const subscriptions = response.data.data;

      // Convert to CSV
      const headers = ['User Name', 'Email', 'Plan', 'Status', 'Amount', 'Type', 'Start Date', 'End Date', 'Next Billing'];
      const csvContent = [
        headers.join(','),
        ...subscriptions.map(sub => [
          sub.user?.name || 'N/A',
          sub.user?.email || 'N/A',
          sub.plan,
          sub.status,
          formatCurrency(sub.amount),
          sub.isRecurring ? 'Recurring' : 'One-time',
          format(new Date(sub.startDate), 'yyyy-MM-dd'),
          format(new Date(sub.endDate), 'yyyy-MM-dd'),
          sub.nextBillingDate ? format(new Date(sub.nextBillingDate), 'yyyy-MM-dd') : 'N/A'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `subscriptions-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('Subscriptions exported successfully');
    } catch (error) {
      console.error('Error exporting subscriptions:', error);
      setError('Failed to export subscriptions');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSubscriptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Subscription Management
      </Typography>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <People color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Subscriptions
                    </Typography>
                    <Typography variant="h5">
                      {stats.total}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp color="success" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Active Subscriptions
                    </Typography>
                    <Typography variant="h5">
                      {stats.active}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Autorenew color="info" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Recurring Subscriptions
                    </Typography>
                    <Typography variant="h5">
                      {stats.recurring}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachMoney color="warning" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Due for Renewal
                    </Typography>
                    <Typography variant="h5">
                      {stats.dueForRenewal}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Cancel color="error" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Failed Renewals
                    </Typography>
                    <Typography variant="h5">
                      {stats.failedRenewals}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={maintenanceLoading ? <CircularProgress size={20} /> : <PlayArrow />}
          onClick={runMaintenance}
          disabled={maintenanceLoading}
        >
          Run Maintenance
        </Button>
        <Button
          variant="outlined"
          startIcon={<FilterList />}
          onClick={() => setFilterDialogOpen(true)}
        >
          Filters
        </Button>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={exportSubscriptions}
        >
          Export
        </Button>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => {
            fetchStats();
            fetchSubscriptions(page);
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Subscriptions Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Subscriptions
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Plan</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell>Next Billing</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subscriptions.map((subscription) => (
                      <TableRow key={subscription._id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {subscription.user?.name || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {subscription.user?.email || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={subscription.plan.toUpperCase()}
                            size="small"
                            color={subscription.plan === 'yearly' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={subscription.status.toUpperCase()}
                            size="small"
                            color={getStatusColor(subscription.status)}
                          />
                        </TableCell>
                        <TableCell>{formatCurrency(subscription.amount)}</TableCell>
                        <TableCell>
                          <Chip
                            label={subscription.isRecurring ? 'Recurring' : 'One-time'}
                            size="small"
                            variant="outlined"
                            color={subscription.isRecurring ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {format(new Date(subscription.startDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(subscription.endDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {subscription.nextBillingDate
                            ? format(new Date(subscription.nextBillingDate), 'MMM dd, yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedSubscription(subscription);
                                setDetailsDialogOpen(true);
                              }}
                            >
                              <PlayArrow />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => {
                    setPage(value);
                    fetchSubscriptions(value);
                  }}
                  color="primary"
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filter Subscriptions</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Plan"
                value={filters.plan}
                onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="trial">Trial</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Type"
                value={filters.isRecurring}
                onChange={(e) => setFilters({ ...filters, isRecurring: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Recurring</MenuItem>
                <MenuItem value="false">One-time</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Search User"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Name or email"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={clearFilters}>Clear</Button>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button onClick={applyFilters} variant="contained">Apply</Button>
        </DialogActions>
      </Dialog>

      {/* Subscription Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Subscription Details</DialogTitle>
        <DialogContent>
          {selectedSubscription && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">User Information</Typography>
                <Typography variant="body1"><strong>Name:</strong> {selectedSubscription.user?.name || 'N/A'}</Typography>
                <Typography variant="body1"><strong>Email:</strong> {selectedSubscription.user?.email || 'N/A'}</Typography>
                <Typography variant="body1"><strong>Phone:</strong> {selectedSubscription.user?.phone || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Subscription Details</Typography>
                <Typography variant="body1"><strong>Plan:</strong> {selectedSubscription.plan?.toUpperCase()}</Typography>
                <Typography variant="body1"><strong>Status:</strong>
                  <Chip
                    label={selectedSubscription.status?.toUpperCase()}
                    size="small"
                    color={getStatusColor(selectedSubscription.status)}
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="body1"><strong>Amount:</strong> {formatCurrency(selectedSubscription.amount)}</Typography>
                <Typography variant="body1"><strong>Type:</strong> {selectedSubscription.isRecurring ? 'Recurring' : 'One-time'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Dates</Typography>
                <Typography variant="body1"><strong>Start Date:</strong> {format(new Date(selectedSubscription.startDate), 'MMM dd, yyyy')}</Typography>
                <Typography variant="body1"><strong>End Date:</strong> {format(new Date(selectedSubscription.endDate), 'MMM dd, yyyy')}</Typography>
                <Typography variant="body1"><strong>Next Billing:</strong> {selectedSubscription.nextBillingDate ? format(new Date(selectedSubscription.nextBillingDate), 'MMM dd, yyyy') : 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Payment Information</Typography>
                <Typography variant="body1"><strong>Payment ID:</strong> {selectedSubscription.paymentId}</Typography>
                <Typography variant="body1"><strong>Order ID:</strong> {selectedSubscription.orderId}</Typography>
                <Typography variant="body1"><strong>Provider:</strong> {selectedSubscription.paymentProvider}</Typography>
                {selectedSubscription.razorpaySubscriptionId && (
                  <Typography variant="body1"><strong>Razorpay Sub ID:</strong> {selectedSubscription.razorpaySubscriptionId}</Typography>
                )}
              </Grid>
              {selectedSubscription.isRecurring && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Auto-Renewal Information</Typography>
                  <Typography variant="body1"><strong>Auto Renew:</strong> {selectedSubscription.autoRenew ? 'Yes' : 'No'}</Typography>
                  <Typography variant="body1"><strong>Failed Payment Count:</strong> {selectedSubscription.failedPaymentCount || 0}</Typography>
                  <Typography variant="body1"><strong>Last Successful Payment:</strong> {selectedSubscription.lastSuccessfulPayment ? format(new Date(selectedSubscription.lastSuccessfulPayment), 'MMM dd, yyyy HH:mm') : 'N/A'}</Typography>
                </Grid>
              )}
              {selectedSubscription.cancelReason && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Cancellation</Typography>
                  <Typography variant="body1"><strong>Reason:</strong> {selectedSubscription.cancelReason}</Typography>
                  <Typography variant="body1"><strong>Cancelled At:</strong> {format(new Date(selectedSubscription.cancelledAt), 'MMM dd, yyyy HH:mm')}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionManagement;
