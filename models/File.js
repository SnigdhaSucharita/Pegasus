const Folder = require("./Folder");

module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define(
    "File",
    {
      fileId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      folderId: {
        type: DataTypes.UUID,
        references: {
          model: Folder,
          key: "folderId",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      uploadedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      secure_url: {
        type: DataTypes.STRING,
      },
      public_id: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: "files",
      timestamps: false,
    }
  );

  File.associate = (models) => {
    File.belongsTo(models.Folder, { foreignKey: "folderId" });
  };

  return File;
};
