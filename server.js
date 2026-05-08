require("dotenv").config();
const {
    connectRedis
} = require("./services/redisService");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const investorRoutes = require("./routes/investorRoutes");
const fundRoutes = require("./routes/fundRoutes");
const sipRoutes = require("./routes/sipRoutes");

const {
    globalErrorHandler
} = require("./middleware/errorMiddleware");

const { connectDB } = require("./database/pgManager");

const app = express();

app.use(cors());
app.use(express.json());


// CONNECT DATABASE
connectDB();


// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/investors", investorRoutes);
app.use("/api/funds", fundRoutes);
app.use("/api/sips", sipRoutes);


// HEALTH CHECK
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "SIP Tracker Backend Running"
    });
});


// GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

connectRedis();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});