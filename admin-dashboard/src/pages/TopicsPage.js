import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Avatar,
  Grid,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Refresh,
  Topic as TopicIcon,
  Category as CategoryIcon,
  VideoLibrary,
  CloudUpload,
} from '@mui/icons-material';
import { adminService } from '../services/adminService';
import { uploadService } from '../services/uploadService';
import { format } from 'date-fns';

const TopicsPage = () => {
  const [topics, setTopics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    thumbnail: '',
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchTopics();
    fetchCategories();
  }, [page, rowsPerPage, selectedCategory]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await adminService.getTopics(page + 1, rowsPerPage, selectedCategory);
      if (response.success) {
        setTopics(response.data || []);
        setTotalCount(response.pagination?.total || 0);
      } else {
        setError('Failed to fetch topics');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch topics');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminService.getCategories(1, 100);
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    fetchTopics();
  };

  const handleDelete = async (topicId, topicTitle) => {
    if (window.confirm(`Are you sure you want to delete the topic "${topicTitle}"? This action cannot be undone.`)) {
      try {
        await adminService.deleteTopic(topicId);
        fetchTopics();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete topic');
      }
    }
  };

  const handleOpenDialog = (topic = null) => {
    if (topic) {
      setEditingTopic(topic);
      setFormData({
        title: topic.title || '',
        description: topic.description || '',
        category: topic.category?._id || '',
        thumbnail: topic.thumbnail || '',
        order: topic.order || 0,
        isActive: topic.isActive !== false,
      });
    } else {
      setEditingTopic(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        thumbnail: '',
        order: 0,
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTopic(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      thumbnail: '',
      order: 0,
      isActive: true,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleThumbnailUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const response = await uploadService.uploadTopicThumbnail(file);
      if (response.success) {
        setFormData(prev => ({
          ...prev,
          thumbnail: response.data.url,
        }));
      }
    } catch (err) {
      setError('Failed to upload thumbnail');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingTopic) {
        await adminService.updateTopic(editingTopic._id, formData);
      } else {
        await adminService.createTopic(formData);
      }
      handleCloseDialog();
      fetchTopics();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save topic');
    }
  };

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
    setPage(0);
  };

  if (loading && topics.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Topics Management
        </Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={loading} sx={{ mr: 1 }}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Topic
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Category Filter */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Filter by Category</InputLabel>
            <Select
              value={selectedCategory}
              label="Filter by Category"
              onChange={(e) => handleCategoryFilter(e.target.value)}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category._id} value={category._id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Thumbnail</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Videos</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topics.map((topic) => (
                  <TableRow key={topic._id}>
                    <TableCell>
                      <Avatar
                        src={topic.thumbnail}
                        sx={{ width: 40, height: 40 }}
                      >
                        <TopicIcon />
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {topic.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {topic.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<CategoryIcon />}
                        label={topic.category?.name || 'No Category'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<VideoLibrary />}
                        label={`${topic.videoCount || 0} videos`}
                        size="small"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={topic.isActive ? 'Active' : 'Inactive'}
                        color={topic.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{topic.order}</TableCell>
                    <TableCell>
                      {topic.createdAt ? format(new Date(topic.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit Topic">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(topic)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Topic">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(topic._id, topic.title)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTopic ? 'Edit Topic' : 'Create New Topic'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    label="Category"
                    onChange={handleInputChange}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Order"
                  name="order"
                  type="number"
                  value={formData.order}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload Thumbnail'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                    />
                  </Button>
                  {formData.thumbnail && (
                    <Avatar src={formData.thumbnail} sx={{ width: 50, height: 50 }} />
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.title || !formData.category}
          >
            {editingTopic ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TopicsPage;
