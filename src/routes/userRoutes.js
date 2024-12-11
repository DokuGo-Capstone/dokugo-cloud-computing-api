const {
  register,
  login,
  logout,
  updateProfilePhoto,
  viewProfile,
  editProfile,
  deleteAccount,
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
      method: "PUT", // Menambahkan rute untuk edit profil
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
      method: "POST", // Menambahkan route logout
      path: "/logout",
      handler: logout,
      options: {
        auth: "jwt",
        // pre: [{ method: checkTokenBlacklist }],
      },
    },
  ]);
};

module.exports = userRoutes;
