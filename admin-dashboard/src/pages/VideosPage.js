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
  LinearProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Refresh,
  VideoLibrary,
  Topic as TopicIcon,
  CloudUpload,
  PlayArrow,
} from '@mui/icons-material';
import { adminService } from '../services/adminService';
import { uploadService } from '../services/uploadService';
import { format } from 'date-fns';

const VideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topic: '',
    videoUrl: '',
    thumbnail: '',
    duration: 0,
    episodeNumber: 1,
    isActive: true,
    isPremium: false,
  });

  useEffect(() => {
    fetchVideos();
    fetchTopics();
  }, [page, rowsPerPage, selectedTopic]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await adminService.getVideos(page + 1, rowsPerPage, selectedTopic);
      if (response.success) {
        setVideos(response.data || []);
        setTotalCount(response.pagination?.total || 0);
      } else {
        setError('Failed to fetch videos');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await adminService.getTopics(1, 100);
      if (response.success) {
        setTopics(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch topics:', err);
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
    fetchVideos();
  };

  const handleOpenDialog = (video = null) => {
    if (video) {
      setEditingVideo(video);
      setFormData({
        title: video.title || '',
        description: video.description || '',
        topic: video.topic?._id || '',
        videoUrl: video.videoUrl || '',
        thumbnail: video.thumbnail || '',
        duration: video.duration || 0,
        episodeNumber: video.episodeNumber || 1,
        isActive: video.isActive !== false,
        isPremium: video.isPremium || false,
      });
    } else {
      setEditingVideo(null);
      setFormData({
        title: '',
        description: '',
        topic: '',
        videoUrl: '',
        thumbnail: '',
        duration: 0,
        episodeNumber: 1,
        isActive: true,
        isPremium: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVideo(null);
    setUploadProgress(0);
    setFormData({
      title: '',
      description: '',
      topic: '',
      videoUrl: '',
      thumbnail: '',
      duration: 0,
      episodeNumber: 1,
      isActive: true,
      isPremium: false,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const response = await uploadService.uploadVideo(file, (progress) => {
        setUploadProgress(progress);
      });

      if (response.success) {
        setFormData(prev => ({
          ...prev,
          videoUrl: response.data.url,
        }));
      } else {
        setError('Upload failed: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      setError('Failed to upload video: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleThumbnailUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const response = await uploadService.uploadVideoThumbnail(file);
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
      if (editingVideo) {
        await adminService.updateVideo(editingVideo._id, formData);
      } else {
        await adminService.createVideo(formData);
      }
      handleCloseDialog();
      fetchVideos();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save video');
    }
  };

  const handleDelete = async (videoId, videoTitle) => {
    if (window.confirm(`Are you sure you want to delete the video "${videoTitle}"? This action cannot be undone.`)) {
      try {
        await adminService.deleteVideo(videoId);
        fetchVideos();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete video');
      }
    }
  };

  const handleTopicFilter = (topicId) => {
    setSelectedTopic(topicId);
    setPage(0);
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading && videos.length === 0) {
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
          Videos Management
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
            Add Video
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Topic Filter */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Filter by Topic</InputLabel>
            <Select
              value={selectedTopic}
              label="Filter by Topic"
              onChange={(e) => handleTopicFilter(e.target.value)}
            >
              <MenuItem value="">All Topics</MenuItem>
              {topics.map((topic) => (
                <MenuItem key={topic._id} value={topic._id}>
                  {topic.title}
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
                  <TableCell>Topic</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Views</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Premium</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {videos.map((video) => (
                  <TableRow key={video._id}>
                    <TableCell>
                      <Avatar
                        src={video.thumbnail}
                        sx={{ width: 60, height: 40, borderRadius: 1 }}
                      >
                        <VideoLibrary />
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {video.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {video.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<TopicIcon />}
                        label={video.topic?.title || 'No Topic'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {video.duration ? formatDuration(video.duration) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<PlayArrow />}
                        label={`${video.views || 0} views`}
                        size="small"
                        color="info"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={video.isActive ? 'Active' : 'Inactive'}
                        color={video.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={video.isPremium ? 'Premium' : 'Free'}
                        color={video.isPremium ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {video.createdAt ? format(new Date(video.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit Video">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(video)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Video">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(video._id, video.title)}
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
          {editingVideo ? 'Edit Video' : 'Create New Video'}
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
                  <InputLabel>Topic</InputLabel>
                  <Select
                    name="topic"
                    value={formData.topic}
                    label="Topic"
                    onChange={handleInputChange}
                  >
                    {topics.map((topic) => (
                      <MenuItem key={topic._id} value={topic._id}>
                        {topic.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Duration (seconds)"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Episode Number"
                  name="episodeNumber"
                  type="number"
                  value={formData.episodeNumber}
                  onChange={handleInputChange}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        name="isActive"
                      />
                    }
                    label="Active"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isPremium}
                        onChange={handleInputChange}
                        name="isPremium"
                      />
                    }
                    label="Premium"
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading Video...' : 'Upload Video'}
                    <input
                      type="file"
                      hidden
                      accept="video/*"
                      onChange={handleVideoUpload}
                    />
                  </Button>
                  {formData.videoUrl && (
                    <Chip label="Video Uploaded" color="success" />
                  )}
                </Box>
                {uploadProgress > 0 && (
                  <LinearProgress variant="determinate" value={uploadProgress} />
                )}
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
            disabled={!formData.title || !formData.topic || !formData.videoUrl || !formData.duration || !formData.episodeNumber}
          >
            {editingVideo ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VideosPage;
