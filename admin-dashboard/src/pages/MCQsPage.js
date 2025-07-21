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

  Radio,
  RadioGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Quiz as QuizIcon
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { adminService } from '../services/adminService';

const MCQsPage = () => {
  const { selectedApp } = useApp();
  const [mcqs, setMCQs] = useState([]);
  const [topics, setTopics] = useState([]);
  const [, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMCQ, setEditingMCQ] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topic: '',
    difficulty: 'beginner',
    estimatedTime: 15,
    passingScore: 70,
    isPremium: false,
    questions: [
      {
        questionText: '',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ],
        explanation: '',
        difficulty: 'easy',
        points: 1,
        order: 0
      }
    ]
  });

  useEffect(() => {
    fetchMCQs();
    fetchTopics();
  }, [selectedApp, page, rowsPerPage, searchTerm, selectedTopic, selectedDifficulty]);

  const fetchMCQs = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedTopic && { topic: selectedTopic }),
        ...(selectedDifficulty && { difficulty: selectedDifficulty })
      };

      const response = await adminService.getMCQs(params);
      setMCQs(response.data);
      setTotalCount(response.pagination.total);
    } catch (error) {
      console.error('Error fetching MCQs:', error);
      showSnackbar('Error fetching MCQs', 'error');
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

  const handleCreateMCQ = () => {
    setEditingMCQ(null);
    setFormData({
      title: '',
      description: '',
      topic: '',
      difficulty: 'beginner',
      estimatedTime: 15,
      passingScore: 70,
      isPremium: false,
      questions: [
        {
          questionText: '',
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ],
          explanation: '',
          difficulty: 'easy',
          points: 1,
          order: 0
        }
      ]
    });
    setOpenDialog(true);
  };

  const handleEditMCQ = (mcq) => {
    setEditingMCQ(mcq);
    setFormData({
      title: mcq.title,
      description: mcq.description || '',
      topic: mcq.topic._id,
      difficulty: mcq.difficulty,
      estimatedTime: mcq.estimatedTime,
      passingScore: mcq.passingScore,
      isPremium: mcq.isPremium,
      questions: mcq.questions.map((q, index) => ({
        questionText: q.questionText,
        options: q.options.map(opt => ({
          text: opt.text,
          isCorrect: opt.isCorrect
        })),
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'easy',
        points: q.points || 1,
        order: index
      }))
    });
    setOpenDialog(true);
  };

  const handleDeleteMCQ = async (id) => {
    if (window.confirm('Are you sure you want to delete this MCQ?')) {
      try {
        await adminService.deleteMCQ(id);
        showSnackbar('MCQ deleted successfully', 'success');
        fetchMCQs();
      } catch (error) {
        console.error('Error deleting MCQ:', error);
        showSnackbar('Error deleting MCQ', 'error');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate that each question has exactly one correct answer
      for (let i = 0; i < formData.questions.length; i++) {
        const correctCount = formData.questions[i].options.filter(opt => opt.isCorrect).length;
        if (correctCount !== 1) {
          showSnackbar(`Question ${i + 1} must have exactly one correct answer`, 'error');
          return;
        }
      }

      const mcqData = {
        ...formData,
        questions: formData.questions.map((q, index) => ({
          ...q,
          order: index
        }))
      };

      if (editingMCQ) {
        await adminService.updateMCQ(editingMCQ._id, mcqData);
        showSnackbar('MCQ updated successfully', 'success');
      } else {
        await adminService.createMCQ(mcqData);
        showSnackbar('MCQ created successfully', 'success');
      }

      setOpenDialog(false);
      fetchMCQs();
    } catch (error) {
      console.error('Error saving MCQ:', error);
      showSnackbar('Error saving MCQ', 'error');
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          questionText: '',
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ],
          explanation: '',
          difficulty: 'easy',
          points: 1,
          order: formData.questions.length
        }
      ]
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      questions: newQuestions.map((q, i) => ({ ...q, order: i }))
    });
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateOption = (questionIndex, optionIndex, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options[optionIndex] = {
      ...newQuestions[questionIndex].options[optionIndex],
      [field]: value
    };

    // If setting this option as correct, unset others
    if (field === 'isCorrect' && value) {
      newQuestions[questionIndex].options.forEach((opt, i) => {
        if (i !== optionIndex) opt.isCorrect = false;
      });
    }

    setFormData({ ...formData, questions: newQuestions });
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
          <QuizIcon /> Multiple Choice Questions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateMCQ}
          sx={{ borderRadius: 2 }}
        >
          Create MCQ
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search MCQs"
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

      {/* MCQs Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Topic</TableCell>
              <TableCell>Difficulty</TableCell>
              <TableCell>Questions</TableCell>
              <TableCell>Pass Rate</TableCell>
              <TableCell>Attempts</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mcqs.map((mcq) => (
              <TableRow key={mcq._id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">{mcq.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {mcq.description}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{mcq.topic?.title}</TableCell>
                <TableCell>
                  <Chip
                    label={mcq.difficulty}
                    color={getDifficultyColor(mcq.difficulty)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{mcq.metadata?.totalQuestions || 0}</TableCell>
                <TableCell>{mcq.metadata?.passRate || 0}%</TableCell>
                <TableCell>{mcq.metadata?.totalAttempts || 0}</TableCell>
                <TableCell>
                  <Chip
                    label={mcq.isActive ? 'Active' : 'Inactive'}
                    color={mcq.isActive ? 'success' : 'default'}
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
                    <IconButton size="small" onClick={() => handleEditMCQ(mcq)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDeleteMCQ(mcq._id)}>
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
          {editingMCQ ? 'Edit MCQ' : 'Create New MCQ'}
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Estimated Time (minutes)"
                type="number"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) })}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Passing Score (%)"
                type="number"
                value={formData.passingScore}
                onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>

            {/* Questions Section */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Questions</Typography>
              {formData.questions.map((question, questionIndex) => (
                <Card key={questionIndex} sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">Question {questionIndex + 1}</Typography>
                      {formData.questions.length > 1 && (
                        <IconButton onClick={() => removeQuestion(questionIndex)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Question Text"
                          value={question.questionText}
                          onChange={(e) => updateQuestion(questionIndex, 'questionText', e.target.value)}
                          multiline
                          rows={2}
                          required
                        />
                      </Grid>

                      {/* Options */}
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Options (Select the correct answer)</Typography>
                        <RadioGroup
                          value={question.options.findIndex(opt => opt.isCorrect)}
                          onChange={(e) => {
                            const correctIndex = parseInt(e.target.value);
                            question.options.forEach((opt, i) => {
                              updateOption(questionIndex, i, 'isCorrect', i === correctIndex);
                            });
                          }}
                        >
                          {question.options.map((option, optionIndex) => (
                            <Box key={optionIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Radio value={optionIndex} />
                              <TextField
                                fullWidth
                                label={`Option ${optionIndex + 1}`}
                                value={option.text}
                                onChange={(e) => updateOption(questionIndex, optionIndex, 'text', e.target.value)}
                                required
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          ))}
                        </RadioGroup>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Question Difficulty</InputLabel>
                          <Select
                            value={question.difficulty}
                            onChange={(e) => updateQuestion(questionIndex, 'difficulty', e.target.value)}
                            label="Question Difficulty"
                          >
                            <MenuItem value="easy">Easy</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="hard">Hard</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Points"
                          type="number"
                          value={question.points}
                          onChange={(e) => updateQuestion(questionIndex, 'points', parseInt(e.target.value))}
                          inputProps={{ min: 1 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Explanation (optional)"
                          value={question.explanation}
                          onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                          multiline
                          rows={2}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addQuestion}
                sx={{ mt: 1 }}
              >
                Add Question
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingMCQ ? 'Update' : 'Create'}
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

export default MCQsPage;
