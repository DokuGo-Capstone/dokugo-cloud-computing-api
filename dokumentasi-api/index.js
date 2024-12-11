const express = require("express");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const YAML = require("yaml");

const app = express();

// Load Swagger YAML file
const swaggerDocument = fs.readFileSync("./swagger.yaml", "utf8");
const swaggerSpec = YAML.parse(swaggerDocument);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Swagger UI running at http://localhost:${PORT}/api-docs`);
});
