const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate local JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecrettokenkeyforcollaborativedoceditor2026', {
    expiresIn: '30d',
  });
};

// @desc    Authenticate with Firebase (Handles both Google and Email/Password)
// @route   POST /api/auth/firebase
// @access  Public
const firebaseAuth = async (req, res) => {
  try {
    const { email, username, firebaseUid } = req.body;

    if (!email || !firebaseUid) {
      return res.status(400).json({ message: 'Missing required Firebase credentials' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = await User.create({
        username: username || email.split('@')[0],
        email,
        googleId: firebaseUid
      });
    } else if (!user.googleId) {
      // Update existing user with firebaseUid
      user.googleId = firebaseUid;
      await user.save();
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      color: user.color,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Error in firebaseAuth:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      color: user.color
    });
  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  firebaseAuth,
  getMe,
};
