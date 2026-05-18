require("dotenv").config();

const app = require("./app");

const {
  connectRedis
} = require("./services/redisService");

const {
  connectDB
} = require("./database/pgManager");

connectDB();

connectRedis();

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});