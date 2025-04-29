const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: [{
    type: String,
    trim: true
  }],
  salary: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    default: 'full-time'
  },
  category: {
    type: String,
    trim: true
  },
  experience: {
    type: String,
    enum: ['entry', 'mid-level', 'senior', 'executive'],
    default: 'mid-level'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // референция към юзъра, който е публикувал обявата
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  }
});


jobSchema.index({ title: 'text', description: 'text', company: 'text' });
jobSchema.index({ category: 1, type: 1, experience: 1, location: 1 });

module.exports = mongoose.model('Job', jobSchema);
