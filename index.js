const express = require("express");
const cors = require("cors");
const { createFolder } = require("./src/controllers/folderController");
const { sequelize } = require("./models");
const { router } = require("./src/router/foldersRouter");
const { getFilesByType } = require("./src/controllers/fileController");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/folders", router);

app.post("/folder/create", createFolder);

app.get("/files", getFilesByType);

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected");
  })
  .catch((error) => {
    console.error("Unable to connect to database", error);
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
