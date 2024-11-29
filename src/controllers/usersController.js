const Joi = require("joi");
const bcrypt = require("bcrypt");
const User = require("../models/userModels");
const TokenBlacklist = require("../models/tokenBlacklistModel");
const jwt = require("@hapi/jwt");
const jwtdecode = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const { Op } = require("sequelize");

// Skema Validasi JOI untuk registrasi
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  phone_number: Joi.string().min(10).max(15).required(), // Validasi nomor telepon
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
}).messages({
  "string.max":
    "{{#label}} panjangnya harus kurang dari atau sama dengan {{#limit}} karakter",
  "string.min":
    "{{#label}} panjangnya harus lebih dari atau sama dengan {{#limit}} karakter",
  "string.email": "{{#label}} harus berupa email yang valid",
  "any.required": "{{#label}} wajib diisi",
});

// Fungsi: Registrasi User
const register = async (request, h) => {
  try {
    const { error, value } = registerSchema.validate(request.payload);
    if (error) {
      return h.response({ error: error.details[0].message }).code(400);
    }

    const { username, phone_number, email, password } = value;

    const existingUser =
      (await User.findOne({ where: { email } })) ||
      (await User.findOne({ where: { username } }));
    if (existingUser) {
      return h
        .response({ error: "Email atau username sudah terdaftar" })
        .code(400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = nanoid();
    const defaultAvatarUrl =
      "https://storage.googleapis.com/dokugo-storage/default-avatar.png"; // URL avatar default

    const newUser = await User.create({
      id: userId,
      username,
      phone_number, // Menambahkan phone_number
      email,
      password: hashedPassword,
      avatar: defaultAvatarUrl, // Menambahkan avatar
    });

    return h
      .response({
        message: "User berhasil didaftarkan",
        data: {
          id: newUser.id,
          username: newUser.username,
          phone_number: newUser.phone_number,
          email: newUser.email,
          avatar: newUser.avatar,
        },
      })
      .code(201);
  } catch (error) {
    console.error(error);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};

// Fungsi: Login User
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const login = async (request, h) => {
  try {
    const { error, value } = loginSchema.validate(request.payload);
    if (error) {
      return h.response({ error: error.details[0].message }).code(400);
    }

    const { email, password } = value;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return h.response({ error: "Email salah" }).code(401);
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return h.response({ error: "Password salah" }).code(401);
    }

    const token = jwt.token.generate(
      {
        aud: "urn:audience:users",
        iss: "urn:issuer:api",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
      {
        key: process.env.JWT_SECRET,
        algorithm: "HS256",
      },
      {
        ttlSec: 14400, // 4 jam
      }
    );

    return h.response({ message: "Login berhasil", token }).code(200);
  } catch (error) {
    console.error(error);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};

// Fungsi: Logout User
const logout = async (request, h) => {
  try {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return h.response({ error: "Token tidak ditemukan" }).code(401);
    }

    const token = authorization.split(" ")[1];
    const decoded = jwtdecode.decode(token);
    if (!decoded) {
      return h.response({ error: "Token tidak valid" }).code(401);
    }

    const expiry = new Date(decoded.exp * 1000);
    await TokenBlacklist.create({ token, expiry });

    return h.response({ message: "Logout berhasil" }).code(200);
  } catch (error) {
    console.error(error);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};

// Fungsi: Update Profile Photo (Avatar)
const updateProfilePhoto = async (request, h) => {
  try {
    console.log("Received payload:", request.payload);

    const userId = request.auth.credentials.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return h.response({ error: "User tidak ditemukan" }).code(404);
    }

    const { avatarUrl } = request.payload;
    console.log("Avatar URL received:", avatarUrl);

    if (!avatarUrl) {
      return h.response({ error: "Avatar URL tidak ditemukan" }).code(400);
    }

    const availableAvatars = [
      "https://storage.googleapis.com/dokugo-storage/avatar1.png",
      "https://storage.googleapis.com/dokugo-storage/avatar2.png",
      "https://storage.googleapis.com/dokugo-storage/avatar3.png",
    ];

    if (!availableAvatars.includes(avatarUrl)) {
      return h.response({ error: "Avatar yang dipilih tidak valid" }).code(400);
    }

    user.avatar = avatarUrl;
    await user.save();

    return h
      .response({ message: "Avatar berhasil diperbarui", avatarUrl: avatarUrl })
      .code(200);
  } catch (error) {
    console.error(error);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};

// Fungsi: Lihat Profil
const viewProfile = async (request, h) => {
  try {
    const userId = request.auth.credentials.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return h.response({ error: "User tidak ditemukan" }).code(404);
    }

    return h
      .response({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatar,
          phone_number: user.phone_number, // Menambahkan nomor telepon
        },
      })
      .code(200);
  } catch (error) {
    console.error(error);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};

// Fungsi: Edit Profil
const editProfileSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).optional(),
  email: Joi.string().email().optional(),
  phone_number: Joi.string().min(10).max(15).optional(), // Validasi nomor telepon
}).messages({
  "string.max":
    "{{#label}} panjangnya harus kurang dari atau sama dengan {{#limit}} karakter",
  "string.min":
    "{{#label}} panjangnya harus lebih dari atau sama dengan {{#limit}} karakter",
  "string.email": "{{#label}} harus berupa email yang valid",
});

// Fungsi: Edit Profil
const editProfile = async (request, h) => {
  try {
    const { error, value } = editProfileSchema.validate(request.payload);
    if (error) {
      return h.response({ error: error.details[0].message }).code(400);
    }

    const userId = request.auth.credentials.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return h.response({ error: "User tidak ditemukan" }).code(404);
    }

    const { username, email, phone_number } = value;

    if (email) {
      const existingEmail = await User.findOne({
        where: { email, id: { [Op.ne]: userId } },
      });
      if (existingEmail) {
        return h.response({ error: "Email sudah digunakan" }).code(400);
      }
    }

    if (username) {
      const existingUsername = await User.findOne({
        where: { username, id: { [Op.ne]: userId } },
      });
      if (existingUsername) {
        return h.response({ error: "Username sudah digunakan" }).code(400);
      }
    }

    if (phone_number) user.phone_number = phone_number;
    if (email) user.email = email;
    if (username) user.username = username;

    await user.save();

    return h
      .response({
        message: "Profil berhasil diperbarui",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone_number: user.phone_number,
        },
      })
      .code(200);
  } catch (error) {
    console.error(error);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};
// Fungsi: Delete User Account
const deleteAccount = async (request, h) => {
  try {
    const userId = request.auth.credentials.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return h.response({ error: "User tidak ditemukan" }).code(404);
    }

    await user.destroy(); // Menghapus pengguna dari database

    return h.response({ message: "Akun berhasil dihapus" }).code(200);
  } catch (error) {
    console.error(error);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};

module.exports = {
  register,
  login,
  logout,
  updateProfilePhoto,
  viewProfile,
  editProfile,
  deleteAccount,
};
