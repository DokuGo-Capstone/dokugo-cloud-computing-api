const Joi = require("joi");
const {
  register,
  login,
  viewProfile,
} = require("../controllers/usersController");

const userRoutes = (server) => {
  server.route([
    {
      method: "POST",
      path: "/register",
      handler: register,
      options: {
        auth: false, // Registrasi tidak memerlukan autentikasi
        validate: {
          payload: Joi.object({
            firstname: Joi.string().required(),
            lastname: Joi.string().required(),
            username: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().required(),
          }),
        },
      },
    },
    {
      method: "POST",
      path: "/login",
      handler: login,
      options: {
        auth: false, 
        validate: {
          payload: Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required(),
          }),
        },
      },
    },
    {
      method: "GET",
      path: "/profile",
      handler: viewProfile,
      options: {
        auth:'jwt'
      },
    },
  ]);
};

module.exports = userRoutes;
