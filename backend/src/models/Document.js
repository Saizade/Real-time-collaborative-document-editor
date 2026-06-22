const mongoose = require('mongoose');

const CollaboratorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['editor', 'viewer'],
    default: 'editor'
  }
}, { _id: false });

const DocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: 'Untitled Document',
      trim: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null
    },
    collaborators: [CollaboratorSchema],
    yjsState: {
      type: Buffer,
      default: null
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    publicRole: {
      type: String,
      enum: ['editor', 'viewer'],
      default: 'viewer'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Document', DocumentSchema);
