
const express = require('express');
const router = express.Router();
const Job = require('../models/JobModel');
const Resume = require('../models/ResumeModel');
const Interview = require('../models/InterviewModel');
const User = require('../models/UserModel');
const authMiddleware = require('../middleware/auth');


router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

//тук са аграгатите (групи и сортиране на данни)
    const jobsByCategory = await Job.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);


    const jobsByExperience = await Job.aggregate([
      { $group: { _id: '$experience', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);


    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);


    const interviewsByStatus = await Interview.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);


    const resumesByTemplate = await Resume.aggregate([
      { $group: { _id: '$template', count: { $sum: 1 } } }
    ]);


    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyApplications = await Job.aggregate([
      { 
        $match: { 
          createdAt: { $gte: sixMonthsAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);


    const totalInterviews = await Interview.countDocuments();
    const successfulInterviews = await Interview.countDocuments({ status: 'successful' });
    const successRate = totalInterviews > 0 ? (successfulInterviews / totalInterviews) * 100 : 0;


    const totalJobs = await Job.countDocuments();
    const applicantCount = await User.countDocuments({ role: 'applicant' });
    const avgJobsPerUser = applicantCount > 0 ? totalJobs / applicantCount : 0;

    return res.json({
      jobsByCategory,
      jobsByExperience,
      usersByRole,
      interviewsByStatus,
      resumesByTemplate,
      monthlyApplications,
      overall: {
        totalUsers: await User.countDocuments(),
        totalJobs: totalJobs,
        totalInterviews: totalInterviews,
        totalResumes: await Resume.countDocuments(),
        successRate: successRate.toFixed(2),
        avgJobsPerUser: avgJobsPerUser.toFixed(2)
      }
    });
  } catch (err) {
    console.error('Error fetching statistics:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/personal', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    

    const jobsApplied = await Job.countDocuments({ applicant: userId });
    

    const interviewsByStatus = await Interview.aggregate([
      { $match: { applicant: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    

    const resumeCount = await Resume.countDocuments({ user: userId });
    

    const recentActivity = await Promise.all([
      Job.find({ applicant: userId }).sort({ createdAt: -1 }).limit(5),
      Interview.find({ applicant: userId }).sort({ scheduledDate: -1 }).limit(5),
      Resume.find({ user: userId }).sort({ updatedAt: -1 }).limit(3)
    ]);
    
    return res.json({
      jobsApplied,
      interviewsByStatus,
      resumeCount,
      recentActivity: {
        recentJobs: recentActivity[0],
        recentInterviews: recentActivity[1],
        recentResumes: recentActivity[2]
      }
    });
  } catch (err) {
    console.error('Error fetching personal statistics:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
