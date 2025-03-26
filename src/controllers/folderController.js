const { Folder, File } = require("../../models");

const createFolder = async (req, res) => {
  try {
    const { name, type, maxFileLimit } = req.body;

    if (!name || !type || !maxFileLimit) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["csv", "img", "pdf", "ppt"].includes(type)) {
      return res.status(400).json({ message: "Invalid folder type" });
    }

    if (typeof maxFileLimit !== "number" || maxFileLimit <= 0) {
      return res
        .status(400)
        .json({ message: "maxFileLimit must be a positive integer" });
    }

    const existingFolder = await Folder.findOne({ where: { name } });
    if (existingFolder) {
      return res.status(400).json({ message: "Folder name must be unique" });
    }

    const folder = await Folder.create({ name, type, maxFileLimit });

    res.status(201).json({ message: "Folder created successfully", folder });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating folder", error: error.message });
  }
};

const updateFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { name, maxFileLimit } = req.body;

    const folder = await Folder.findByPk(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ message: "Invalid folder name" });
      }
      const existingFolder = await Folder.findOne({ where: { name } });
      if (existingFolder && existingFolder.folderId !== folderId) {
        return res.status(400).json({ message: "Folder name must be unique" });
      }
      folder.name = name;
    }

    if (maxFileLimit !== undefined) {
      if (typeof maxFileLimit !== "number" || maxFileLimit <= 0) {
        return res
          .status(400)
          .json({ message: "maxFileLimit must be a positive integer" });
      }
      folder.maxFileLimit = maxFileLimit;
    }

    await folder.save();

    res.status(200).json({ message: "Folder updated successfully", folder });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating folder", error: error.message });
  }
};

const deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;

    const folder = await Folder.findByPk(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    await folder.destroy();

    res
      .status(200)
      .json({ message: "Folder and its files deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting folder", error: error.message });
  }
};

const getFolder = async (req, res) => {
  try {
    const { folderId } = req.params;

    const folder = await Folder.findByPk(folderId, {
      include: [{ model: File }],
    });

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    res.status(200).json({ message: "Folder retrieved successfully", folder });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving folder", error: error.message });
  }
};

const getAllFolders = async (req, res) => {
  try {
    const folders = await Folder.findAll({
      attributes: ["folderId", "name", "type", "maxFileLimit"],
    });

    return res.json(folders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch folders", error: error.message });
  }
};

module.exports = {
  createFolder,
  updateFolder,
  deleteFolder,
  getFolder,
  getAllFolders,
};
