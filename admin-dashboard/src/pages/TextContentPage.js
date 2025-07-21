import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { adminService } from '../services/adminService';

const TextContentPage = () => {
  const { selectedApp } = useApp();
  const [textContent, setTextContent] = useState([]);
  const [topics, setTopics] = useState([]);
  const [, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedContentType, setSelectedContentType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topic: '',
    contentType: 'summary',
    content: '',
    contentFormat: 'plain',
    difficulty: 'beginner',
    isPremium: false,
    tags: [],
    resources: []
  });

  const contentTypes = [
    { value: 'summary', label: 'Summary' },
    { value: 'reading', label: 'Reading Material' },
    { value: 'instructions', label: 'Instructions' },
    { value: 'notes', label: 'Notes' },
    { value: 'explanation', label: 'Explanation' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchTextContent();
    fetchTopics();
  }, [selectedApp, page, rowsPerPage, searchTerm, selectedTopic, selectedContentType, selectedDifficulty]);

  const fetchTextContent = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedTopic && { topic: selectedTopic }),
        ...(selectedContentType && { contentType: selectedContentType }),
        ...(selectedDifficulty && { difficulty: selectedDifficulty })
      };

      const response = await adminService.getTextContent(params);
      setTextContent(response.data);
      setTotalCount(response.pagination.total);
    } catch (error) {
      console.error('Error fetching text content:', error);
      showSnackbar('Error fetching text content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await adminService.getTopics({ limit: 100 });
      setTopics(response.data);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const handleCreateContent = () => {
    setEditingContent(null);
    setFormData({
      title: '',
      description: '',
      topic: '',
      contentType: 'summary',
      content: '',
      contentFormat: 'plain',
      difficulty: 'beginner',
      isPremium: false,
      tags: [],
      resources: []
    });
    setOpenDialog(true);
  };

  const handleEditContent = (content) => {
    setEditingContent(content);
    setFormData({
      title: content.title,
      description: content.description || '',
      topic: content.topic._id,
      contentType: content.contentType,
      content: content.content,
      contentFormat: content.contentFormat,
      difficulty: content.difficulty,
      isPremium: content.isPremium,
      tags: content.tags || [],
      resources: content.resources || []
    });
    setOpenDialog(true);
  };

  const handleDeleteContent = async (id) => {
    if (window.confirm('Are you sure you want to delete this text content?')) {
      try {
        await adminService.deleteTextContent(id);
        showSnackbar('Text content deleted successfully', 'success');
        fetchTextContent();
      } catch (error) {
        console.error('Error deleting text content:', error);
        showSnackbar('Error deleting text content', 'error');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const contentData = {
        ...formData,
        tags: typeof formData.tags === 'string' ? formData.tags.split(',').map(tag => tag.trim()) : formData.tags
      };

      if (editingContent) {
        await adminService.updateTextContent(editingContent._id, contentData);
        showSnackbar('Text content updated successfully', 'success');
      } else {
        await adminService.createTextContent(contentData);
        showSnackbar('Text content created successfully', 'success');
      }

      setOpenDialog(false);
      fetchTextContent();
    } catch (error) {
      console.error('Error saving text content:', error);
      showSnackbar('Error saving text content', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const getContentTypeColor = (contentType) => {
    switch (contentType) {
      case 'summary': return 'primary';
      case 'reading': return 'secondary';
      case 'instructions': return 'warning';
      case 'notes': return 'info';
      case 'explanation': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ArticleIcon /> Text Content
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateContent}
          sx={{ borderRadius: 2 }}
        >
          Create Text Content
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search content"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Topic</InputLabel>
              <Select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                label="Topic"
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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Content Type</InputLabel>
              <Select
                value={selectedContentType}
                onChange={(e) => setSelectedContentType(e.target.value)}
                label="Content Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {contentTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                label="Difficulty"
              >
                <MenuItem value="">All Difficulties</MenuItem>
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Content Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Topic</TableCell>
              <TableCell>Content Type</TableCell>
              <TableCell>Difficulty</TableCell>
              <TableCell>Reading Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {textContent.map((content) => (
              <TableRow key={content._id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">{content.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {content.description}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{content.topic?.title}</TableCell>
                <TableCell>
                  <Chip
                    label={content.contentType.toUpperCase()}
                    color={getContentTypeColor(content.contentType)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={content.difficulty}
                    color={getDifficultyColor(content.difficulty)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{content.estimatedReadingTime} min</TableCell>
                <TableCell>
                  <Chip
                    label={content.isActive ? 'Active' : 'Inactive'}
                    color={content.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View">
                    <IconButton size="small">
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleEditContent(content)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDeleteContent(content._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingContent ? 'Edit Text Content' : 'Create New Text Content'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Topic</InputLabel>
                <Select
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  label="Topic"
                >
                  {topics.map((topic) => (
                    <MenuItem key={topic._id} value={topic._id}>
                      {topic.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Content Type</InputLabel>
                <Select
                  value={formData.contentType}
                  onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                  label="Content Type"
                >
                  {contentTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  label="Difficulty"
                >
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Content Format</InputLabel>
                <Select
                  value={formData.contentFormat}
                  onChange={(e) => setFormData({ ...formData, contentFormat: e.target.value })}
                  label="Content Format"
                >
                  <MenuItem value="plain">Plain Text</MenuItem>
                  <MenuItem value="markdown">Markdown</MenuItem>
                  <MenuItem value="html">HTML</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPremium}
                    onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                  />
                }
                label="Premium Content"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                multiline
                rows={8}
                required
                helperText="Enter the main content. Use markdown formatting if selected above."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                helperText="Enter tags separated by commas (e.g., grammar, tenses, beginner)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingContent ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TextContentPage;
