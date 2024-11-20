const Hapi = require("@hapi/hapi");
const userRoutes = require("./routes/userRoutes");
require("dotenv").config();

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: "localhost",
  });

  await server.register(require("@hapi/jwt"));

  server.auth.strategy("jwt", "jwt", {
    keys: process.env.JWT_SECRET,
    verify: {
      aud: "urn:audience:users",
      iss: "urn:issuer:api",
      sub: false,
    },
    validate: (artifacts, request, h) => {
      return {
        isValid: true,
        credentials: { user: artifacts.decoded.payload.user },
      };
    },
  });

  server.auth.default("jwt");

  // Registrasi rute
  userRoutes(server);

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
