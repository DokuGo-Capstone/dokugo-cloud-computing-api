const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    phone_number: {
      // Mengganti 'no_hp' dengan 'phone_number'
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    avatar: {
      // Mengganti 'photo' dengan 'avatar'
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  { timestamps: false, tableName: "users" }
);

module.exports = User;
