"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("files", "secure_url", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.addColumn("files", "public_id", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("files", "secure_url");
    await queryInterface.removeColumn("files", "public_id");
  },
};
