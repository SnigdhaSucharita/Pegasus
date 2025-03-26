const { Op } = require("sequelize");
const { Folder, File } = require("../../models");
const cloudinary = require("../config/cloudinary");

const uploadFile = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { originalname, mimetype, size, path } = req.file;

    if (size > 10 * 1024 * 1024) {
      return res.status(400).json({ message: "File size exceeds 10MB limit" });
    }

    const folder = await Folder.findByPk(folderId);
    if (!folder) {
      return res.stauts(404).json({ message: "Folder not found" });
    }

    const allowedTypes = {
      csv: ["text/csv", "application/csv"],
      img: ["image/png", "image/jpeg", "image/jpg"],
      pdf: ["application/pdf"],
      ppt: [
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ],
    };

    if (!allowedTypes[folder.type].includes(mimetype)) {
      return res
        .status(400)
        .json({ message: `Invalid file type. Expected ${folder.type}` });
    }

    const fileCount = await File.count({ where: { folderId } });
    if (fileCount >= folder.maxFileLimit) {
      return res
        .status(400)
        .json({ message: "Folder has reached its maximum file limit" });
    }

    const cloudinaryResponse = await cloudinary.uploader.upload(path, {
      folder: `${folder.name}`,
      resource_type: "auto",
    });

    const file = await File.create({
      folderId,
      name: originalname,
      description,
      type: mimetype,
      size,
      uploadedAt: new Date(),
      secure_url: cloudinaryResponse.secure_url,
      public_id: cloudinaryResponse.public_id,
    });

    res.status(201).json({ message: "File uploaded successfully", file });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading file", error: error.message });
  }
};

const updateFileDescription = async (req, res) => {
  try {
    const { folderId, fileId } = req.params;
    const { description } = req.body;

    if (
      !description ||
      typeof description !== "string" ||
      description.trim() === ""
    ) {
      return res.status(400).json({
        message: "Description is required and must be a non-empty string.",
      });
    }

    const file = await File.findOne({ where: { fileId, folderId } });

    if (!file) {
      return res
        .status(404)
        .json({ message: "File does not exist in the specified folder." });
    }

    file.description = description;
    await file.save();

    res.status(200).json({
      message: "File description updated successfully",
      files: {
        fileId: file.fileId,
        description: file.description,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating file description",
      error: error.message,
    });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { folderId, fileId } = req.params;

    const file = await File.findOne({ where: { fileId, folderId } });
    if (!file) {
      return res
        .status(404)
        .json({ message: "File not found in the specified folder" });
    }

    const folder = await Folder.findByPk(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Parent folder not found" });
    }

    if (!file.public_id) {
      return res
        .status(400)
        .json({ message: "Cloudinary public_id not found for this file." });
    }

    const fileInfo = await cloudinary.api.resource(file.public_id);

    await cloudinary.uploader.destroy(file.public_id, {
      resource_type: fileInfo.resource_type,
    });

    await file.destroy();

    res.status(200).json({
      message: "File deleted successfully from database and Cloudinary",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting file", error: error.message });
  }
};

const getAllFiles = async (req, res) => {
  try {
    const { folderId } = req.params;

    const folder = await Folder.findByPk(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const files = await File.findAll({ where: { folderId } });

    return res.json(files);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch files", error: error.message });
  }
};

const sortFilesByField = async (req, res) => {
  const { folderId } = req.params;
  const { sort, order = "desc" } = req.query;

  const validSortFields = ["size", "uploadedAt"];
  const validOrders = ["asc", "desc"];

  try {
    const folder = await Folder.findByPk(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    if (!validSortFields.includes(sort)) {
      return res.status(400).json({
        message: `Invalid sort field. Use one of: ${validSortFields.join(
          ", "
        )}`,
      });
    }

    const sortOrder = validOrders.includes(order.toLowerCase())
      ? order.toUpperCase()
      : "DESC";

    const files = await File.findAll({
      where: { folderId },
      order: [[sort, sortOrder]],
      attributes: ["fileId", "name", "size", "uploadedAt", "description"],
    });

    res
      .status(200)
      .json({ message: `Files sorted by ${sort} ${sortOrder}`, files });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving sorted files", error: error.message });
  }
};

const getFilesByType = async (req, res) => {
  const { type } = req.query;

  try {
    if (!type) {
      return res.status(400).json({
        message: "File type query param is required (e.g., ?type=pdf)",
      });
    }

    const folderObjs = await Folder.findAll({
      where: { type },
      attributes: ["folderId"],
    });

    const folderIds = folderObjs.map((obj) => obj.folderId);

    const files = await File.findAll({
      where: { folderId: { [Op.in]: folderIds } },
    });

    if (!files.length) {
      return res
        .status(404)
        .json({ message: `No files found with type: ${type}` });
    }

    res.json(files);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving files by type",
      error: error.message,
    });
  }
};

const getFileMetadata = async (req, res) => {
  const { folderId } = req.params;

  try {
    const files = await File.findAll({
      where: { folderId },
      attributes: ["fileId", "name", "size", "description"],
    });

    res.json({ files });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching file metadata", error: error.message });
  }
};

module.exports = {
  uploadFile,
  updateFileDescription,
  deleteFile,
  getAllFiles,
  sortFilesByField,
  getFilesByType,
  getFileMetadata,
};
