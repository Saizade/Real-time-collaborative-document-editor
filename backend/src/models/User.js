const mongoose = require('mongoose');

const COLORS = [
  '#E64980', // Pink
  '#BE4BDB', // Grape
  '#7950F2', // Violet
  '#4C6EF5', // Indigo
  '#228BE6', // Blue
  '#15AABF', // Cyan
  '#12B886', // Teal
  '#40C057', // Green
  '#82C91E', // Lime
  '#FAB005', // Yellow
  '#FD7E14', // Orange
  '#FA5252'  // Red
];

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please add a username'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters']
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    googleId: {
      type: String
    },
    color: {
      type: String,
      default: () => COLORS[Math.floor(Math.random() * COLORS.length)]
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', UserSchema);
