const mongoose = require('mongoose');

const VersionSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true
    },
    yjsState: {
      type: Buffer,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    description: {
      type: String,
      required: true,
      default: 'Version Snapshot'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Version', VersionSchema);
