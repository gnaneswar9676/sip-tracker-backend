require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes =
require("./routes/authRoutes");

const investorRoutes =
require("./routes/investorRoutes");

const fundRoutes =
require("./routes/fundRoutes");

const sipRoutes =
require("./routes/sipRoutes");

// const investmentRoutes =
// require("./routes/investmentRoutes");

const {
  globalErrorHandler
} = require("./middleware/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());


// ROUTES
app.use("/api/auth", authRoutes);

app.use(
  "/api/investors",
  investorRoutes
);

app.use("/api/funds", fundRoutes);

app.use("/api/sips", sipRoutes);

// app.use(
//   "/api/investments",
//   investmentRoutes
// );


// HEALTH CHECK
app.get("/", (req, res) => {

  res.status(200).json({
    success: true,
    message:
    "SIP Tracker Backend Running"
  });

});


// GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

module.exports = app;