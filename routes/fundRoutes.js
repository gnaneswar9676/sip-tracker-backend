const express = require("express");

const router = express.Router();

const {
    createFund,
    getFunds,
    updateNAV
} = require("../controllers/fundController");

const {
    authenticateUser,
    authorizeRole
} = require("../middleware/authMiddleware");

// CREATE FUND
router.post(
    "/",
    authenticateUser,
    authorizeRole("INVESTOR"),
    createFund
);

// GET ALL FUNDS
router.get(
    "/",
    authenticateUser,
    authorizeRole("INVESTOR"),
    getFunds
);

// UPDATE NAV
router.put(
    "/:fundId/nav",
    authenticateUser,
    authorizeRole("INVESTOR"),
    updateNAV
);

module.exports = router;