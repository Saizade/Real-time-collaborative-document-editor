const Folder = require('../models/Folder');
const Document = require('../models/Document');

const getFolders = async (req, res) => {
  try {
    const folders = await Folder.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createFolder = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Folder name is required' });
    }
    const folder = await Folder.create({ name: name.trim(), owner: req.user._id });
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateFolder = async (req, res) => {
  try {
    const { name } = req.body;
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    
    if (name) folder.name = name.trim();
    await folder.save();
    res.json(folder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    // Move all documents in this folder to root (null folder)
    await Document.updateMany({ folder: folder._id }, { folder: null });
    
    await Folder.deleteOne({ _id: folder._id });
    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getFolders, createFolder, updateFolder, deleteFolder };
