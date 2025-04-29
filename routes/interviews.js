const express = require('express');
const router = express.Router();
const Interview = require('../models/InterviewModel');
const Job = require('../models/JobModel');
const authMiddleware = require('../middleware/auth');


router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, date, job } = req.query;
    let filter = {};
    

    if (req.user.role === 'jobseeker') {
      filter.candidate = req.user.id;
    } else if (req.user.role === 'employer') {
      filter.employer = req.user.id;
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
   
    if (status) filter.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.scheduledDate = { $gte: startDate, $lt: endDate };
    }
    if (job) filter.job = job;

    const interviews = await Interview.find(filter)
      .populate('job', 'title company')
      .populate('candidate', 'username email')
      .populate('employer', 'username company email')
      .populate('resume', 'fullName')
      .sort({ scheduledDate: 1 });
    
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/slots/:jobId', async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    

    const bookedSlots = await Interview.find({ 
      employer: job.postedBy,
      status: { $in: ['scheduled', 'rescheduled'] }
    }).select('scheduledDate duration');
    

    const availableSlots = [];
    const today = new Date();
    

    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      

      for (let hour = 9; hour < 17; hour++) {
        const slot = new Date(date);
        slot.setHours(hour, 0, 0, 0);
        

        const isBooked = bookedSlots.some(bookedSlot => {
          const bookedStart = new Date(bookedSlot.scheduledDate);
          const bookedEnd = new Date(bookedSlot.scheduledDate);
          bookedEnd.setMinutes(bookedEnd.getMinutes() + bookedSlot.duration);
          
          return slot >= bookedStart && slot < bookedEnd;
        });
        
        if (!isBooked) {
          availableSlots.push({
            startTime: slot,
            endTime: new Date(slot.getTime() + 30 * 60000) 
          });
        }
      }
    }
    
    res.json(availableSlots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('job', 'title company description')
      .populate('candidate', 'username email')
      .populate('employer', 'username company email')
      .populate('resume', 'fullName fileUrl');
      
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    

    if (
      interview.candidate.toString() !== req.user.id && 
      interview.employer.toString() !== req.user.id && 
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(interview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({ message: 'Only job seekers can schedule interviews' });
    }
    
    const job = await Job.findById(req.body.job);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    
    const interview = new Interview({
      job: req.body.job,
      candidate: req.user.id,
      employer: job.postedBy,
      resume: req.body.resume,
      scheduledDate: req.body.scheduledDate,
      duration: req.body.duration || 30,
      location: req.body.location || 'Online'
    });

    const newInterview = await interview.save();
    
  
    const populatedInterview = await Interview.findById(newInterview._id)
      .populate('job', 'title company')
      .populate('candidate', 'username email')
      .populate('employer', 'username company email')
      .populate('resume', 'fullName');
    
    res.status(201).json(populatedInterview);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    

    if (
      interview.candidate.toString() !== req.user.id && 
      interview.employer.toString() !== req.user.id && 
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to update this interview' });
    }


    const allowedUpdates = ['status', 'scheduledDate', 'duration', 'location', 'notes'];
    const updates = req.body;
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        interview[field] = updates[field];
      }
    });
    

    if (req.user.role === 'employer' || req.user.role === 'admin') {
      if (updates.feedback) {
        interview.feedback = updates.feedback;
      }
    }

    const updatedInterview = await interview.save();
    res.json(updatedInterview);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    

    if (
      interview.candidate.toString() !== req.user.id && 
      interview.employer.toString() !== req.user.id && 
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to cancel this interview' });
    }


    interview.status = 'cancelled';
    await interview.save();
    
    res.json({ message: 'Interview cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
