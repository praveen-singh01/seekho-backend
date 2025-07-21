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
  Card,
  CardContent,
  Tooltip,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  School as SchoolIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { adminService } from '../services/adminService';

const LearningModulesPage = () => {
  const { selectedApp } = useApp();
  const [modules, setModules] = useState([]);
  const [topics, setTopics] = useState([]);
  const [questionnaires, setQuestionnaires] = useState([]);
  const [mcqs, setMCQs] = useState([]);
  const [videos, setVideos] = useState([]);
  const [, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
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
    fetchContent();
  }, [selectedApp, page, rowsPerPage, searchTerm, selectedTopic, selectedDifficulty]);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedTopic && { topic: selectedTopic }),
        ...(selectedDifficulty && { difficulty: selectedDifficulty })
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

  const fetchContent = async () => {
    try {
      const [questionnairesRes, mcqsRes, videosRes] = await Promise.all([
        adminService.getQuestionnaires({ limit: 100 }),
        adminService.getMCQs({ limit: 100 }),
        adminService.getVideos({ limit: 100 })
      ]);
      
      setQuestionnaires(questionnairesRes.data);
      setMCQs(mcqsRes.data);
      setVideos(videosRes.data);
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const handleCreateModule = () => {
    setEditingModule(null);
    setFormData({
      title: '',
      description: '',
      topic: '',
      difficulty: 'beginner',
      isPremium: false,
      content: []
    });
    setOpenDialog(true);
  };

  const handleEditModule = (module) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      description: module.description || '',
      topic: module.topic._id,
      difficulty: module.difficulty,
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

  const addContent = (contentType, contentId, contentModel, title) => {
    const newContent = {
      contentType,
      contentId,
      contentModel,
      title, // For display purposes
      order: formData.content.length,
      isRequired: true
    };

    setFormData({
      ...formData,
      content: [...formData.content, newContent]
    });
  };

  const removeContent = (index) => {
    const newContent = formData.content.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      content: newContent.map((item, i) => ({ ...item, order: i }))
    });
  };

  const moveContent = (fromIndex, toIndex) => {
    const newContent = [...formData.content];
    const [movedItem] = newContent.splice(fromIndex, 1);
    newContent.splice(toIndex, 0, movedItem);
    
    setFormData({
      ...formData,
      content: newContent.map((item, i) => ({ ...item, order: i }))
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

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'video': return '🎥';
      case 'questionnaire': return '📝';
      case 'mcq': return '❓';
      default: return '📄';
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
        </Grid>
      </Paper>

      {/* Modules Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Topic</TableCell>
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
