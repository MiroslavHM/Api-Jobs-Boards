const express = require('express');
const router = express.Router();
const Job = require('../models/JobModel');
const authMiddleware = require('../middleware/auth');


router.get('/', async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      type,
      category,
      experience,
      minSalary,
      maxSalary
    } = req.query;

    const filter = { isActive: true };
    // Филтриране на обявите
    if (title) filter.title = { $regex: title, $options: 'i' };
    if (company) filter.company = { $regex: company, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (experience) filter.experience = experience;
    
    if (minSalary || maxSalary) {
      filter.salary = {};
      if (minSalary) filter.salary.$gte = parseInt(minSalary);
      if (maxSalary) filter.salary.$lte = parseInt(maxSalary);
    }

    // Извличане на обявите от базата данни по зададените филтри
    // и сортиране по дата на публикуване
    
    const jobs = await Job.find(filter)
      .populate('postedBy', 'username company')
      .sort({ createdAt: -1 });
    
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'username company email');
      
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post('/', authMiddleware, async (req, res) => {

  if (req.user.role !== 'employer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only employers can post jobs' });
  }

  const job = new Job({
    title: req.body.title,
    company: req.body.company || req.user.company,
    description: req.body.description,
    requirements: req.body.requirements,
    salary: req.body.salary,
    location: req.body.location,
    type: req.body.type,
    category: req.body.category,
    experience: req.body.experience,
    postedBy: req.user.id,
    expiresAt: req.body.expiresAt
  });

  try {
    const newJob = await job.save();
    res.status(201).json(newJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    

    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    const updateFields = req.body;
    Object.keys(updateFields).forEach(key => {
      if (key !== 'postedBy' && key !== '_id') { 
        job[key] = updateFields[key];
      }
    });

    const updatedJob = await job.save();
    res.json(updatedJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    
  
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await job.deleteOne();
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/search/text', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const jobs = await Job.find(
      { $text: { $search: query }, isActive: true },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .populate('postedBy', 'username company');

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
