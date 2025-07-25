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
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Switch,
  Tooltip,
  Alert,
  Snackbar
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

const QuestionnairesPage = () => {
  const { selectedApp } = useApp();
  const [questionnaires, setQuestionnaires] = useState([]);
  const [topics, setTopics] = useState([]);
  const [, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topic: '',
    difficulty: 'beginner',
    estimatedTime: 10,
    passingScore: 70,
    isPremium: false,
    questions: [
      {
        questionText: '',
        questionType: 'short_answer',
        isRequired: true,
        order: 0,
        hints: [],
        maxLength: 500,
        expectedAnswers: [],
        points: 1
      }
    ]
  });

  useEffect(() => {
    fetchQuestionnaires();
    fetchTopics();
  }, [selectedApp, page, rowsPerPage, searchTerm, selectedTopic, selectedDifficulty]);

  const fetchQuestionnaires = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedTopic && { topic: selectedTopic }),
        ...(selectedDifficulty && { difficulty: selectedDifficulty })
      };

      const response = await adminService.getQuestionnaires(params);
      setQuestionnaires(response.data);
      setTotalCount(response.pagination.total);
    } catch (error) {
      console.error('Error fetching questionnaires:', error);
      showSnackbar('Error fetching questionnaires', 'error');
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

  const handleCreateQuestionnaire = () => {
    setEditingQuestionnaire(null);
    setFormData({
      title: '',
      description: '',
      topic: '',
      difficulty: 'beginner',
      estimatedTime: 10,
      passingScore: 70,
      isPremium: false,
      questions: [
        {
          questionText: '',
          questionType: 'short_answer',
          isRequired: true,
          order: 0,
          hints: [],
          maxLength: 500,
          expectedAnswers: [],
          points: 1
        }
      ]
    });
    setOpenDialog(true);
  };

  const handleEditQuestionnaire = (questionnaire) => {
    setEditingQuestionnaire(questionnaire);
    setFormData({
      title: questionnaire.title,
      description: questionnaire.description || '',
      topic: questionnaire.topic._id,
      difficulty: questionnaire.difficulty,
      estimatedTime: questionnaire.estimatedTime,
      isPremium: questionnaire.isPremium,
      questions: questionnaire.questions.map((q, index) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        isRequired: q.isRequired,
        order: index,
        hints: q.hints || [],
        maxLength: q.maxLength || 500
      }))
    });
    setOpenDialog(true);
  };

  const handleDeleteQuestionnaire = async (id) => {
    if (window.confirm('Are you sure you want to delete this questionnaire?')) {
      try {
        await adminService.deleteQuestionnaire(id);
        showSnackbar('Questionnaire deleted successfully', 'success');
        fetchQuestionnaires();
      } catch (error) {
        console.error('Error deleting questionnaire:', error);
        showSnackbar('Error deleting questionnaire', 'error');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const questionnaireData = {
        ...formData,
        questions: formData.questions.map((q, index) => ({
          ...q,
          order: index
        }))
      };

      if (editingQuestionnaire) {
        await adminService.updateQuestionnaire(editingQuestionnaire._id, questionnaireData);
        showSnackbar('Questionnaire updated successfully', 'success');
      } else {
        await adminService.createQuestionnaire(questionnaireData);
        showSnackbar('Questionnaire created successfully', 'success');
      }

      setOpenDialog(false);
      fetchQuestionnaires();
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      showSnackbar('Error saving questionnaire', 'error');
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          questionText: '',
          questionType: 'short_answer',
          isRequired: true,
          order: formData.questions.length,
          hints: [],
          maxLength: 500,
          expectedAnswers: [],
          points: 1
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

  const addExpectedAnswer = (questionIndex) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].expectedAnswers.push('');
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const removeExpectedAnswer = (questionIndex, answerIndex) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].expectedAnswers.splice(answerIndex, 1);
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const updateExpectedAnswer = (questionIndex, answerIndex, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].expectedAnswers[answerIndex] = value;
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
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
          <QuizIcon /> Questionnaires
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateQuestionnaire}
          sx={{ borderRadius: 2 }}
        >
          Create Questionnaire
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search questionnaires"
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

      {/* Questionnaires Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Topic</TableCell>
              <TableCell>Difficulty</TableCell>
              <TableCell>Questions</TableCell>
              <TableCell>Responses</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {questionnaires.map((questionnaire) => (
              <TableRow key={questionnaire._id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">{questionnaire.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {questionnaire.description}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{questionnaire.topic?.title}</TableCell>
                <TableCell>
                  <Chip
                    label={questionnaire.difficulty}
                    color={getDifficultyColor(questionnaire.difficulty)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{questionnaire.metadata?.totalQuestions || 0}</TableCell>
                <TableCell>{questionnaire.metadata?.totalResponses || 0}</TableCell>
                <TableCell>
                  <Chip
                    label={questionnaire.isActive ? 'Active' : 'Inactive'}
                    color={questionnaire.isActive ? 'success' : 'default'}
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
                    <IconButton size="small" onClick={() => handleEditQuestionnaire(questionnaire)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDeleteQuestionnaire(questionnaire._id)}>
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
          {editingQuestionnaire ? 'Edit Questionnaire' : 'Create New Questionnaire'}
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
                helperText="Minimum score required to pass (0-100%)"
              />
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

            {/* Questions Section */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Questions</Typography>
              {formData.questions.map((question, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">Question {index + 1}</Typography>
                      {formData.questions.length > 1 && (
                        <IconButton onClick={() => removeQuestion(index)} color="error">
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
                          onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                          multiline
                          rows={2}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Question Type</InputLabel>
                          <Select
                            value={question.questionType}
                            onChange={(e) => updateQuestion(index, 'questionType', e.target.value)}
                            label="Question Type"
                          >
                            <MenuItem value="short_answer">Short Answer</MenuItem>
                            <MenuItem value="long_answer">Long Answer</MenuItem>
                            <MenuItem value="essay">Essay</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Max Length"
                          type="number"
                          value={question.maxLength}
                          onChange={(e) => updateQuestion(index, 'maxLength', parseInt(e.target.value))}
                          inputProps={{ min: 10 }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Points"
                          type="number"
                          value={question.points}
                          onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value))}
                          inputProps={{ min: 1 }}
                          helperText="Points awarded for correct answer"
                        />
                      </Grid>

                      {/* Expected Answers Section */}
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Expected Answers (for auto-scoring)
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                          Add expected answers to enable automatic scoring. Leave empty for manual review.
                        </Typography>
                        {question.expectedAnswers.map((answer, answerIndex) => (
                          <Box key={answerIndex} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder={`Expected answer ${answerIndex + 1}`}
                              value={answer}
                              onChange={(e) => updateExpectedAnswer(index, answerIndex, e.target.value)}
                            />
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeExpectedAnswer(index, answerIndex)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        ))}
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => addExpectedAnswer(index)}
                          sx={{ mt: 1 }}
                        >
                          Add Expected Answer
                        </Button>
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
            {editingQuestionnaire ? 'Update' : 'Create'}
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

export default QuestionnairesPage;
