const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();


const jobRoutes = require('./routes/jobs-routes');
const resumeRoutes = require('./routes/resumes-routes');
const interviewRoutes = require('./routes/interviews');
const userRoutes = require('./routes/users-routes');
const statsRoutes = require('./routes/stats-routes');


const app = express();
const PORT = process.env.PORT;


app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/jobs', jobRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);


mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/virtual-job-fair')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });
