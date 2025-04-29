const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  summary: {
    type: String
  },
  education: [{
    institution: String,
    degree: String,
    field: String,
    startDate: Date,
    endDate: Date,
    current: Boolean
  }],
  experience: [{
    company: String,
    position: String,
    description: String,
    startDate: Date,
    endDate: Date,
    current: Boolean
  }],
  skills: [{
    type: String,
    trim: true
  }],
  languages: [{
    name: String,
    proficiency: String
  }],
  certifications: [{
    name: String,
    issuer: String,
    date: Date
  }],
  references: [{
    name: String,
    position: String,
    company: String,
    email: String,
    phone: String
  }],
  fileUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isPublic: {
    type: Boolean,
    default: false
  }
});


resumeSchema.index({ 'skills': 1 });
resumeSchema.index({ 'experience.position': 1 });
resumeSchema.index({ 'education.field': 1 });

module.exports = mongoose.model('Resume', resumeSchema);
