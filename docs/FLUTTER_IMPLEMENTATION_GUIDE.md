# 📱 Flutter Implementation Guide - Bolo English Learning App

This comprehensive guide shows how to implement the enhanced Seekho Backend APIs in your Flutter application for the Bolo English learning platform.

## 🎯 Overview

The Bolo app (`com.gumbo.english`) now supports:
- **📝 Questionnaires** - Open-ended Q&A sessions
- **🧩 MCQs** - Multiple choice quizzes with instant feedback
- **🎓 Learning Modules** - Flexible content organization
- **📄 Text Content** - Summaries, reading materials, instructions, notes
- **📊 Answer Analytics** - Performance tracking

## 🔧 Setup & Configuration

### 1. Dependencies

Add these to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  shared_preferences: ^2.2.2
  provider: ^6.1.1
  json_annotation: ^4.8.1
  
dev_dependencies:
  build_runner: ^2.4.7
  json_serializable: ^6.7.1
```

### 2. API Configuration

Create `lib/config/api_config.dart`:

```dart
class ApiConfig {
  static const String baseUrl = 'http://localhost:8000'; // Change for production
  static const String packageId = 'com.gumbo.english'; // Bolo app package ID
  
  // API Endpoints
  static const String questionnaires = '/api/questionnaires';
  static const String mcqs = '/api/mcqs';
  static const String learningModules = '/api/learning-modules';
  static const String textContent = '/api/text-content';
  static const String auth = '/api/auth';
  
  // Headers
  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
    'X-Package-ID': packageId,
  };
  
  static Map<String, String> authHeaders(String token) => {
    ...headers,
    'Authorization': 'Bearer $token',
  };
}
```

### 3. HTTP Service

Create `lib/services/http_service.dart`:

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class HttpService {
  static Future<Map<String, dynamic>> get(String endpoint, {String? token}) async {
    final headers = token != null 
        ? ApiConfig.authHeaders(token) 
        : ApiConfig.headers;
    
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}$endpoint'),
      headers: headers,
    );
    
    return _handleResponse(response);
  }
  
  static Future<Map<String, dynamic>> post(
    String endpoint, 
    Map<String, dynamic> body, 
    {String? token}
  ) async {
    final headers = token != null 
        ? ApiConfig.authHeaders(token) 
        : ApiConfig.headers;
    
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}$endpoint'),
      headers: headers,
      body: jsonEncode(body),
    );
    
    return _handleResponse(response);
  }
  
  static Map<String, dynamic> _handleResponse(http.Response response) {
    final data = jsonDecode(response.body);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    } else {
      throw Exception(data['message'] ?? 'API Error');
    }
  }
}
```

## 📝 Data Models

### 1. Questionnaire Model

Create `lib/models/questionnaire.dart`:

```dart
import 'package:json_annotation/json_annotation.dart';

part 'questionnaire.g.dart';

@JsonSerializable()
class Questionnaire {
  final String id;
  final String title;
  final String? description;
  final Topic topic;
  final String difficulty;
  final int estimatedTime;
  final bool isPremium;
  final List<Question> questions;
  final QuestionnaireMetadata? metadata;
  
  Questionnaire({
    required this.id,
    required this.title,
    this.description,
    required this.topic,
    required this.difficulty,
    required this.estimatedTime,
    required this.isPremium,
    required this.questions,
    this.metadata,
  });
  
  factory Questionnaire.fromJson(Map<String, dynamic> json) => 
      _$QuestionnaireFromJson(json);
  Map<String, dynamic> toJson() => _$QuestionnaireToJson(this);
}

@JsonSerializable()
class Question {
  final String id;
  final String questionText;
  final String questionType;
  final int order;
  final bool isRequired;
  
  Question({
    required this.id,
    required this.questionText,
    required this.questionType,
    required this.order,
    required this.isRequired,
  });
  
  factory Question.fromJson(Map<String, dynamic> json) => 
      _$QuestionFromJson(json);
  Map<String, dynamic> toJson() => _$QuestionToJson(this);
}

@JsonSerializable()
class QuestionnaireMetadata {
  final int totalQuestions;
  final int totalAttempts;
  final double averageCompletionTime;
  
  QuestionnaireMetadata({
    required this.totalQuestions,
    required this.totalAttempts,
    required this.averageCompletionTime,
  });
  
  factory QuestionnaireMetadata.fromJson(Map<String, dynamic> json) => 
      _$QuestionnaireMetadataFromJson(json);
  Map<String, dynamic> toJson() => _$QuestionnaireMetadataToJson(this);
}
```

### 2. MCQ Model

Create `lib/models/mcq.dart`:

