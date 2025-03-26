const express = require("express");
const {
  updateFolder,
  deleteFolder,
  getFolder,
  getAllFolders,
} = require("../controllers/folderController");
const authenticateJWT = require("../middleware/authentication");
const upload = require("../middleware/fileUpload");
const {
  uploadFile,
  updateFileDescription,
  deleteFile,
  getAllFiles,
  sortFilesByField,
  getFileMetadata,
} = require("../controllers/fileController");

const router = express.Router();

router.get("/", getAllFolders);
router.put("/:folderId", updateFolder);
router.delete("/:folderId", deleteFolder);
router.get("/:folderId", getFolder);
router.get("/:folderId/files", getAllFiles);
router.get("/:folderId/files/metadata", getFileMetadata);
router.post(
  "/:folderId/files",
  authenticateJWT,
  upload.single("file"),
  uploadFile
);
router.put("/:folderId/files/:fileId", updateFileDescription);
router.delete("/:folderId/files/:fileId", authenticateJWT, deleteFile);
router.get("/:folderId/filesBySort", sortFilesByField);

module.exports = { router };
