const Joi = require("joi");
const bcrypt = require("bcrypt");
const User = require("../models/userModels");
const jwt = require("@hapi/jwt");
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
  "any.required": "{{#label}} wajib diisi"
});

// Register User

const register = async (request, h) => {
  try {
    // Validasi input
    const { error, value } = registerSchema.validate(request.payload);
    if (error) {
      return h.response({ error: error.details[0].message }).code(400);
    }

    const { firstname, lastname, username, email, password } = value;

    // Cek jika email atau username sudah terdaftar
    const existingUser =
      (await User.findOne({ where: { email } })) ||
      (await User.findOne({ where: { username } }));
    if (existingUser) {
      return h
        .response({ error: "Email atau username sudah terdaftar" })
        .code(400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // inisialisasi nanoid & generate nanoid sebelum disimpan ke column ID table
    const userId = nanoid();

    // Simpan user baru
    const newUser = await User.create({
      id: userId,
      firstname,
      lastname,
      username,
      email,
      password: hashedPassword,
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
        },
      })
      .code(201);
  } catch (error) {
    console.error(error);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};

// Login User & skema validasi joi
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const login = async (request, h) => {
  try {
    // Validasi input
    const { error, value } = loginSchema.validate(request.payload);
    if (error) {
      return h.response({ error: error.details[0].message }).code(400);
    }

    const { email, password } = value;

    // check email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return h.response({ error: "Email salah" }).code(401);
    }

    // check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return h.response({ error: "password salah" }).code(401);
    }

    // Generate JWT token
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
        ttlSec: 14400, // 4 hours
      }
    );

    return h.response({ message: "Login berhasil", token }).code(200);
  } catch (error) {
    console.error(error);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};

// View Profile
const viewProfile = async (request, h) => {
  try {
    const userId = request.auth.credentials.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return h.response({ error: "User tidak ditemukan" }).code(404);
    }

    return h.response({ user }).code(200);
  } catch (error) {
    console.error(error);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};

module.exports = {
  register,
  login,
  viewProfile,
};