```dart
import 'package:json_annotation/json_annotation.dart';

part 'mcq.g.dart';

@JsonSerializable()
class MCQ {
  final String id;
  final String title;
  final String? description;
  final Topic topic;
  final String difficulty;
  final int estimatedTime;
  final int passingScore;
  final bool isPremium;
  final List<MCQQuestion> questions;
  final MCQMetadata? metadata;
  
  MCQ({
    required this.id,
    required this.title,
    this.description,
    required this.topic,
    required this.difficulty,
    required this.estimatedTime,
    required this.passingScore,
    required this.isPremium,
    required this.questions,
    this.metadata,
  });
  
  factory MCQ.fromJson(Map<String, dynamic> json) => _$MCQFromJson(json);
  Map<String, dynamic> toJson() => _$MCQToJson(this);
}

@JsonSerializable()
class MCQQuestion {
  final String id;
  final String questionText;
  final List<MCQOption> options;
  final String? explanation;
  final String difficulty;
  final int points;
  final int order;
  
  MCQQuestion({
    required this.id,
    required this.questionText,
    required this.options,
    this.explanation,
    required this.difficulty,
    required this.points,
    required this.order,
  });
  
  factory MCQQuestion.fromJson(Map<String, dynamic> json) => 
      _$MCQQuestionFromJson(json);
  Map<String, dynamic> toJson() => _$MCQQuestionToJson(this);
}

@JsonSerializable()
class MCQOption {
  final String text;
  // Note: isCorrect is not included in API response for security
  
  MCQOption({required this.text});
  
  factory MCQOption.fromJson(Map<String, dynamic> json) => 
      _$MCQOptionFromJson(json);
  Map<String, dynamic> toJson() => _$MCQOptionToJson(this);
}
```

### 3. Learning Module Model

Create `lib/models/learning_module.dart`:

```dart
import 'package:json_annotation/json_annotation.dart';

part 'learning_module.g.dart';

@JsonSerializable()
class LearningModule {
  final String id;
  final String title;
  final String? description;
  final Topic topic;
  final String difficulty;
  final int estimatedDuration;
  final bool isPremium;
  final List<ContentItem> content;
  final List<PopulatedContentItem>? populatedContent;
  final LearningModuleMetadata? metadata;
  
  LearningModule({
    required this.id,
    required this.title,
    this.description,
    required this.topic,
    required this.difficulty,
    required this.estimatedDuration,
    required this.isPremium,
    required this.content,
    this.populatedContent,
    this.metadata,
  });
  
  factory LearningModule.fromJson(Map<String, dynamic> json) => 
      _$LearningModuleFromJson(json);
  Map<String, dynamic> toJson() => _$LearningModuleToJson(this);
}

@JsonSerializable()
class ContentItem {
  final String contentType;
  final String contentId;
  final String contentModel;
  final int order;
  final bool isRequired;
  final String? customTitle;
  final String? customDescription;
  
  ContentItem({
    required this.contentType,
    required this.contentId,
    required this.contentModel,
    required this.order,
    required this.isRequired,
    this.customTitle,
    this.customDescription,
  });
  
  factory ContentItem.fromJson(Map<String, dynamic> json) => 
      _$ContentItemFromJson(json);
  Map<String, dynamic> toJson() => _$ContentItemToJson(this);
}

@JsonSerializable()
class PopulatedContentItem extends ContentItem {
  final dynamic contentData; // Can be Video, Questionnaire, MCQ, or TextContent
  
  PopulatedContentItem({
    required super.contentType,
    required super.contentId,
    required super.contentModel,
    required super.order,
    required super.isRequired,
    super.customTitle,
    super.customDescription,
    required this.contentData,
  });
  
  factory PopulatedContentItem.fromJson(Map<String, dynamic> json) => 
      _$PopulatedContentItemFromJson(json);
  Map<String, dynamic> toJson() => _$PopulatedContentItemToJson(this);
}
```

### 4. Text Content Model

Create `lib/models/text_content.dart`:

```dart
import 'package:json_annotation/json_annotation.dart';

part 'text_content.g.dart';

@JsonSerializable()
class TextContent {
  final String id;
  final String title;
  final String? description;
  final Topic topic;
  final String contentType;
  final String content;
  final String contentFormat;
  final int estimatedReadingTime;
  final String difficulty;
  final bool isPremium;
  final List<String> tags;
  final List<Resource> resources;
  final String? contentPreview;
  final int? wordCount;
  final TextContentMetadata? metadata;
  
  TextContent({
    required this.id,
    required this.title,
    this.description,
    required this.topic,
    required this.contentType,
    required this.content,
    required this.contentFormat,
    required this.estimatedReadingTime,
    required this.difficulty,
    required this.isPremium,
    required this.tags,
    required this.resources,
    this.contentPreview,
    this.wordCount,
    this.metadata,
  });
  
  factory TextContent.fromJson(Map<String, dynamic> json) => 
      _$TextContentFromJson(json);
  Map<String, dynamic> toJson() => _$TextContentToJson(this);
}

@JsonSerializable()
class Resource {
  final String title;
  final String url;
  final String type;
  
  Resource({
    required this.title,
    required this.url,
    required this.type,
  });
  
  factory Resource.fromJson(Map<String, dynamic> json) => 
      _$ResourceFromJson(json);
  Map<String, dynamic> toJson() => _$ResourceToJson(this);
}
```

## 🔄 API Services

### 1. Questionnaire Service

Create `lib/services/questionnaire_service.dart`:

