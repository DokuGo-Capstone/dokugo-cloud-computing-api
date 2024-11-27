const {  DataTypes } = require("sequelize");
const sequelize = require("../config/db"); 

const TokenBlacklist = sequelize.define(
  "TokenBlacklist",
  {
    // Mendefinisikan skema/model
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiry: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    // Opsi model
    timestamps: false,
    tableName: "token_blacklist",
  }
);

module.exports = TokenBlacklist;
