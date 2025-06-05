const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  thumbnail: {
    type: String,
    default: null
  },
  icon: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: '#007bff',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  metadata: {
    totalTopics: {
      type: Number,
      default: 0
    },
    totalVideos: {
      type: Number,
      default: 0
    },
    totalDuration: {
      type: Number,
      default: 0 // in seconds
    }
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for topics
categorySchema.virtual('topics', {
  ref: 'Topic',
  localField: '_id',
  foreignField: 'category',
  options: { sort: { order: 1 } }
});

// Additional indexes for better performance
categorySchema.index({ isActive: 1, order: 1 });
categorySchema.index({ name: 'text', description: 'text' });

// Generate slug before saving
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Update metadata when topics change
categorySchema.methods.updateMetadata = async function() {
  const Topic = mongoose.model('Topic');
  const Video = mongoose.model('Video');
  
  const topics = await Topic.find({ category: this._id });
  const topicIds = topics.map(topic => topic._id);
  
  const videos = await Video.find({ topic: { $in: topicIds } });
  
  this.metadata.totalTopics = topics.length;
  this.metadata.totalVideos = videos.length;
  this.metadata.totalDuration = videos.reduce((total, video) => total + (video.duration || 0), 0);
  
  await this.save();
};

module.exports = mongoose.model('Category', categorySchema);
