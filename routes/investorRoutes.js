const express = require("express");

const router = express.Router();

const {
    getInvestor,
    getHoldings,
    getNetWorth
} = require("../controllers/investorController");

const {
    authenticateUser,
    authorizeRole
} = require("../middleware/authMiddleware");


// GET INVESTOR PROFILE
router.get(
    "/:investorId",

    authenticateUser,

    authorizeRole("INVESTOR"),

    getInvestor
);


// GET HOLDINGS
router.get(
    "/:investorId/holdings",

    authenticateUser,

    authorizeRole("INVESTOR"),

    getHoldings
);


// GET NETWORTH
router.get(
    "/:investorId/networth",

    authenticateUser,

    authorizeRole("INVESTOR"),

    getNetWorth
);

module.exports = router;