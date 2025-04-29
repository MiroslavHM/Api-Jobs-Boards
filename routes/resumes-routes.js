const express = require('express');
const router = express.Router();
const Resume = require('../models/ResumeModel');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname,'uploads', 'resumes');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = /pdf|doc|docx|jpg|jpeg|png/; 
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);
  
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed'));
    }
  }
});


router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { skills, experience, education, name } = req.query;
    const filter = {};


    if (name) filter.$text = { $search: name };
    if (skills) filter.skills = { $in: skills.split(',').map(s => new RegExp(s.trim(), 'i')) };
    if (experience) filter['experience.position'] = { $regex: experience, $options: 'i' };
    if (education) filter['education.field'] = { $regex: education, $options: 'i' };

    const resumes = await Resume.find(filter)
      .populate('user', 'username email');
    
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/me', authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findOne({ user: req.user.id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id)
      .populate('user', 'username email');
      
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    

    if (
      resume.user._id.toString() !== req.user.id && 
      req.user.role !== 'employer' && 
      req.user.role !== 'admin' &&
      !resume.isPublic
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post('/', [authMiddleware, upload.single('resume')], async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only job seekers can create resumes' });
    }


    let resume = await Resume.findOne({ user: req.user.id });
    
    const resumeData = {
      user: req.user.id,
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      summary: req.body.summary,
      isPublic: req.body.isPublic === 'true'
    };


    if (req.body.education) {
      resumeData.education = JSON.parse(req.body.education);
    }
    
    if (req.body.experience) {
      resumeData.experience = JSON.parse(req.body.experience);
    }
    
    if (req.body.skills) {
      resumeData.skills = JSON.parse(req.body.skills);
    }
    
    if (req.body.languages) {
      resumeData.languages = JSON.parse(req.body.languages);
    }
    
    if (req.body.certifications) {
      resumeData.certifications = JSON.parse(req.body.certifications);
    }
    
    if (req.body.references) {
      resumeData.references = JSON.parse(req.body.references);
    }


    if (req.file) {
      resumeData.fileUrl = `/uploads/resumes/${req.file.filename}`;
    }

    if (resume) {
   
      resumeData.updatedAt = Date.now();
      resume = await Resume.findOneAndUpdate(
        { user: req.user.id },
        resumeData,
        { new: true }
      );
      res.json(resume);
    } else {

      resume = new Resume(resumeData);
      const newResume = await resume.save();
      res.status(201).json(newResume);
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    if (resume.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this resume' });
    }

    await resume.deleteOne();
    res.json({ message: 'Resume deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
