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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { adminService } from '../services/adminService';

const LearningModulesPage = () => {
  const { selectedApp } = useApp();
  const [modules, setModules] = useState([]);
  const [topics, setTopics] = useState([]);
  const [availableContent, setAvailableContent] = useState([]);
  const [selectedContentType, setSelectedContentType] = useState('');
  const [contentSearchTerm, setContentSearchTerm] = useState('');
  const [, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topic: '',
    difficulty: 'beginner',
    isPremium: false,
    content: []
  });

  useEffect(() => {
    fetchModules();
    fetchTopics();
  }, [selectedApp, page, rowsPerPage, searchTerm, selectedTopic, selectedDifficulty, selectedClass]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchModules = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedTopic && { topic: selectedTopic }),
        ...(selectedDifficulty && { difficulty: selectedDifficulty }),
        ...(selectedClass && { classNumber: selectedClass })
      };

      const response = await adminService.getLearningModules(params);
      setModules(response.data);
      setTotalCount(response.pagination.total);
    } catch (error) {
      console.error('Error fetching learning modules:', error);
      showSnackbar('Error fetching learning modules', 'error');
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

  const fetchContentByType = async (contentType) => {
    try {
      let response;
      console.log('Fetching content for type:', contentType);
      switch (contentType) {
        case 'questionnaire':
          response = await adminService.getQuestionnaires({ limit: 100 });
          break;
        case 'mcq':
          response = await adminService.getMCQs({ limit: 100 });
          break;
        case 'text':
          response = await adminService.getTextContent({ limit: 100 });
          break;
        case 'video':
          response = await adminService.getVideos({ limit: 100, page: 1 });
          break;
        default:
          setAvailableContent([]);
          return;
      }
      console.log('Content response:', response);
      setAvailableContent(response.data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      setAvailableContent([]);
    }
  };



  const handleCreateModule = () => {
    setEditingModule(null);
    setFormData({
      title: '',
      description: '',
      topic: '',
      difficulty: 'beginner',
      classNumber: '',
      isPremium: false,
      content: []
    });
    setSelectedContentType('');
    setContentSearchTerm('');
    setAvailableContent([]);
    setOpenDialog(true);
  };

  const handleEditModule = (module) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      description: module.description || '',
      topic: module.topic._id,
      difficulty: module.difficulty,
      classNumber: module.classNumber || '',
      isPremium: module.isPremium,
      content: module.content.map((item, index) => ({
        contentType: item.contentType,
        contentId: item.contentId,
        contentModel: item.contentModel,
        order: index,
        isRequired: item.isRequired
      }))
    });
    setOpenDialog(true);
  };

  const handleDeleteModule = async (id) => {
    if (window.confirm('Are you sure you want to delete this learning module?')) {
      try {
        await adminService.deleteLearningModule(id);
        showSnackbar('Learning module deleted successfully', 'success');
        fetchModules();
      } catch (error) {
        console.error('Error deleting learning module:', error);
        showSnackbar('Error deleting learning module', 'error');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const moduleData = {
        ...formData,
        content: formData.content.map((item, index) => ({
          ...item,
          order: index
        }))
      };

      if (editingModule) {
        await adminService.updateLearningModule(editingModule._id, moduleData);
        showSnackbar('Learning module updated successfully', 'success');
      } else {
        await adminService.createLearningModule(moduleData);
        showSnackbar('Learning module created successfully', 'success');
      }

      setOpenDialog(false);
      fetchModules();
    } catch (error) {
      console.error('Error saving learning module:', error);
      showSnackbar('Error saving learning module', 'error');
    }
  };



  const handleContentTypeChange = (contentType) => {
    setSelectedContentType(contentType);
    setContentSearchTerm('');
    if (contentType) {
      fetchContentByType(contentType);
    } else {
      setAvailableContent([]);
    }
  };

  const getContentModel = (contentType) => {
    switch (contentType) {
      case 'questionnaire':
        return 'Questionnaire';
      case 'mcq':
        return 'MCQ';
      case 'text':
      case 'summary':
      case 'reading':
      case 'instructions':
      case 'notes':
      case 'explanation':
        return 'TextContent';
      case 'video':
        return 'Video';
      default:
        return 'TextContent';
    }
  };

  const addContentToModule = (content) => {
    const newContentItem = {
      contentType: selectedContentType,
      contentId: content._id,
      contentModel: getContentModel(selectedContentType),
      title: content.title,
      order: formData.content.length,
      isRequired: true
    };

    setFormData({
      ...formData,
      content: [...formData.content, newContentItem]
    });

    // Clear search and reset
    setContentSearchTerm('');
  };

  const removeContent = (index) => {
    const newContent = formData.content.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      content: newContent.map((item, i) => ({ ...item, order: i }))
    });
  };

  const getFilteredContent = () => {
    if (!availableContent) return [];

    return availableContent.filter(content => {
      const matchesSearch = !contentSearchTerm ||
        content.title.toLowerCase().includes(contentSearchTerm.toLowerCase()) ||
        (content.description && content.description.toLowerCase().includes(contentSearchTerm.toLowerCase()));

      // Don't show content that's already added to the module
      const notAlreadyAdded = !formData.content.some(item =>
        item.contentId === content._id && item.contentType === selectedContentType
      );

      return matchesSearch && notAlreadyAdded;
    });
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



  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon /> Learning Modules
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateModule}
          sx={{ borderRadius: 2 }}
        >
          Create Module
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search modules"
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
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                label="Class"
              >
                <MenuItem value="">All Classes</MenuItem>
                <MenuItem value={1}>Class 1</MenuItem>
                <MenuItem value={2}>Class 2</MenuItem>
                <MenuItem value={3}>Class 3</MenuItem>
                <MenuItem value={4}>Class 4</MenuItem>
                <MenuItem value={5}>Class 5</MenuItem>
                <MenuItem value={6}>Class 6</MenuItem>
                <MenuItem value={7}>Class 7</MenuItem>
                <MenuItem value={8}>Class 8</MenuItem>
                <MenuItem value={9}>Class 9</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Modules Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Topic</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Difficulty</TableCell>
              <TableCell>Content Items</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {modules.map((module) => (
              <TableRow key={module._id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">{module.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {module.description}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{module.topic?.title}</TableCell>
                <TableCell>
                  {module.classNumber ? (
                    <Chip
                      label={`Class ${module.classNumber}`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No Class
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={module.difficulty}
                    color={getDifficultyColor(module.difficulty)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {module.metadata?.totalVideos > 0 && (
                      <Chip label={`${module.metadata.totalVideos} Videos`} size="small" />
                    )}
                    {module.metadata?.totalQuestionnaires > 0 && (
                      <Chip label={`${module.metadata.totalQuestionnaires} Q&A`} size="small" />
                    )}
                    {module.metadata?.totalMCQs > 0 && (
                      <Chip label={`${module.metadata.totalMCQs} MCQs`} size="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>{module.estimatedDuration} min</TableCell>
                <TableCell>
                  <Chip
                    label={module.isActive ? 'Active' : 'Inactive'}
                    color={module.isActive ? 'success' : 'default'}
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
                    <IconButton size="small" onClick={() => handleEditModule(module)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDeleteModule(module._id)}>
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
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingModule ? 'Edit Learning Module' : 'Create New Learning Module'}
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
                rows={3}
              />
            </Grid>
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={6}>
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
                <InputLabel>Class Number</InputLabel>
                <Select
                  value={formData.classNumber}
                  onChange={(e) => setFormData({ ...formData, classNumber: e.target.value })}
                  label="Class Number"
                >
                  <MenuItem value="">No Class (General)</MenuItem>
                  <MenuItem value={1}>Class 1</MenuItem>
                  <MenuItem value={2}>Class 2</MenuItem>
                  <MenuItem value={3}>Class 3</MenuItem>
                  <MenuItem value={4}>Class 4</MenuItem>
                  <MenuItem value={5}>Class 5</MenuItem>
                  <MenuItem value={6}>Class 6</MenuItem>
                  <MenuItem value={7}>Class 7</MenuItem>
                  <MenuItem value={8}>Class 8</MenuItem>
                  <MenuItem value={9}>Class 9</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isPremium}
                    onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                  />
                }
                label="Premium Content"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Content Items</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add content items to this learning module. You can add videos, questionnaires, MCQs, and text content.
              </Typography>

              {/* Add Content Section */}
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Add Content to Module</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Content Type</InputLabel>
                      <Select
                        value={selectedContentType}
                        label="Content Type"
                        onChange={(e) => handleContentTypeChange(e.target.value)}
                      >
                        <MenuItem value="">Select Type</MenuItem>
                        <MenuItem value="questionnaire">Questionnaires</MenuItem>
                        <MenuItem value="mcq">MCQs</MenuItem>
                        <MenuItem value="text">Text Content</MenuItem>
                        <MenuItem value="video">Videos</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search content..."
                      placeholder="Search by title"
                      value={contentSearchTerm}
                      onChange={(e) => setContentSearchTerm(e.target.value)}
                      disabled={!selectedContentType}
                      helperText={!selectedContentType ? "Select a content type first" : `${getFilteredContent().length} items available`}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      disabled={!selectedContentType || getFilteredContent().length === 0}
                      sx={{ height: '40px' }}
                      onClick={() => {
                        const filtered = getFilteredContent();
                        if (filtered.length > 0) {
                          addContentToModule(filtered[0]);
                        }
                      }}
                    >
                      Add First
                    </Button>
                  </Grid>
                </Grid>

                {/* Available Content List */}
                {selectedContentType && (
                  <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      Available {selectedContentType} content (click to add):
                    </Typography>
                    {getFilteredContent().length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', p: 1 }}>
                        {availableContent.length === 0
                          ? `No ${selectedContentType} content found. Create some first.`
                          : 'All available content is already added to this module.'
                        }
                      </Typography>
                    ) : (
                      <List dense>
                        {getFilteredContent().slice(0, 5).map((content) => (
                          <ListItem
                            key={content._id}
                            button
                            onClick={() => addContentToModule(content)}
                            sx={{
                              bgcolor: 'background.paper',
                              mb: 0.5,
                              borderRadius: 1,
                              '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' }
                            }}
                          >
                            <ListItemText
                              primary={content.title}
                              secondary={content.description || `${selectedContentType} content`}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        ))}
                        {getFilteredContent().length > 5 && (
                          <Typography variant="caption" color="text.secondary" sx={{ p: 1 }}>
                            ... and {getFilteredContent().length - 5} more. Use search to find specific content.
                          </Typography>
                        )}
                      </List>
                    )}
                  </Box>
                )}
              </Paper>

              {/* Current Content Items */}
              {formData.content.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', p: 2, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1 }}>
                  No content items added yet. Use the section above to add content to this module.
                </Typography>
              ) : (
                <List>
                  {formData.content.map((item, index) => (
                    <ListItem key={index} sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}>
                      <ListItemText
                        primary={item.title || `${item.contentType} Content`}
                        secondary={`Type: ${item.contentType} | Order: ${item.order + 1}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton onClick={() => removeContent(index)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingModule ? 'Update' : 'Create'}
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

export default LearningModulesPage;
