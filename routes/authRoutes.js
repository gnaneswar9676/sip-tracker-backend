const express = require("express");

const router = express.Router();

const {
    register,
    login,
    forgotPassword,
    resetPassword
} = require("../controllers/authController");

router.post("/register", register);

router.post("/login", login);

module.exports = router;

router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/reset-password/:token",
  resetPassword
);