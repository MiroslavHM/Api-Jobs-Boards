
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');


module.exports = async function(req, res, next) {

  const token = req.header('Authorization')?.replace('Bearer ', '');


  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
  
    const decoded = jwt.verify(token,process.env.JWT_SECRET);
    console.log(decoded);

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    

    req.user = user;
    
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