```dart
import '../models/questionnaire.dart';
import '../config/api_config.dart';
import 'http_service.dart';

class QuestionnaireService {
  static Future<List<Questionnaire>> getQuestionnaires({
    int page = 1,
    int limit = 10,
    String? topic,
    String? difficulty,
    String? search,
  }) async {
    String endpoint = '${ApiConfig.questionnaires}?page=$page&limit=$limit';
    
    if (topic != null) endpoint += '&topic=$topic';
    if (difficulty != null) endpoint += '&difficulty=$difficulty';
    if (search != null) endpoint += '&search=$search';
    
    final response = await HttpService.get(endpoint);
    
    return (response['data'] as List)
        .map((json) => Questionnaire.fromJson(json))
        .toList();
  }
  
  static Future<Questionnaire> getQuestionnaire(String id, String token) async {
    final response = await HttpService.get(
      '${ApiConfig.questionnaires}/$id',
      token: token,
    );
    
    return Questionnaire.fromJson(response['data']);
  }
  
  static Future<Map<String, dynamic>> submitAnswers(
    String questionnaireId,
    List<Map<String, dynamic>> answers,
    String token,
  ) async {
    final response = await HttpService.post(
      '${ApiConfig.questionnaires}/$questionnaireId/submit',
      {'answers': answers},
      token: token,
    );
    
    return response['data'];
  }
}
```

### 2. MCQ Service

Create `lib/services/mcq_service.dart`:

```dart
import '../models/mcq.dart';
import '../config/api_config.dart';
import 'http_service.dart';

class MCQService {
  static Future<List<MCQ>> getMCQs({
    int page = 1,
    int limit = 10,
    String? topic,
    String? difficulty,
    String? search,
  }) async {
    String endpoint = '${ApiConfig.mcqs}?page=$page&limit=$limit';
    
    if (topic != null) endpoint += '&topic=$topic';
    if (difficulty != null) endpoint += '&difficulty=$difficulty';
    if (search != null) endpoint += '&search=$search';
    
    final response = await HttpService.get(endpoint);
    
    return (response['data'] as List)
        .map((json) => MCQ.fromJson(json))
        .toList();
  }
  
  static Future<MCQ> getMCQ(String id, String token) async {
    final response = await HttpService.get(
      '${ApiConfig.mcqs}/$id',
      token: token,
    );
    
    return MCQ.fromJson(response['data']);
  }
  
  static Future<Map<String, dynamic>> submitAnswers(
    String mcqId,
    List<Map<String, dynamic>> answers,
    String token,
  ) async {
    final response = await HttpService.post(
      '${ApiConfig.mcqs}/$mcqId/submit',
      {'answers': answers},
      token: token,
    );
    
    return response['data'];
  }
}
```

## 📱 UI Implementation Examples

### 1. Questionnaire Screen

Create `lib/screens/questionnaire_screen.dart`:

```dart
import 'package:flutter/material.dart';
import '../models/questionnaire.dart';
import '../services/questionnaire_service.dart';

class QuestionnaireScreen extends StatefulWidget {
  final String questionnaireId;
  
  const QuestionnaireScreen({Key? key, required this.questionnaireId}) : super(key: key);
  
  @override
  _QuestionnaireScreenState createState() => _QuestionnaireScreenState();
}

class _QuestionnaireScreenState extends State<QuestionnaireScreen> {
  Questionnaire? questionnaire;
  Map<String, String> answers = {};
  bool isLoading = true;
  bool isSubmitting = false;
  
  @override
  void initState() {
    super.initState();
    loadQuestionnaire();
  }
  
  Future<void> loadQuestionnaire() async {
    try {
      final token = await getAuthToken(); // Implement this method
      final data = await QuestionnaireService.getQuestionnaire(
        widget.questionnaireId,
        token,
      );
      
      setState(() {
        questionnaire = data;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      // Handle error
    }
  }
  
  Future<void> submitAnswers() async {
    if (answers.isEmpty) return;
    
    setState(() {
      isSubmitting = true;
    });
    
    try {
      final token = await getAuthToken();
      final answersList = answers.entries
          .map((entry) => {
                'questionId': entry.key,
                'answer': entry.value,
              })
          .toList();
      
      final result = await QuestionnaireService.submitAnswers(
        widget.questionnaireId,
        answersList,
        token,
      );
      
      // Show success message and navigate
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Submitted Successfully!'),
          content: Text('Your answers have been recorded.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text('OK'),
            ),
          ],
        ),
      );
    } catch (e) {
      // Handle error
    } finally {
      setState(() {
        isSubmitting = false;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text('Loading...')),
        body: Center(child: CircularProgressIndicator()),
      );
    }
    
    if (questionnaire == null) {
      return Scaffold(
        appBar: AppBar(title: Text('Error')),
        body: Center(child: Text('Failed to load questionnaire')),
      );
    }
    
    return Scaffold(
      appBar: AppBar(
        title: Text(questionnaire!.title),
        actions: [
          IconButton(
            icon: Icon(Icons.info),
            onPressed: () => showQuestionnaireInfo(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Header with info
          Container(
            padding: EdgeInsets.all(16),
            color: Colors.blue.shade50,
            child: Row(
              children: [
                Icon(Icons.quiz, color: Colors.blue),
                SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        questionnaire!.title,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (questionnaire!.description != null)
                        Text(questionnaire!.description!),
                      SizedBox(height: 4),
                      Row(
                        children: [
                          Chip(
                            label: Text(questionnaire!.difficulty),
                            backgroundColor: getDifficultyColor(questionnaire!.difficulty),
                          ),
                          SizedBox(width: 8),
                          Text('${questionnaire!.estimatedTime} min'),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Questions
          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.all(16),
              itemCount: questionnaire!.questions.length,
              itemBuilder: (context, index) {
                final question = questionnaire!.questions[index];
                return Card(
                  margin: EdgeInsets.only(bottom: 16),
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Question ${index + 1}',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[600],
                              ),
                            ),
                            if (question.isRequired)
                              Text(
                                ' *',
                                style: TextStyle(color: Colors.red),
                              ),
                          ],
                        ),
                        SizedBox(height: 8),
                        Text(
                          question.questionText,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        SizedBox(height: 12),
                        TextField(
                          maxLines: question.questionType == 'long_answer' ? 4 : 1,
                          decoration: InputDecoration(
                            hintText: 'Enter your answer...',
                            border: OutlineInputBorder(),
                          ),
                          onChanged: (value) {
                            answers[question.id] = value;
                          },
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          
          // Submit button
          Container(
            padding: EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isSubmitting ? null : submitAnswers,
                child: isSubmitting
                    ? CircularProgressIndicator(color: Colors.white)
                    : Text('Submit Answers'),
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Color getDifficultyColor(String difficulty) {
    switch (difficulty) {
      case 'beginner':
        return Colors.green.shade100;
      case 'intermediate':
        return Colors.orange.shade100;
      case 'advanced':
        return Colors.red.shade100;
      default:
        return Colors.grey.shade100;
    }
  }
  
  void showQuestionnaireInfo() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Questionnaire Info'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Topic: ${questionnaire!.topic.title}'),
            Text('Difficulty: ${questionnaire!.difficulty}'),
            Text('Estimated Time: ${questionnaire!.estimatedTime} minutes'),
            Text('Questions: ${questionnaire!.questions.length}'),
            if (questionnaire!.isPremium)
              Text('Premium Content', style: TextStyle(color: Colors.orange)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Close'),
          ),
        ],
      ),
    );
  }
  
  Future<String> getAuthToken() async {
    // Implement token retrieval from SharedPreferences or secure storage
    // This is just a placeholder
    return 'your-jwt-token';
  }
}
```

