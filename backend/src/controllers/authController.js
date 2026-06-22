const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecrettokenkeyforcollaborativedoceditor2026', {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email or username' });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        color: user.color,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    // Check for user email
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        color: user.color,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        color: user.color
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user via Google
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { email, username, googleId } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ message: 'Missing Google credentials' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, just return token
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        color: user.color,
        token: generateToken(user._id)
      });
    } else {
      // User doesn't exist, create a new one
      // We generate a random password since they will login with Google
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      
      // Ensure unique username if google username already exists
      let finalUsername = username || email.split('@')[0];
      const usernameExists = await User.findOne({ username: finalUsername });
      if (usernameExists) {
        finalUsername = `${finalUsername}${Math.floor(Math.random() * 10000)}`;
      }

      user = await User.create({
        username: finalUsername,
        email,
        password: randomPassword
      });

      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        color: user.color,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    console.error('Error in googleLogin:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  googleLogin
};
