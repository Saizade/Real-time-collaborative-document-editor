const express = require('express');
const router = express.Router();
const {
  createDocument,
  getDocuments,
  getDocumentDetails,
  updateDocumentTitle,
  shareDocument,
  removeCollaborator,
  getVersions,
  createVersion,
  rollbackVersion,
  togglePublicAccess,
  deleteDocument
} = require('../controllers/docController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Public endpoints (or mixed)
router.get('/:id', optionalAuth, getDocumentDetails);

// All other document routes require authentication
router.use(protect);

router.route('/')
  .post(createDocument)
  .get(getDocuments);

router.route('/:id')
  .put(updateDocumentTitle)
  .delete(deleteDocument);

router.put('/:id/public', togglePublicAccess);

router.route('/:id/share')
  .post(shareDocument)
  .delete(removeCollaborator);

router.route('/:id/versions')
  .get(getVersions)
  .post(createVersion);

router.route('/:id/versions/:versionId/rollback')
  .post(rollbackVersion);

module.exports = router;