### 2. MCQ Screen

Create `lib/screens/mcq_screen.dart`:

```dart
import 'package:flutter/material.dart';
import '../models/mcq.dart';
import '../services/mcq_service.dart';

class MCQScreen extends StatefulWidget {
  final String mcqId;

  const MCQScreen({Key? key, required this.mcqId}) : super(key: key);

  @override
  _MCQScreenState createState() => _MCQScreenState();
}

class _MCQScreenState extends State<MCQScreen> {
  MCQ? mcq;
  Map<String, int> selectedAnswers = {};
  bool isLoading = true;
  bool isSubmitting = false;
  Map<String, dynamic>? result;

  @override
  void initState() {
    super.initState();
    loadMCQ();
  }

  Future<void> loadMCQ() async {
    try {
      final token = await getAuthToken();
      final data = await MCQService.getMCQ(widget.mcqId, token);

      setState(() {
        mcq = data;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> submitAnswers() async {
    if (selectedAnswers.isEmpty) return;

    setState(() {
      isSubmitting = true;
    });

    try {
      final token = await getAuthToken();
      final answersList = selectedAnswers.entries
          .map((entry) => {
                'questionId': entry.key,
                'selectedOption': entry.value,
              })
          .toList();

      final submitResult = await MCQService.submitAnswers(
        widget.mcqId,
        answersList,
        token,
      );

      setState(() {
        result = submitResult;
      });

      showResultDialog();
    } catch (e) {
      // Handle error
    } finally {
      setState(() {
        isSubmitting = false;
      });
    }
  }

  void showResultDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(
              result!['passed'] ? Icons.check_circle : Icons.cancel,
              color: result!['passed'] ? Colors.green : Colors.red,
            ),
            SizedBox(width: 8),
            Text(result!['passed'] ? 'Passed!' : 'Try Again'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Score: ${result!['score']}/${result!['totalQuestions']}'),
            Text('Percentage: ${result!['percentage'].toStringAsFixed(1)}%'),
            Text('Passing Score: ${mcq!.passingScore}%'),
            if (result!['feedback'] != null)
              Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text(result!['feedback']),
              ),
          ],
        ),
        actions: [
          if (!result!['passed'])
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                setState(() {
                  selectedAnswers.clear();
                  result = null;
                });
              },
              child: Text('Try Again'),
            ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Continue'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text('Loading...')),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (mcq == null) {
      return Scaffold(
        appBar: AppBar(title: Text('Error')),
        body: Center(child: Text('Failed to load MCQ')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(mcq!.title),
        actions: [
          IconButton(
            icon: Icon(Icons.info),
            onPressed: () => showMCQInfo(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Header
          Container(
            padding: EdgeInsets.all(16),
            color: Colors.purple.shade50,
            child: Row(
              children: [
                Icon(Icons.quiz, color: Colors.purple),
                SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        mcq!.title,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (mcq!.description != null)
                        Text(mcq!.description!),
                      SizedBox(height: 4),
                      Row(
                        children: [
                          Chip(
                            label: Text(mcq!.difficulty),
                            backgroundColor: getDifficultyColor(mcq!.difficulty),
                          ),
                          SizedBox(width: 8),
                          Text('${mcq!.estimatedTime} min'),
                          SizedBox(width: 8),
                          Text('Pass: ${mcq!.passingScore}%'),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Questions
          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.all(16),
              itemCount: mcq!.questions.length,
              itemBuilder: (context, index) {
                final question = mcq!.questions[index];
                return Card(
                  margin: EdgeInsets.only(bottom: 16),
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Question ${index + 1}',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[600],
                              ),
                            ),
                            Spacer(),
                            Chip(
                              label: Text('${question.points} pt${question.points > 1 ? 's' : ''}'),
                              backgroundColor: Colors.blue.shade100,
                            ),
                          ],
                        ),
                        SizedBox(height: 8),
                        Text(
                          question.questionText,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        SizedBox(height: 12),
                        ...question.options.asMap().entries.map((entry) {
                          final optionIndex = entry.key;
                          final option = entry.value;
                          final isSelected = selectedAnswers[question.id] == optionIndex;

                          return Container(
                            margin: EdgeInsets.only(bottom: 8),
                            child: InkWell(
                              onTap: result == null ? () {
                                setState(() {
                                  selectedAnswers[question.id] = optionIndex;
                                });
                              } : null,
                              child: Container(
                                padding: EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: isSelected ? Colors.blue : Colors.grey.shade300,
                                    width: isSelected ? 2 : 1,
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                  color: isSelected ? Colors.blue.shade50 : null,
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 24,
                                      height: 24,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: isSelected ? Colors.blue : Colors.grey,
                                        ),
                                        color: isSelected ? Colors.blue : null,
                                      ),
                                      child: isSelected
                                          ? Icon(Icons.check, size: 16, color: Colors.white)
                                          : null,
                                    ),
                                    SizedBox(width: 12),
                                    Expanded(child: Text(option.text)),
                                  ],
                                ),
                              ),
                            ),
                          );
                        }).toList(),

                        // Show explanation after submission
                        if (result != null && question.explanation != null)
                          Container(
                            margin: EdgeInsets.only(top: 12),
                            padding: EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.yellow.shade50,
                              border: Border.all(color: Colors.yellow.shade200),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(Icons.lightbulb, color: Colors.orange, size: 20),
                                SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    question.explanation!,
                                    style: TextStyle(fontSize: 14),
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Submit button
          if (result == null)
            Container(
              padding: EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isSubmitting || selectedAnswers.length != mcq!.questions.length
                      ? null
                      : submitAnswers,
                  child: isSubmitting
                      ? CircularProgressIndicator(color: Colors.white)
                      : Text('Submit Quiz'),
                  style: ElevatedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Color getDifficultyColor(String difficulty) {
    switch (difficulty) {
      case 'beginner':
        return Colors.green.shade100;
      case 'intermediate':
        return Colors.orange.shade100;
      case 'advanced':
        return Colors.red.shade100;
      default:
        return Colors.grey.shade100;
    }
  }

  void showMCQInfo() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Quiz Info'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Topic: ${mcq!.topic.title}'),
            Text('Difficulty: ${mcq!.difficulty}'),
            Text('Estimated Time: ${mcq!.estimatedTime} minutes'),
            Text('Questions: ${mcq!.questions.length}'),
            Text('Passing Score: ${mcq!.passingScore}%'),
            if (mcq!.isPremium)
              Text('Premium Content', style: TextStyle(color: Colors.orange)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Close'),
          ),
        ],
      ),
    );
  }

  Future<String> getAuthToken() async {
    return 'your-jwt-token';
  }
}
```

