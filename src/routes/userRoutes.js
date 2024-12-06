const {
  register,
  login,
  logout,
  updateProfilePhoto,
  viewProfile,
  editProfile,
  deleteAccount,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require("../controllers/usersController");

const userRoutes = (server) => {
  server.route([
    {
      method: "POST",
      path: "/register",
      handler: register,
      options: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/login",
      handler: login,
      options: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/profile",
      handler: viewProfile,
      options: {
        auth: "jwt",
      },
    },
    {
      method: "PUT",
      path: "/profile/edit",
      handler: editProfile,
      options: {
        auth: "jwt",
      },
    },
    {
      method: "DELETE", // Rute untuk delete account
      path: "/profile/delete",
      handler: deleteAccount,
      options: {
        auth: "jwt",
      },
    },
    {
      method: "PATCH",
      path: "/profile/photo",
      handler: updateProfilePhoto,
      options: {
        auth: "jwt",
        payload: {
          maxBytes: 2 * 1024 * 1024,
          output: "data",
          parse: true,
        },
      },
    },
    {
      method: "POST", 
      path: "/logout",
      handler: logout,
      options: {
        auth: "jwt",
        // pre: [{ method: checkTokenBlacklist }],
      },
    },
    {
      method: "POST",
      path: "/forgotPassword",
      handler: forgotPassword,
      options: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/verify-otp",
      handler: verifyOtp,
      options: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/resetPassword",
      handler: resetPassword,
      options: {
        auth: false,
      },
    },
  ]);
};

module.exports = userRoutes;
