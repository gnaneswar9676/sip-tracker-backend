require("dotenv").config();

const app = require("./app");

const {
  connectRedis
} = require("./services/redisService");

const {
  connectDB
} = require("./database/pgManager");


// CONNECT DATABASE
connectDB();


// CONNECT REDIS
connectRedis();


const PORT =
process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});