## 🎓 Learning Module Implementation

### 3. Learning Module Screen

Create `lib/screens/learning_module_screen.dart`:

```dart
import 'package:flutter/material.dart';
import '../models/learning_module.dart';
import '../services/learning_module_service.dart';

class LearningModuleScreen extends StatefulWidget {
  final String moduleId;

  const LearningModuleScreen({Key? key, required this.moduleId}) : super(key: key);

  @override
  _LearningModuleScreenState createState() => _LearningModuleScreenState();
}

class _LearningModuleScreenState extends State<LearningModuleScreen> {
  LearningModule? module;
  bool isLoading = true;
  int currentContentIndex = 0;

  @override
  void initState() {
    super.initState();
    loadModule();
  }

  Future<void> loadModule() async {
    try {
      final token = await getAuthToken();
      final data = await LearningModuleService.getLearningModule(
        widget.moduleId,
        token,
      );

      setState(() {
        module = data;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
    }
  }

  void navigateToContent(PopulatedContentItem contentItem) {
    switch (contentItem.contentType) {
      case 'video':
        // Navigate to video player
        Navigator.pushNamed(
          context,
          '/video',
          arguments: contentItem.contentId,
        );
        break;
      case 'questionnaire':
        Navigator.pushNamed(
          context,
          '/questionnaire',
          arguments: contentItem.contentId,
        );
        break;
      case 'mcq':
        Navigator.pushNamed(
          context,
          '/mcq',
          arguments: contentItem.contentId,
        );
        break;
      case 'text':
      case 'summary':
      case 'reading':
      case 'instructions':
      case 'notes':
      case 'explanation':
        Navigator.pushNamed(
          context,
          '/text-content',
          arguments: contentItem.contentId,
        );
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text('Loading...')),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (module == null) {
      return Scaffold(
        appBar: AppBar(title: Text('Error')),
        body: Center(child: Text('Failed to load learning module')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(module!.title),
        actions: [
          IconButton(
            icon: Icon(Icons.info),
            onPressed: () => showModuleInfo(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Module Header
          Container(
            padding: EdgeInsets.all(16),
            color: Colors.green.shade50,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.school, color: Colors.green),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        module!.title,
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                if (module!.description != null)
                  Padding(
                    padding: EdgeInsets.only(top: 8),
                    child: Text(module!.description!),
                  ),
                SizedBox(height: 8),
                Row(
                  children: [
                    Chip(
                      label: Text(module!.difficulty),
                      backgroundColor: getDifficultyColor(module!.difficulty),
                    ),
                    SizedBox(width: 8),
                    Text('${module!.estimatedDuration} min'),
                    SizedBox(width: 8),
                    Text('${module!.content.length} items'),
                  ],
                ),
              ],
            ),
          ),

          // Content List
          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.all(16),
              itemCount: module!.populatedContent?.length ?? 0,
              itemBuilder: (context, index) {
                final contentItem = module!.populatedContent![index];
                final contentData = contentItem.contentData;

                return Card(
                  margin: EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: getContentTypeColor(contentItem.contentType),
                      child: Icon(
                        getContentTypeIcon(contentItem.contentType),
                        color: Colors.white,
                      ),
                    ),
                    title: Text(
                      contentItem.customTitle ?? contentData['title'] ?? 'Content',
                      style: TextStyle(fontWeight: FontWeight.w500),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (contentItem.customDescription != null)
                          Text(contentItem.customDescription!),
                        SizedBox(height: 4),
                        Row(
                          children: [
                            Chip(
                              label: Text(contentItem.contentType.toUpperCase()),
                              backgroundColor: getContentTypeColor(contentItem.contentType).withOpacity(0.2),
                            ),
                            SizedBox(width: 8),
                            if (contentData['estimatedTime'] != null)
                              Text('${contentData['estimatedTime']} min'),
                            if (contentData['estimatedReadingTime'] != null)
                              Text('${contentData['estimatedReadingTime']} min read'),
                          ],
                        ),
                      ],
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (contentItem.isRequired)
                          Icon(Icons.star, color: Colors.orange, size: 16),
                        Icon(Icons.arrow_forward_ios),
                      ],
                    ),
                    onTap: () => navigateToContent(contentItem),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Color getDifficultyColor(String difficulty) {
    switch (difficulty) {
      case 'beginner':
        return Colors.green.shade100;
      case 'intermediate':
        return Colors.orange.shade100;
      case 'advanced':
        return Colors.red.shade100;
      default:
        return Colors.grey.shade100;
    }
  }

  Color getContentTypeColor(String contentType) {
    switch (contentType) {
      case 'video':
        return Colors.red;
      case 'questionnaire':
        return Colors.blue;
      case 'mcq':
        return Colors.purple;
      case 'text':
      case 'summary':
      case 'reading':
      case 'instructions':
      case 'notes':
      case 'explanation':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  IconData getContentTypeIcon(String contentType) {
    switch (contentType) {
      case 'video':
        return Icons.play_circle;
      case 'questionnaire':
        return Icons.quiz;
      case 'mcq':
        return Icons.check_circle;
      case 'summary':
        return Icons.summarize;
      case 'reading':
        return Icons.menu_book;
      case 'instructions':
        return Icons.list;
      case 'notes':
        return Icons.note;
      case 'explanation':
        return Icons.lightbulb;
      case 'text':
      default:
        return Icons.article;
    }
  }

  void showModuleInfo() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Module Info'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Topic: ${module!.topic.title}'),
            Text('Difficulty: ${module!.difficulty}'),
            Text('Duration: ${module!.estimatedDuration} minutes'),
            Text('Content Items: ${module!.content.length}'),
            if (module!.metadata != null) ...[
              Text('Videos: ${module!.metadata!.totalVideos}'),
              Text('Questionnaires: ${module!.metadata!.totalQuestionnaires}'),
              Text('MCQs: ${module!.metadata!.totalMCQs}'),
              Text('Text Content: ${module!.metadata!.totalTextContent}'),
            ],
            if (module!.isPremium)
              Text('Premium Content', style: TextStyle(color: Colors.orange)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Close'),
          ),
        ],
      ),
    );
  }

  Future<String> getAuthToken() async {
    return 'your-jwt-token';
  }
}
```

