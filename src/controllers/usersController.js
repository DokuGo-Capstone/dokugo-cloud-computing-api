const Joi = require("joi");
const bcrypt = require("bcrypt");
const User = require("../models/userModels");
const TokenBlacklist = require("../models/tokenBlacklistModel");
const jwt = require("@hapi/jwt");
const jwtdecode = require("jsonwebtoken");
const { nanoid } = require("nanoid");

// Skema Validasi JOI
const registerSchema = Joi.object({
  firstname: Joi.string().min(2).max(30).required(),
  lastname: Joi.string().min(2).max(30).required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
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

    const { firstname, lastname, username, email, password } = value;

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
    const defaultProfilePhotoUrl =
      "https://storage.googleapis.com/dokugo-storage/default.png";

    const newUser = await User.create({
      id: userId,
      firstname,
      lastname,
      username,
      email,
      password: hashedPassword,
      photo: defaultProfilePhotoUrl,
    });

    return h
      .response({
        message: "User berhasil didaftarkan",
        data: {
          id: newUser.id,
          firstname: newUser.firstname,
          lastname: newUser.lastname,
          username: newUser.username,
          email: newUser.email,
          photo: newUser.photo,
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


const updateProfilePhoto = async (request, h) => {
  try {
    console.log("Received payload:", request.payload); // Menambahkan log untuk mengecek payload

    const userId = request.auth.credentials.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return h.response({ error: "User tidak ditemukan" }).code(404);
    }

    // Memeriksa apakah payload berisi avatarUrl
    const { avatarUrl } = request.payload;
    console.log("Avatar URL received:", avatarUrl); // Menambahkan log untuk memeriksa avatarUrl

    if (!avatarUrl) {
      return h.response({ error: "Avatar URL tidak ditemukan" }).code(400);
    }

    // Daftar avatar yang disediakan
    const availableAvatars = [
      "https://storage.googleapis.com/dokugo-storage/avatar1.png",
      "https://storage.googleapis.com/dokugo-storage/avatar2.png",
      "https://storage.googleapis.com/dokugo-storage/avatar3.png",
    ];

    // Memeriksa apakah avatarUrl ada dalam daftar avatar yang tersedia
    if (!availableAvatars.includes(avatarUrl)) {
      return h.response({ error: "Avatar yang dipilih tidak valid" }).code(400);
    }

    // Memperbarui foto pengguna
    user.photo = avatarUrl;
    await user.save();

    return h
      .response({ message: "Avatar berhasil diperbarui", photoUrl: avatarUrl })
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
          // firstname: user.firstname,
          // lastname: user.lastname,
          username: user.username,
          email: user.email,
          photoUrl: user.photo,
        },
      })
      .code(200);
  } catch (error) {
    console.error(error);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};

// Skema Validasi JOI untuk Edit Profil
const editProfileSchema = Joi.object({
  firstname: Joi.string().min(2).max(30).optional(),
  lastname: Joi.string().min(2).max(30).optional(),
  username: Joi.string().alphanum().min(3).max(30).optional(),
  email: Joi.string().email().optional(),
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

    const { firstname, lastname, username, email } = value;

    // Cek apakah email atau username sudah digunakan oleh user lain
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

    // Perbarui data profil pengguna
    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();

    return h.response({
      message: "Profil berhasil diperbarui",
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        email: user.email,
        photoUrl: user.photo,
      },
    }).code(200);
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
};