## 🔐 Authentication & State Management

### 4. Auth Provider

Create `lib/providers/auth_provider.dart`:

```dart
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  String? _token;
  Map<String, dynamic>? _user;
  bool _isLoading = false;

  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  bool get isAuthenticated => _token != null;
  bool get isLoading => _isLoading;

  Future<void> loginWithGoogle(String idToken) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await AuthService.loginWithGoogle(idToken);

      _token = response['token'];
      _user = response['user'];

      // Save to SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _token!);
      await prefs.setString('user_data', jsonEncode(_user!));

      notifyListeners();
    } catch (e) {
      throw e;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadSavedAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final savedToken = prefs.getString('auth_token');
    final savedUser = prefs.getString('user_data');

    if (savedToken != null && savedUser != null) {
      _token = savedToken;
      _user = jsonDecode(savedUser);
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _token = null;
    _user = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_data');

    notifyListeners();
  }
}
```

## 📊 Usage Examples

### 5. Content List Screen

Create `lib/screens/content_list_screen.dart`:

```dart
import 'package:flutter/material.dart';
import '../models/questionnaire.dart';
import '../models/mcq.dart';
import '../models/text_content.dart';
import '../services/questionnaire_service.dart';
import '../services/mcq_service.dart';
import '../services/text_content_service.dart';

class ContentListScreen extends StatefulWidget {
  final String? topicId;

  const ContentListScreen({Key? key, this.topicId}) : super(key: key);

  @override
  _ContentListScreenState createState() => _ContentListScreenState();
}

class _ContentListScreenState extends State<ContentListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  List<Questionnaire> questionnaires = [];
  List<MCQ> mcqs = [];
  List<TextContent> textContent = [];

  bool isLoadingQuestionnaires = true;
  bool isLoadingMCQs = true;
  bool isLoadingTextContent = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    loadAllContent();
  }

  Future<void> loadAllContent() async {
    await Future.wait([
      loadQuestionnaires(),
      loadMCQs(),
      loadTextContent(),
    ]);
  }

  Future<void> loadQuestionnaires() async {
    try {
      final data = await QuestionnaireService.getQuestionnaires(
        topic: widget.topicId,
      );
      setState(() {
        questionnaires = data;
        isLoadingQuestionnaires = false;
      });
    } catch (e) {
      setState(() {
        isLoadingQuestionnaires = false;
      });
    }
  }

  Future<void> loadMCQs() async {
    try {
      final data = await MCQService.getMCQs(
        topic: widget.topicId,
      );
      setState(() {
        mcqs = data;
        isLoadingMCQs = false;
      });
    } catch (e) {
      setState(() {
        isLoadingMCQs = false;
      });
    }
  }

  Future<void> loadTextContent() async {
    try {
      final data = await TextContentService.getTextContent(
        topic: widget.topicId,
      );
      setState(() {
        textContent = data;
        isLoadingTextContent = false;
      });
    } catch (e) {
      setState(() {
        isLoadingTextContent = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Learning Content'),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(icon: Icon(Icons.quiz), text: 'Q&A'),
            Tab(icon: Icon(Icons.check_circle), text: 'MCQs'),
            Tab(icon: Icon(Icons.article), text: 'Reading'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Questionnaires Tab
          isLoadingQuestionnaires
              ? Center(child: CircularProgressIndicator())
              : ListView.builder(
                  padding: EdgeInsets.all(16),
                  itemCount: questionnaires.length,
                  itemBuilder: (context, index) {
                    final questionnaire = questionnaires[index];
                    return Card(
                      margin: EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: Colors.blue,
                          child: Icon(Icons.quiz, color: Colors.white),
                        ),
                        title: Text(questionnaire.title),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (questionnaire.description != null)
                              Text(questionnaire.description!),
                            SizedBox(height: 4),
                            Row(
                              children: [
                                Chip(
                                  label: Text(questionnaire.difficulty),
                                  backgroundColor: getDifficultyColor(questionnaire.difficulty),
                                ),
                                SizedBox(width: 8),
                                Text('${questionnaire.estimatedTime} min'),
                                SizedBox(width: 8),
                                Text('${questionnaire.questions.length} questions'),
                              ],
                            ),
                          ],
                        ),
                        trailing: questionnaire.isPremium
                            ? Icon(Icons.star, color: Colors.orange)
                            : Icon(Icons.arrow_forward_ios),
                        onTap: () {
                          Navigator.pushNamed(
                            context,
                            '/questionnaire',
                            arguments: questionnaire.id,
                          );
                        },
                      ),
                    );
                  },
                ),

          // MCQs Tab
          isLoadingMCQs
              ? Center(child: CircularProgressIndicator())
              : ListView.builder(
                  padding: EdgeInsets.all(16),
                  itemCount: mcqs.length,
                  itemBuilder: (context, index) {
                    final mcq = mcqs[index];
                    return Card(
                      margin: EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: Colors.purple,
                          child: Icon(Icons.check_circle, color: Colors.white),
                        ),
                        title: Text(mcq.title),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (mcq.description != null)
                              Text(mcq.description!),
                            SizedBox(height: 4),
                            Row(
                              children: [
                                Chip(
                                  label: Text(mcq.difficulty),
                                  backgroundColor: getDifficultyColor(mcq.difficulty),
                                ),
                                SizedBox(width: 8),
                                Text('${mcq.estimatedTime} min'),
                                SizedBox(width: 8),
                                Text('${mcq.questions.length} questions'),
                                SizedBox(width: 8),
                                Text('Pass: ${mcq.passingScore}%'),
                              ],
                            ),
                          ],
                        ),
                        trailing: mcq.isPremium
                            ? Icon(Icons.star, color: Colors.orange)
                            : Icon(Icons.arrow_forward_ios),
                        onTap: () {
                          Navigator.pushNamed(
                            context,
                            '/mcq',
                            arguments: mcq.id,
                          );
                        },
                      ),
                    );
                  },
                ),

          // Text Content Tab
          isLoadingTextContent
              ? Center(child: CircularProgressIndicator())
              : ListView.builder(
                  padding: EdgeInsets.all(16),
                  itemCount: textContent.length,
                  itemBuilder: (context, index) {
                    final content = textContent[index];
                    return Card(
                      margin: EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: getContentTypeColor(content.contentType),
                          child: Icon(
                            getContentTypeIcon(content.contentType),
                            color: Colors.white,
                          ),
                        ),
                        title: Text(content.title),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (content.description != null)
                              Text(content.description!),
                            if (content.contentPreview != null)
                              Text(
                                content.contentPreview!,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(color: Colors.grey[600]),
                              ),
                            SizedBox(height: 4),
                            Row(
                              children: [
                                Chip(
                                  label: Text(content.contentType.toUpperCase()),
                                  backgroundColor: getContentTypeColor(content.contentType).withOpacity(0.2),
                                ),
                                SizedBox(width: 8),
                                Text('${content.estimatedReadingTime} min read'),
                                if (content.wordCount != null) ...[
                                  SizedBox(width: 8),
                                  Text('${content.wordCount} words'),
                                ],
                              ],
                            ),
                          ],
                        ),
                        trailing: content.isPremium
                            ? Icon(Icons.star, color: Colors.orange)
                            : Icon(Icons.arrow_forward_ios),
                        onTap: () {
                          Navigator.pushNamed(
                            context,
                            '/text-content',
                            arguments: content.id,
                          );
                        },
                      ),
                    );
                  },
                ),
        ],
      ),
    );
  }

  Color getDifficultyColor(String difficulty) {
    switch (difficulty) {
      case 'beginner':
        return Colors.green.shade100;
      case 'intermediate':
        return Colors.orange.shade100;
      case 'advanced':
        return Colors.red.shade100;
      default:
        return Colors.grey.shade100;
    }
  }

  Color getContentTypeColor(String contentType) {
    switch (contentType) {
      case 'summary':
        return Colors.blue;
      case 'reading':
        return Colors.green;
      case 'instructions':
        return Colors.orange;
      case 'notes':
        return Colors.purple;
      case 'explanation':
        return Colors.teal;
      default:
        return Colors.grey;
    }
  }

  IconData getContentTypeIcon(String contentType) {
    switch (contentType) {
      case 'summary':
        return Icons.summarize;
      case 'reading':
        return Icons.menu_book;
      case 'instructions':
        return Icons.list;
      case 'notes':
        return Icons.note;
      case 'explanation':
        return Icons.lightbulb;
      default:
        return Icons.article;
    }
  }
}
```

## 🚀 Getting Started

### 6. Main App Setup

Update your `lib/main.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'screens/questionnaire_screen.dart';
import 'screens/mcq_screen.dart';
import 'screens/learning_module_screen.dart';
import 'screens/text_content_screen.dart';
import 'screens/content_list_screen.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: MaterialApp(
        title: 'Bolo - English Learning',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          visualDensity: VisualDensity.adaptivePlatformDensity,
        ),
        routes: {
          '/': (context) => ContentListScreen(),
          '/questionnaire': (context) => QuestionnaireScreen(
                questionnaireId: ModalRoute.of(context)!.settings.arguments as String,
              ),
          '/mcq': (context) => MCQScreen(
                mcqId: ModalRoute.of(context)!.settings.arguments as String,
              ),
          '/learning-module': (context) => LearningModuleScreen(
                moduleId: ModalRoute.of(context)!.settings.arguments as String,
              ),
          '/text-content': (context) => TextContentScreen(
                contentId: ModalRoute.of(context)!.settings.arguments as String,
              ),
        },
      ),
    );
  }
}
```

## 📝 Next Steps

1. **Generate Model Files**: Run `flutter packages pub run build_runner build` to generate JSON serialization code
2. **Implement Authentication**: Set up Google Sign-In for your app
3. **Add Error Handling**: Implement proper error handling and user feedback
4. **Add Offline Support**: Cache content for offline access
5. **Implement Progress Tracking**: Track user progress through modules
6. **Add Push Notifications**: Notify users of new content
7. **Performance Optimization**: Implement lazy loading and caching

## 🔧 Testing

Use the provided Postman collection to test all APIs before implementing in Flutter:

1. Import `Seekho-Backend-Enhanced-Complete.postman_collection.json`
2. Set environment variables for your server
3. Test authentication flow
4. Test all content endpoints
5. Verify multi-tenant isolation

This guide provides a complete foundation for implementing the enhanced Seekho Backend APIs in your Flutter Bolo app! 🚀
```
